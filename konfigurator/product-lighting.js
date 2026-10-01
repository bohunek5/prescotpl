import * as T from 'three';
import {tapeLayout} from './tape-layout.js?v=130bc2896fcd';
import {smdDimensions} from './smd-package.js?v=130bc2896fcd';

// Sample the real emitter positions. Unlike an unshadowed rectangular light,
// these sources cannot illuminate aluminium through the channel wall.
export function createPcbLighting(strip,length){
  const root=new T.Group();root.name='Swiatlo_PCB';
  const positions=tapeLayout(strip,length).leds;
  const count=Math.min(5,positions.length),lights=[];
  const height=strip.encapsulation?((strip.envelopeHeight??4)+.1)/1000:strip.type==='COB'?.0012:(.26+smdDimensions(strip).height+.1)/1000;
  for(let i=0;i<count;i++){
    const x=positions[count===1?0:Math.round(i*(positions.length-1)/(count-1))];
    const light=new T.SpotLight('#fff4df',0,.08,Math.PI/3,.7,2);
    light.position.set(x,height,0);light.target.position.set(x,height+.04,0);
    light.castShadow=true;light.shadow.mapSize.set(256,256);
    light.shadow.camera.near=.0001;light.shadow.camera.far=.08;
    light.shadow.bias=-.000001;light.shadow.normalBias=.000015;
    light.visible=false;root.add(light,light.target);lights.push(light);
  }
  return{root,update(color,level){
    for(const light of lights){light.color.copy(color);light.visible=level>0;light.intensity=Math.max(0,level)*.00006*(length/.1)/Math.max(1,count);}
    root.userData={count,shadowed:true,emitterHeightMm:height*1000,level:Math.max(0,level)};
  },dispose(){for(const light of lights)light.dispose();}};
}
