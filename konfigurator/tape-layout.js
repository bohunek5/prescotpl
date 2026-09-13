// Presentation layout in metres. S-shape follows type 23 in the PRESCOT
// Premium catalogue (p.19): contact islands, three LEDs per 50 mm and S bridges.
// Package positions and bridge radii are illustrative, not fabrication artwork.
export function tapeLayout(t,length){
  const pitch=1/t.density,count=Math.round(length*t.density),segments=Math.round(length/(t.cut/1000)),serpentine=t.shape==='s',width=t.width/1000;
  const leds=Array.from({length:count},(_,i)=>-length/2+(serpentine?.005+i*pitch:(i+.5)*length/count));
  const contacts=Array.from({length:segments+1},(_,i)=>Math.min(length/2-.00085,Math.max(-length/2+.00085,-length/2+i*t.cut/1000)));
  const resistors=serpentine?Array.from({length:segments},(_,i)=>leds[i*3+1]-.0031):leds.slice(0,-1).flatMap((x,i)=>t.type==='CCT'||i%4===0?[x+length/count/2]:[]);
  const intervals=[...leds.map(x=>[x-.0022,x+.0022]),...contacts.map(x=>[x-.00165,x+.00165]),...resistors.map(x=>[x-.0011,x+.0011])].sort((a,b)=>a[0]-b[0]),islands=[];
  for(const [a,b]of intervals){const last=islands.at(-1);if(last&&a-last[1]<.0013)last[1]=Math.max(last[1],b);else islands.push([a,b]);}
  function section(x){
    if(!serpentine)return{center:0,scale:1};
    let lo=0,hi=islands.length;while(lo<hi){const mid=(lo+hi)>>1;if(islands[mid][1]<x)lo=mid+1;else hi=mid;}
    const current=islands[lo],previous=islands[lo-1];if(!current||!previous||x>=current[0])return{center:0,scale:1};
    const f=(x-previous[1])/(current[0]-previous[1]),blend=Math.pow(Math.sin(Math.PI*f),.6);
    return{center:.00135*Math.sin(2*Math.PI*f)*blend,scale:1-(1-.0022/width)*blend};
  }
  return{leds,contacts,resistors,section,islands};
}
