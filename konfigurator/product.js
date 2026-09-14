import {prepareCoverFlex} from './cover-flex.js?v=a9d8f23925dd';
import {stripOutputScale} from './light-state.js?v=a9d8f23925dd';
import {hasAdhesiveBacking} from './strip-protection.js?v=a9d8f23925dd';
import * as T from 'three';
import {buildAccessories} from './accessories.js?v=a9d8f23925dd';
import {buildPCB} from './tape.js?v=a9d8f23925dd';
import {sectionGeometry} from './section.js?v=a9d8f23925dd';
import {profileContour} from './profile-shapes.js?v=a9d8f23925dd';
import {coverSection} from './cover-shapes.js?v=a9d8f23925dd';
import {glowMaterial} from './glow.js?v=a9d8f23925dd';
import {diffuserMap} from './light-textures.js?v=a9d8f23925dd';
import {assemblyPose} from './assembly-motion.js?v=a9d8f23925dd';
import {createLightVolume} from './light-volume.js?v=a9d8f23925dd';
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';

// Display samples and full-length export share one physical model, in metres.
export function buildProduct(source,sourceSize,spec,state,{length=100,art=null,sourceCover=null,quality='auto'}={}){
  const group=new T.Group(),profile=new T.Group(),pcb=new T.Group(),cover=new T.Group();
  group.name='PRESCOT_assembly';profile.name='KLUŚ_profile';pcb.name='PRESCOT_LED';cover.name='KLUŚ_cover';group.add(profile,pcb,cover);
  const p=spec.profile,t=spec.strip,sleeveLift=spec.sleeve?(spec.sleeve.pcbLift??.8)/1000:spec.strip.encapsulation==='tube'?.0008:0,L=length/1000,H=p.height/1000,W=p.width/1000;
  const segments=Math.floor(length/t.cut),stripLength=segments*t.cut;
  const materials=[],textures=[];
  const mat=options=>{const m=new T.MeshStandardMaterial(options);materials.push(m);return m;};
  const brushed=brushedTexture();textures.push(brushed);
  // Keep a soft reflection on anodised aluminium; broad white studio cards
  // must not flatten the retaining lips and the end of the extrusion.
  const metal=mat({color:'#c3cbcf',metalness:.88,roughness:.44,envMapIntensity:.85,roughnessMap:brushed});
  const isClear=spec.cover.id.endsWith('-clear')||!!spec.cover.beamAngle;
  const emission=diffuserMap(spec,length);textures.push(emission);
  const lens=mat({color:spec.cover.color,roughness:isClear?.14:.38,metalness:0,transparent:isClear,opacity:spec.cover.beamAngle?.48:isClear?.22:1,depthWrite:!isClear,side:T.DoubleSide,emissiveMap:emission});
  const add=(geo,m,parent,name)=>{const mesh=new T.Mesh(geo,m);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
  if(!spec.isSleeve){
  if(p.id==='micro'&&!p.section){
    const cut=sectionGeometry(source,H/2);
    const g=extrudeSection(cut,L,.00010);cut.dispose();
    add(g,metal,profile,p.name);
  }else{
    const shapes=[];
    for(const loop of p.section||[{points:profileContour(p),hole:false}]){
      const shape=loop.hole?new T.Path():new T.Shape();loop.points.forEach(([x,y],i)=>shape[i?'lineTo':'moveTo'](x/1000,y/1000));shape.closePath();
      if(loop.hole)shapes.at(-1).holes.push(shape);else shapes.push(shape);
    }
    const g=new T.ExtrudeGeometry(shapes,{depth:L-.00007,bevelEnabled:true,bevelSize:.000035,bevelThickness:.000035,bevelSegments:2,steps:1});g.rotateY(Math.PI/2);g.translate(-L/2+.000035,0,0);
    if(p.id==='stos'){g.scale(1000,1000,1000);toCreasedNormals(g,Math.PI/6);g.scale(.001,.001,.001);}
    add(g,metal,profile,p.name);
  }
  }
  const accessories=buildAccessories(p,state,L);accessories.root.visible=!spec.isSleeve;group.add(accessories.root);
  const details=buildPCB({...spec,segments,stripLength},state,{art,quality:quality==='auto'&&length>300?'overview':'detail'});pcb.add(details.group);
  if(!spec.isSleeve){
  if(sourceCover&&p.id==='micro'&&!p.section&&['hs-opal','hs-clear'].includes(spec.cover.id)){
    const cut=sectionGeometry(sourceCover);
    const g=extrudeSection(cut,L,.000025,32);cut.dispose();g.translate(0,-H+.00045,0);
    add(g,lens,cover,'HS_geometria_z_modelu_KLUS');
  }else{
    const shape=coverSection({...spec.cover,width:spec.cover.width??(p.id==='micro'||p.id==='microk'?13:14.2)});
    const g=new T.ExtrudeGeometry(shape,{depth:L*1000,bevelEnabled:true,bevelSize:.035,bevelThickness:.025,bevelSegments:2,curveSegments:24,steps:32});g.scale(.001,.001,.001);g.rotateY(Math.PI/2);g.translate(-L/2,0,0);add(g,lens,cover,'Oslona_'+spec.cover.ref);

  }
  }
  cover.visible=!spec.isSleeve;profile.visible=!spec.isSleeve;
  const coverBase=lens.clone();coverBase.emissiveMap=null;materials.push(coverBase);
  cover.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,pos=g.attributes.position,uv=g.attributes.uv,width=(spec.cover.width||p.channel+2)/1000;
    for(let i=0;i<pos.count;i++)uv.setXY(i,(pos.getX(i)+L/2)/L,.5+pos.getZ(i)/width);
    const faces=[[],[]],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
    for(let i=0;i<pos.count;i+=3){a.fromBufferAttribute(pos,i);b.fromBufferAttribute(pos,i+1).sub(a);c.fromBufferAttribute(pos,i+2).sub(a);b.cross(c).normalize();faces[b.y>.12?0:1].push(i,i+1,i+2);}
    g.setIndex(faces.flat());g.clearGroups();let start=0;faces.forEach((indices,materialIndex)=>{if(indices.length)g.addGroup(start,indices.length,materialIndex);start+=indices.length;});o.material=[lens,coverBase];
  });
  const coverFlex=cover.children.filter(o=>o.isMesh).map(o=>prepareCoverFlex(o,L));
  // Longitudinal finish gives the light something to describe on the extrusion.
  const haloStyle=glowMaterial();haloStyle.material.side=T.FrontSide;materials.push(haloStyle.material);textures.push(haloStyle.texture);
  const halo=add(new T.PlaneGeometry(L,(spec.cover.width||14)/1000*3),haloStyle.material,cover,'Poswiata_oslony_prezentacyjna');halo.rotation.x=-Math.PI/2;halo.position.y=(spec.cover.rise??(spec.cover.shape==='round'?3.4:spec.cover.shape==='shallow'?1.1:.8))/1000+.0002;halo.castShadow=false;halo.receiveShadow=false;halo.visible=false;
  const beam=createLightVolume(L,p.channel/1000,{slope:spec.cover.beamAngle?Math.tan(spec.cover.beamAngle*Math.PI/360):isClear?.85:1.25});
  cover.add(beam.mesh);beam.mesh.position.y=halo.position.y+.00015;
  profile.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,a=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    for(let i=0;i<a.count;i++)uv.setXY(i,(a.getX(i)+L/2)/L,(Math.abs(n.getY(i))>.5?a.getZ(i):a.getY(i))*600);
  });
  const pcbTravel=Math.max(.020,(p.channelDepth??p.height-p.ledBase)/1000+.014),coverTravel=pcbTravel+.015;
  const bounce=new T.RectAreaLight('#fff4df',0,Math.max(.001,stripLength/1000),t.width/1000*.7);bounce.name='Swiatlo_PCB_podglad';bounce.rotation.x=Math.PI/2;bounce.position.y=.0015;pcb.add(bounce);
  function assemble(amount){
    const pose=assemblyPose(amount),macro=state.view==='macro'||spec.isSleeve,angle=macro?0:(p.ledAngle||0)*Math.PI/180,normal=new T.Vector3(0,Math.cos(angle),Math.sin(angle));
    pcb.position.set(0,macro?0:p.ledBase/1000,macro?0:(p.ledZ||0)/1000);pcb.position.addScaledVector(normal,macro?0:sleeveLift+pose.pcbLift*pcbTravel);pcb.rotation.x=angle;
    cover.position.set(0,(p.coverY??p.height)/1000-.00045,(p.coverZ||0)/1000);cover.position.addScaledVector(normal,pose.coverLift*coverTravel);cover.rotation.x=angle-.52*pose.coverTilt;
    coverFlex.forEach(bend=>bend(macro||spec.cover.rigid?0:pose.coverBend));
    const protectedDetail=macro&&['sleeve','seal'].includes(state.detail);
    details.bend(state.exporting||spec.sleeve?.shape==='side'||spec.isSleeve&&state.detail==='sleeve'?0:spec.isSleeve?.12:protectedDetail?.12:macro&&state.detail!=='curve'?1:pose.pcbBend*.8*Math.min(1,.15/L),macro&&state.detail==='curve'?1:0);
    accessories.update(state,pose.capGap*100);
    updateCoverLight(amount);
    const canPeel=hasAdhesiveBacking(t,spec.sleeve);
    details.peel(macro?0:pose.peel,macro?0:pose.linerExit,canPeel&&(macro||state.view==='assembly'&&amount>62));
    group.userData.assembly={...pose,pcbLiftMm:macro?0:pose.pcbLift*pcbTravel*1000,coverLiftMm:pose.coverLift*coverTravel*1000};
  }
  let lightColor=new T.Color('#fff4df');
  function updateCoverLight(amount){
    const level=state.light&&!state.compare?state.dimmer/100*stripOutputScale(t,state):0,pose=assemblyPose(amount),coupling=Math.exp(-pose.coverLift*coverTravel/.009)*Math.max(0,Math.cos(pose.coverTilt*.52))*(1-.55*pose.coverBend);
    const rgb=t.type==='RGBW'&&state.rgbMode!=='white';
    if(lens.toneMapped===rgb){lens.toneMapped=!rgb;lens.needsUpdate=true;}
    if(rgb)lens.color.copy(lightColor).multiplyScalar(.12);
    lens.emissive.copy(lightColor);lens.emissiveIntensity=level*(rgb?1.65:state.lightStudy?10.5:6.5)*spec.cover.transmission*coupling*(isClear?.018:1);
    halo.visible=level>0&&coupling>.15&&!isClear&&pose.coverBend<.025;haloStyle.material.color.copy(lightColor);haloStyle.material.opacity=level*spec.cover.transmission*coupling*(state.lightStudy?1.4:.65);
    beam.update(lightColor,level,{night:state.lightStudy,power:spec.wattsPerMeter,transmission:spec.cover.transmission,coupling:coupling*Math.exp(-pose.pcbLift*8)*(state.view==='zone'?.32:1)});
    if(spec.isSleeve||state.view==='macro'||state.view==='zone'&&!state.zone?.startsWith('stair-')||pose.coverBend>.025)beam.mesh.visible=false;
    bounce.color.copy(lightColor);bounce.intensity=['macro','zone'].includes(state.view)||spec.isSleeve||pose.pcbLift>.001?0:level*(rgb?1.4:state.lightStudy?25:14);
    cover.userData.light={intensity:lens.emissiveIntensity,coupling,clear:isClear,color:lightColor.getHexString(),transmission:spec.cover.transmission,beam:{...beam.mesh.userData,visible:beam.mesh.visible}};
  }
  function update(s,color){
    state=s;metal.color.set({silver:'#c3cbcf',black:'#373a3b',white:'#efefeb',raw:'#bfc2c2'}[s.finish]);metal.metalness=s.finish==='white'?.05:.88;metal.roughness=s.finish==='raw'?.48:s.finish==='silver'?.44:.43;
    metal.envMapIntensity=s.finish==='raw'?1:s.finish==='silver'?.85:s.finish==='white'?.6:1;
    lens.color.set(s.cover.includes('black')?'#292b2c':s.cover.endsWith('-clear')?'#edf0f1':'#f5f4ef');
    coverBase.color.copy(lens.color);
    lightColor.copy(color);updateCoverLight(s.exploded);details.update(s,color);
  }
  function dispose(){beam.dispose();accessories.dispose();details.dispose();group.traverse(o=>o.geometry?.dispose());for(const m of materials)m.dispose();for(const x of textures)x.dispose();}
  assemble(state.exploded);
  return{group,profile,pcb,cover,liner:details.liner,peel:details.peel,bend:details.bend,accessories:accessories.root,wiring:details.wiring,
    connectionPads(){group.updateWorldMatrix(true,true);return details.connectionPads().map(t=>({...t,point:group.worldToLocal(t.point)}));},
    strip:t,assemble,update,dispose,length,stripLength,ledBase:p.ledBase/1000+sleeveLift*Math.cos((p.ledAngle||0)*Math.PI/180),ledZ:(p.ledZ||0)/1000+sleeveLift*Math.sin((p.ledAngle||0)*Math.PI/180)};
}

function extrudeSection(section,length,bevel,steps=1){
  // Tiny chamfers affect only presentation; manufacturer cross-section stays
  // available unchanged for the end section and dimensions.
  const shapes=section.parameters.shapes;
  const g=new T.ExtrudeGeometry(shapes,{depth:length-2*bevel,steps,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2,curveSegments:2});
  g.rotateY(Math.PI/2);g.translate(-length/2+bevel,0,0);return g;
}
function brushedTexture(){
  const c=document.createElement('canvas');c.width=256;c.height=256;const x=c.getContext('2d');x.fillStyle='#aaa';x.fillRect(0,0,256,256);
  let seed=48271;for(let y=0;y<256;y++){seed=seed*16807%2147483647;const v=180+Math.floor(seed/2147483647*20);x.fillStyle=`rgb(${v} ${v} ${v})`;x.fillRect(0,y,256,1);}
  const texture=new T.CanvasTexture(c);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=8;return texture;
}
