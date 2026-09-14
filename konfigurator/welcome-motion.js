import {smooth} from './assembly-motion.js?v=05d60c0cb577';
export const welcomeDuration=12.8;
export function welcomePose(time){
 const t=Math.max(0,Math.min(welcomeDuration,time));
 return{time:t,turn:smooth((t-2.2)/1.6),profile:smooth((t-3.6)/1.5),cover:smooth((t-6.8)/.65),caps:smooth((t-8.9)/.55),
  amount:t<5.2?100:t<6.8?100-50*smooth((t-5.2)/1.6):t<9.4?50-42*smooth((t-6.8)/2.6):8*(1-smooth((t-9.4)/1.05)),
  light:smooth((t-10.7)/1.2),complete:t>=welcomeDuration};
}
