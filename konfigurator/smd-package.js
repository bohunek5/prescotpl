import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Package outlines use manufacturer mechanical drawings; the optical layout
// follows PRESCOT product photos. This is presentation geometry, not a PCB footprint.
export function smdDimensions(t){
  const code=t.package||(['CCT','RGBW'].includes(t.type)?'5050':'2835');
  return {code,...({'2835':{x:2.8,z:3.5,height:.7},'4014':{x:1.4,z:4,height:.65},'2216':{x:2.2,z:1.6,height:.55},'5050':{x:5,z:5,height:1.6}}[code]||{x:2.8,z:3.5,height:.7})};
}
export function smdPackage(t){
  const d=smdDimensions(t),parts=[],base=.26,wide=d.code==='5050';
  const outline=(w,h,chamfer=.08)=>{const s=new T.Shape(),x=w/2,z=h/2,c=chamfer;[[-x+c,-z],[x-c,-z],[x,-z+c],[x,z-c],[x-c,z],[-x+c,z],[-x,z-c],[-x,-z+c]].forEach(([a,b],i)=>s[i?'lineTo':'moveTo'](a,b));s.closePath();return s;};
  const box=(x,y,z,cx,cy,cz,role,name)=>{const g=new T.BoxGeometry(x,y,z);g.translate(cx,cy,cz);parts.push({g,role,name});};
  const solid=(shape,depth,y,role,name)=>{const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1,curveSegments:40});g.rotateX(-Math.PI/2);g.translate(0,y,0);parts.push({g,role,name});};
  const face=(shape,y,role,name)=>{const g=new T.ShapeGeometry(shape,40);g.rotateX(-Math.PI/2);g.translate(0,y,0);parts.push({g,role,name});};
  // A shallow base and open, recessed optical well replace stacked solid cubes.
  solid(outline(d.x,d.z,wide?.22:.10),wide?.38:.22,base,'body','SMD_podstawa');
  const rim=outline(d.x,d.z,wide?.22:.10),aperture=wide&&t.type==='RGBW'?new T.Shape():outline(wide?4.1:d.x-.47,wide?3.8:d.z-.65,wide?.15:.24);
  if(wide&&t.type==='RGBW')aperture.absarc(0,0,2.08,0,Math.PI*2,false);
  rim.holes.push(new T.Path(aperture.getPoints(40).reverse()));
  solid(rim,d.height-(wide?.38:.22),base+(wide?.38:.22),'body','SMD_krawedz_studni');
  const y=base+d.height-(wide?.22:.12);
  if(t.type==='RGBW'){
    // White phosphor occupies one half of the well. Three small RGB dies sit
    // in the clear half, as in PRESCOT 24E033 product photography.
    const white=new T.Shape();white.moveTo(-2.01,-.10);white.absarc(0,0,2.01,Math.PI+Math.asin(.10/2.01),Math.PI*2-Math.asin(.10/2.01),false);white.closePath();
    face(aperture,base+.42,'silver','SMD_pole_odblaskowe');face(white,y,'warm','Luminofor_W');
    for(const [i,role]of ['R','G','B'].entries()){
      const x=(i-1)*1.05,z=-.72;
      box(.68,.035,.68,x,y-.04,z,'silver','SMD_pole_chipu_'+role);
      box(.40,.045,.40,x,y,z,role,'Diody_'+role);
      box(.055,.03,.5,x+.22,y+.04,z+.32,'gold','SMD_polaczenie_'+role);
    }
  }else if(t.type==='CCT'){
    const half=outline(3.8,1.64,.14);
    for(const [sign,role,name]of [[-1,'warm','Diody_WW'],[1,'cool','Diody_CW']]){const g=new T.ShapeGeometry(half,12);g.rotateX(-Math.PI/2);g.translate(0,y,sign*.92);parts.push({g,role,name});}
    box(4.1,.15,.14,0,y,0,'body','SMD_przegroda_CCT');
  }else face(aperture,y,'warm','Luminofor_SMD');
  for(const sign of[-1,1])for(const z of wide?[-1.65,0,1.65]:[0]){
    box(wide?.48:.25,.12,wide?.64:d.z*.58,sign*(d.x/2-.02),base+.01,z,'silver','SMD_wyprowadzenia');
  }
  // Small cathode index, on the housing rather than on the luminous surface.
  box(.14,.012,wide?.35:.27,-d.x/2+.14,base+d.height+.008,-d.z/2+.24,'black','SMD_znacznik_katody');
  for(const {g}of parts)g.scale(.001,.001,.001);
  for(const part of parts)if(part.g.index){const original=part.g;part.g=original.toNonIndexed();original.dispose();}
  const merged=[];
  for(const role of new Set(parts.map(p=>p.role))){const list=parts.filter(p=>p.role===role),g=mergeGeometries(list.map(p=>p.g));list.forEach(p=>p.g.dispose());merged.push({g,role,name:role==='body'?'SMD_obudowa_z_wneka':list[0].name});}
  return {dimensions:d,parts:merged,emitterHeight:y/1000};
}
