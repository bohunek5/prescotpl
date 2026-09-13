import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {TDSLoader} from 'three/addons/loaders/TDSLoader.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {specification,displayLength} from './catalog.js?v=b7faa7b30a34';
import {buildProduct} from './product.js?v=b7faa7b30a34';
import {buildMount} from './mounting.js?v=b7faa7b30a34';
import {buildZone} from './zones.js?v=b7faa7b30a34';
import {sectionGeometry} from './section.js?v=b7faa7b30a34';
import {lightColor} from './light-color.js?v=b7faa7b30a34';
import {assemblyClip} from './assembly-export.js?v=b7faa7b30a34';
import {createSoftShadow} from './soft-shadow.js?v=b7faa7b30a34';

export async function createStudio(host,initial){
  RectAreaLightUniformsLib.init();
  const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.localClippingEnabled=true;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  renderer.domElement.setAttribute('aria-label','Model 3D. Przeciągnij, aby zmienić kąt.');host.append(renderer.domElement);
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-.1,.1,.06,-.06,.001,10);
  let s={...initial},sample=null,fixture=null,zone=null,art=null,sampleKey='',zoneKey='',ready=false,disposed=false,framePending=0,shadowDirty=true;
  let cameraTween=0;
  let interactive=false,basePixelRatio=1,settleTimer,interactionFrames=0,lastFrameMs=0,renderCount=0;
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.enablePan=false;controls.rotateSpeed=.45;controls.zoomSpeed=.65;
  const pmrem=new T.PMREMGenerator(renderer),env=makeStudioEnvironment(),environment=pmrem.fromScene(env,.02);scene.environment=environment.texture;
  env.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});pmrem.dispose();
  const hemi=new T.HemisphereLight(0xf7f5ef,0x938b80,.6);scene.add(hemi);
  const key=new T.DirectionalLight(0xfffcf5,1.35);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.00002;key.shadow.normalBias=.000035;scene.add(key,key.target);
  const fill=new T.DirectionalLight(0xf4f5f6,.35);fill.position.set(.04,-.10,.12);scene.add(fill);
  const detailRoot=new T.Group(),mount=new T.Group(),cut=new T.Group();detailRoot.add(mount,cut);scene.add(detailRoot);
  const softShadow=createSoftShadow(renderer),ground=softShadow.plane;scene.add(ground);
  const woodMap=makeWood(),wood=new T.MeshStandardMaterial({color:'#d0bda3',map:woodMap,roughness:.65});
  const cutMat=new T.MeshStandardMaterial({color:'#c0c5c7',metalness:.5,roughness:.5,side:T.DoubleSide});
  const entryPlane=new T.Plane(new T.Vector3(-1,0,0),-.020);
  const endPlane=new T.Plane(new T.Vector3(1,0,0),-.020);
  const sectionPlane=new T.Plane(new T.Vector3(1,0,0),-.026),wiringPlane=new T.Plane(new T.Vector3(-1,0,0),-.020);
  const source=await new TDSLoader().loadAsync('assets/sources/micro-plus.3ds');source.updateMatrixWorld(true);
  let geometry,sourceCover;
  const extracted=new Map();
  source.traverse(o=>{if(!o.isMesh||o.name.startsWith('Poswiata_'))return;const expanded=o.geometry.toNonIndexed();for(const part of o.geometry.groups){if(![1,2].includes(part.materialIndex))continue;const g=new T.BufferGeometry();for(const [name,a]of Object.entries(expanded.attributes))g.setAttribute(name,new T.BufferAttribute(a.array.slice(part.start*a.itemSize,(part.start+part.count)*a.itemSize),a.itemSize));g.applyMatrix4(o.matrixWorld);g.rotateX(Math.PI/2);g.rotateY(Math.PI/2);g.scale(.0001,.0001,.0001);g.computeBoundingBox();extracted.set(part.materialIndex,g);}expanded.dispose();});
  geometry=extracted.get(1);sourceCover=extracted.get(2);
  if(!geometry||!sourceCover)throw Error('Brak geometrii profilu lub osłony KLUŚ.');
  const center=geometry.boundingBox.getCenter(new T.Vector3()),base=geometry.boundingBox.min.y;
  geometry.translate(-center.x,-center.y,-center.z);sourceCover.translate(-center.x,-base,-center.z);
  geometry.computeVertexNormals();geometry.computeBoundingBox();const sourceSize=geometry.boundingBox.getSize(new T.Vector3());
  source.traverse(o=>{o.geometry?.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)m?.dispose();});

  function clear(group){for(const child of [...group.children]){group.remove(child);child.traverse(o=>o.geometry?.dispose());}}
  function ensureSample(){
    const next=[s.profile,s.strip,s.cover,s.print,s.backing,s.powerMode,s.repeat,s.mounting,s.sleeve,s.finish,s.endcaps,s.showCable,displayLength(s)].join('|');if(next===sampleKey&&sample)return;
    if(sample){detailRoot.remove(sample.group);sample.dispose();}if(fixture){mount.remove(fixture.root);fixture.dispose();}clear(cut);
    const spec=specification(s),H=spec.profile.height/1000;
    sample=buildProduct(geometry,sourceSize,spec,s,{length:displayLength(s),art,sourceCover});detailRoot.add(sample.group);
    fixture=buildMount(spec.profile,s,wood);mount.add(fixture.root);sampleKey=next;
    const cutGeo=sectionGeometry(s.profile==='micro'?geometry:sample.profile.children.map(o=>{const g=o.geometry.clone();g.translate(...o.position.toArray());return g;}),s.profile==='micro'?H/2:0);
    const face=new T.Mesh(cutGeo,cutMat);face.rotation.y=Math.PI/2;face.position.set(.05004,fixture.seat,0);cut.add(face);
  }
  function ensureZone(){
    const next=[s.profile,s.strip,s.cover,s.print,s.backing,s.powerMode,s.repeat,s.mounting,s.zone,s.sleeve,s.zonePosition,s.finish,s.endcaps,s.showCable].join('|');if(next===zoneKey&&zone)return;
    if(zone){scene.remove(zone.root);zone.dispose();}zone=buildZone(geometry,sourceSize,specification(s),s,{sourceCover,art,wood});scene.add(zone.root);zoneKey=next;
  }
  function appearance(){
    const spec=specification(s),z=s.view==='zone',installed=['installation','section','mounting'].includes(s.view),color=lightColor(s,spec.strip);
    detailRoot.visible=!z;if(zone){zone.root.visible=z;if(z)zone.update(s,color);}
    detailRoot.rotation.x=installed?Math.PI:0;mount.visible=installed;cut.visible=s.view==='section';ground.visible=!s.lightStudy&&(s.view==='assembly'||s.view==='macro')&&displayLength(s)<=300;
    const clipping=s.view==='assembly'&&s.assemblyAngle==='entry'?[entryPlane]:s.view==='assembly'&&s.assemblyAngle==='end'?[endPlane]:s.view==='section'?[sectionPlane]:s.view==='macro'&&s.detail==='wiring'?[wiringPlane]:[];
    detailRoot.traverse(o=>{if(o.isMesh)for(const m of(Array.isArray(o.material)?o.material:[o.material]))m.clippingPlanes=clipping;});
    cutMat.color.set({silver:'#bcc2c4',black:'#303233',white:'#efeeeb',raw:'#b3b8ba'}[s.finish]);
    wood.color.set({oak:'#d0bda3',walnut:'#99836f',white:'#efeeeb',graphite:'#4a4d50',sand:'#c6bba8'}[s.material]);
    const map=['white','graphite','sand'].includes(s.material)?null:woodMap;if(wood.map!==map){wood.map=map;wood.needsUpdate=true;}
    fill.intensity=z?1.1:installed?1.7:.35;fill.position.set(...(z?[.1,-.3,.4]:[.04,-.10,.12]));hemi.intensity=z?.8:.6;key.intensity=z?1.7:1.35;
    scene.environmentIntensity=s.lightStudy?.18:1;
    if(s.lightStudy){fill.intensity*=.25;hemi.intensity=.12;key.intensity=.30;}
    key.position.set(...(z?[-.35,.55,.55]:[.04,.24,.12]));key.target.position.set(0,z?.1:0,0);
    Object.assign(key.shadow.camera,z?{left:-.5,right:.5,top:.5,bottom:-.5,near:.01,far:3}:{left:-.14,right:.14,top:.14,bottom:-.14,near:.01,far:2});key.shadow.camera.updateProjectionMatrix();
    renderer.toneMappingExposure=1.08;scene.background=null;
    if(sample&&!z){sample.update(s,color);assemble(s.exploded);}
    renderer.shadowMap.needsUpdate=!interactive;shadowDirty=true;requestDraw();
  }
  function assemble(value){
    s.exploded=value;if(sample){sample.group.visible=true;sample.pcb.visible=true;sample.assemble(s.view==='assembly'?value:0);sample.profile.visible=s.view!=='macro';sample.cover.visible=s.view!=='macro';sample.group.position.y=0;
      if(['installation','section','mounting'].includes(s.view))fixture.update(s,sample);
    }renderer.shadowMap.needsUpdate=!interactive;shadowDirty=true;requestDraw();
  }
  function frame(animate=false,preserveDirection=false){
    cancelAnimationFrame(cameraTween);cameraTween=0;const before={position:camera.position.clone(),target:controls.target.clone(),left:camera.left,right:camera.right,top:camera.top,bottom:camera.bottom,zoom:camera.zoom};
    if(!sample&&!zone)return;
    const aspect=host.clientWidth/Math.max(1,host.clientHeight),z=s.view==='zone',section=s.view==='section',side=s.view==='assembly'&&s.assemblyAngle==='side';
    let direction;
    if(z)direction=s.zone==='drywall'?[.18,-.11,.15]:s.zoneDetail?[.13,-.07,.19]:s.zone==='shelf'?[.24,-.22,.40]:s.zone==='plinth'?[.28,.16,.50]:s.zone==='drawer'?[.34,.28,.60]:s.zone==='under'?[.35,-.03,.48]:[.34,.015,.60];
    else if(s.view==='assembly'&&s.assemblyAngle==='entry')direction=[-.065,.038,.11];
    else if(s.view==='assembly'&&s.assemblyAngle==='end')direction=[.045,.035,.12];
    else if(section)direction=[.068,-.030,.029];
    else if(['installation','mounting'].includes(s.view))direction=[.075,-.067,.11];
    else if(side)direction=[0,0,1];
    else if(s.view==='macro')direction=s.detail==='sleeve'?[.11,.045,.095]:s.detail==='wiring'?[.014,.046,.060]:s.detail==='curve'?[.008,.1,.055]:[.039,.068,.105];
    else direction=[.080,.07,.125];
    if(host.clientWidth<600&&!z){if(s.view==='macro')direction=s.detail==='wiring'?[-.06,.055,.055]:[.13,.095,.065];else if(s.view==='assembly'&&!['side','end','entry'].includes(s.assemblyAngle))direction=[.13,.080,.075];}
    if(preserveDirection)direction=camera.position.clone().sub(controls.target).toArray();
    // Product inspection needs the full orbit, including the channel and underside.
    // Side/end buttons choose a starting view; they never lock manual rotation.
    controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;controls.minPolarAngle=.001;controls.maxPolarAngle=Math.PI-.001;
    controls.enableRotate=true;controls.enablePan=!z;controls.screenSpacePanning=true;controls.minZoom=.5;controls.maxZoom=z?4:8;controls.minDistance=.07;controls.maxDistance=3;
    scene.updateMatrixWorld(true);let bounds,framingBoxes=[];
    if(z){
      if(s.zoneDetail){const c=zone.focus.clone();c.x=s.showCable?-.12:.09;bounds=new T.Box3(c.clone().add(new T.Vector3(-.07,-.02,-.025)),c.clone().add(new T.Vector3(.07,.025,.025)));framingBoxes=[bounds];}
      else{const saved=zone.opening;zone.setOpening(1);bounds=visibleBounds(zone.root);framingBoxes=worldBoxes(zone.root);zone.setOpening(saved);}
    }else{
      bounds=visibleBounds(sample.group);framingBoxes=worldBoxes(sample.group);
      // Frame the motion envelope once. Closing/opening the cover must never
      // hide it or chase it with the camera halfway through the animation.
      if(s.view==='assembly'){
        for(const amount of [0,25,50,62,68,75,85,95,100]){sample.assemble(amount);sample.group.updateMatrixWorld(true);const boxes=worldBoxes(sample.group);framingBoxes.push(...boxes);for(const b of boxes)bounds.union(b);}
        sample.assemble(s.exploded);sample.group.updateMatrixWorld(true);
      }
      if(['installation','section','mounting'].includes(s.view)){bounds.union(visibleBounds(mount));framingBoxes.push(...worldBoxes(mount));}
      if(section)bounds.min.x=.026;
      if(s.view==='assembly'&&s.assemblyAngle==='entry')bounds.max.x=-.020;
      if(s.view==='assembly'&&s.assemblyAngle==='end')bounds.min.x=.020;
      if(s.view==='macro'&&s.detail==='wiring')bounds.max.x=-.020;
      framingBoxes=framingBoxes.map(b=>b.intersect(bounds)).filter(b=>!b.isEmpty());
    }
    if(bounds.isEmpty())return;
    const center=bounds.getCenter(new T.Vector3()),dir=new T.Vector3(...direction).normalize();controls.target.copy(center);camera.position.copy(center).addScaledVector(dir,z?1.3:Math.max(.4,bounds.getSize(new T.Vector3()).length()/2+.2));camera.lookAt(center);
    camera.left=-aspect;camera.right=aspect;camera.top=1;camera.bottom=-1;camera.zoom=1;camera.updateProjectionMatrix();camera.updateMatrixWorld();
    let half=0;for(const box of framingBoxes)for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){const v=new T.Vector3(x,y,z).project(camera);half=Math.max(half,Math.abs(v.x)/.84,Math.abs(v.y)/.8);}
    camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();controls.update();
    if(z){const a=controls.getAzimuthalAngle();controls.minAzimuthAngle=a-1.15;controls.maxAzimuthAngle=a+1.15;controls.minPolarAngle=.25;controls.maxPolarAngle=Math.PI-.25;}
    if(animate&&ready&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
      const after={position:camera.position.clone(),target:controls.target.clone(),left:camera.left,right:camera.right,top:camera.top,bottom:camera.bottom,zoom:camera.zoom},start=performance.now();
      const tick=time=>{const f=Math.min(1,(time-start)/360),e=f*f*(3-2*f);camera.position.lerpVectors(before.position,after.position,e);controls.target.lerpVectors(before.target,after.target,e);for(const k of ['left','right','top','bottom','zoom'])camera[k]=T.MathUtils.lerp(before[k],after[k],e);camera.lookAt(controls.target);camera.updateProjectionMatrix();requestDraw();if(f<1)cameraTween=requestAnimationFrame(tick);else cameraTween=0;};cameraTween=requestAnimationFrame(tick);
    }
    requestDraw();
  }
  function requestDraw(){if(ready&&!framePending&&!disposed)framePending=requestAnimationFrame(draw);}
  function draw(){
    framePending=0;if(!ready||disposed||document.hidden)return;
    if(shadowDirty&&ground.visible&&!interactive){softShadow.update(scene,s.view==='assembly'&&s.assemblyAngle==='end'?[endPlane]:s.view==='macro'&&s.detail==='wiring'?[wiringPlane]:[]);shadowDirty=false;}
    const start=performance.now();renderer.render(scene,camera);lastFrameMs=performance.now()-start;renderCount++;
    if(interactive&&++interactionFrames===6&&lastFrameMs>28)renderer.setPixelRatio(basePixelRatio*.55);
  }
  function beginInteraction(){if(!ready)return;clearTimeout(settleTimer);if(!interactive){interactive=true;interactionFrames=0;renderer.setPixelRatio(basePixelRatio*.65);}settleTimer=setTimeout(finishInteraction,350);}
  function finishInteraction(){clearTimeout(settleTimer);if(interactive){interactive=false;renderer.setPixelRatio(basePixelRatio);renderer.shadowMap.needsUpdate=true;shadowDirty=true;requestDraw();}}
  function resize(){const {width,height}=host.getBoundingClientRect();basePixelRatio=Math.min(devicePixelRatio,1.5,Math.sqrt(1400000/Math.max(1,width*height)));renderer.setPixelRatio(interactive?basePixelRatio*.65:basePixelRatio);renderer.setSize(width,height,false);
    if(!ready)frame();else{const aspect=width/Math.max(1,height),half=Math.max(camera.top,camera.right/aspect);camera.top=half;camera.bottom=-half;camera.left=-half*aspect;camera.right=half*aspect;camera.updateProjectionMatrix();}
    requestDraw();}
  controls.addEventListener('start',()=>{cancelAnimationFrame(cameraTween);cameraTween=0;beginInteraction();});controls.addEventListener('change',()=>{beginInteraction();requestDraw();});
  const visibility=()=>requestDraw();document.addEventListener('visibilitychange',visibility);
  function update(next){
    const previous=s;s={...next};if(s.view==='zone')ensureZone();else ensureSample();appearance();
    const explicitView=['view','detail','assemblyAngle','productScale','zone','zoneDetail','mountStep','zonePosition'].some(k=>previous[k]!==s[k]);
    if((explicitView&&previous.profile===s.profile&&previous.strip===s.strip)||previous.view!==s.view)frame(true);
    else if(previous.length!==s.length&&displayLength(s)>100)frame(true,true);
  }
  if(s.view==='zone')ensureZone();else ensureSample();appearance();resize();await renderer.compileAsync(scene,camera);ready=true;renderer.shadowMap.needsUpdate=true;draw();const ro=new ResizeObserver(resize);ro.observe(host);
  async function exportGLB(){
    const spec=specification(s),exportState={...s,view:'assembly',assemblyAngle:'perspective',exporting:true},full=buildProduct(geometry,sourceSize,spec,exportState,{length:s.length,art,sourceCover,quality:'detail'});full.update(exportState,lightColor(s,spec.strip));full.assemble(0);const out=full.group,H=spec.profile.height/1000;out.traverse(o=>{if(o.name.startsWith('Poswiata_')||o.isLight)o.visible=false;});
    const clip=assemblyClip(full,{linerAllowed:!spec.sleeve&&!spec.strip.encapsulation});
    // Expand instancing for importers that do not support EXT_mesh_gpu_instancing.
    const instances=[];out.traverse(o=>{if(o.isInstancedMesh)instances.push(o);});for(const o of instances){const g=new T.Group();g.name=o.name;g.position.copy(o.position);g.quaternion.copy(o.quaternion);g.scale.copy(o.scale);for(let i=0;i<o.count;i++){const mesh=new T.Mesh(o.geometry,o.material),m=new T.Matrix4();o.getMatrixAt(i,m);m.decompose(mesh.position,mesh.quaternion,mesh.scale);g.add(mesh);}o.parent.add(g);o.parent.remove(o);}
    out.userData={units:'meters',configuration:s,profileLengthMm:s.length,stripLengthMm:spec.stripLength,fitStatus:spec.fitStatus,fitIssues:spec.issues,finishVariant:spec.finish,modelNotes:'MICRO-PLUS and HS cover: sections from manufacturer 3DS, with presentation chamfers. Other profile sections reconstructed from manufacturer drawings; retaining details, covers, PCB and print: illustrative. Exported tape is straight. Release-paper morphs precede PCB seating. Not fabrication geometry.',printNotes:'CE/RoHS option is a proposed print, not certification evidence.'};
    try{return await new GLTFExporter().parseAsync(out,{binary:true,animations:[clip],onlyVisible:true});}finally{full.dispose();}
  }

  async function capture(){
    cancelAnimationFrame(cameraTween);cameraTween=0;
    const saved={state:{...s},position:camera.position.clone(),target:controls.target.clone(),zoom:camera.zoom,left:camera.left,right:camera.right,top:camera.top,bottom:camera.bottom};
    try{finishInteraction();update({...s,view:'assembly',assemblyAngle:'perspective',productScale:'detail'});mount.visible=false;ground.visible=false;frame(false);finishInteraction();renderer.render(scene,camera);return await new Promise((resolve,reject)=>renderer.domElement.toBlob(blob=>blob?resolve(blob):reject(Error('Nie można zapisać obrazu.')),'image/png'));}
    finally{update(saved.state);frame();camera.position.copy(saved.position);for(const k of ['zoom','left','right','top','bottom'])camera[k]=saved[k];camera.updateProjectionMatrix();controls.target.copy(saved.target);camera.lookAt(saved.target);requestDraw();}
  }
  function projectedCover(){
    scene.updateMatrixWorld(true);camera.updateMatrixWorld();const points=[];
    for(const b of worldBoxes(sample.cover)){
      if(s.view==='assembly'&&s.assemblyAngle==='end')b.min.x=Math.max(b.min.x,.020);
      if(s.view==='assembly'&&s.assemblyAngle==='entry')b.max.x=Math.min(b.max.x,-.020);
      if(b.isEmpty())continue;
      for(const x of[b.min.x,b.max.x])for(const y of[b.min.y,b.max.y])for(const z of[b.min.z,b.max.z])points.push(new T.Vector3(x,y,z).project(camera).toArray());
    }
    return points;
  }
  return{update,frame,exportGLB,exportPNG:capture,setAssembly(value){beginInteraction();assemble(value);},setOpening(value){zone?.setOpening(value);beginInteraction();renderer.shadowMap.needsUpdate=true;requestDraw();},setArtwork(canvas){art=canvas;sampleKey='';zoneKey='';if(s.view==='zone')ensureZone();else ensureSample();appearance();frame();},
    inspect(){return{assembly:sample?.group.userData.assembly,liner:sample?{...sample.liner.userData,visible:sample.liner.visible}:null,ledLight:sample?.pcb.children[0]?.userData.light,coverLight:sample?.cover.userData.light,coverVisible:sample?.cover.visible,coverProjection:sample?projectedCover():null,cameraMoving:!!cameraTween,view:s.view,sourceSize,productVisible:sample?.group.visible&&detailRoot.visible,installedRotation:detailRoot.rotation.x,pcbBend:sample?.pcb.children[0]?.userData.bend,pcbShape:sample?.pcb.children[0]?.userData.shape,lateralBend:sample?.pcb.children[0]?.userData.lateralBend,sampleLengthMm:sample?.length,silicone:(()=>{let data=null;sample?.pcb.traverse(o=>{if(o.name==='Ochrona_silikonowa')data={...o.userData,visible:o.visible};});return data;})(),accessoryParts:sample?.accessories.children.filter(o=>o.visible).flatMap(g=>g.children.map(o=>o.name||o.type)),profileSize:sample?new T.Box3().setFromObject(sample.profile).getSize(new T.Vector3()):null,cameraType:camera.type,cameraZoom:camera.zoom,camera:camera.position.toArray(),cameraTarget:controls.target.toArray(),cameraLimits:{pan:controls.enablePan,rotate:controls.enableRotate,minAzimuth:controls.minAzimuthAngle,maxAzimuth:controls.maxAzimuthAngle,minPolar:controls.minPolarAngle,maxPolar:controls.maxPolarAngle,azimuth:controls.getAzimuthalAngle(),polar:controls.getPolarAngle()},renderer:{...renderer.info.render},memory:{...renderer.info.memory},renderCount,pixelRatio:renderer.getPixelRatio(),basePixelRatio,interactive,lastFrameMs,renderPending:!!framePending,zone:zone?{id:s.zone,visible:zone.root.visible,opening:zone.opening,lightOn:zone.root.userData.lightOn,position:s.zonePosition,motion:zone.motion,profileLengthMm:zone.product.length,focus:zone.focus.toArray(),light:zone.root.children.filter(o=>o.isSpotLight).reduce((sum,o)=>sum+o.intensity,0),lighting:zone.root.userData.lighting}:null,mount:fixture?{depthMm:fixture.depth*1000,seatMm:fixture.seat*1000,step:s.mountStep,visibleParts:fixture.root.children.filter(o=>o.visible).map(o=>o.name||o.type)}:null};},
    dispose(){disposed=true;cancelAnimationFrame(cameraTween);cancelAnimationFrame(framePending);clearTimeout(settleTimer);ro.disconnect();controls.dispose();document.removeEventListener('visibilitychange',visibility);sample?.dispose();fixture?.dispose();zone?.dispose();clear(cut);geometry.dispose();sourceCover.dispose();softShadow.dispose();environment.dispose();wood.dispose();woodMap.dispose();cutMat.dispose();renderer.dispose();renderer.domElement.remove();}
  };
}
function makeWood(){const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');x.fillStyle='#d3c5ae';x.fillRect(0,0,512,256);let seed=912;const rand=()=>{seed=seed*16807%2147483647;return seed/2147483647;};for(let i=0;i<700;i++){const y=rand()*256;x.strokeStyle=`rgba(68,47,25,${rand()*.10})`;x.lineWidth=rand();x.beginPath();x.moveTo(0,y);x.bezierCurveTo(125,y+rand()*7,375,y-rand()*5,512,y+rand()*4);x.stroke();}const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;}

function makeStudioEnvironment(){
  const env=new T.Scene();env.background=new T.Color('#77797a');
  const card=(w,h,p,target,intensity)=>{const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color().setScalar(intensity),side:T.DoubleSide}));m.position.set(...p);m.lookAt(...target);env.add(m);};
  card(6,3,[0,4,0],[0,0,0],3);
  card(1.8,5,[-3,1.3,2],[0,0,0],5);
  card(1,6,[3,0,1],[0,0,0],3);
  card(6,.6,[0,-1,-3],[0,0,0],.25);
  card(6,3,[0,0,4],[0,0,0],.85);
  return env;
}

function visibleBounds(root){
  const result=new T.Box3();
  root.traverseVisible(o=>{if(!o.isMesh||o.name.startsWith('Poswiata_'))return;
    if(o.isInstancedMesh){o.computeBoundingBox();result.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld));}
    else {o.geometry.computeBoundingBox();result.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}
  });return result;
}

function worldBoxes(root){
  const boxes=[];root.traverseVisible(o=>{if(!o.isMesh||o.name.startsWith('Poswiata_'))return;if(o.isInstancedMesh){o.computeBoundingBox();boxes.push(o.boundingBox.clone().applyMatrix4(o.matrixWorld));}else{o.geometry.computeBoundingBox();boxes.push(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});return boxes;
}
