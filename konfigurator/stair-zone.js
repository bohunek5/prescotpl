import * as T from 'three';
import {stairLayout} from './stair-layout.js?v=1deadf165ec6';

export function buildStairZone({root,product,profile,state,box,wood,plaster,edge}){
 const q=stairLayout(profile,state),receivers=[],geometries=[],parts=new T.Group();parts.name='Trzy_stopnie_przekroj';root.add(parts);
 const put=(w,h,d,material,x,y,z,name)=>{const mesh=box(parts,w,h,d,material,x,y,z,/frez/.test(name)?0:.0012);mesh.name=name;receivers.push(mesh);return mesh;};
 const treadDepth=q.run+q.nosing,centreZ=q.nosing/2;
 for(let i=0;i<3;i++){
  const top=i*q.rise,z=(1-i)*q.run,bottom=top-q.thickness;
  if(i===1&&state.zone==='stair-under'&&q.recess>0){
   put(q.width,q.remainingWood,treadDepth,wood,0,bottom+q.recess+q.remainingWood/2,z+centreZ,'Stopien_warstwa_nad_frezem');
   const lo=z-q.run/2,hi=z+q.front;
   for(const [a,b]of[[lo,q.stripZ-q.gap/2],[q.stripZ+q.gap/2,hi]])put(q.width,q.recess,b-a,wood,0,bottom+q.recess/2,(a+b)/2,'Stopien_bok_frezu');
   for(const sign of[-1,1])put((q.width-.304)/2,q.recess,q.gap,wood,sign*(.152+(q.width-.304)/4),bottom+q.recess/2,q.stripZ,'Koniec_frezu');
  }else put(q.width,q.thickness,treadDepth,wood,0,top-q.thickness/2,z+centreZ,'Stopien_'+(i+1));
  if(i>0&&q.showRiser)put(q.width,q.rise-q.thickness,.018,plaster,0,top-q.thickness-(q.rise-q.thickness)/2,z+q.run/2-.009,'Podstopnica_'+i);
  // A recessed seam separates the tread from the riser and catches the light.
  if(i>0&&q.showRiser)put(q.width-.004,.002,.0015,edge,0,top-q.thickness-.003,z+q.run/2+.0005,'Szczelina_pod_stopniem_'+i);
 }
 put(q.width+.025,.018,q.run*3+q.nosing+.025,plaster,0,-q.thickness-.03,centreZ,'Podloga_przy_schodach');
 let cableTail;
 if(state.zone==='stair-under'){
  product.group.rotation.x=Math.PI;
  if(profile.ledAngle)product.group.rotation.y=Math.PI;
  product.group.position.set(0,q.underside-q.seat,q.stripZ);
  cableTail=[new T.Vector3(-.158,q.underside+.005,q.stripZ),new T.Vector3(-.170,q.underside+.008,q.stripZ),new T.Vector3(-.190,q.underside+.008,q.run/2-.020),new T.Vector3(-.195,.045,q.run/2-.026)];
 }else{
  const thickness=Math.max(.034,q.recess+.008),wallDepth=q.run*3+q.nosing;
  const openingY=q.rise+q.sideHeight,wallTop=q.rise*2+.10,wallBottom=-q.thickness-.02;
  if(q.recess){
   put(thickness-q.recess,wallTop-wallBottom,wallDepth,plaster,q.wallInner+q.recess+(thickness-q.recess)/2,(wallTop+wallBottom)/2,centreZ,'Bok_schodow_za_frezem');
   // One continuous face with a real opening avoids seams between filler boxes.
   const face=new T.Shape(),u0=-q.run*1.5-q.nosing,u1=q.run*1.5;
   face.moveTo(u0,wallBottom);face.lineTo(u1,wallBottom);face.lineTo(u1,wallTop);face.lineTo(u0,wallTop);face.closePath();
   const opening=new T.Path();opening.moveTo(-.152,openingY-q.gap/2);opening.lineTo(-.152,openingY+q.gap/2);opening.lineTo(.152,openingY+q.gap/2);opening.lineTo(.152,openingY-q.gap/2);opening.closePath();face.holes.push(opening);
   const geometry=new T.ExtrudeGeometry(face,{depth:q.recess,bevelEnabled:false,steps:1});geometry.rotateY(Math.PI/2);geometry.translate(q.wallInner,0,0);geometries.push(geometry);
   const front=new T.Mesh(geometry,plaster);front.name='Bok_schodow_z_frezem';front.castShadow=true;front.receiveShadow=true;parts.add(front);receivers.push(front);
  }else put(thickness,wallTop-wallBottom,wallDepth,plaster,q.wallInner+thickness/2,(wallTop+wallBottom)/2,centreZ,'Bok_schodow');
  const basis=new T.Matrix4().makeBasis(new T.Vector3(0,0,1),new T.Vector3(-1,0,0),new T.Vector3(0,-1,0));
  product.group.quaternion.setFromRotationMatrix(basis);product.group.position.set(q.wallInner-q.seat,openingY,0);
  cableTail=[new T.Vector3(q.wallInner+.006,openingY,-.158),new T.Vector3(q.wallInner+.010,openingY,-.17),new T.Vector3(q.wallInner+.010,.07,-.17)];
 }
 root.userData.stair={...q,profileLength:.3,selectedStep:2,side:state.zone==='stair-side'};
 return{receivers,cableTail,layout:q,geometries};
}
