import {tracedContours} from './profile-contours.js?v=e6079192090f';
// Millimetres in the section plane. These authored contours follow the source
// cards; small retaining details are illustrative. MICRO-PLUS uses source 3DS.
export function profileContour(p){
  if(tracedContours[p.id])return tracedContours[p.id];
  const a=p.bodyWidth/2,b=p.channel/2,H=p.height,base=p.ledBase;
  if(p.id==='pdsnk')return[[-8.1,0],[8.1,0],[8.1,11],[11.1,11],[11.1,12],[5.7,12],[5.7,10.9],[7,10.9],[7,1.1],[-7,1.1],[-7,10.9],[-5.7,10.9],[-5.7,12],[-11.1,12],[-11.1,11],[-8.1,11]];
  if(p.id==='siler')return[[-9.5,0],[9.5,0],[9.5,5],[9.1,5],[9.1,6],[9.5,6],[9.5,12],[8,12],[8,10.9],[8.4,10.9],[8.4,1.2],[-8.4,1.2],[-8.4,10.9],[-8,10.9],[-8,12],[-9.5,12],[-9.5,6],[-9.1,6],[-9.1,5],[-9.5,5]];
  if(p.id==='alu45')return [[-9.5,0],[8.5,0],[9.5,1],[9.5,19],[1.9,19],[.8,17.9],[6.9,11.8],[-2.3,2.6],[-8.3,8.6],[-9.5,7.4]];
  if(p.id==='pikoo'){
    const outer=Array.from({length:33},(_,i)=>{const a=Math.PI+(Math.PI+0.68)*i/32-.34;return[5.25*Math.cos(a),5.25+5.25*Math.sin(a)];});
    return [...outer,[3,6.8],[3,2.5],[-3,2.5],[-3,6.8]];
  }
  if(['pdszm','pikozm','giza','lipod'].includes(p.id)){
    const points=[[-a,0]],slots=p.id==='pdszm'||p.id==='pikozm'?1:3,span=p.width-2;
    for(let i=0;i<slots;i++){const x=-span/2+span*(i+.5)/slots,w=slots===1?2.8:2.5;points.push([x-w/2,0],[x-w/2,Math.min(2.6,base-.8)],[x+w/2,Math.min(2.6,base-.8)],[x+w/2,0]);}
    return [...points,[a,0],[a,H-.6],[a-.6,H],[b-.2,H],[b-.2,H-1.1],[b,H-1.1],[b,base],[-b,base],[-b,H-1.1],[-b+.2,H-1.1],[-b+.2,H],[-a+.6,H],[-a,H-.6]];
  }
  if(p.id==='microk')return[[-7.6,0],[7.6,0],[7.6,2.3],[7.05,4.9],[11,4.9],[11,5.4],[8,6],[5.7,6],[6.6,2.1],[5.6,2.1],[5.6,1.1],[-5.6,1.1],[-5.6,2.1],[-6.6,2.1],[-5.7,6],[-8,6],[-11,5.4],[-11,4.9],[-7.05,4.9],[-7.6,2.3]];
  if(p.id==='kozus')return[[-a,0],[-10,0],[-10,1.4],[-8,1.4],[-8,0],[-3,0],[-3,1.4],[-1,1.4],[-1,0],[4,0],[4,1.4],[6,1.4],[6,0],[11,0],[11,1.4],[a,1.4],[a,15],[33.4,15],[33.4,16.1],[a,16.6],[a,17.5],[10.9,17.5],[10.9,16.3],[12,15.6],[12,base],[-12,base],[-12,15.6],[-10.9,16.3],[-10.9,17.5],[-a,17.5],[-a,16.6],[-33.4,16.1],[-33.4,15],[-a,15]];
  if(p.id==='larko')return[[-a,0],[a,0],[a,3],[a-1,3],[a-1,4.4],[a,4.4],[a,22.8],[23.1,22.8],[23.1,23.7],[a,24.5],[10.9,24.5],[10.9,23.4],[12,22.7],[12,base],[-12,base],[-12,22.7],[-10.9,23.4],[-10.9,24.5],[-a,24.5],[-23.1,23.7],[-23.1,22.8],[-a,22.8],[-a,4.4],[-a+1,4.4],[-a+1,3],[-a,3]];
  return[[-a,0],[a,0],[a,H],[b-.5,H],[b-.5,H-1],[b,H-1],[b,base],[-b,base],[-b,H-1],[-b+.5,H-1],[-b+.5,H],[-a,H]];
}
export function profileIcon(p){
  const points=profileContour(p),W=p.width,H=p.height;
  return `<svg class="profile-section-icon" viewBox="${-W/2-1} -1 ${W+2} ${H+2}" aria-hidden="true"><path d="${points.map(([x,y],i)=>(i?'L':'M')+x+','+(H-y)).join(' ')}Z"/></svg>`;
}
