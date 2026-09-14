export function sleeveInsertionPose(state,length){
 const active=state.housing==='sleeve'&&state.view==='macro'&&state.detail==='sleeve'&&state.sleeve!=='none';
 const progress=active?Math.max(0,Math.min(1,Number.isFinite(state.sleeveInsertion)?state.sleeveInsertion:0)):1;
 return{active,progress,offset:-(length+.004)*(1-progress)};
}
