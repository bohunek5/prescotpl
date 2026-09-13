import * as T from 'three';

// A small local halo, depth-tested against the product. No full-screen blur or
// continuous postprocessing; the texture is generated once per model.
export function glowMaterial(radial=false){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=64;
  const c=canvas.getContext('2d'),g=c.createLinearGradient(0,0,0,64);
  for(const [stop,alpha]of [[0,0],[.15,.015],[.35,.10],[.5,.32],[.65,.10],[.85,.015],[1,0]])g.addColorStop(stop,`rgba(255,255,255,${alpha})`);
  c.fillStyle=g;c.fillRect(0,0,128,64);c.globalCompositeOperation='destination-in';
  const ends=c.createLinearGradient(0,0,128,0);for(const [stop,alpha]of [[0,0],[.055,1],[.945,1],[1,0]])ends.addColorStop(stop,`rgba(255,255,255,${alpha})`);
  c.fillStyle=ends;c.fillRect(0,0,128,64);
  if(radial){
    c.globalCompositeOperation='source-over';c.clearRect(0,0,128,64);
    c.save();c.scale(2,1);const spot=c.createRadialGradient(32,32,0,32,32,32);
    for(const [stop,a]of [[0,.9],[.12,.52],[.32,.16],[.6,.028],[1,0]])spot.addColorStop(stop,`rgba(255,255,255,${a})`);
    c.fillStyle=spot;c.fillRect(0,0,64,64);c.restore();
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const material=new T.MeshBasicMaterial({map:texture,color:'#fff0d8',transparent:true,opacity:0,depthWrite:false,depthTest:true,blending:T.AdditiveBlending,side:T.DoubleSide,toneMapped:false});
  return{material,texture};
}
