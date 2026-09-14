import * as T from 'three';

// Sample the same assembly as the viewport. Morphs carry the cover flex and
// release-paper curl into GLB; PCB packages keep their straight geometry.
export function assemblyClip(product,{linerAllowed=true,duration=6.2}={}){
  const moving=[product.pcb,product.cover,...product.accessories.children[0].children,product.accessories.children[1]];
  moving.forEach((o,i)=>{if(i>1)o.name='Montaz_akcesorium_'+i;});
  const flexible=[];product.cover.traverse(o=>{if(o.userData.coverFlex)flexible.push(o);});
  const flexWeights=flexible.map(()=>[]);
  const times=[],positions=moving.map(()=>[]),rotations=moving.map(()=>[]);
  for(let i=0;i<=100;i++){
    product.assemble(100-i);times.push(duration*i/100);
    flexible.forEach((o,n)=>flexWeights[n].push(...o.morphTargetInfluences));
    moving.forEach((o,n)=>{positions[n].push(...o.position.toArray());rotations[n].push(...o.quaternion.toArray());});
  }
  const tracks=moving.flatMap((o,i)=>[new T.VectorKeyframeTrack(o.name+'.position',times,positions[i]),new T.QuaternionKeyframeTrack(o.name+'.quaternion',times,rotations[i])]);
  flexible.forEach((o,i)=>tracks.push(new T.NumberKeyframeTrack(o.name+'.morphTargetInfluences',times,flexWeights[i])));
  const liner=product.liner,g=liner.geometry;
  if(linerAllowed){
    const morphs=[],normals=[],paperTimes=[];
    for(let i=0;i<=32;i++){
      const amount=100-38*i/32;product.assemble(amount);paperTimes.push(duration*(100-amount)/100);
      morphs.push(g.attributes.position.clone());normals.push(g.attributes.normal.clone());
    }
    product.assemble(0);g.setAttribute('position',morphs[0].clone());g.setAttribute('normal',normals[0].clone());
    g.morphAttributes.position=morphs;g.morphAttributes.normal=normals;g.morphTargetsRelative=false;liner.updateMorphTargets();
    const weights=paperTimes.flatMap((_,i)=>morphs.map((_,j)=>i===j?1:0));
    tracks.push(new T.NumberKeyframeTrack(liner.name+'.morphTargetInfluences',paperTimes,weights));
    // glTF core has no material-opacity animation. A zero scale removes paper
    // after its withdrawal and before the PCB starts descending.
    const exit=duration*.38;tracks.push(new T.VectorKeyframeTrack(liner.name+'.scale',[0,exit-.01,exit,duration],[1,1,1,1,1,1,0,0,0,0,0,0]));
    liner.visible=true;liner.scale.setScalar(0);liner.material.opacity=1;g.computeBoundingBox();g.computeBoundingSphere();
  }else product.assemble(0);
  return new T.AnimationClip('Montaz_PRESCOT',duration,tracks);
}
