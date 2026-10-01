import * as T from 'three';

const raisedShapes=new Set(['dome','square','arch','round','shallow']);

// Cover coordinates are metres: X along the extrusion, Y above the seating
// line, Z across it. Raised optics emit through their exterior dome/walls;
// their interior, end section and retaining feet remain passive.
export function prepareCoverOptics(geometry,cover){
  const raised=raisedShapes.has(cover.shape),source=geometry.attributes;
  const names=Object.keys(source),parts=[[],[]],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
  if(!raised){
    // Flat covers and lenses keep their original vertices, UVs and material
    // boundary. Only the raised families need a split at the seating line.
    const count=geometry.index?.count??source.position.count;
    for(let i=0;i<count;i+=3){
      const indices=[0,1,2].map(j=>geometry.index?geometry.index.getX(i+j):i+j);
      a.fromBufferAttribute(source.position,indices[0]);b.fromBufferAttribute(source.position,indices[1]).sub(a);c.fromBufferAttribute(source.position,indices[2]).sub(a);b.cross(c).normalize();
      parts[b.y>.12?0:1].push(...indices);
    }
    geometry.setIndex(parts.flat());geometry.clearGroups();let start=0;
    parts.forEach((indices,materialIndex)=>{if(indices.length)geometry.addGroup(start,indices.length,materialIndex);start+=indices.length;});
    return geometry;
  }
  const vertex=index=>Object.fromEntries(names.map(name=>{
    const attr=source[name];return[name,Array.from({length:attr.itemSize},(_,j)=>attr.array[index*attr.itemSize+j])];
  }));
  const intersect=(v,w)=>{
    const t=v.position[1]/(v.position[1]-w.position[1]);
    const q=Object.fromEntries(names.map(name=>[name,v[name].map((value,j)=>T.MathUtils.lerp(value,w[name][j],t))]));
    q.position[1]=0;return q;
  };
  const clip=(polygon,above)=>{
    const result=[];
    for(let i=0;i<polygon.length;i++){
      const v=polygon[i],w=polygon[(i+1)%polygon.length],insideV=above?v.position[1]>=0:v.position[1]<=0,insideW=above?w.position[1]>=0:w.position[1]<=0;
      if(insideV)result.push(v);
      if(insideV!==insideW)result.push(intersect(v,w));
    }
    return result;
  };
  const append=triangle=>{
    a.fromArray(triangle[0].position);b.fromArray(triangle[1].position).sub(a);c.fromArray(triangle[2].position).sub(a);b.cross(c);
    if(b.lengthSq()<1e-24)return;
    b.normalize();
    const y=triangle.reduce((sum,v)=>sum+v.position[1],0)/3,z=triangle.reduce((sum,v)=>sum+v.position[2],0)/3;
    const optical=y>0&&Math.abs(b.x)<.7&&(b.y>.12||b.z*z>1e-9);
    parts[optical?0:1].push(...triangle);
  };
  const count=geometry.index?.count??source.position.count;
  for(let i=0;i<count;i+=3){
    const triangle=[0,1,2].map(j=>vertex(geometry.index?geometry.index.getX(i+j):i+j)),ys=triangle.map(v=>v.position[1]);
    if(Math.min(...ys)<0&&Math.max(...ys)>0){
      // A tall side can span both the exposed optic and the buried foot.
      // Split at the physical seating line before assigning its material.
      for(const above of[true,false]){const polygon=clip(triangle,above);for(let j=1;j<polygon.length-1;j++)append([polygon[0],polygon[j],polygon[j+1]]);}
    }else append(triangle);
  }
  const vertices=parts.flat();
  for(const name of names){const values=vertices.flatMap(v=>v[name]);geometry.setAttribute(name,new T.Float32BufferAttribute(values,source[name].itemSize));}
  geometry.setIndex(null);geometry.clearGroups();let start=0;
  parts.forEach((vertices,materialIndex)=>{if(vertices.length)geometry.addGroup(start,vertices.length,materialIndex);start+=vertices.length;});
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  return geometry;
}
