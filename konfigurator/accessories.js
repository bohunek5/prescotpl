import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {accessoryKit} from './accessory-data.js?v=a9d8f23925dd';
import {profileContour} from './profile-shapes.js?v=a9d8f23925dd';
// Exterior study of the matched parts; snap fits are not machining geometry.
export function buildAccessories(p,state,L){
  const root=new T.Group(),caps=new T.Group(),fixings=new T.Group();root.name='Akcesoria_KLUS';root.add(caps,fixings);
  const plastic=new T.MeshStandardMaterial({color:'#bfc1bf',roughness:.34}),metal=new T.MeshStandardMaterial({color:'#c1c7ca',metalness:.86,roughness:.24}),clear=new T.MeshStandardMaterial({color:'#e8eeee',transparent:true,opacity:.48,roughness:.19});
  const W=p.width/1000,H=p.height/1000;
  function add(g,m,parent,name){const o=new T.Mesh(g,m);o.name=name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const kit=accessoryKit(p,state),capInfo=kit.find(x=>x.kind==='endcap'),bracketInfo=kit.find(x=>x.kind==='bracket');
  function capShape(){
    const sh=new T.Shape();
    if(p.section&&capInfo?.dimensions?.width&&capInfo?.dimensions?.height){
      // Clip the section hull to the documented cap envelope. A plaster wing
      // is not part of the end cap, even when it dominates the profile width.
      const cw=capInfo.dimensions.width/1000,ch=capInfo.dimensions.height/1000;
      const cx=p.ledAngle?0:-(p.ledZ||0)/1000,top=p.ledAngle?H:(p.coverY??p.height)/1000;
      const left=cx-cw/2,right=cx+cw/2,bottom=top-ch;
      let pts=profileContour(p).map(([x,y])=>[x/1000,y/1000]);
      for(const [axis,bound,sign]of[[0,left,1],[0,right,-1],[1,bottom,1],[1,top,-1]]){
        const next=[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],insideA=(a[axis]-bound)*sign>=0,insideB=(b[axis]-bound)*sign>=0;if(insideA)next.push(a);if(insideA!==insideB){const t=(bound-a[axis])/(b[axis]-a[axis]);next.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}}pts=next;
      }
      pts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
      const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
      const half=list=>{const out=[];for(const v of list){while(out.length>1&&cross(out.at(-2),out.at(-1),v)<=0)out.pop();out.push(v);}return out;};
      const lower=half(pts),upper=half([...pts].reverse());lower.pop();upper.pop();const hull=[...lower,...upper];
      if(hull.length>2){hull.forEach(([x,y],i)=>sh[i?'lineTo':'moveTo'](x,y));sh.closePath();return sh;}
    }
    if(p.universal){
      // The cap closes the open channel; retain the exterior silhouette of the extrusion.
      const points=profileContour(p).map(([x,y])=>[x/1000,y/1000]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
      const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
      const hull=pts=>{const out=[];for(const q of pts){while(out.length>1&&cross(out.at(-2),out.at(-1),q)<=0)out.pop();out.push(q);}return out;};
      const lower=hull(points),upper=hull([...points].reverse());lower.pop();upper.pop();[...lower,...upper].forEach(([x,y],i)=>sh[i?'lineTo':'moveTo'](x,y));sh.closePath();return sh;
    }
    if(p.id==='pikoo'){sh.absarc(0,.00525,.00525,0,Math.PI*2,false);return sh;}
    if(p.id==='alu45'){sh.moveTo(-.0095,0);sh.lineTo(.0085,0);sh.lineTo(.0095,.001);sh.lineTo(.0095,.019);sh.lineTo(.002,.019);sh.lineTo(-.0095,.0075);sh.closePath();return sh;}
    const w=(p.mount==='drywall'||p.id==='larko')?p.bodyWidth/1000:W,r=.0005;sh.moveTo(-w/2+r,0);sh.lineTo(w/2-r,0);sh.quadraticCurveTo(w/2,0,w/2,r);sh.lineTo(w/2,H-r);sh.quadraticCurveTo(w/2,H,w/2-r,H);sh.lineTo(-w/2+r,H);sh.quadraticCurveTo(-w/2,H,-w/2,H-r);sh.lineTo(-w/2,r);sh.quadraticCurveTo(-w/2,0,-w/2+r,0);return sh;
  }
  if(capInfo&&(!p.section||capInfo.dimensions?.width&&capInfo.dimensions?.height))for(const sign of [-1,1]){
    const end=new T.Group();end.userData.sign=sign;caps.add(end);
    const shape=capShape(),entryInfo=kit.find(a=>a.kind==='entrycap'),pairInfo=kit.find(a=>a.kind==='endcap-pair');
    if(sign<0&&state.showCable){const hole=new T.Path();hole.ellipse(-(p.ledZ||0)/1000,p.ledBase/1000+.0018,Math.min(p.channel/1000*.36,.004),Math.min(H*.23,.0015),0,Math.PI*2,true);shape.holes.push(hole);end.userData.cablePort={prepared:!entryInfo,center:[0,p.ledBase/1000+.0018,(p.ledZ||0)/1000]};}
    const geo=new T.ExtrudeGeometry(shape,{depth:.0014,bevelEnabled:true,bevelSize:.0001,bevelThickness:.0001,bevelSegments:2,steps:1});geo.rotateY(Math.PI/2);geo.translate(-.0007,0,0);add(geo,/aluminum|steel/.test(capInfo.material||'')?metal:plastic,end,'Zaslepka_'+(sign<0&&entryInfo?entryInfo.ref:sign>0&&pairInfo?pairInfo.ref:capInfo.ref));
    if(!p.section&&!p.ledAngle&&p.id!=='pikoo')for(const side of [-1,1]){const tang=add(new RoundedBoxGeometry(.0025,Math.min(H*.55,.006),.0006,2,.0001),plastic,end,'Jezyczek_pogladowy');tang.position.set(-sign*.0012,H/2,side*(p.channel/2000-.0005));}
  }
  if(bracketInfo&&(!p.section||p.id==='micro'))for(const x of [-L*.32,L*.32]){
    const bracket=new T.Group();bracket.position.x=x;bracket.name=bracketInfo.name+'_'+bracketInfo.ref;fixings.add(bracket);const hiddenH=['microh','pdsh'].includes(p.id),m=hiddenH?plastic:['pikoo','pikozm'].includes(p.id)?clear:metal;
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
    plastic.color.set(capInfo?.ref.endsWith('C10')?'#f6f6f2':capInfo?.ref.endsWith('C07')?'#333638':'#c1c3c1');
    caps.children.forEach(o=>{o.visible=!(s.view==='assembly'&&(s.assemblyAngle==='end'&&o.userData.sign<0||s.assemblyAngle==='entry'&&o.userData.sign>0));o.position.x=o.userData.sign*(L/2+.0008+(s.view==='assembly'?e*.00016:0));});
    fixings.position.y=-.0007-(s.view==='assembly'?e*.00012:0);
  }
  update(state,state.exploded);return{root,update,dispose(){root.traverse(o=>o.geometry?.dispose());plastic.dispose();metal.dispose();clear.dispose();}};
}
