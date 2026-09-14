import {smooth} from './assembly-motion.js?v=a9d8f23925dd';
export const welcomeDuration=5;
// Assembly has distinct peel/seat beats, then each real wiring mode gets 0.7 s.
export function welcomePose(time){
 const t=Math.max(0,Math.min(welcomeDuration,Number.isFinite(time)?time:0));
 const phase=t<.35?'tape':t<.65?'turn':t<1.05?'profile':t<1.55?'peel':t<2.1?'seat':t<2.55?'cover':t<2.9?'caps':t<3.6?'low':t<4.3?'medium':t<5?'high':'complete';
 return{time:t,phase,turn:smooth((t-.35)/.3),profile:smooth((t-.65)/.4),
  peel:smooth((t-1.05)/.3),linerExit:smooth((t-1.35)/.2),seat:smooth((t-1.55)/.55),
  cover:smooth((t-2.1)/.45),caps:smooth((t-2.55)/.35),
  amount:t<1.55?72:t<2.1?72-22*smooth((t-1.55)/.55):t<2.55?50-42*smooth((t-2.1)/.45):8*(1-smooth((t-2.55)/.35)),
  light:smooth((t-2.9)/.16),powerMode:t<3.6?'low':t<4.3?'medium':'high',complete:t>=welcomeDuration};
}
