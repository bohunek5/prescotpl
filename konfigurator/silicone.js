import * as T from 'three';
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';
import {diffuserMap} from './light-textures.js?v=42bf92f1850c';
// Outer PRO dimensions follow the supplied manufacturer drawings. Wall and
// sealing details are illustrative; adding a sleeve does not assign an IP rating.
export function buildSilicone(t,sleeve,L){
  const root=new T.Group();root.name='Ochrona_silikonowa';const shell=new T.Group(),caps=new T.Group();root.add(shell,caps);
  const native=t.encapsulation==='tube',coating=t.encapsulation==='coating',spec=sleeve||(native?{width:t.width+2,height:4,clear:true,shape:'basic'}:{width:t.envelopeWidth??t.width,height:t.envelopeHeight??5,clear:false,shape:'coating'});
  const W=spec.width/1000,H=spec.height/1000,side=spec.shape==='side',offset=coating||side?0:(spec.pcbLift??.8)/1000,geos=[],mats=[];
  const material=opts=>{const m=new T.MeshStandardMaterial(opts);mats.push(m);return m;};
  const silicone=material({color:spec.clear?'#c8d3d3':'#f7f8f3',roughness:coating?.4:.18,metalness:0,transparent:!!spec.clear,opacity:spec.clear?.42:1,depthWrite:!spec.clear,side:T.DoubleSide});
  const opal=material({color:'#f5f5f0',roughness:.29,transparent:true,opacity:.72,depthWrite:false,side:T.DoubleSide});
  const plug=material({color:'#e7efeb',roughness:.27,transparent:true,opacity:.73,side:T.DoubleSide});
  const emission=diffuserMap({strip:t,profile:{height:spec.height,ledBase:offset*1000,channelDepth:spec.height-offset*1000},cover:{id:'silicone'}},L*1000);silicone.emissiveMap=emission;
  const baseMaterial=material({color:'#f1f2ec',roughness:.43,side:T.DoubleSide});
  const outer=new T.Shape();
  if(coating){outer.moveTo(-W/2,0);outer.lineTo(W/2,0);outer.lineTo(W/2,.00055);outer.bezierCurveTo(W/2,H*.72,W*.28,H,0,H);outer.bezierCurveTo(-W*.28,H,-W/2,H*.72,-W/2,.00055);outer.closePath();}
  else if(spec.shape==='oval'){outer.moveTo(-W*.27,0);outer.lineTo(W*.27,0);outer.bezierCurveTo(W*.60,H*.18,W*.64,H*.71,W*.29,H*.91);outer.bezierCurveTo(W*.12,H*1.03,-W*.12,H*1.03,-W*.29,H*.91);outer.bezierCurveTo(-W*.64,H*.71,-W*.60,H*.18,-W*.27,0);outer.closePath();}
  else if(spec.shape==='top'){outer.moveTo(-W/2,0);outer.lineTo(W/2,0);outer.lineTo(W/2,H*.25);outer.bezierCurveTo(W/2,H*1.25,-W/2,H*1.25,-W/2,H*.25);outer.closePath();}
  else {const r=coating?.00035:.0006;outer.moveTo(-W/2+r,0);outer.lineTo(W/2-r,0);outer.quadraticCurveTo(W/2,0,W/2,r);outer.lineTo(W/2,H-r);outer.quadraticCurveTo(W/2,H,W/2-r,H);outer.lineTo(-W/2+r,H);outer.quadraticCurveTo(-W/2,H,-W/2,H-r);outer.lineTo(-W/2,r);outer.quadraticCurveTo(-W/2,0,-W/2+r,0);}
  if(coating){
    const hole=new T.Path();hole.moveTo(-.00145,.00026);hole.lineTo(-.00145,.00135);hole.quadraticCurveTo(-.00145,.0018,-.001,.0018);hole.lineTo(.001,.0018);hole.quadraticCurveTo(.00145,.0018,.00145,.00135);hole.lineTo(.00145,.00026);hole.closePath();outer.holes.push(hole);
  }else{
    const hole=new T.Path(),w=side?W-.0018:spec.shape==='oval'?.011:Math.min(W-.0012,t.width/1000+.0005),floor=side?.001:offset,h=side?H-.002:spec.shape==='basic'?H-offset-.0007:.0022;
    hole.moveTo(-w/2,floor);hole.lineTo(-w/2,floor+h);
    if(spec.shape==='top'){
      hole.lineTo(-W*.20,floor+h);hole.bezierCurveTo(-W*.20,H*.35,-W*.35,H*.35,-W*.35,H*.48);hole.bezierCurveTo(-W*.35,H*.87,W*.35,H*.87,W*.35,H*.48);hole.bezierCurveTo(W*.35,H*.35,W*.20,H*.35,W*.20,floor+h);hole.lineTo(w/2,floor+h);
    }else{hole.lineTo(w/2,floor+h);}
    hole.lineTo(w/2,floor);hole.closePath();outer.holes.push(hole);
    if(['standard','oval'].includes(spec.shape)){const cavity=new T.Path();cavity.ellipse(0,H*.64,W*.24,H*.12,0,2*Math.PI,true);outer.holes.push(cavity);}
  }
  const geo=new T.ExtrudeGeometry(outer,{depth:L,bevelEnabled:false,steps:Math.max(24,Math.ceil(L*500)),curveSegments:32});geo.rotateY(Math.PI/2);geo.translate(-L/2,-offset,0);geo.scale(1000,1000,1000);toCreasedNormals(geo,Math.PI/4);geo.scale(.001,.001,.001);geos.push(geo);
  const pos=geo.attributes.position,uv=geo.attributes.uv,faces=[[],[]],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
  for(let i=0;i<pos.count;i++)uv.setXY(i,(pos.getX(i)+L/2)/L,.5+pos.getZ(i)/W);
  // Classify whole faces before batching. Smoothed vertex normals can cross the
  // material boundary within a triangle, creating jagged ends and hundreds of
  // draw calls when every alternating strip is kept as a separate group.
  for(let i=0;i<pos.count;i+=3){
    a.fromBufferAttribute(pos,i);b.fromBufferAttribute(pos,i+1).sub(a);c.fromBufferAttribute(pos,i+2).sub(a);b.cross(c).normalize();
    const lit=spec.clear?true:side?b.z>.3:coating||['top','oval'].includes(spec.shape)?b.y>-.15:b.y>.5;
    faces[lit?0:1].push(i,i+1,i+2);
  }
  geo.setIndex(faces.flat());geo.clearGroups();let start=0;
  faces.forEach((indices,materialIndex)=>{if(indices.length)geo.addGroup(start,indices.length,materialIndex);start+=indices.length;});
  const tube=new T.Mesh(geo,[silicone,baseMaterial]);tube.name=sleeve?'Koszulka_'+sleeve.ref:native?'COB_IP67_oslona_pogladowa':'WCOB_powloka_IP62';tube.castShadow=!spec.clear;tube.receiveShadow=true;shell.add(tube);const original=geo.attributes.position.array.slice(),originalNormals=geo.attributes.normal.array.slice();let geometryKey='';
  const capShape=outer.clone();capShape.holes=[];
  if(!coating)for(const sign of [-1,1]){
    const cap=new T.Group();cap.userData.sign=sign;caps.add(cap);const endShape=capShape.clone();if(sign<0){const hole=new T.Path();hole.ellipse(0,side?H/2:offset+.001,W*.37,side?H*.36:Math.min(.0012,H*.2),0,2*Math.PI,true);endShape.holes.push(hole);}const g=new T.ExtrudeGeometry(endShape,{depth:.0018,bevelEnabled:true,bevelSize:.00015,bevelThickness:.00015,bevelSegments:3,steps:1});g.rotateY(Math.PI/2);g.translate(-.0009,-offset,0);geos.push(g);const mesh=new T.Mesh(g,plug);mesh.name=sign<0?'Zamkniecie_przy_przewodzie_pogladowe':'Zamkniecie_koncowe_pogladowe';cap.add(mesh);
    const bead=new T.Mesh(new T.TorusGeometry(Math.min(W,H)*.33,.00018,6,20),opal);bead.rotation.y=Math.PI/2;bead.position.set(-sign*.001,.0012,0);cap.add(bead);geos.push(bead.geometry);
  }
  function update(state,point,curvature,color){
    const macro=state.view==='macro',inspect=macro&&state.detail==='sleeve';root.visible=coating||!macro||['sleeve','seal'].includes(state.detail);caps.visible=!coating&&(!macro||state.detail==='seal');
    const nextKey=[inspect,curvature].join('|');
    if(nextKey!==geometryKey){
      geometryKey=nextKey;const p=geo.attributes.position,n=geo.attributes.normal;
      for(let i=0;i<p.count;i++){
        let x=original[i*3],y=original[i*3+1],z=original[i*3+2];
        if(inspect&&!coating)x+=Math.min(.042,L*.42);
        const v=point(x,y,z),a=x*curvature,cs=Math.cos(a),sn=Math.sin(a),nx=originalNormals[i*3],ny=originalNormals[i*3+1];
        p.setXYZ(i,v.x,v.y,v.z);n.setXYZ(i,nx*cs-ny*sn,nx*sn+ny*cs,originalNormals[i*3+2]);
      }
      p.needsUpdate=true;n.needsUpdate=true;geo.computeBoundingSphere();
    }
    caps.children.forEach(cap=>{const sign=cap.userData.sign,x=sign*(L/2+.0011+(macro&&!state.sealClosed?.009:0));cap.position.copy(point(x,0,0));cap.rotation.z=x*curvature;});
    opal.emissive.copy(color);opal.emissiveIntensity=state.light?state.dimmer/100*.4:0;
    silicone.emissive.copy(color);silicone.emissiveIntensity=!spec.clear&&state.light?state.dimmer/100*(coating?(state.lightStudy?10:5):(state.lightStudy?7:3.8)):0;
    root.userData={kind:coating?'coating':native?'factory-ip67':'pro-sleeve',shape:spec.shape,pcbOrientation:side?'vertical':'horizontal',outerWidthMm:spec.width,outerHeightMm:spec.height,milky:!spec.clear,shapeVerified:coating?!!t.envelopeVerified:!!sleeve?.verified,closed:!macro||state.sealClosed,dimensionsVerified:coating?!!t.envelopeVerified:!!sleeve?.verified};
  }
  return{root,update,dispose(){geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());emission.dispose();}};
}
