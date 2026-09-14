import * as T from 'three';

// Millimetre-based illustrative sections. Rise and engagement are separate:
// a taller optical surface does not imply a wider LED channel.
export function coverSection(c){
  const w=c.width||14.2,lip=c.lipDepth??3.2,wall=c.wall??.65,r=c.rise??(c.shape==='round'?3.4:c.shape==='shallow'?1.1:.8),s=new T.Shape();
  if(c.shape==='dome'){
    s.moveTo(-w/2,-lip);s.lineTo(-w/2,r-w/2);s.absarc(0,r-w/2,w/2,Math.PI,0,true);s.lineTo(w/2,-lip);s.lineTo(w/2-wall,-lip);s.lineTo(w/2-wall,r-w/2);s.absarc(0,r-w/2,w/2-wall,0,Math.PI,false);s.lineTo(-w/2+wall,-lip);
  }else if(c.shape==='square'){
    s.moveTo(-w/2+.3,-lip);s.lineTo(-w/2+.3,0);s.lineTo(-w/2,0);s.lineTo(-w/2,r);s.lineTo(w/2,r);s.lineTo(w/2,0);s.lineTo(w/2-.3,0);s.lineTo(w/2-.3,-lip);s.lineTo(w/2-wall,-lip);s.lineTo(w/2-wall,r-wall);s.lineTo(-w/2+wall,r-wall);s.lineTo(-w/2+wall,-lip);
  }else if(c.shape==='lens'){
    s.moveTo(-w/2,-lip);s.lineTo(-w/2,r);s.lineTo(w/2,r);s.lineTo(w/2,-lip);s.lineTo(w/2-wall,-lip);s.lineTo(w/2-wall,r-wall);s.quadraticCurveTo(0,-1.4,-w/2+wall,r-wall);s.lineTo(-w/2+wall,-lip);
  }else if(['round','shallow','arch'].includes(c.shape)){
    s.moveTo(-w/2,-lip);s.lineTo(-w/2,0);s.quadraticCurveTo(0,r*2,w/2,0);s.lineTo(w/2,-lip);s.lineTo(w/2-wall,-lip);s.lineTo(w/2-wall,-.2);s.quadraticCurveTo(0,(r-wall)*2,-w/2+wall,-.2);s.lineTo(-w/2+wall,-lip);
  }else{
    const underside=r-(c.plateThickness??.8);
    s.moveTo(-w/2,-lip);s.lineTo(-w/2,r);s.lineTo(w/2,r);s.lineTo(w/2,-lip);s.lineTo(w/2-wall,-lip);s.lineTo(w/2-wall,underside);s.lineTo(-w/2+wall,underside);s.lineTo(-w/2+wall,-lip);
  }
  s.closePath();return s;
}
export function coverIcon(c){
  const points=coverSection(c).getPoints(36),coords=points.map(p=>[p.x,-p.y]),minY=Math.min(...coords.map(p=>p[1])),maxY=Math.max(...coords.map(p=>p[1])),w=c.width||14.2;
  const mode=c.id.includes('black')?'black':c.id.endsWith('-clear')||c.beamAngle?'clear':'opal';
  // Same scale for adjacent flat sections: the different width remains visible.
  const span=Math.max(19,w+3),height=Math.max(11,maxY-minY+4),top=(minY+maxY-height)/2;
  const shape=coords.map(([x,y],i)=>(i?'L':'M')+x+','+y).join('')+'Z';
  return `<svg class="cover-section-icon ${mode}" viewBox="${-span/2} ${top} ${span} ${height}" aria-hidden="true"><path class="cover-optic" d="${shape}"/><path class="cover-edge" d="${shape}"/><path class="cover-dimension" d="M${-w/2},${maxY+1.4}H${w/2}M${-w/2},${maxY+.9}v1M${w/2},${maxY+.9}v1"/></svg>`;
}
