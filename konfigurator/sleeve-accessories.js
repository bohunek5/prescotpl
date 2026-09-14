import * as T from 'three';
import {sleeveAccessoryKit} from './sleeve-accessory-data.js?v=1deadf165ec6';
import {coatingSection} from './sleeve-shapes.js?v=1deadf165ec6';

// White silicone cups and model-specific holders follow catalog photography.
// Wall, screw and overlap dimensions are illustrative, not tooling dimensions.
export function buildSleeveAccessories(spec,offset,{emission=null}={}){
 const caps=new T.Group(),holders=new T.Group(),geos=[],mats=[],kit=sleeveAccessoryKit(spec);
 caps.name='Zaslepki_silikonowe_PRESCOT';holders.name='Uchwyty_koszulki_PRESCOT';
 const material=options=>{const m=new T.MeshStandardMaterial(options);mats.push(m);return m;};
 const white=material({color:'#f3f3ee',roughness:.42}),plastic=material({color:'#cfd4d2',roughness:.22,transparent:true,opacity:.72,depthWrite:false}),metal=material({color:'#aeb4b6',metalness:.9,roughness:.27});
 const W=spec.width,H=spec.height,off=offset*1000,wcob=spec.technology==='WCOB',overlap=wcob?2.4:3.6,wall=wcob?.45:.85,collar=wcob?.20:.65;
 const optic=wcob?material({color:'#f7f8f3',roughness:.4,emissiveMap:emission}):white;
 function section(expand=0){
  if(wcob)return coatingSection(W+expand*2,H+expand);
  const w=W+expand*2,h=H+expand*2,x=w/2,b=-expand,s=new T.Shape();
  if(spec.shape==='oval'){s.moveTo(-w*.27,b);s.lineTo(w*.27,b);s.bezierCurveTo(w*.60,b+h*.18,w*.64,b+h*.71,w*.29,b+h*.91);s.bezierCurveTo(w*.12,b+h*1.03,-w*.12,b+h*1.03,-w*.29,b+h*.91);s.bezierCurveTo(-w*.64,b+h*.71,-w*.60,b+h*.18,-w*.27,b);}
  else if(spec.shape==='top'){s.moveTo(-x,b);s.lineTo(x,b);s.lineTo(x,b+h*.25);s.bezierCurveTo(x,b+h*1.25,-x,b+h*1.25,-x,b+h*.25);}
  else{const r=.65+expand/2;s.moveTo(-x+r,b);s.lineTo(x-r,b);s.quadraticCurveTo(x,b,x,b+r);s.lineTo(x,b+h-r);s.quadraticCurveTo(x,b+h,x-r,b+h);s.lineTo(-x+r,b+h);s.quadraticCurveTo(-x,b+h,-x,b+h-r);s.lineTo(-x,b+r);s.quadraticCurveTo(-x,b,-x+r,b);}
  s.closePath();return s;
 }
 function extrude(shape,depth,x,group,mat,name){const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:48});g.rotateY(Math.PI/2);g.translate(x,-off,0);geos.push(g);
  if(wcob&&mat===optic){const pos=g.attributes.position,uv=g.attributes.uv;for(let i=0;i<pos.count;i++)uv.setXY(i,.5,.5+pos.getZ(i)/W);const faces=[[],[]],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();for(let i=0;i<pos.count;i+=3){a.fromBufferAttribute(pos,i);b.fromBufferAttribute(pos,i+1).sub(a);c.fromBufferAttribute(pos,i+2).sub(a);b.cross(c).normalize();const high=(pos.getY(i)+pos.getY(i+1)+pos.getY(i+2))/3>.3;faces[high&&b.y>-.3?0:1].push(i,i+1,i+2);}g.setIndex(faces.flat());g.clearGroups();g.addGroup(0,faces[0].length,0);g.addGroup(faces[0].length,faces[1].length,1);mat=[optic,white];}
  const o=new T.Mesh(g,mat);o.name=name;o.castShadow=true;o.receiveShadow=true;group.add(o);return o;}
 const capData=kit.filter(a=>a.kind==='cap');
 if(capData.length)for(const sign of[-1,1]){
  const cap=new T.Group();cap.scale.setScalar(.001);cap.name=wcob?(sign<0?'WCOB_nasadka_przewodowa':'WCOB_zaslepka_pelna'):'';cap.userData={sign,ref:capData[0].ref,material:'white-silicone',cup:true,wire:sign<0,overlapMm:overlap,geometryVerified:false};caps.add(cap);
  const ring=section(collar);ring.holes.push(new T.Path(section(wcob?.04:.08).getPoints(48).reverse()));
  extrude(ring,overlap,-overlap,cap,optic,'Silikonowy_kolnierz');
  const end=section(collar),holeY=spec.wireHeight??(spec.shape==='side'?H*.45:Math.min(H*.45,off+1.3)),radius=Math.min(1.3,W*.21,H*.24);
  if(sign<0){const hole=new T.Path();hole.absellipse(0,holeY,radius,radius,0,2*Math.PI,true);end.holes.push(hole);}
  extrude(end,wall,0,cap,optic,sign<0?'Zaslepka_z_przepustem':'Zaslepka_pelna');
  if(sign<0&&capData[0].kit){const neck=new T.Shape();neck.absellipse(0,holeY,radius+.55,radius+.55,0,2*Math.PI);const bore=new T.Path();bore.absellipse(0,holeY,radius,radius,0,2*Math.PI,true);neck.holes.push(bore);extrude(neck,wcob?2.8:3.8,wall,cap,white,'Silikonowy_krociec_przewodu');}
 }
 const holderData=kit.find(a=>a.kind==='holder');
 if(holderData)for(const anchor of[-.27,.27]){
  const holder=new T.Group();holder.scale.setScalar(.001);holder.userData={anchor,ref:holderData.ref,material:holderData.material,geometryVerified:false};holders.add(holder);
  const mat=holderData.material==='metal'?metal:plastic,depth=spec.shape==='side'?8:10,thick=holderData.material==='metal'?.55:.85;
  let shape=new T.Shape();
  if(['oval','top'].includes(spec.shape)){
    const points=[],r=W/2+.15,cy=spec.shape==='oval'?H/2:H*.30,limit=spec.shape==='oval'?2.05:1.7;
    for(let i=0;i<=48;i++){const a=-limit+2*limit*i/48;points.push([Math.sin(a)*(r+thick),cy-Math.cos(a)*(cy+thick)]);}
    for(let i=48;i>=0;i--){const a=-limit+2*limit*i/48;points.push([Math.sin(a)*r,cy-Math.cos(a)*cy]);}
    points.forEach(([x,y],i)=>shape[i?'lineTo':'moveTo'](x,y));shape.closePath();
  }else{
    const x=W/2+.12,height=spec.shape==='standard'?H*.36:spec.shape==='side'?H*.65:H*.72;
    [[-x-thick,-thick],[x+thick,-thick],[x+thick,height],[x-.65,height],[x-.65,height-thick],[x,height-thick],[x,0],[-x,0],[-x,height-thick],[-x+.65,height-thick],[-x+.65,height],[-x-thick,height]].forEach(([a,b],i)=>shape[i?'lineTo':'moveTo'](a,b));shape.closePath();
  }
  extrude(shape,depth,-depth/2,holder,mat,'Obejma_'+spec.ref);
  // Screw eye: external tab on BASIC and SIDE; a base eye on STANDARD/TOP/OVAL.
  const external=['basic','side'].includes(spec.shape),eye=new T.Shape(),z=external?W/2+3.0:0;
  eye.absellipse(0,z,2.7,2.7,0,2*Math.PI);const bore=new T.Path();bore.absellipse(0,z,1.3,1.3,0,2*Math.PI,true);eye.holes.push(bore);
  const g=new T.ExtrudeGeometry(eye,{depth:thick,bevelEnabled:false,curveSegments:32});g.rotateX(Math.PI/2);g.translate(0,-off-.05,0);geos.push(g);const o=new T.Mesh(g,mat);o.name='Otwor_mocowania';holder.add(o);
 }
 return{caps,holders,update(state,point,curvature,L,color=null,intensity=0){
  const open=state.view==='macro'&&state.detail==='seal'&&!state.sealClosed,visible=['product','seal'].includes(state.detail)||wcob&&state.detail==='segment'||state.view!=='macro';caps.visible=visible&&state.sleeveCaps!==false;holders.visible=visible&&!!state.sleeveFixings;
  if(wcob&&color){const attached=!open;optic.emissive.copy(color);optic.emissiveIntensity=attached?intensity:0;caps.userData={lightLevel:optic.emissiveIntensity,continuous:attached&&state.light};}
  for(const cap of caps.children){const sign=cap.userData.sign,x=sign*(L/2+(open?.010:0));cap.position.copy(point(x,0,0));cap.rotation.set(0,sign<0?Math.PI:0,x*curvature);}
  for(const holder of holders.children){const x=L*holder.userData.anchor;holder.position.copy(point(x,0,0));holder.rotation.z=x*curvature;}
 },dispose(){geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}};
}
