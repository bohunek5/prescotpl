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
    const old={target:renderer.getRenderTarget(),background:scene.background,override:scene.overrideMaterial,visible:plane.visible,shadow:renderer.shadowMap.enabled,color:renderer.getClearColor(new T.Color()),alpha:renderer.getClearAlpha()};
    try{
      plane.visible=false;scene.background=null;scene.overrideMaterial=depth;renderer.shadowMap.enabled=false;renderer.setClearColor(0,0);renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);
      scene.overrideMaterial=null;
      for(const amount of [4,2]){
        quad.material=horizontal;horizontal.uniforms.tDiffuse.value=target.texture;horizontal.uniforms.h.value=amount/size;renderer.setRenderTarget(scratch);renderer.render(blurScene,blurCamera);
        quad.material=vertical;vertical.uniforms.tDiffuse.value=scratch.texture;vertical.uniforms.v.value=amount/size;renderer.setRenderTarget(target);renderer.render(blurScene,blurCamera);
      }
    }finally{scene.background=old.background;scene.overrideMaterial=old.override;plane.visible=old.visible;renderer.shadowMap.enabled=old.shadow;renderer.setRenderTarget(old.target);renderer.setClearColor(old.color,old.alpha);}
  }
  return{plane,update,dispose(){plane.geometry.dispose();material.dispose();depth.dispose();horizontal.dispose();vertical.dispose();quad.geometry.dispose();target.dispose();scratch.dispose();}};
}
