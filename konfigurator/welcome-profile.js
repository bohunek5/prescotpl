// The traced MICRO-PLUS outline includes a retraced horizontal dimension edge.
// It has zero section area but extrusion gives it a false roof over the PCB.
// Clean the presentation copy; the configurator catalogue/state stays intact.
export function welcomeProfile(profile){
 return{...profile,section:profile.section?.map(loop=>({...loop,points:loop.points.filter((b,i,points)=>{
  const a=points[(i+points.length-1)%points.length],c=points[(i+1)%points.length];
  return Math.abs((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]))>1e-8;
 }).map(point=>[...point])}))};
}
