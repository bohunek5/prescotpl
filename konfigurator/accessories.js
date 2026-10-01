import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {accessoryKit} from './accessory-data.js?v=130bc2896fcd';
import {accessoryFinish} from './accessory-finish.js?v=130bc2896fcd';
import {profileContour} from './profile-shapes.js?v=130bc2896fcd';
import {sourceEndcapGeometry} from './source-endcaps.js?v=130bc2896fcd';
function convexHull(points){
  const sorted=[...points].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const half=list=>{const out=[];for(const point of list){while(out.length>1&&cross(out.at(-2),out.at(-1),point)<=0)out.pop();out.push(point);}return out;};
  const lower=half(sorted),upper=half([...sorted].reverse());lower.pop();upper.pop();return[...lower,...upper];
}
// Exterior study of the matched parts; snap fits are not machining geometry.
export function buildAccessories(p,state,L){
  const root=new T.Group(),caps=new T.Group(),fixings=new T.Group();root.name='Akcesoria_KLUS';root.add(caps,fixings);
  const materials=[];
  const materialFor=info=>{const {id,...options}=accessoryFinish(info),material=new T.MeshStandardMaterial(options);material.userData.accessoryFinish=id;materials.push(material);return material;};
  const W=p.width/1000,H=p.height/1000;
  function add(g,m,parent,name){const o=new T.Mesh(g,m);o.name=name;o.castShadow=!m.transparent;o.receiveShadow=true;parent.add(o);return o;}
  const kit=accessoryKit(p,state),capInfo=kit.find(x=>x.kind==='endcap'),bracketInfo=kit.find(x=>x.kind==='bracket');
  // Cleaned sections can contain separate aluminium regions. Close their
  // combined outer envelope without letting inner voids remove either side.
  const outerPoints=()=>p.section?p.section.filter(loop=>!loop.hole).flatMap(loop=>loop.points):profileContour(p);
  function capEnvelope(info){
    const d=info?.dimensions||{};
    // These cards name their dimensions in a rotated product view. Retain the
    // source record and rotate only the envelope in the profile's section plane.
    const rotated=p.id==='lipod50'&&info.ref.startsWith('C28028')||p.id==='lokom'&&info.ref.startsWith('C24005');
    return rotated?{width:d.height,height:d.width}:d;
  }
  function capShape(info){
    const sh=new T.Shape();
    const dimensions=capEnvelope(info),family=info.ref.slice(0,6);
    if(p.id==='giza'&&['C24029','C24030'].includes(family)){
      // GIL / GIZAT close the raised cover as well as the aluminium extrusion.
      // Source cards document these envelopes and a 4 mm face; retaining tabs
      // remain illustrative, rather than a claimed machining model.
      const w=dimensions.width/1000,h=dimensions.height/1000;
      sh.moveTo(-w/2,0);sh.lineTo(w/2,0);
      if(family==='C24029'){sh.lineTo(w/2,h-w/2);sh.absarc(0,h-w/2,w/2,0,Math.PI,false);}
      else{sh.lineTo(w/2,h);sh.lineTo(-w/2,h);}
      sh.closePath();return sh;
    }
    if(p.section&&dimensions.width&&dimensions.height){
      // Clip the section hull to the documented cap envelope. A plaster wing
      // is not part of the end cap, even when it dominates the profile width.
      const cw=dimensions.width/1000,ch=dimensions.height/1000;
      const cx=p.ledAngle?0:-(p.ledZ||0)/1000,top=p.ledAngle?H:(p.coverY??p.height)/1000;
      const left=cx-cw/2,right=cx+cw/2,bottom=top-ch;
      let pts=convexHull(outerPoints().map(([x,y])=>[x/1000,y/1000]));
      for(const [axis,bound,sign]of[[0,left,1],[0,right,-1],[1,bottom,1],[1,top,-1]]){
        const next=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],insideA=(a[axis]-bound)*sign>=0,insideB=(b[axis]-bound)*sign>=0;if(insideA)next.push(a);if(insideA!==insideB){const t=(bound-a[axis])/(b[axis]-a[axis]);next.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}pts=next;
      }
      if(pts.length>2){pts.forEach(([x,y],i)=>sh[i?'lineTo':'moveTo'](x,y));sh.closePath();return sh;}
    }
    if(p.universal){
      // The cap closes the open channel; retain the exterior silhouette of the extrusion.
      convexHull(outerPoints().map(([x,y])=>[x/1000,y/1000])).forEach(([x,y],i)=>sh[i?'lineTo':'moveTo'](x,y));sh.closePath();return sh;
    }
    if(p.id==='pikoo'){sh.absarc(0,.00525,.00525,0,Math.PI*2,false);return sh;}
    if(p.id==='alu45'){sh.moveTo(-.0095,0);sh.lineTo(.0085,0);sh.lineTo(.0095,.001);sh.lineTo(.0095,.019);sh.lineTo(.002,.019);sh.lineTo(-.0095,.0075);sh.closePath();return sh;}
    const w=(p.mount==='drywall'||p.id==='larko')?p.bodyWidth/1000:W,r=.0005;sh.moveTo(-w/2+r,0);sh.lineTo(w/2-r,0);sh.quadraticCurveTo(w/2,0,w/2,r);sh.lineTo(w/2,H-r);sh.quadraticCurveTo(w/2,H,w/2-r,H);sh.lineTo(-w/2+r,H);sh.quadraticCurveTo(-w/2,H,-w/2,H-r);sh.lineTo(-w/2,r);sh.quadraticCurveTo(-w/2,0,-w/2+r,0);return sh;
  }
  if(capInfo&&(!p.section||capInfo.dimensions?.width&&capInfo.dimensions?.height))for(const sign of [-1,1]){
    const end=new T.Group();end.userData.sign=sign;caps.add(end);
    const entryInfo=kit.find(a=>a.kind==='entrycap'),pairInfo=kit.find(a=>a.kind==='endcap-pair'),part=sign<0&&entryInfo?entryInfo:sign>0&&pairInfo?pairInfo:capInfo;
    const material=materialFor(part);
    const sourceGeometry=sign<0&&state.showCable?null:sourceEndcapGeometry(p,part,sign);
    if(sourceGeometry){
      end.userData.capOffset=0;
      end.userData.geometrySource=sourceGeometry.userData;
      add(sourceGeometry,material,end,'Zaslepka_'+part.ref);
      continue;
    }
    const shape=capShape({...capInfo,...part,dimensions:part.dimensions||capInfo.dimensions});
    if(sign<0&&state.showCable){const hole=new T.Path();hole.ellipse(-(p.ledZ||0)/1000,p.ledBase/1000+.0018,Math.min(p.channel/1000*.36,.004),Math.min(H*.23,.0015),0,Math.PI*2,true);shape.holes.push(hole);end.userData.cablePort={prepared:!entryInfo,center:[0,p.ledBase/1000+.0018,(p.ledZ||0)/1000]};}
    const depth=p.id==='giza'&&/^C240(?:29|30)/.test(part.ref)?.004:.0014;
    end.userData.capOffset=depth/2+.0001;
    const geo=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.0001,bevelThickness:.0001,bevelSegments:2,curveSegments:48,steps:1});geo.rotateY(Math.PI/2);geo.translate(-depth/2,0,0);add(geo,material,end,'Zaslepka_'+part.ref);
    if(!p.section&&!p.ledAngle&&p.id!=='pikoo')for(const side of [-1,1]){const tang=add(new RoundedBoxGeometry(.0025,Math.min(H*.55,.006),.0006,2,.0001),material,end,'Jezyczek_pogladowy');tang.position.set(-sign*(depth/2+.0005),H/2,side*(p.channel/2000-.0005));}
  }
  if(bracketInfo&&(!p.section||p.id==='micro'))for(const x of [-L*.32,L*.32]){
    const bracket=new T.Group();bracket.position.x=x;bracket.name=bracketInfo.name+'_'+bracketInfo.ref;fixings.add(bracket);const hiddenH=['microh','pdsh'].includes(p.id),m=materialFor(bracketInfo);
    const bw=p.bodyWidth/1000+(hiddenH?-.004:.0012),base=new T.Shape();base.moveTo(-.004,-bw/2);base.lineTo(.004,-bw/2);base.lineTo(.004,bw/2);base.lineTo(-.004,bw/2);base.closePath();const hole=new T.Path();hole.absarc(0,0,.0017,0,Math.PI*2,true);base.holes.push(hole);
    const g=new T.ExtrudeGeometry(base,{depth:.0006,bevelEnabled:false});g.rotateX(-Math.PI/2);add(g,m,bracket,'Stopa_z_otworem');
    if(p.id==='pikoo'){
      const curve=new T.EllipseCurve(0,.0059,.0057,.0057,.16,Math.PI-.16,false,0),pts=curve.getPoints(28).map(v=>new T.Vector3(0,v.y,v.x));add(new T.TubeGeometry(new T.CatmullRomCurve3(pts),28,.0006,8,false),m,bracket,'Obrotowe_gniazdo_PLD');
    }else for(const sign of [-1,1]){
      const h=hiddenH?.0024:Math.min(.005,H*.45),side=add(new RoundedBoxGeometry(.008,h,.0005,2,.00007),m,bracket,'Ramie_zatrzasku');side.position.set(0,h/2,sign*(bw/2-.0002));const lip=add(new RoundedBoxGeometry(.008,.0005,.0012,2,.00007),m,bracket,'Hak_zatrzasku');lip.position.set(0,h,sign*(bw/2-.0006));
    }
  }
  function update(s,e){
    caps.visible=s.endcaps&&s.view!=='macro'&&s.view!=='section';fixings.visible=s.showFixings&&s.view==='assembly';
    caps.children.forEach(o=>{o.visible=!(s.view==='assembly'&&(s.assemblyAngle==='end'&&o.userData.sign!==(s.showCable?1:-1)||s.assemblyAngle==='entry'&&o.userData.sign>0));o.position.x=o.userData.sign*(L/2+o.userData.capOffset+(s.view==='assembly'?e*.00016:0));});
    fixings.position.y=-.0007-(s.view==='assembly'?e*.00012:0);
  }
  update(state,state.exploded);return{root,update,dispose(){root.traverse(o=>o.geometry?.dispose());materials.forEach(m=>m.dispose());}};
}
