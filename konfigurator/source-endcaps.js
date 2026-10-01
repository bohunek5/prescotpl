import * as T from 'three';
import {microEndcaps} from './source-endcap-data.js?v=130bc2896fcd';
import {lipod50EndcapGeometry} from './lipod50-source-endcap.js?v=130bc2896fcd';

// Only the documented cap families in the source assemblies are used. Do not
// transplant its retaining fingers to different profiles or conductor caps.
export function sourceEndcapGeometry(profile,part,sign){
  if(profile.id==='lipod50')return lipod50EndcapGeometry(part,sign);
  if(profile.id!=='micro'||!/^C24392(?:C02|C07|C10|L01)$/.test(part.ref))return null;
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(microEndcaps[sign].map(v=>v/1000),3));
  geometry.computeVertexNormals();
  geometry.userData={source:'assets/sources/micro-plus.3ds',sourceGroup:sign<0?0:3,family:'MICRO-PLUS',method:'manufacturer-presentation-mesh',matingPlaneMm:0,insertDepthMm:7,outsideDepthMm:2,toleranceNotice:'Presentation mesh, not tooling geometry or manufacturing tolerances.'};
  return geometry;
}
