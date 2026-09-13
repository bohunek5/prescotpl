import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Presentation cut through the liner only: two halves release from the centre
// toward the ends. Material distance is preserved around each 180-degree fold.
export function buildReleaseLiner(length,width,section,backing='factory'){
  const half=length/2,steps=Math.max(120,Math.min(800,Math.ceil(half*3000)));
  const halves=[-1,1].map(sign=>{const geo=new T.PlaneGeometry(half,width,steps,1);geo.rotateX(-Math.PI/2);geo.translate(sign*half/2,0,0);return geo;});
  const halfCount=halves[0].attributes.position.count,g=mergeGeometries(halves);halves.forEach(g=>g.dispose());
  const original=g.attributes.position.array.slice(),texture=linerTexture(backing);texture.repeat.set(half/.024,1);
  const m=new T.MeshStandardMaterial({color:'#fff5de',map:texture,roughness:.76,side:T.DoubleSide,transparent:true,opacity:1,depthWrite:true});
  const mesh=new T.Mesh(g,m);mesh.name='Podklad_od_srodka';mesh.castShadow=true;mesh.receiveShadow=true;mesh.visible=false;
  let previous='';
  function update(progress,exit=0,enabled=true,point=(x,y,z)=>new T.Vector3(x,y,z),bendKey=''){
    mesh.visible=enabled&&exit<.999;const key=[progress,exit,enabled,bendKey].join('|');if(key===previous)return;previous=key;
    const f=T.MathUtils.clamp(progress,0,1),front=half*f,radius=.0026,p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const sign=i<halfCount?-1:1,sourceX=original[i*3],u=Math.abs(sourceX),q=section(sourceX),z=q.center+original[i*3+2]*q.scale;
      let x=u,y=-.00009;
      if(u<front){const distance=front-u,angle=Math.min(Math.PI,distance/radius);x=front-radius*Math.sin(angle)+Math.max(0,distance-Math.PI*radius);y-=radius*(1-Math.cos(angle));}
      const v=point(sign*(x+exit*Math.min(.025,half*.35)),y-exit*.002,z);p.setXYZ(i,v.x,v.y,v.z);
    }
    p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();g.computeBoundingBox();m.opacity=1-exit;
    mesh.userData={peel:f,exit,attachedLengthMm:length*(1-f)*1000,materialLengthMm:length*1000,halves:2,backing,cut:'Liner only; presentation split at centre'};
  }
  return{mesh,update,dispose(){g.dispose();m.dispose();texture.dispose();}};
}
function linerTexture(backing){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d');x.fillStyle=backing==='factory'?'#f2e7c9':'#dcca9c';x.fillRect(0,0,1024,256);
  let seed=93;for(let i=0;i<3500;i++){seed=seed*16807%2147483647;const a=seed/2147483647;seed=seed*16807%2147483647;x.fillStyle='rgba(121,91,42,.035)';x.fillRect(a*1024,seed/2147483647*256,1,1);}
  if(backing!=='factory'){x.translate(512,128);x.rotate(-.12);x.textAlign='center';x.textBaseline='middle';x.fillStyle=backing==='200mp'?'#547057':'#4c6957';x.font='bold 86px Arial';x.fillText('3M',-180,0);x.font='66px Arial';x.fillText(backing==='200mp'?'200MP':'300LSE',110,0);}
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=T.RepeatWrapping;tex.anisotropy=8;return tex;
}
