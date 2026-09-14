import * as T from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {normalize,specification} from './catalog.js?v=05d60c0cb577';
import {buildProduct} from './product.js?v=05d60c0cb577';
import {buildInstallationCable} from './installation-wiring.js?v=05d60c0cb577';
import {makeStudioEnvironment} from './studio-environment.js?v=05d60c0cb577';
import {lightColor} from './light-color.js?v=05d60c0cb577';
import {welcomePose,welcomeDuration} from './welcome-motion.js?v=05d60c0cb577';

export async function createWelcomeFilm(host,{onComplete=()=>{},onPlaying=()=>{}}={}){
 RectAreaLightUniformsLib.init();
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true});renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
 renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-.1,.1,.055,-.055,.001,3);camera.position.set(0,0,.45);
 const pmrem=new T.PMREMGenerator(renderer),env=makeStudioEnvironment(),environment=pmrem.fromScene(env,.02);scene.environment=environment.texture;env.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});pmrem.dispose();
 const hemi=new T.HemisphereLight('#fffaf1','#b6afb0',1.05),key=new T.DirectionalLight('#fff8e9',2),fill=new T.DirectionalLight('#dce8f3',1.1);key.position.set(-.1,.2,.3);fill.position.set(.12,-.1,.2);scene.add(hemi,key,fill);
 const state=normalize({profile:'micro',strip:'threeinone',cover:'hs11-opal',length:100,view:'assembly',exploded:100,print:'brand',endcaps:true,showCable:true,powerMode:'high',light:false,dimmer:0}),spec=specification(state),color=lightColor(state,spec.strip);
 const product=buildProduct(null,null,spec,state,{length:100,quality:'detail'});scene.add(product.group);
 const cable=buildInstallationCable(product,spec.profile);
 // Build the final connection once, using the four actual terminal positions.
 product.assemble(0);product.group.updateMatrixWorld(true);cable.update(state,[new T.Vector3(-.062,.003,.001),new T.Vector3(-.076,.002,-.002),new T.Vector3(-.087,.004,-.004)],true);cable.root.visible=false;
 const front=new T.Quaternion().setFromEuler(new T.Euler(Math.PI/2,0,0)),angled=new T.Quaternion().setFromEuler(new T.Euler(.95,-.24,-.17));
 let frame=0,elapsed=0,start=0,disposed=false,playing=false,renderCount=0,previousTime=0,resumeAfterVisibility=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function render(time){
  if(disposed)return;elapsed=time;const p=welcomePose(time),on=p.light>.002;
  product.update({...state,light:on,dimmer:p.light*80,exploded:p.amount},color);product.assemble(p.amount);
  product.group.quaternion.slerpQuaternions(front,angled,p.turn);product.group.position.set(.012,-.006*p.turn,0);
  // Present the PCB face first, then leave room for the arriving profile.
  product.pcb.position.y*=p.turn;product.profile.visible=p.profile>0;product.profile.position.y=-.11*(1-p.profile);
  product.cover.visible=p.cover>0;product.cover.position.y+=.055*(1-p.cover);
  product.accessories.visible=p.caps>0;product.wiring.visible=p.time<10.45;cable.root.visible=p.time>=10.45;
  product.liner.visible=p.time>=4.5&&p.amount>62;
  host.dataset.phase=p.time<2.2?'tape':p.time<3.6?'turn':p.time<5.2?'profile':p.time<6.8?'seat':p.time<9.4?'cover':p.time<10.7?'caps':p.complete?'complete':'light';
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
 function resize(){if(disposed)return;const w=host.clientWidth,h=host.clientHeight,aspect=w/Math.max(1,h),half=Math.max(.038,.098/aspect);renderer.setSize(w,h,false);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();render(elapsed);}
 const hidden=()=>{if(document.hidden){resumeAfterVisibility=playing;stop();}else if(resumeAfterVisibility&&!disposed&&elapsed<welcomeDuration){resumeAfterVisibility=false;start=performance.now()-elapsed*1000;playing=true;onPlaying(true);frame=requestAnimationFrame(tick);}};
 const motion=()=>{if(reduced.matches){stop();render(welcomeDuration);}};
 resize();await renderer.compileAsync(scene,camera);
 const observer=new ResizeObserver(resize);observer.observe(host);document.addEventListener('visibilitychange',hidden);reduced.addEventListener('change',motion);
 return{play,pause(){resumeAfterVisibility=false;stop();},seek(time){stop();render(time)},inspect:()=>({time:elapsed,phase:host.dataset.phase,playing,renderCount,connections:cable.root.userData.connections,profileVisible:product.profile.visible,coverVisible:product.cover.visible,light:welcomePose(elapsed).light}),dispose(){if(disposed)return;stop();disposed=true;observer.disconnect();document.removeEventListener('visibilitychange',hidden);reduced.removeEventListener('change',motion);cable.dispose();product.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();}};
}
