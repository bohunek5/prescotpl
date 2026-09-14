import * as T from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {normalize,specification} from './catalog.js?v=e64a20d5c820';
import {buildProduct} from './product.js?v=e64a20d5c820';
import {buildInstallationCable} from './installation-wiring.js?v=e64a20d5c820';
import {makeStudioEnvironment} from './studio-environment.js?v=e64a20d5c820';
import {lightColor} from './light-color.js?v=e64a20d5c820';
import {welcomePose,welcomeDuration} from './welcome-motion.js?v=e64a20d5c820';
import {welcomeProfile} from './welcome-profile.js?v=e64a20d5c820';

export async function createWelcomeFilm(host,{onComplete=()=>{},onPlaying=()=>{},onPhase=()=>{}}={}){
 RectAreaLightUniformsLib.init();
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true});renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.94;renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-.1,.1,.055,-.055,.001,3);camera.position.set(0,0,.45);
 const pmrem=new T.PMREMGenerator(renderer),env=makeStudioEnvironment(),environment=pmrem.fromScene(env,.02);scene.environment=environment.texture;env.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});pmrem.dispose();
 const hemi=new T.HemisphereLight('#fffaf1','#b6afb0',1.05),key=new T.DirectionalLight('#fff8e9',2),fill=new T.DirectionalLight('#dce8f3',1.1);key.position.set(-.1,.2,.3);fill.position.set(.12,-.1,.2);scene.add(hemi,key,fill);
 key.castShadow=true;key.shadow.mapSize.set(512,512);Object.assign(key.shadow.camera,{left:-.085,right:.085,top:.085,bottom:-.085,near:.01,far:1});key.shadow.bias=-.00002;key.shadow.normalBias=.0001;
 const state=normalize({profile:'micro',strip:'threeinone',cover:'hs11-opal',length:50,view:'assembly',exploded:100,print:'brand',backing:'200mp',endcaps:true,showCable:true,powerMode:'high',light:false,dimmer:0}),spec=specification(state),color=lightColor(state,spec.strip);
 spec.profile=welcomeProfile(spec.profile);
 // One real 50 mm cutting segment keeps the PCB and its four pads legible on a phone.
 const product=buildProduct(null,null,spec,state,{length:50,quality:'detail'});scene.add(product.group);
 const cable=buildInstallationCable(product,spec.profile,{tailSpread:.002});
 // Build the final connection once, using the four actual terminal positions.
 product.assemble(0);product.group.updateMatrixWorld(true);cable.update(state,[new T.Vector3(-.034,.003,.001),new T.Vector3(-.041,.002,-.001),new T.Vector3(-.048,.004,-.001)],true);cable.root.visible=false;
 const front=new T.Quaternion().setFromEuler(new T.Euler(Math.PI/2,0,-.06)),angled=new T.Quaternion().setFromEuler(new T.Euler(.7,.35,-.6));
 const anchor=new T.Vector3();
 let frame=0,elapsed=0,start=0,disposed=false,playing=false,renderCount=0,previousTime=0,resumeAfterVisibility=false,aspect=1;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function render(time){
  if(disposed)return;const p=welcomePose(time),on=p.light>.002;elapsed=p.time;
  product.update({...state,light:on,dimmer:p.light*80,exploded:p.amount},color);product.assemble(p.amount);
  product.bend(.32*p.turn*(1-p.seat));
  product.peel(p.peel,p.linerExit,p.time>=1.7&&p.time<2.45);
  product.group.quaternion.slerpQuaternions(front,angled,p.turn);
  anchor.set(0,.022*(1-p.turn)+.011*p.turn,0).applyQuaternion(product.group.quaternion);
  product.group.position.set(.01-anchor.x,-anchor.y,0);
  product.profile.visible=p.profile>0;product.profile.position.y=-.028*(1-p.profile);
  // Controlled lowering makes contact with the actual channel floor explicit.
  product.pcb.position.y=product.ledBase+.021*(1-p.seat);
  product.cover.visible=p.time>=3.2;
  product.cover.position.y=(spec.profile.coverY/1000-.00045)+.024*(1-p.cover);
  product.accessories.visible=p.time>=3.85;
  product.wiring.visible=p.time<3.2;cable.root.visible=p.time>=3.2;
  const half=Math.max(.026,.042/aspect)*(1+.3*p.turn*(1-p.seat));
  camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();
  host.dataset.phase=p.phase;host.style.setProperty('--film-progress',String(p.time/welcomeDuration));onPhase(p.phase,p);
  renderer.render(scene,camera);renderCount++;if(p.complete)onComplete();
 }
 function stop(){cancelAnimationFrame(frame);frame=0;playing=false;onPlaying(false);}
 function tick(now){
  if(disposed||document.hidden){stop();return;}
  const t=Math.min(welcomeDuration,(now-start)/1000);
  // A short film can run at 30 fps without a permanent render loop.
  if(now-previousTime>=31||t===welcomeDuration){previousTime=now;render(t);}
  if(t<welcomeDuration)frame=requestAnimationFrame(tick);else stop();
 }
 function play(){stop();if(disposed)return;if(reduced.matches){render(welcomeDuration);return;}elapsed=0;start=performance.now();previousTime=0;playing=true;onPlaying(true);frame=requestAnimationFrame(tick);}
 function resize(){if(disposed)return;const w=host.clientWidth,h=host.clientHeight;aspect=w/Math.max(1,h);renderer.setSize(w,h,false);render(elapsed);}
 const hidden=()=>{if(document.hidden){resumeAfterVisibility=playing;stop();}else if(resumeAfterVisibility&&!disposed&&elapsed<welcomeDuration){resumeAfterVisibility=false;start=performance.now()-elapsed*1000;playing=true;onPlaying(true);frame=requestAnimationFrame(tick);}};
 const motion=()=>{if(reduced.matches){stop();render(welcomeDuration);}};
 // Compile every assembly part and the lit material before autoplay starts.
 product.update({...state,light:true,dimmer:80,exploded:0},color);product.assemble(0);
 product.wiring.visible=true;product.liner.visible=true;cable.root.visible=true;
 await renderer.compileAsync(scene,camera);resize();
 const observer=new ResizeObserver(resize);observer.observe(host);document.addEventListener('visibilitychange',hidden);reduced.addEventListener('change',motion);
 return{play,pause(){resumeAfterVisibility=false;stop();},seek(time){stop();render(time)},inspect:()=>({time:elapsed,duration:welcomeDuration,phase:host.dataset.phase,playing,renderCount,connections:cable.root.userData.connections,visibleWireCount:(cable.root.visible?cable.root:product.wiring).children.filter(o=>o.userData.terminal&&o.name.indexOf('Koncowka')!==0).length,throughCap:cable.root.userData.throughCap,sampleLength:product.length,pcbLiftMm:(product.pcb.position.y-product.ledBase)*1000,liner:{...product.liner.userData,visible:product.liner.visible},profileVisible:product.profile.visible,coverVisible:product.cover.visible,light:welcomePose(elapsed).light}),dispose(){if(disposed)return;stop();disposed=true;observer.disconnect();document.removeEventListener('visibilitychange',hidden);reduced.removeEventListener('change',motion);cable.dispose();product.dispose();key.shadow.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();}};
}
