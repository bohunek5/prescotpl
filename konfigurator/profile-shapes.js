import {tracedContours} from './profile-contours.js?v=797082b8b9d7';
// Millimetres in the section plane. These authored contours follow the source
// cards; small retaining details are illustrative. MICRO-PLUS uses source 3DS.
export function profileContour(p){
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
export function profileIcon(p,cover=null){
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
  const bounds=[...points.map(([x,y])=>[x,H-y]),...envelope.map(([u,v])=>[x+u*c+v*s,y-u*s+v*c])];
  const minX=Math.min(...bounds.map(p=>p[0]))-1.5,minY=Math.min(...bounds.map(p=>p[1]))-1.5;
  const width=Math.max(...bounds.map(p=>p[0]))-minX+1.5,height=Math.max(...bounds.map(p=>p[1]))-minY+1.5;
  const gradient=`profile-light-${p.id}`,edge=`${gradient}-edge`,mask=`${gradient}-mask`;
  return `<svg class="profile-section-icon" data-cover="${cover?.id||''}" data-beam-angle="${cover?.beamAngle||''}" viewBox="${minX} ${minY} ${width} ${height}" aria-hidden="true">
    <defs><linearGradient id="${gradient}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${-reach}">
      <stop offset="0" stop-color="var(--profile-light)" stop-opacity=".82"/><stop offset=".3" stop-color="var(--profile-light)" stop-opacity=".6"/><stop offset=".65" stop-color="var(--profile-light)" stop-opacity=".25"/><stop offset="1" stop-color="var(--profile-light)" stop-opacity="0"/>
    </linearGradient><linearGradient id="${edge}">
      <stop offset="0" stop-color="white" stop-opacity="0"/><stop offset=".16" stop-color="white" stop-opacity=".65"/><stop offset=".32" stop-color="white"/><stop offset=".68" stop-color="white"/><stop offset=".84" stop-color="white" stop-opacity=".65"/><stop offset="1" stop-color="white" stop-opacity="0"/>
    </linearGradient><mask id="${mask}" maskUnits="userSpaceOnUse" x="${-spread}" y="${-reach}" width="${spread*2}" height="${reach}"><rect x="${-spread}" y="${-reach}" width="${spread*2}" height="${reach}" fill="url(#${edge})"/></mask></defs>
    <g transform="translate(${x} ${y}) rotate(${-p.ledAngle||0})"><path class="profile-section-glow" fill="url(#${gradient})" mask="url(#${mask})" d="${beam.map(([x,y],i)=>(i?'L':'M')+x+','+y).join(' ')}Z"/></g>
    <path class="profile-section-body" d="${points.map(([x,y],i)=>(i?'L':'M')+x+','+(H-y)).join(' ')}Z"/>
    <path class="profile-section-emitter" transform="translate(${x} ${y}) rotate(${-p.ledAngle||0})" d="M${-half},0 H${half}"/>
  </svg>`;
}
