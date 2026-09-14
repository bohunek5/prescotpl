import {stripOutputScale} from './light-state.js?v=e64a20d5c820';
import {sleeveInsertionPose} from './sleeve-motion.js?v=e64a20d5c820';
import {factorySilicone} from './strip-protection.js?v=e64a20d5c820';
import * as T from 'three';
import {toCreasedNormals,mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {diffuserMap} from './light-textures.js?v=e64a20d5c820';
import {sleeveDrawing,sectionShapes,coatingSection} from './sleeve-shapes.js?v=e64a20d5c820';
import {createLightVolume} from './light-volume.js?v=e64a20d5c820';
import {buildSleeveAccessories} from './sleeve-accessories.js?v=e64a20d5c820';
// Outer PRO dimensions follow the supplied manufacturer drawings. Wall and
// sealing details are illustrative; adding a sleeve does not assign an IP rating.
export function buildSilicone(t,sleeve,L){
  const root=new T.Group();root.name='Ochrona_silikonowa';const shell=new T.Group();root.add(shell);
  const native=t.encapsulation==='tube',coating=t.encapsulation==='coating',spec=sleeve||factorySilicone(t);
  const W=spec.width/1000,H=spec.height/1000,side=spec.shape==='side',offset=coating||side?0:(spec.pcbLift??.8)/1000,geos=[],mats=[],drawing=sleeveDrawing(spec);
  const material=opts=>{const m=new T.MeshStandardMaterial(opts);mats.push(m);return m;};
  const silicone=material({color:spec.clear?'#c8d3d3':'#f7f8f3',roughness:coating?.4:.18,metalness:0,transparent:!!spec.clear,opacity:spec.clear?.18:1,depthWrite:!spec.clear,side:T.DoubleSide});

  const emission=diffuserMap({strip:t,profile:{height:spec.height,ledBase:offset*1000,channelDepth:spec.height-offset*1000},cover:{id:'silicone'}},L*1000);silicone.emissiveMap=emission;
  const inserted={value:1};
  silicone.onBeforeCompile=shader=>{shader.uniforms.sleeveInserted=inserted;shader.fragmentShader='uniform float sleeveInserted;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance *= sleeveInserted > 0.9999 ? 1.0 : sleeveInserted < 0.0001 ? 0.0 : 1.0 - smoothstep(sleeveInserted - 0.006, sleeveInserted + 0.006, vEmissiveMapUv.x);');};
  silicone.customProgramCacheKey=()=> 'sleeve-insertion-v1';
  const cutMaterial=material({color:'#e3e5df',roughness:.42});
  const baseMaterial=material({color:'#f1f2ec',roughness:.43,side:T.DoubleSide});
  const outer=coating?coatingSection(W,H):new T.Shape();
  if(!coating&&spec.shape==='oval'){outer.moveTo(-W*.27,0);outer.lineTo(W*.27,0);outer.bezierCurveTo(W*.60,H*.18,W*.64,H*.71,W*.29,H*.91);outer.bezierCurveTo(W*.12,H*1.03,-W*.12,H*1.03,-W*.29,H*.91);outer.bezierCurveTo(-W*.64,H*.71,-W*.60,H*.18,-W*.27,0);outer.closePath();}
  else if(!coating&&spec.shape==='top'){outer.moveTo(-W/2,0);outer.lineTo(W/2,0);outer.lineTo(W/2,H*.25);outer.bezierCurveTo(W/2,H*1.25,-W/2,H*1.25,-W/2,H*.25);outer.closePath();}
  else if(!coating){const r=.0006;outer.moveTo(-W/2+r,0);outer.lineTo(W/2-r,0);outer.quadraticCurveTo(W/2,0,W/2,r);outer.lineTo(W/2,H-r);outer.quadraticCurveTo(W/2,H,W/2-r,H);outer.lineTo(-W/2+r,H);outer.quadraticCurveTo(-W/2,H,-W/2,H-r);outer.lineTo(-W/2,r);outer.quadraticCurveTo(-W/2,0,-W/2+r,0);}
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
  const extrusion={depth:L,bevelEnabled:false,steps:Math.max(24,Math.min(96,Math.ceil(L*240))),curveSegments:48};
  let geo;
  if(drawing){
    const parts=[drawing.optical,drawing.opaque].map(regions=>new T.ExtrudeGeometry(sectionShapes(regions),extrusion));
    geo=mergeGeometries(parts,true);parts.forEach(g=>g.dispose());
  }else geo=new T.ExtrudeGeometry(outer,extrusion);
  geo.rotateY(Math.PI/2);geo.translate(-L/2,-offset,0);geo.scale(1000,1000,1000);toCreasedNormals(geo,Math.PI/5);geo.scale(.001,.001,.001);geos.push(geo);
  const pos=geo.attributes.position,uv=geo.attributes.uv,faces=[[],[]],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
  for(let i=0;i<pos.count;i++)uv.setXY(i,(pos.getX(i)+L/2)/L,drawing&&!spec.clear?.5:.5+pos.getZ(i)/W);
  // Classify whole faces before batching. Smoothed vertex normals can cross the
  // material boundary within a triangle, creating jagged ends and hundreds of
  // draw calls when every alternating strip is kept as a separate group.
  if(!drawing){for(let i=0;i<pos.count;i+=3){
    a.fromBufferAttribute(pos,i);b.fromBufferAttribute(pos,i+1).sub(a);c.fromBufferAttribute(pos,i+2).sub(a);b.cross(c).normalize();
    const lit=spec.clear?true:side?b.z>.3:coating||['top','oval'].includes(spec.shape)?b.y>-.15:b.y>.5;
    faces[lit?0:1].push(i,i+1,i+2);
  }
  geo.setIndex(faces.flat());geo.clearGroups();let start=0;
  faces.forEach((indices,materialIndex)=>{if(indices.length)geo.addGroup(start,indices.length,materialIndex);start+=indices.length;});}
  if(drawing){
    const groups=geo.groups.map(g=>({...g})),byMaterial=[[],[],[]];
    for(let i=0;i<pos.count;i+=3){
      const index=groups.find(g=>i>=g.start&&i<g.start+g.count)?.materialIndex||0;
      a.fromBufferAttribute(pos,i);b.fromBufferAttribute(pos,i+1).sub(a);c.fromBufferAttribute(pos,i+2).sub(a);b.cross(c).normalize();
      byMaterial[index===0&&Math.abs(b.x)>.7?2:index].push(i,i+1,i+2);
    }
    geo.setIndex(byMaterial.flat());geo.clearGroups();let start=0;byMaterial.forEach((indices,index)=>{if(indices.length)geo.addGroup(start,indices.length,index);start+=indices.length;});
  }
  const tube=new T.Mesh(geo,[silicone,baseMaterial,cutMaterial]);tube.name=sleeve?'Koszulka_'+sleeve.ref:native?'COB_IP67_oslona_pogladowa':'WCOB_powloka_IP62';tube.castShadow=!spec.clear;tube.receiveShadow=true;shell.add(tube);const original=geo.attributes.position.array.slice(),originalNormals=geo.attributes.normal.array.slice();let geometryKey='';
  const accessories=buildSleeveAccessories(spec,offset,{emission});root.add(accessories.caps,accessories.holders);
  const volumes=[];
  function outgoing(y,z,angle,width,gain=1){const v=createLightVolume(L,width,{reach:.048,name:spec.shape+'_'+volumes.length});v.mesh.position.set(0,y-offset,z);v.mesh.rotation.x=angle;root.add(v.mesh);volumes.push({v,y:y-offset,z,gain});}
  if(spec.shape==='oval'){
    for(let i=0;i<8;i++){const a=i*Math.PI/4;outgoing(H/2+H/2*Math.cos(a),W/2*Math.sin(a),a,W*.55,.24);}
  }else if(spec.shape==='top'||coating){
    outgoing(H,0,0,W*.6,.65);for(const a of[-1,1])outgoing(H*.63,a*W*.47,a*1.1,W*.42,.3);
  }else if(side){
    // PCB faces across the internal guide; the source drawing's yellow window
    // exits at the TOP, with a small rear port. Broad side walls are opaque.
    outgoing(H,0,0,W*.64,1);outgoing(H*.42,W/2,Math.PI/2,H*.10,.08);
  }else if(spec.shape==='standard'){
    outgoing(H,0,0,W,.75);for(const a of[-1,1])outgoing(H*.84,a*W/2,a*Math.PI/2,H*.31,.22);
  }else outgoing(H,0,0,W,spec.clear?.65:1);
  function update(state,point,curvature,color){
    const macro=state.view==='macro',inspect=macro&&state.detail==='sleeve';root.visible=coating||!macro||['product','sleeve','seal'].includes(state.detail);
    const insertion=sleeveInsertionPose(state,L);inserted.value=Math.max(0,Math.min(1,1+insertion.offset/L));
    const nextKey=[inspect,curvature].join('|');
    if(nextKey!==geometryKey){
      geometryKey=nextKey;const p=geo.attributes.position,n=geo.attributes.normal;
      for(let i=0;i<p.count;i++){
        let x=original[i*3],y=original[i*3+1],z=original[i*3+2];
        if(inspect&&!coating&&!insertion.active)x+=Math.min(.042,L*.42);
        const v=point(x,y,z),a=x*curvature,cs=Math.cos(a),sn=Math.sin(a),nx=originalNormals[i*3],ny=originalNormals[i*3+1];
        p.setXYZ(i,v.x,v.y,v.z);n.setXYZ(i,nx*cs-ny*sn,nx*sn+ny*cs,originalNormals[i*3+2]);
      }
      p.needsUpdate=true;n.needsUpdate=true;geo.computeBoundingSphere();
    }
    const rgb=t.type==='RGBW'&&state.rgbMode!=='white';
    if(silicone.toneMapped===rgb){silicone.toneMapped=!rgb;silicone.needsUpdate=true;}
    silicone.color.set(spec.clear?'#c8d3d3':'#f7f8f3');if(rgb&&!spec.clear)silicone.color.copy(color).multiplyScalar(.12);
    silicone.emissive.copy(color);silicone.emissiveIntensity=!spec.clear&&state.light?state.dimmer/100*stripOutputScale(t,state)*(rgb?1.65:coating?(state.lightStudy?10:5):(state.lightStudy?7:3.8)):0;
    accessories.update(state,point,curvature,L,color,silicone.emissiveIntensity);
    cutMaterial.emissive.copy(color);cutMaterial.emissiveIntensity=silicone.emissiveIntensity*.09*inserted.value;
    const level=state.light&&!state.compare?state.dimmer/100*stripOutputScale(t,state):0;
    for(const {v,y,z,gain}of volumes){v.mesh.position.set(insertion.active?-L*(1-inserted.value)/2:inspect&&!coating?Math.min(.042,L*.42):0,y,z);v.update(color,level,{night:state.lightStudy,power:t.modes?.[state.powerMode]?.watts??t.watts,coupling:gain*inserted.value,curvature});if(insertion.active)v.mesh.scale.x*=Math.max(.001,inserted.value);if(!['product','sleeve','seal'].includes(state.detail)||state.housing!=='sleeve')v.mesh.visible=false;}
    root.userData={insertion,insertedFraction:inserted.value,kind:coating?'coating':native?'factory-ip67':'pro-sleeve',shape:spec.shape,pcbOrientation:side?'vertical':'horizontal',outerWidthMm:spec.width,outerHeightMm:spec.height,milky:!spec.clear,shapeVerified:!!drawing||coating&&!!t.envelopeVerified,sectionSource:drawing?.source,accessories:[...accessories.caps.children,...accessories.holders.children].filter(o=>o.parent.visible).map(o=>({...o.userData})),opticalRegions:drawing?.optical.length,opaqueRegions:drawing?.opaque.length,emissionDirection:side?'top':spec.shape==='oval'?'circumference':spec.shape==='top'?'dome':'top-and-optical-sides',closed:state.view!=='macro'||state.detail!=='seal'||state.sealClosed,capLight:accessories.caps.userData,dimensionsVerified:coating?!!t.envelopeVerified:!!sleeve?.verified,beams:volumes.map(({v})=>({...v.mesh.userData,position:v.mesh.position.toArray(),direction:new T.Vector3(0,1,0).applyQuaternion(v.mesh.quaternion).toArray(),visible:v.mesh.visible}))};
  }
  return{root,update,dispose(){accessories.dispose();volumes.forEach(({v})=>v.dispose());geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());emission.dispose();}};
}
