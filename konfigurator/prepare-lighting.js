// Light count is part of Three's shader key. A raised/off PCB otherwise leaves
// the seated, shadowed variant to compile on the first animation frame.
export async function prepareLighting(renderer,scene,camera,product){
  async function compile(){
    const result=await renderer.compileAsync(scene,camera);
    // compileAsync links programs, but Three defers shader diagnostics and
    // uniform/attribute locations until getUniforms() on their first use.
    // Finish that cached read-only step under the loading feedback, without
    // drawing, allocating shadow maps or disabling shader error checks.
    for(const program of renderer.info?.programs||[])if(typeof program.getUniforms==='function')program.getUniforms();
    return result;
  }
  const lights=[];
  product?.traverseVisible(object=>{
    if(object.name==='Swiatlo_PCB')for(const light of object.children)if(light.isSpotLight)lights.push(light);
  });
  if(!lights.length)return compile();
  const saved=lights.map(light=>({light,visible:light.visible,intensity:light.intensity}));
  try{
    for(const visible of [false,true]){
      for(const light of lights){light.visible=visible;light.intensity=0;}
      await compile();
    }
  }finally{
    for(const {light,visible,intensity}of saved){light.visible=visible;light.intensity=intensity;}
  }
  // Leave the active program matching the restored scene, including off/zero.
  return compile();
}
