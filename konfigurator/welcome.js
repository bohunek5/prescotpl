import * as T from 'three';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

// The original vector contours become bevelled solids. This renderer exists
// only on the welcome screen and stops as soon as its brief reveal settles.
export async function createWelcome(host,{signal}={}){
  const svg=await new SVGLoader().loadAsync('assets/logo.svg');
  if(signal?.aborted)return null;
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true});
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.VSMShadowMap;
  renderer.domElement.setAttribute('aria-hidden','true');
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-3,3,1,-1,.1,30),mark=new T.Group(),presentation=new T.Group();scene.add(presentation);presentation.add(mark);
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);
  scene.environment=environment.texture;scene.environmentIntensity=.75;room.dispose();pmrem.dispose();
  const materials=[],geometries=[];
  const face=color=>{const m=new T.MeshStandardMaterial({color,metalness:.42,roughness:.27,envMapIntensity:1.2});materials.push(m);return m;};
  const navy=face('#243b4d'),orange=face('#e14e26'),navyEdge=face('#122635'),orangeEdge=face('#9b3417');
  for(const path of svg.paths){
    const warm=path.color.r>path.color.g*1.5;
    for(const shape of SVGLoader.createShapes(path)){
      const geometry=new T.ExtrudeGeometry(shape,{depth:8,steps:1,bevelEnabled:true,bevelThickness:.65,bevelSize:.65,bevelSegments:4,curveSegments:18});
      const mesh=new T.Mesh(geometry,[warm?orange:navy,warm?orangeEdge:navyEdge]);mesh.castShadow=true;mark.add(mesh);geometries.push(geometry);
    }
  }
  const bounds=new T.Box3().setFromObject(mark),center=bounds.getCenter(new T.Vector3());
  for(const geometry of geometries)geometry.translate(-center.x,-center.y,-center.z);
  mark.scale.set(.01,-.01,.01);
  const light=new T.DirectionalLight(0xfffaf1,3.2);light.position.set(-2,5,8);light.castShadow=true;
  Object.assign(light.shadow.camera,{left:-3.5,right:3.5,top:1.5,bottom:-1.5,near:.1,far:20});light.shadow.mapSize.set(1024,512);light.shadow.bias=-.0004;light.shadow.radius=5;light.shadow.blurSamples=8;scene.add(light);
  const fill=new T.DirectionalLight(0xe0ecff,1.3);fill.position.set(3,-1,5);scene.add(fill,new T.HemisphereLight(0xffffff,0xcbd0d2,.5));
  const shadowMaterial=new T.ShadowMaterial({opacity:.1}),shadowGeometry=new T.PlaneGeometry(7,2.5),shadow=new T.Mesh(shadowGeometry,shadowMaterial);
  shadow.position.set(.02,-.015,-.12);shadow.receiveShadow=true;presentation.add(shadow);materials.push(shadowMaterial);geometries.push(shadowGeometry);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(pointer:fine)');
  let disposed=false,frame=0,renderCount=0,started=performance.now(),movingUntil=started+(reduced.matches?0:1600),targetX=.13,targetY=-.13;
  presentation.rotation.set(reduced.matches?targetX:.3,reduced.matches?targetY:-.34,0);
  camera.position.set(0,.03,10);camera.lookAt(0,0,0);
  function draw(now){
    frame=0;if(disposed||document.hidden)return;
    const reveal=reduced.matches?1:Math.min(1,(now-started)/1600),ease=1-Math.pow(1-reveal,3);
    if(reveal<1){presentation.rotation.x=T.MathUtils.lerp(.3,targetX,ease);presentation.rotation.y=T.MathUtils.lerp(-.34,targetY,ease);}
    else{presentation.rotation.x=T.MathUtils.lerp(presentation.rotation.x,targetX,.16);presentation.rotation.y=T.MathUtils.lerp(presentation.rotation.y,targetY,.16);}
    renderer.render(scene,camera);renderCount++;host.dataset.logo='ready';
    if(now<movingUntil)request();
  }
  function request(){if(!frame&&!disposed)frame=requestAnimationFrame(draw);}
  function resize(){
    if(disposed)return;const {width,height}=host.getBoundingClientRect();if(!width||!height)return;
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.75,Math.sqrt(1300000/(width*height))));renderer.setSize(width,height,false);
    const halfWidth=2.77,halfHeight=Math.max(.63,halfWidth*height/width);camera.left=-halfWidth;camera.right=halfWidth;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();request();
  }
  function move(event){if(reduced.matches||!fine.matches)return;const r=host.getBoundingClientRect();targetY=-.13+((event.clientX-r.left)/r.width-.5)*.12;targetX=.13+((event.clientY-r.top)/r.height-.5)*.06;movingUntil=performance.now()+500;request();}
  function leave(){targetX=.13;targetY=-.13;if(reduced.matches)presentation.rotation.set(targetX,targetY,0);movingUntil=performance.now()+(reduced.matches?0:500);request();}
  function motionChange(){if(reduced.matches){movingUntil=0;presentation.rotation.set(targetX,targetY,0);}request();}
  function visibility(){if(!document.hidden)request();}
  host.append(renderer.domElement);host.addEventListener('pointermove',move);host.addEventListener('pointerleave',leave);document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',motionChange);
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  return{
    inspect:()=>({active:!disposed,renderCount,meshes:mark.children.length,depth:8,source:'assets/logo.svg',rotation:presentation.rotation.toArray(),triangles:renderer.info.render.triangles}),
    dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motionChange);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();environment.dispose();light.shadow.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}
  };
}
