export const isStairZone=zone=>zone==='stair-under'||zone==='stair-side';

// A measured demonstration fragment, not a building-code stair specification.
export function stairLayout(profile,state){
 const width=.48,run=.26,rise=.17,body=profile.bodyWidth/1000;
 const thickness=(state.stairThickness??32)/1000,nosing=Math.max(.04,body+.012);
 const seat=state.mounting==='recessed'?-(profile.seatDepth??profile.height-1)/1000:.0008;
 const minInset=body/2+.003,maxInset=state.stairRiser!==false?nosing-body/2-.003:.09;
 const inset=Math.max(minInset,Math.min(maxInset,(state.stairInset??25)/1000));
 const recess=Math.max(0,-seat),sideHeight=(state.stairSideHeight??65)/1000;
 return{width,run,rise,body,thickness,nosing,seat,recess,inset,minInset,maxInset,
  front:run/2+nosing,gap:body+.001,sideHeight,wallInner:width/2+.004,
  stripZ:run/2+nosing-inset,underside:rise-thickness,
  remainingWood:thickness-recess,showRiser:state.stairRiser!==false};
}
