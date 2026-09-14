import * as T from 'three';

// One continuous route from the selected strip's actual pad positions to the
// hidden supply run. All coordinates are local to the installed product.
export function buildInstallationCable(product,profile){
  const root=new T.Group();root.name='Przewod_od_pol_PCB';product.group.add(root);let key='';
  function clear(){for(const o of [...root.children]){o.geometry.dispose();o.material.dispose();root.remove(o);}}
  function update(state,tail,visible){
    root.visible=visible;if(!visible)return;
    product.wiring.visible=false;
    const pads=product.connectionPads(),signature=JSON.stringify([pads.map(p=>[p.label,...p.point]),tail.map(p=>p.toArray()),state.endcaps]);
    if(signature===key)return;key=signature;clear();
    const end=-product.length/2000,portY=profile.ledBase/1000+.0018,portZ=(profile.ledZ||0)/1000,connections=[];
    for(const [i,pad]of pads.entries()){
      const angle=i*2*Math.PI/pads.length,dy=pads.length===2?0:Math.cos(angle)*.0006,dz=pads.length===2?(i-.5)*.0008:Math.sin(angle)*.0006;
      const start=pad.point.clone(),solder=start.clone().add(new T.Vector3(-.0008,.00015,0));
      const port=new T.Vector3(end-.0008,portY+dy,portZ+dz);
      const points=[solder,new T.Vector3(end+.002,port.y,port.z),port,port.clone().add(new T.Vector3(-.003,0,0)),...tail.map(p=>p.clone().add(new T.Vector3(0,dy,dz)))];
      if(product.strip.technology==='WCOB'){
        const x=-product.stripLength/2000,h=product.ledBase+.0021;
        points.splice(1,1,new T.Vector3(x-.0009,h+dy,product.ledZ+dz),new T.Vector3(x-.0048,h+dy,product.ledZ+dz));
      }
      const tip=new T.Mesh(new T.TubeGeometry(new T.LineCurve3(start,solder),1,.0002,8,false),new T.MeshStandardMaterial({color:'#b8babb',metalness:.85,roughness:.28}));tip.name='Lut_'+pad.channel;
      const wire=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points,false,'centripetal'),48,.00032,8,false),new T.MeshStandardMaterial({color:pad.color,roughness:.52}));wire.name='Przewod_'+pad.channel;wire.castShadow=true;wire.userData={terminal:pad.label,polarity:pad.polarity,padIndex:pad.index};root.add(tip,wire);
      connections.push({terminal:pad.label,color:pad.color,start:start.toArray(),port:port.toArray(),end:points.at(-1).toArray()});
    }
    root.userData={connections,throughCap:!!state.endcaps};
  }
  return{root,update,dispose(){clear();root.removeFromParent();}};
}
