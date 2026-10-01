// Keep white-light chromaticity legible when the filmic curve compresses bright
// channels towards white. Blend in a peak-mapped response only where the
// material actually emits. Unlit polymer/phosphor keeps the normal studio look.
// This is a display response, not a replacement for the product's Kelvin value.
export function configureWhiteEmission(material){
  const preserve={value:1},compile=material.onBeforeCompile,cacheKey=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    compile.call(this,shader,renderer);
    shader.uniforms.preserveWhiteEmission=preserve;
    shader.fragmentShader='uniform float preserveWhiteEmission;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>',`
      #include <tonemapping_fragment>
      #ifdef TONE_MAPPING
        float whitePeak = max(outgoingLight.r, max(outgoingLight.g, outgoingLight.b));
        float emissionPeak = max(totalEmissiveRadiance.r, max(totalEmissiveRadiance.g, totalEmissiveRadiance.b));
        float whiteWeight = preserveWhiteEmission * 0.72 * clamp(emissionPeak / max(whitePeak, 0.00001), 0.0, 1.0);
        vec3 whiteResponse = outgoingLight / max(whitePeak, 0.00001) * toneMapping(vec3(whitePeak));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, whiteResponse, whiteWeight);
      #endif
    `);
  };
  material.customProgramCacheKey=()=>cacheKey+'|white-emission-v1';
  return enabled=>{preserve.value=enabled?1:0;};
}

// Preserve a neutral polymer when dark, while keeping strong RGB emission
// legible under the studio lights. Work per fragment, after the emission map
// and sleeve insertion mask: an unlit part must retain its original surface.
export function configureDiffuserEmission(material,{surfaceReflection=0}={}){
  const setWhiteEmission=configureWhiteEmission(material);
  const rgb={value:0},compile=material.onBeforeCompile,cacheKey=material.customProgramCacheKey();
  material.onBeforeCompile=function(shader,renderer){
    compile.call(this,shader,renderer);
    shader.uniforms.diffuserRgb=rgb;
    shader.uniforms.diffuserReflection={value:surfaceReflection};
    shader.fragmentShader='uniform float diffuserRgb;\nuniform float diffuserReflection;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      float diffuserPower = max(totalEmissiveRadiance.r, max(totalEmissiveRadiance.g, totalEmissiveRadiance.b));
      // Reach the RGB surface response near darkness, then retain a constant
      // reflection as power rises. Removing more white reflection at 32–100%
      // made higher RGB settings visibly darker, especially for blue.
      float diffuserBlend = diffuserRgb * smoothstep(0.0, 0.015, diffuserPower);
      vec3 diffuserSurface = outgoingLight - totalEmissiveRadiance;
      outgoingLight = mix(outgoingLight, totalEmissiveRadiance + diffuserSurface * diffuserReflection, diffuserBlend);
      #include <opaque_fragment>
    `);
  };
  material.customProgramCacheKey=()=>cacheKey+'|diffuser-emission-v3';
  return enabled=>{rgb.value=enabled?1:0;setWhiteEmission(!enabled);};
}
