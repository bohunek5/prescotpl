import * as T from 'three';
// Intersect the extrusion at X=0, stitch the contour, fill its material section.
export function sectionGeometry(input,offsetY=0){
  const geometries=Array.isArray(input)?input:[input],segments=[],epsilon=1e-7;
  for(const g of geometries){const a=g.getAttribute('position'),index=g.index,count=index?index.count:a.count;
    for(let i=0;i<count;i+=3){const v=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(a,index?index.getX(i+j):i+j)),hits=[];
      for(let j=0;j<3;j++){const p=v[j],q=v[(j+1)%3];if((p.x<=0&&q.x>0)||(p.x>0&&q.x<=0)){const t=-p.x/(q.x-p.x),hit=p.clone().lerp(q,t);if(!hits.some(h=>h.distanceTo(hit)<epsilon))hits.push(hit);}}
      if(hits.length===2&&hits[0].distanceTo(hits[1])>epsilon)segments.push(hits.map(p=>new T.Vector2(-p.z,p.y+offsetY)));
    }
  }
  const key=p=>Math.round(p.x/epsilon)+','+Math.round(p.y/epsilon),nodes=new Map(),edges=[];
  for(const [a,b]of segments){const ka=key(a),kb=key(b);if(ka===kb)continue;for(const [k,p]of [[ka,a],[kb,b]])if(!nodes.has(k))nodes.set(k,{p,edges:[]});const id=edges.length;edges.push({a:ka,b:kb,used:false});nodes.get(ka).edges.push(id);nodes.get(kb).edges.push(id);}
  const loops=[];
  for(const first of edges){if(first.used)continue;const loop=[],start=first.a;let current=start,edge=first;
    for(let safety=0;safety<=edges.length;safety++){edge.used=true;loop.push(nodes.get(current).p);current=edge.a===current?edge.b:edge.a;if(current===start){if(loop.length>=3)loops.push(loop);break;}const next=nodes.get(current).edges.map(i=>edges[i]).find(e=>!e.used);if(!next)break;edge=next;}
  }
  // Nested closed contours are holes; disconnected pieces are separate shapes.
  const contains=(point,loop)=>{let inside=false;for(let i=0,j=loop.length-1;i<loop.length;j=i++){const a=loop[i],b=loop[j];if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;};
  const shapes=[];const outer=loops.filter(l=>!loops.some(o=>o!==l&&contains(l[0],o)));
  for(const loop of outer){const shape=new T.Shape(loop);for(const hole of loops)if(hole!==loop&&contains(hole[0],loop))shape.holes.push(new T.Path(hole));shapes.push(shape);}
  const result=new T.ShapeGeometry(shapes);result.userData.contours=loops.length;
  if(Array.isArray(input))for(const g of input)g.dispose();return result;
}
