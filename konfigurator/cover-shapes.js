import * as T from 'three';

// Millimetre-based illustrative sections. Rise and engagement are separate:
// a taller optical surface does not imply a wider LED channel.
export function coverSection(c){
  const w=c.width||14.2,lip=c.lipDepth??3.2,wall=.65,r=c.rise??(c.shape==='round'?3.4:c.shape==='shallow'?1.1:.8),s=new T.Shape();
  if(c.shape==='dome'){
    s.moveTo(-w/2,-lip);s.lineTo(-w/2,r-w/2);s.quadraticCurveTo(-w/2,r,0,r);s.quadraticCurveTo(w/2,r,w/2,r-w/2);s.lineTo(w/2,-lip);s.lineTo(w/2-wall,-lip);s.lineTo(w/2-wall,r-w/2);s.quadraticCurveTo(w/2-wall,r-wall,0,r-wall);s.quadraticCurveTo(-w/2+wall,r-wall,-w/2+wall,r-w/2);s.lineTo(-w/2+wall,-lip);
  }else if(c.shape==='square'){
    s.moveTo(-w/2,-lip);s.lineTo(-w/2,r);s.lineTo(w/2,r);s.lineTo(w/2,-lip);s.lineTo(w/2-wall,-lip);s.lineTo(w/2-wall,r-wall);s.lineTo(-w/2+wall,r-wall);s.lineTo(-w/2+wall,-lip);
  }else if(c.shape==='lens'){
    s.moveTo(-w/2,-lip);s.lineTo(-w/2,r);s.lineTo(w/2,r);s.lineTo(w/2,-lip);s.lineTo(w/2-wall,-lip);s.lineTo(w/2-wall,r-wall);s.quadraticCurveTo(0,-1.4,-w/2+wall,r-wall);s.lineTo(-w/2+wall,-lip);
  }else if(['round','shallow','arch'].includes(c.shape)){
    s.moveTo(-w/2,-lip);s.lineTo(-w/2,0);s.quadraticCurveTo(0,r*2,w/2,0);s.lineTo(w/2,-lip);s.lineTo(w/2-wall,-lip);s.lineTo(w/2-wall,-.2);s.quadraticCurveTo(0,(r-wall)*2,-w/2+wall,-.2);s.lineTo(-w/2+wall,-lip);
  }else{
    s.moveTo(-w/2,-lip);s.lineTo(-w/2,.8);s.lineTo(w/2,.8);s.lineTo(w/2,-lip);s.lineTo(w/2-wall,-lip);s.lineTo(w/2-wall,0);s.lineTo(-w/2+wall,0);s.lineTo(-w/2+wall,-lip);
  }
  s.closePath();return s;
}
export function coverIcon(c){
  const points=coverSection(c).getPoints(20),coords=points.map(p=>[p.x,-p.y]),minY=Math.min(...coords.map(p=>p[1])),maxY=Math.max(...coords.map(p=>p[1])),w=c.width||14.2;
  return `<svg class="cover-section-icon" viewBox="${-w/2-2} ${minY-2} ${w+4} ${Math.max(9,maxY-minY+4)}" aria-hidden="true"><path d="${coords.map(([x,y],i)=>(i?'L':'M')+x+','+y).join('')}Z"/></svg>`;
}
