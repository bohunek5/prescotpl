import {smooth} from './assembly-motion.js?v=e64a20d5c820';
export const welcomeDuration=5;
// Distinct beats for peeling and seating. The cover arrives after the PCB.
export function welcomePose(time){
 const t=Math.max(0,Math.min(welcomeDuration,Number.isFinite(time)?time:0));
 const phase=t<.55?'tape':t<1.1?'turn':t<1.7?'profile':t<2.45?'peel':t<3.2?'seat':t<3.85?'cover':t<4.25?'caps':t<5?'light':'complete';
 return{time:t,phase,turn:smooth((t-.55)/.55),profile:smooth((t-1.1)/.6),
  peel:smooth((t-1.7)/.45),linerExit:smooth((t-2.15)/.3),seat:smooth((t-2.45)/.75),
  cover:smooth((t-3.2)/.65),caps:smooth((t-3.85)/.4),
  amount:t<2.45?72:t<3.2?72-22*smooth((t-2.45)/.75):t<3.85?50-42*smooth((t-3.2)/.65):8*(1-smooth((t-3.85)/.4)),
  light:smooth((t-4.25)/.55),complete:t>=welcomeDuration};
}
