import {tracedContours} from './profile-contours.js?v=42bf92f1850c';
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
  // Match the model's cover plane: section X = -world Z, screen Y = H - world Y.
  const angle=(p.ledAngle||0)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
  const x=-(p.coverZ||0),y=H-(p.coverY??H),half=p.channel*.46;
  const reach=Math.min(14,Math.max(7,H*.65+W*.2)),spread=half+reach*.25;
  const beam=[[-half,0],[-spread,-reach],[spread,-reach],[half,0]];
  const bounds=[...points.map(([x,y])=>[x,H-y]),...beam.map(([u,v])=>[x+u*c+v*s,y-u*s+v*c])];
  const minX=Math.min(...bounds.map(p=>p[0]))-1.5,minY=Math.min(...bounds.map(p=>p[1]))-1.5;
  const width=Math.max(...bounds.map(p=>p[0]))-minX+1.5,height=Math.max(...bounds.map(p=>p[1]))-minY+1.5;
  const gradient=`profile-light-${p.id}`;
  return `<svg class="profile-section-icon" viewBox="${minX} ${minY} ${width} ${height}" aria-hidden="true">
    <defs><radialGradient id="${gradient}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="scale(${spread} ${reach})">
      <stop offset="0" stop-color="var(--profile-light)" stop-opacity=".55"/><stop offset=".35" stop-color="var(--profile-light)" stop-opacity=".24"/><stop offset=".7" stop-color="var(--profile-light)" stop-opacity=".06"/><stop offset="1" stop-color="var(--profile-light)" stop-opacity="0"/>
    </radialGradient></defs>
    <g transform="translate(${x} ${y}) rotate(${-p.ledAngle||0})"><path class="profile-section-glow" fill="url(#${gradient})" d="${beam.map(([x,y],i)=>(i?'L':'M')+x+','+y).join(' ')}Z"/></g>
    <path class="profile-section-body" d="${points.map(([x,y],i)=>(i?'L':'M')+x+','+(H-y)).join(' ')}Z"/>
    <path class="profile-section-emitter" transform="translate(${x} ${y}) rotate(${-p.ledAngle||0})" d="M${-half},0 H${half}"/>
  </svg>`;
}
