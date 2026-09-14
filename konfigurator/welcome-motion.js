import {smooth} from './assembly-motion.js?v=1deadf165ec6';
export const welcomeDuration=6;
// Keep each assembly step readable, then softly light the finished set once.
export function welcomePose(time){
 const t=Math.max(0,Math.min(welcomeDuration,Number.isFinite(time)?time:0));
 const phase=t<.5?'tape':t<1?'turn':t<1.65?'profile':t<2.5?'peel':t<3.45?'seat':t<4.15?'cover':t<4.6?'caps':t<6?'light':'complete';
 return{time:t,phase,turn:smooth((t-.5)/.5),profile:smooth((t-1)/.65),
  peel:smooth((t-1.65)/.5),linerExit:smooth((t-2.15)/.35),seat:smooth((t-2.5)/.95),
  cover:smooth((t-3.45)/.7),caps:smooth((t-4.15)/.45),
  amount:t<2.5?72:t<3.45?72-22*smooth((t-2.5)/.95):t<4.15?50-42*smooth((t-3.45)/.7):8*(1-smooth((t-4.15)/.45)),
  light:smooth((t-4.6)/.85),complete:t>=welcomeDuration};
}
