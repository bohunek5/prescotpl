import * as T from 'three';
import {tapeLayout} from './tape-layout.js?v=c5bc01a3b1d1';

// Presentation maps, not measured photometry. Point spacing follows the real
// Grayscale maps contain linear emission weights, not display-encoded colors.
// tape; depth and diffuser transmission control how much the points merge.
export function diffuserMap(spec,length){
  const c=document.createElement('canvas');c.width=Math.min(4096,Math.max(512,Math.ceil(length*5)));c.height=64;
  const ctx=c.getContext('2d'),data=ctx.createImageData(c.width,c.height),t=spec.strip,p=spec.profile,cover=spec.cover,L=length/1000;
  const stripLength=Math.floor(length/t.cut)*t.cut/1000,layout=tapeLayout(t,stripLength),points=layout.leds,pitch=1/t.density;
  const depth=(p.channelDepth??(p.height-p.ledBase))/1000+(cover.rise||0)/1000;
  const continuous=t.type==='COB'||t.technology==='WCOB',diffuse=!cover.id.endsWith('-clear')&&!cover.beamAngle,
    sigma=Math.max(.0011,depth*(cover.id.includes('liger')?1.2:diffuse?.95:.62)),first=points[0]||0;
  const sample=x=>{if(continuous)return x>=-stripLength/2&&x<=stripLength/2?1:.06;let sum=0;const nearest=Math.round((x-first)/pitch),radius=Math.ceil(sigma*3/pitch)+1;for(let j=Math.max(0,nearest-radius);j<=Math.min(points.length-1,nearest+radius);j++)sum+=Math.exp(-.5*((x-points[j])/sigma)**2);return sum;};
  const normal=Math.max(.001,sample(points[Math.floor(points.length/2)]||0));
  for(let x=0;x<c.width;x++){const q=sample((x/(c.width-1)-.5)*L)/normal;for(let y=0;y<c.height;y++){const cross=Math.pow(Math.sin(Math.PI*(y+.5)/c.height),.35),v=Math.round(255*Math.min(1,(diffuse?.30+.70*q:.035+.965*q)*(.28+.72*cross))),i=(y*c.width+x)*4;data.data[i]=data.data[i+1]=data.data[i+2]=v;data.data[i+3]=255;}}
  ctx.putImageData(data,0,0);const texture=new T.CanvasTexture(c);texture.colorSpace=T.NoColorSpace;texture.anisotropy=8;return texture;
}
export function phosphorMap(white=false){
  const c=document.createElement('canvas');c.width=128;c.height=128;const x=c.getContext('2d'),im=x.createImageData(128,128);let seed=83;
  for(let y=0;y<128;y++)for(let z=0;z<128;z++){seed=seed*16807%2147483647;const radius=Math.pow(Math.abs((z-63.5)/64),5)+Math.pow(Math.abs((y-63.5)/64),5),grain=seed/2147483647*.025,value=Math.max(.12,Math.min(1,1-radius*.54-grain)),i=(y*128+z)*4;im.data[i]=255*value;im.data[i+1]=255*value;im.data[i+2]=255*value;im.data[i+3]=255;}
  x.putImageData(im,0,0);const texture=new T.CanvasTexture(c);texture.colorSpace=T.NoColorSpace;return texture;
}
