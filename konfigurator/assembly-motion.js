const clamp=x=>Math.max(0,Math.min(1,x));
export const smooth=x=>{const v=clamp(x);return v*v*(3-2*v);};
// Amount runs from 100 (parts) to 0 (assembled). The adhesive liner is removed
// completely before the PCB is lowered into the channel.
export function assemblyPose(amount){
  const e=clamp(amount/100);
  return {peel:smooth((1-e)/.25),linerExit:smooth((.75-e)/.13),pcbLift:smooth((e-.50)/.12),pcbBend:smooth((e-.5)/.3),coverLift:smooth(e/.5),coverTilt:smooth(e/.5),capGap:smooth(e/.35)};
}
