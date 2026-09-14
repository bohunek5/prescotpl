export const surfaceFinishes=[
  {id:'white',name:'Biały',color:'#efeeeb'},
  {id:'black',name:'Czarny',color:'#282a2c'},
  {id:'graphite',name:'Szary',color:'#858787'},
  {id:'sand',name:'Ecru',color:'#ddd3bf'},
  {id:'oak',name:'Dąb naturalny',color:'#c3a27a',grain:'oak',seed:912},
  {id:'oak-white',name:'Dąb bielony',color:'#d9d0bd',grain:'oak',seed:314},
  {id:'walnut',name:'Orzech',color:'#806047',grain:'walnut',seed:726},
  {id:'ash',name:'Jesion',color:'#d6bd98',grain:'ash',seed:483}
];
export const surfaceFinish=id=>surfaceFinishes.find(f=>f.id===id)||surfaceFinishes[0];

// Procedural grain is shared by the model and swatches; it describes a finish,
// not a branded furniture-board reference. Four independent patterns are cached.
export function surfaceCanvas(finish){
  const c=document.createElement('canvas');c.width=512;c.height=512;
  const ctx=c.getContext('2d');ctx.fillStyle=finish.color;ctx.fillRect(0,0,512,512);
  if(!finish.grain)return c;
  let seed=finish.seed;const random=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
  const dark=finish.grain==='walnut'?'43,26,18':'84,58,30';
  const centre=130+random()*250,spread=finish.grain==='ash'?145:100;
  for(let i=0;i<440;i++){
    const y=random()*512,phase=random()*6.28,bend=finish.grain==='walnut'?15:7;
    ctx.strokeStyle=`rgba(${dark},${.03+random()*.11})`;ctx.lineWidth=.2+random()*.7;ctx.beginPath();
    for(let x=0;x<=512;x+=4){const arch=Math.exp(-(((x-centre)/spread)**2))*Math.sin(y*.014+phase)*bend;const yy=y+arch+Math.sin(x*.012+phase)*1.8;x?ctx.lineTo(x,yy):ctx.moveTo(x,yy);}ctx.stroke();
  }
  // Wider growth rings give the light ash and walnut their own structure.
  const count=finish.grain==='ash'?18:finish.grain==='walnut'?13:9;
  for(let i=0;i<count;i++){
    const y=20+i*512/count;ctx.strokeStyle=`rgba(${dark},${finish.grain==='walnut'?.18:.11})`;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,y);
    ctx.bezierCurveTo(145,y-24,centre,y-54,512,y+12);ctx.stroke();
  }
  return c;
}
