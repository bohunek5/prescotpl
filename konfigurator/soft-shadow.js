import * as T from 'three';
import {HorizontalBlurShader} from 'three/addons/shaders/HorizontalBlurShader.js';
import {VerticalBlurShader} from 'three/addons/shaders/VerticalBlurShader.js';

// Cached, blurred depth silhouette. Refreshed only when product geometry changes.
export function createSoftShadow(renderer){
  const size=512,span=.22;
  const target=new T.WebGLRenderTarget(size,size),scratch=new T.WebGLRenderTarget(size,size);
  const material=new T.MeshBasicMaterial({map:target.texture,transparent:true,opacity:.18,depthWrite:false,toneMapped:false});
  const plane=new T.Mesh(new T.PlaneGeometry(span,span),material);plane.name='Cien_studyjny';plane.rotation.x=-Math.PI/2;plane.position.y=-.008;
  const depth=new T.MeshDepthMaterial({depthPacking:T.BasicDepthPacking});
  depth.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );','gl_FragColor = vec4( vec3( 0.0 ), min(1.0, pow(fragCoordZ, 3.0) * 3.0) );');};
  const camera=new T.OrthographicCamera(-span/2,span/2,span/2,-span/2,.001,.2);camera.position.set(0,.13,0);camera.up.set(0,0,-1);camera.lookAt(0,0,0);
  const blurScene=new T.Scene(),blurCamera=new T.OrthographicCamera(-1,1,1,-1,0,2);blurCamera.position.z=1;
  const horizontal=new T.ShaderMaterial(HorizontalBlurShader),vertical=new T.ShaderMaterial(VerticalBlurShader),quad=new T.Mesh(new T.PlaneGeometry(2,2),horizontal);blurScene.add(quad);
  function update(scene,clippingPlanes=[]){
    depth.clippingPlanes=clippingPlanes;
    // The depth override otherwise turns clear lenses and presentation effects
    // into opaque silhouettes. Honour the same casting flag as real shadows.
    const effects=[],bounds=new T.Box3();scene.updateMatrixWorld(true);
    scene.traverseVisible(o=>{
      if(o===plane)return;
      if(o.name.startsWith('Poswiata_')||(o.isMesh&&!o.castShadow)){effects.push(o);return;}
      if(o.isMesh){const box=new T.Box3().setFromObject(o,true);if(!box.isEmpty())bounds.union(box);}
    });
    // A fixed 220 mm receiver cropped long products and partially inserted PCB.
    // Keep the existing close-up scale and extend only the needed axes.
    const center=bounds.isEmpty()?new T.Vector3():bounds.getCenter(new T.Vector3());
    const extent=bounds.isEmpty()?new T.Vector3():bounds.getSize(new T.Vector3());
    const width=Math.max(span,extent.x+.06),height=Math.max(span,extent.z+.06);
    plane.position.x=center.x;plane.position.z=center.z;plane.scale.set(width/span,height/span,1);
    camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;
    camera.position.set(center.x,Math.max(.13,(bounds.isEmpty()?0:bounds.max.y)+.035),center.z);
    camera.lookAt(center.x,plane.position.y,center.z);camera.far=Math.max(.2,camera.position.y-plane.position.y+.035);camera.updateProjectionMatrix();
    plane.userData.shadow={widthMm:width*1000,depthMm:height*1000,casters:!bounds.isEmpty()};
    effects.forEach(o=>o.visible=false);
    const old={target:renderer.getRenderTarget(),background:scene.background,override:scene.overrideMaterial,visible:plane.visible,shadow:renderer.shadowMap.enabled,color:renderer.getClearColor(new T.Color()),alpha:renderer.getClearAlpha()};
    try{
      plane.visible=false;scene.background=null;scene.overrideMaterial=depth;renderer.shadowMap.enabled=false;renderer.setClearColor(0,0);renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);
      scene.overrideMaterial=null;
      for(const amount of [4,2]){
        quad.material=horizontal;horizontal.uniforms.tDiffuse.value=target.texture;horizontal.uniforms.h.value=amount/size*span/width;renderer.setRenderTarget(scratch);renderer.render(blurScene,blurCamera);
        quad.material=vertical;vertical.uniforms.tDiffuse.value=scratch.texture;vertical.uniforms.v.value=amount/size*span/height;renderer.setRenderTarget(target);renderer.render(blurScene,blurCamera);
      }
    }finally{effects.forEach(o=>o.visible=true);scene.background=old.background;scene.overrideMaterial=old.override;plane.visible=old.visible;renderer.shadowMap.enabled=old.shadow;renderer.setRenderTarget(old.target);renderer.setClearColor(old.color,old.alpha);}
  }
  return{plane,update,dispose(){plane.geometry.dispose();material.dispose();depth.dispose();horizontal.dispose();vertical.dispose();quad.geometry.dispose();target.dispose();scratch.dispose();}};
}
