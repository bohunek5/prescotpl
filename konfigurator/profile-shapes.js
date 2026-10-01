import {tracedContours} from './profile-contours.js?v=130bc2896fcd';
// A raster trace can retrace an edge or describe an open channel as a hole
// sharing an edge with the exterior. Both have zero section area, but Three's
// extrusion gives each edge its own longitudinal face: a false aluminium roof.
// Reconstruct only coincident boundaries; never infer new product dimensions.
const geometryProfiles=new WeakMap(),sectionEpsilon=1e-8;
const signedArea=points=>points.reduce((area,b,i)=>{const a=points[(i+points.length-1)%points.length];return area+a[0]*b[1]-b[0]*a[1];},0)/2;
const pointKey=point=>point.map(x=>(Math.abs(x)<sectionEpsilon?0:x).toFixed(8)).join(',');
const sectionArea=loops=>loops.reduce((area,loop)=>area+(loop.hole?-1:1)*Math.abs(signedArea(loop.points)),0);
const sectionBounds=loops=>{const points=loops.flatMap(loop=>loop.points);return [Math.min(...points.map(p=>p[0])),Math.max(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[1]))];};
const aboveSupport=(profile,[x,y])=>{const angle=(profile.ledAngle||0)*Math.PI/180;return (y-(profile.ledBase??0))*Math.cos(angle)+(-x-(profile.ledZ||0))*Math.sin(angle)>.05;};
function cleanLoop(points,profile=null){
  const out=points.map(point=>[...point]);
  // Remove one point at a time so A-B-A spikes cannot also remove a neighbouring
  // corner. A following pass removes the resulting repeated A-A point.
  let changed=true;
  while(changed&&out.length>3){
    changed=false;
    for(let i=0;i<out.length;i++){
      const a=out[(i+out.length-1)%out.length],b=out[i],c=out[(i+1)%out.length];
      if(Math.abs((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]))>sectionEpsilon)continue;
      const reverses=(b[0]-a[0])*(c[0]-b[0])+(b[1]-a[1])*(c[1]-b[1])<0;
      if(profile&&reverses&&!aboveSupport(profile,b))continue;
      out.splice(i,1);changed=true;break;
    }
  }
  return out;
}
function joinTouchingLoops(loops,profile){
  const oriented=loops.map(loop=>{const points=loop.points.map(p=>[...p]);if((signedArea(points)>0)===!!loop.hole)points.reverse();return points;});
  const vertices=[...new Map(oriented.flat().map(p=>[pointKey(p),p])).values()],edges=[],byKey=new Map();
  for(const points of oriented){
    const ring=[];
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dy=b[1]-a[1],length2=dx*dx+dy*dy;
      if(length2<sectionEpsilon*sectionEpsilon)continue;
      const cuts=[{t:0,p:a},{t:1,p:b}];
      for(const p of vertices){const t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length2;if(t>sectionEpsilon&&t<1-sectionEpsilon&&Math.abs(dx*(p[1]-a[1])-dy*(p[0]-a[0]))<sectionEpsilon)cuts.push({t,p});}
      cuts.sort((a,b)=>a.t-b.t);
      for(let j=1;j<cuts.length;j++){
        const from=cuts[j-1].p,to=cuts[j].p,f=pointKey(from),t=pointKey(to);if(f===t)continue;
        const key=f+'|'+t;if(byKey.has(key))return loops;
        const edge={from,to,f,t};byKey.set(key,edge);ring.push(edge);edges.push(edge);
      }
    }
    ring.forEach((edge,i)=>{edge.prev=ring[(i+ring.length-1)%ring.length];edge.next=ring[(i+1)%ring.length];});
  }
  let joined=false;
  for(const edge of edges){
    const reverse=byKey.get(edge.t+'|'+edge.f);
    // Preserve the original support plane and all geometry below the PCB.
    // Only coincident boundaries above it can become a false optical roof.
    if(edge.removed||!reverse||reverse.removed||!aboveSupport(profile,edge.from)||!aboveSupport(profile,edge.to))continue;
    if(edge.next===reverse){edge.prev.next=reverse.next;reverse.next.prev=edge.prev;}
    else if(reverse.next===edge){reverse.prev.next=edge.next;edge.next.prev=reverse.prev;}
    else{edge.prev.next=reverse.next;reverse.next.prev=edge.prev;reverse.prev.next=edge.next;edge.next.prev=reverse.prev;}
    edge.removed=true;reverse.removed=true;joined=true;
  }
  if(!joined)return loops;
  const result=[];
  for(const start of edges){
    if(start.removed||start.visited)continue;
    const points=[];let edge=start;
    do{if(edge.removed||edge.visited)return loops;points.push(edge.from);edge.visited=true;edge=edge.next;}while(edge!==start);
    const cleaned=cleanLoop(points,profile);if(cleaned.length<3||Math.abs(signedArea(cleaned))<sectionEpsilon)continue;
    result.push({hole:signedArea(cleaned)<0,points:cleaned});
  }
  const outers=result.filter(loop=>!loop.hole).sort((a,b)=>Math.abs(signedArea(b.points))-Math.abs(signedArea(a.points)));
  const holes=result.filter(loop=>loop.hole),ordered=[];
  const contains=(points,[x,y])=>{let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [a,b]=points[i],[c,d]=points[j];if((b>y)!=(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside;}return inside;};
  const enclosedBy=(outer,hole)=>hole.points.some((a,i)=>{const b=hole.points[(i+1)%hole.points.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(!length)return false;const sample=[(a[0]+b[0])/2+dy/length*1e-5,(a[1]+b[1])/2-dx/length*1e-5];return contains(hole.points,sample)&&contains(outer.points,sample);});
  for(const outer of outers){ordered.push(outer);for(let i=holes.length-1;i>=0;i--)if(enclosedBy(outer,holes[i]))ordered.push(...holes.splice(i,1));}
  return holes.length?loops:ordered;
}
function removeKozus50Cover(loops){
  // The KOZUS-50 card shows this pale horizontal part as the separate cover,
  // but its raster trace included it in the aluminium. Retain the right wing
  // beyond the existing inner corner (21.881 mm), not the cover crossing the
  // channel. Source: assets/sources/catalog-2026-09/kozus50.pdf.
  return loops.map(loop=>{
    if(loop.hole||!loop.points.some(([x,y])=>x===-21.881&&y===17.518)||!loop.points.some(([x,y])=>x===21.881&&y===17.518))return loop;
    const points=[],limit=21.881;
    for(let i=0;i<loop.points.length;i++){
      const a=loop.points[i],b=loop.points[(i+1)%loop.points.length],insideA=a[0]>=limit,insideB=b[0]>=limit;
      if(insideA)points.push([...a]);
      if(insideA!==insideB){const t=(limit-a[0])/(b[0]-a[0]);points.push([limit,a[1]+t*(b[1]-a[1])]);}
    }
    return {...loop,points:cleanLoop(points)};
  });
}
export function profileForGeometry(profile){
  if(!profile.section)return profile;
  if(geometryProfiles.has(profile))return geometryProfiles.get(profile);
  const clean=profile.section.map(loop=>({...loop,points:cleanLoop(loop.points,profile)})),joined=joinTouchingLoops(clean,profile);
  const section=profile.id==='kozus50'?removeKozus50Cover(joined):joined;
  const bounds=sectionBounds(profile.section),newBounds=sectionBounds(section);
  // These two traces put a zero-area dimension edge a fraction of a raster
  // pixel above the material. Bound the correction explicitly; keep catalog
  // heights of 14.5 / 15 mm and every other envelope coordinate unchanged.
  const dimensionTip={gizallt:.074,kozma22bok:.072}[profile.id];
  const areaPreserved=Math.abs(sectionArea(joined)-sectionArea(profile.section))<1e-6;
  const unchanged=areaPreserved&&bounds.every((v,i)=>Math.abs(v-newBounds[i])<1e-6||(dimensionTip&&i===3&&Math.abs(v-newBounds[i]-dimensionTip)<1e-6));
  // Keep uncertain traces intact; they require review against the source card.
  const result=unchanged?{...profile,section}:profile;
  geometryProfiles.set(profile,result);geometryProfiles.set(result,result);return result;
}
// Millimetres in the section plane. These authored contours follow the source
// cards; small retaining details are illustrative. MICRO-PLUS uses source 3DS.
export function profileContour(p){
  p=profileForGeometry(p);
  if(p.section)return p.section.find(loop=>!loop.hole).points;
  if(p.id==='stos'){
    // Smooth flanges from the STOS card, without raster stair-steps extruded into
    // bright longitudinal seams. Continuous floor and 13.1 mm LED channel.
    const wing=[];for(let i=0;i<=28;i++){const t=i/28;wing.push([-15.5+6.3*t,.45+8.9*t-2.35*t*t]);}
    const left=[...wing,[-6.55,7],[-6.55,2.1],[6.55,2.1],[6.55,7],[9.2,7]];
    return [...left,...wing.slice(0,-1).reverse().map(([x,y])=>[-x,y]),[15.5,0],[14.7,0],[8.65,5.55],[8.65,0],[-8.65,0],[-8.65,5.55],[-14.7,0],[-15.5,0]];
  }
  if(['pdst','pdsust'].includes(p.id)){
    const base=p.ledBase,H=p.height;
    return [[-26.1,0],[-6.7,0],[-6.7,base-1.2],[-4.5,base-1.2],[-4.5,0],[-1.6,0],[-1.6,base-1.2],[1.6,base-1.2],[1.6,0],[4.5,0],[4.5,base-1.2],[6.7,base-1.2],[6.7,0],[26.1,0],[26.1,1],[8.1,1],[8.1,H],[5.6,H],[5.6,H-1],[7,H-1],[7,base],[-7,base],[-7,H-1],[-5.6,H-1],[-5.6,H],[-8.1,H],[-8.1,1],[-26.1,1]];
  }
  if(p.id==='pdszmg')return [[-8.3,0],[-6.5,0],[-6.5,2.8],[-4,2.8],[-4,0],[-1.3,0],[-1.3,2.8],[1.3,2.8],[1.3,0],[4,0],[4,2.8],[6.5,2.8],[6.5,0],[8.3,0],[8.3,22],[7,22],[7,15.7],[5.6,15.7],[5.6,14.7],[7,14.7],[7,4.4],[-7,4.4],[-7,14.7],[-5.6,14.7],[-5.6,15.7],[-7,15.7],[-7,22],[-8.3,22]];
  if(tracedContours[p.id])return tracedContours[p.id];
  const a=p.bodyWidth/2,b=p.channel/2,H=p.height,base=p.ledBase;
  if(p.id==='pdsnk')return[[-8.1,0],[8.1,0],[8.1,11],[11.1,11],[11.1,12],[5.7,12],[5.7,10.9],[7,10.9],[7,1.1],[-7,1.1],[-7,10.9],[-5.7,10.9],[-5.7,12],[-11.1,12],[-11.1,11],[-8.1,11]];
  if(p.id==='siler')return[[-9.5,0],[9.5,0],[9.5,5],[9.1,5],[9.1,6],[9.5,6],[9.5,12],[8,12],[8,10.9],[8.4,10.9],[8.4,1.2],[-8.4,1.2],[-8.4,10.9],[-8,10.9],[-8,12],[-9.5,12],[-9.5,6],[-9.1,6],[-9.1,5],[-9.5,5]];
  if(p.id==='alu45')return [[-9.5,0],[8.5,0],[9.5,1],[9.5,19],[1.9,19],[.8,17.9],[6.9,11.8],[-2.3,2.6],[-8.3,8.6],[-9.5,7.4]];
  if(p.id==='pikoo'){
    const outer=Array.from({length:33},(_,i)=>{const a=Math.PI+(Math.PI+0.68)*i/32-.34;return[5.25*Math.cos(a),5.25+5.25*Math.sin(a)];});
    return [...outer,[3,6.8],[3,2.5],[-3,2.5],[-3,6.8]];
  }
  if(['pdszm','pikozm','giza','lipod'].includes(p.id)){
    const points=[[-a,0]],slots=p.id==='pdszm'||p.id==='pikozm'?1:3,span=p.width-2;
    for(let i=0;i<slots;i++){const x=-span/2+span*(i+.5)/slots,w=slots===1?2.8:2.5;points.push([x-w/2,0],[x-w/2,Math.min(2.6,base-.8)],[x+w/2,Math.min(2.6,base-.8)],[x+w/2,0]);}
    return [...points,[a,0],[a,H-.6],[a-.6,H],[b-.2,H],[b-.2,H-1.1],[b,H-1.1],[b,base],[-b,base],[-b,H-1.1],[-b+.2,H-1.1],[-b+.2,H],[-a+.6,H],[-a,H-.6]];
  }
  if(p.id==='microk')return[[-7.6,0],[7.6,0],[7.6,2.3],[7.05,4.9],[11,4.9],[11,5.4],[8,6],[5.7,6],[6.6,2.1],[5.6,2.1],[5.6,1.1],[-5.6,1.1],[-5.6,2.1],[-6.6,2.1],[-5.7,6],[-8,6],[-11,5.4],[-11,4.9],[-7.05,4.9],[-7.6,2.3]];
  if(p.id==='kozus')return[[-a,0],[-10,0],[-10,1.4],[-8,1.4],[-8,0],[-3,0],[-3,1.4],[-1,1.4],[-1,0],[4,0],[4,1.4],[6,1.4],[6,0],[11,0],[11,1.4],[a,1.4],[a,15],[33.4,15],[33.4,16.1],[a,16.6],[a,17.5],[10.9,17.5],[10.9,16.3],[12,15.6],[12,base],[-12,base],[-12,15.6],[-10.9,16.3],[-10.9,17.5],[-a,17.5],[-a,16.6],[-33.4,16.1],[-33.4,15],[-a,15]];
  if(p.id==='larko')return[[-a,0],[a,0],[a,3],[a-1,3],[a-1,4.4],[a,4.4],[a,22.8],[23.1,22.8],[23.1,23.7],[a,24.5],[10.9,24.5],[10.9,23.4],[12,22.7],[12,base],[-12,base],[-12,22.7],[-10.9,23.4],[-10.9,24.5],[-a,24.5],[-23.1,23.7],[-23.1,22.8],[-a,22.8],[-a,4.4],[-a+1,4.4],[-a+1,3],[-a,3]];
  return[[-a,0],[a,0],[a,H],[b-.5,H],[b-.5,H-1],[b,H-1],[b,base],[-b,base],[-b,H-1],[-b+.5,H-1],[-b+.5,H],[-a,H]];
}
export function profileIcon(p,cover=null,instance=''){
  p=profileForGeometry(p);
  const points=profileContour(p),W=p.width,H=p.height;
  // Match the model's cover plane: section X = -world Z, screen Y = H - world Y.
  const angle=(p.ledAngle||0)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  const x=-(p.coverZ||0),y=H-(p.coverY??H),half=p.channel*.46;
  const depth=Math.max(1,((p.coverY??H)-p.ledBase)*c+((p.coverZ||0)-(p.ledZ||0))*s);
  // LENSO's angle is documented. Plain-cover fans illustrate diffusion/clearance;
  // they are not photometric measurements. Rounded covers spread light wider.
  const round=['round','arch','dome','square'].includes(cover?.shape);
  const slope=cover?.beamAngle?Math.tan(cover.beamAngle*Math.PI/360):round?1.55:cover?.id.endsWith('-clear')?Math.min(1.15,Math.max(.45,p.channel/2/depth)):1.15;
  const reach=Math.min(16,Math.max(8,H*.45+W*.16)),spread=half+reach*slope;
  const beam=[[-half,0],[-spread,-reach],[spread,-reach],[half,0]];
  // Reserve the widest preview so changing a compatible cover keeps the framing.
  const envelope=[[-half,0],[-half-reach*1.55,-reach],[half+reach*1.55,-reach],[half,0]];
  const sectionPoints=p.section?p.section.flatMap(loop=>loop.points):points;
  const bounds=[...sectionPoints.map(([x,y])=>[x,H-y]),...envelope.map(([u,v])=>[x+u*c+v*s,y-u*s+v*c])];
  const minX=Math.min(...bounds.map(p=>p[0]))-1.5,minY=Math.min(...bounds.map(p=>p[1]))-1.5;
  const width=Math.max(...bounds.map(p=>p[0]))-minX+1.5,height=Math.max(...bounds.map(p=>p[1]))-minY+1.5;
  const gradient=`profile-light-${p.id}${instance?'-'+instance:''}`,edge=`${gradient}-edge`,mask=`${gradient}-mask`;
  return `<svg class="profile-section-icon" data-cover="${cover?.id||''}" data-beam-angle="${cover?.beamAngle||''}" viewBox="${minX} ${minY} ${width} ${height}" aria-hidden="true">
    <defs><linearGradient id="${gradient}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${-reach}">
      <stop offset="0" stop-color="var(--profile-light)" stop-opacity=".82"/><stop offset=".3" stop-color="var(--profile-light)" stop-opacity=".6"/><stop offset=".65" stop-color="var(--profile-light)" stop-opacity=".25"/><stop offset="1" stop-color="var(--profile-light)" stop-opacity="0"/>
    </linearGradient><linearGradient id="${edge}">
      <stop offset="0" stop-color="white" stop-opacity="0"/><stop offset=".16" stop-color="white" stop-opacity=".65"/><stop offset=".32" stop-color="white"/><stop offset=".68" stop-color="white"/><stop offset=".84" stop-color="white" stop-opacity=".65"/><stop offset="1" stop-color="white" stop-opacity="0"/>
    </linearGradient><mask id="${mask}" maskUnits="userSpaceOnUse" x="${-spread}" y="${-reach}" width="${spread*2}" height="${reach}"><rect x="${-spread}" y="${-reach}" width="${spread*2}" height="${reach}" fill="url(#${edge})"/></mask></defs>
    <g transform="translate(${x} ${y}) rotate(${-p.ledAngle||0})"><path class="profile-section-glow" fill="url(#${gradient})" mask="url(#${mask})" d="${beam.map(([x,y],i)=>(i?'L':'M')+x+','+y).join(' ')}Z"/></g>
    <path class="profile-section-body" fill-rule="evenodd" d="${(p.section||[{points}]).map(loop=>loop.points.map(([x,y],i)=>(i?'L':'M')+x+','+(H-y)).join(' ')+'Z').join(' ')}"/>
    <path class="profile-section-emitter" transform="translate(${x} ${y}) rotate(${-p.ledAngle||0})" d="M${-half},0 H${half}"/>
  </svg>`;
}
