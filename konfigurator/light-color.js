import * as T from 'three';
export function colorCct(k){
  const v=k/100,clamp=x=>Math.min(255,Math.max(0,x))/255;
  return new T.Color().setRGB(clamp(v<=66?255:329.698*Math.pow(v-60,-.1332)),clamp(v<=66?99.471*Math.log(v)-161.12:288.122*Math.pow(v-60,-.07551)),clamp(v>=66?255:v<=19?0:138.518*Math.log(v-10)-305.045),T.SRGBColorSpace);
}
export function rgbwChannels(state){
  const c=new T.Color(state.rgbColor||'#ff6424'),rgb=state.rgbMode==='white'?0:1,w=state.rgbMode==='white'?1:state.rgbMode==='mixed'?.5:0;
  return{R:c.r*rgb,G:c.g*rgb,B:c.b*rgb,W:w};
}
export function lightColor(state,t){
  if(t.type!=='RGBW')return colorCct(t.type==='CCT'?state.cct:t.cct);
  const c=rgbwChannels(state),rgb=new T.Color().setRGB(c.R,c.G,c.B).add(colorCct(t.cct).multiplyScalar(c.W)),max=Math.max(rgb.r,rgb.g,rgb.b,1);
  return rgb.multiplyScalar(1/max);
}
