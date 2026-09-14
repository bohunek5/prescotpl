import * as T from 'three';

// A gentle longitudinal bow, with a rigid cross-section at each station.
// One GPU morph keeps the animation smooth and is also exported to glTF.
export function prepareCoverFlex(mesh,length){
  const g=mesh.geometry,base=g.attributes.position,normal=g.attributes.normal;
  const positions=base.clone(),normals=normal.clone(),rise=Math.min(.008,length*.045),curvature=8*rise/(length*length);
  for(let i=0;i<base.count;i++){
    const x=base.getX(i),y=base.getY(i),a=x*curvature,s=Math.sin(a),c=Math.cos(a);
    positions.setXYZ(i,s/curvature-y*s,(1-c)/curvature+y*c,base.getZ(i));
    normals.setXYZ(i,normal.getX(i)*c-normal.getY(i)*s,normal.getX(i)*s+normal.getY(i)*c,normal.getZ(i));
  }
  g.morphAttributes.position=[positions];g.morphAttributes.normal=[normals];g.morphTargetsRelative=false;mesh.updateMorphTargets();
  g.computeBoundingBox();g.computeBoundingSphere();
  mesh.userData.coverFlex={riseMm:rise*1000,presentationOnly:true};
  return weight=>{mesh.morphTargetInfluences[0]=T.MathUtils.clamp(weight,0,1);};
}
