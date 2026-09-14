import {stripOutputScale} from './light-state.js?v=797082b8b9d7';
import {factorySilicone} from './strip-protection.js?v=797082b8b9d7';
import * as T from 'three';
import {rgbwChannels,colorCct} from './light-color.js?v=797082b8b9d7';
import {drawPcbBrand} from './brand-art.js?v=797082b8b9d7';
import {tapeLayout,pcbBrandPlacement} from './tape-layout.js?v=797082b8b9d7';
import {smdPackage} from './smd-package.js?v=797082b8b9d7';
import {tapeTerminals} from './tape-wiring.js?v=797082b8b9d7';
import {buildSilicone} from './silicone.js?v=797082b8b9d7';
import {glowMaterial} from './glow.js?v=797082b8b9d7';
import {phosphorMap} from './light-textures.js?v=797082b8b9d7';
import {buildReleaseLiner} from './release-liner.js?v=797082b8b9d7';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// The bend preserves arc length and LED pitch. Packages remain rigid and follow
// the local tangent; only the flexible laminate bends. Artwork is illustrative.
export function buildPCB(spec,state,{art=null,quality='detail'}={}){
  const {strip:t,stripLength}=spec,L=stripLength/1000,W=t.width/1000;
  const whiteCOB=t.technology==='WCOB',continuous=t.type==='COB'||whiteCOB,cct=t.type==='CCT',rgbw=t.type==='RGBW',wide=cct||rgbw,multi=t.type==='3IN1',serpentine=t.shape==='s',small=t.package==='2216',group=new T.Group();
  const layout=tapeLayout(t,L),boardAt=layout.section,overview=quality==='overview';
  group.name='PCB_detale';
  const materials=[],geometries=[],textures=[],ribbons=[],batches=[];
  const mat=(color,roughness=.5,extra={})=>{const m=new T.MeshStandardMaterial({color,roughness,...extra});materials.push(m);return m;};
  const body=mat('#fffefa',.35),gold=mat('#bd8851',.3,{metalness:.8}),silver=mat('#b4b8b6',.22,{metalness:.96}),black=mat('#242523',.44);
  const phosphor=phosphorMap();textures.push(phosphor);
  const warm=mat(whiteCOB?'#fafbf7':'#ecc44d',.38,{emissiveMap:phosphor,emissive:0xffbd65,emissiveIntensity:0}),cool=mat('#f1d67d',.38,{emissiveMap:phosphor,emissive:0xe4edff,emissiveIntensity:0});
  function geometry(w,h,d,r=.00006){const g=new RoundedBoxGeometry(w,h,d,overview?1:2,Math.min(r,h*.44,w*.2,d*.2));geometries.push(g);return g;}
  function instances(g,m,points,name){
    if(!points.length)return;
    const o=new T.InstancedMesh(g,m,points.length);o.name=name;o.castShadow=true;o.receiveShadow=true;group.add(o);batches.push({o,points});return o;
  }
  const surfaceTexture=art?new T.CanvasTexture(art):pcbTexture(t,state.print);
  surfaceTexture.colorSpace=T.SRGBColorSpace;surfaceTexture.wrapS=T.RepeatWrapping;
  surfaceTexture.repeat.set(stripLength/(art?state.repeat:t.cut),1);surfaceTexture.anisotropy=16;textures.push(surfaceTexture);
  function ribbon(width,thickness,y,material,name){
    const g=new T.BoxGeometry(L,thickness,width,Math.max(32,Math.ceil(L*(serpentine?(overview?1500:6000):(overview?200:1200)))),1,1);
    // Top UVs need physical X along the length, -Z across the tape.
    const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
    for(let i=0;i<p.count;i++)if(Math.abs(n.getY(i))>.5)uv.setXY(i,p.getX(i)/L+.5,.5-p.getZ(i)/width);
    if(serpentine)for(let i=0;i<p.count;i++){const q=boardAt(p.getX(i));p.setZ(i,q.center+p.getZ(i)*q.scale);}
    const original=p.array.slice();geometries.push(g);const o=new T.Mesh(g,material);o.name=name;o.castShadow=true;o.receiveShadow=true;group.add(o);ribbons.push({g,original,y});return o;
  }
  ribbon(W,.00008,.00004,mat('#d3bd88',.65),'Warstwa_kleju');
  ribbon(W,.00010,.00013,mat('#e6d4b3',.5),'Elastyczny_laminat');
  ribbon(W,.00008,.00022,mat('#ffffff',.57,{map:surfaceTexture,envMapIntensity:.45}),'PCB_z_nadrukiem');
  const count=layout.leds.length;
  const emitters=[],coldEmitters=[],resistors=[],resistorEnds=[],rgbMaterials={};
  if(rgbw)for(const [key,color]of Object.entries({R:'#ff0000',G:'#00ff00',B:'#0000ff'}))rgbMaterials[key]=mat('#171b20',.3,{emissive:color,emissiveMap:phosphor,emissiveIntensity:0,toneMapped:false});
  if(!continuous&&!art){
    const packageModel=smdPackage(t),points=layout.leds.map(x=>[x,0,0]);
    const roles={body,gold,silver,black,warm,cool,...rgbMaterials};
    for(const {g,role,name}of packageModel.parts){geometries.push(g);instances(g,roles[role],points,name);}
    for(const x of layout.leds){emitters.push([x,packageModel.emitterHeight,cct?-.00092:0]);if(cct)coldEmitters.push([x,packageModel.emitterHeight,.00092]);}
    group.userData.package=packageModel.dimensions;
    for(const x of layout.resistors){resistors.push([x,.00048,0]);resistorEnds.push([x-.00065,.00046,0],[x+.00065,.00046,0]);}
    instances(geometry(.00105,.00040,.00165),black,resistors,'Rezystory');
    instances(geometry(.0003,.00032,.00165),silver,resistorEnds,'Metalizacja_rezystorow');
  }else if(!art){
    // Distinct white encapsulant for WCOB, phosphor for ordinary COB.
    ribbon(W*(whiteCOB?.70:.53),whiteCOB?.00085:.00043,whiteCOB?.00069:.00047,warm,whiteCOB?'Biale_pasmo_WCOB':'Ciagle_pasmo_COB');
  }
  const halos=[];
  function addHalo(points,channel){
    const style=glowMaterial(!continuous);materials.push(style.material);textures.push(style.texture);
    style.material.side=T.FrontSide;
    let mesh;if(continuous){const g=new T.PlaneGeometry(L,W*2.5,Math.max(32,Math.ceil(L*200)),1);g.rotateX(-Math.PI/2);geometries.push(g);mesh=new T.Mesh(g,style.material);mesh.name='Poswiata_pasmo';group.add(mesh);ribbons.push({g,original:g.attributes.position.array.slice(),y:whiteCOB?(t.envelopeHeight??5)/1000+.00012:.0017});}
    else{const g=new T.PlaneGeometry(rgbw?.008:cct?.008:small?.0045:.006,rgbw?.008:cct?.008:small?.0045:.006);g.rotateX(-Math.PI/2);geometries.push(g);mesh=instances(g,style.material,points.map(([x,y,z])=>[x,y+.00022,z]),'Poswiata_'+channel);}
    if(mesh){mesh.castShadow=false;mesh.receiveShadow=false;mesh.visible=false;halos.push({mesh,style,channel});}
  }
  if(!art){if(rgbw)addHalo(layout.leds.map(x=>[x,.0016,0]),'RGBW');else{addHalo(emitters,'WW');if(cct&&!continuous)addHalo(coldEmitters,'CW');}}
  const terminals=tapeTerminals(t,state),pads=[],endPads=[],zs=terminals.map(p=>p.z);
  for(let i=0;i<=spec.segments;i++){
    const x=layout.contacts[i];
    for(const z of zs)(serpentine&&(i===0||i===spec.segments)?endPads:pads).push([x,.00029,z]);
  }
  if(!art){instances(geometry(serpentine?.0028:.00165,.000055,serpentine?.00185:terminals.length>=5?Math.min(.0012,(zs[1]-zs[0])*.7):(cct||multi)?.00140:W*.19,.000025),gold,pads,'Pola_miedziane');if(serpentine)instances(geometry(.0015,.000055,.00185,.000025),gold,endPads,'Pola_miedziane_koncowe');}
  const wireGroup=new T.Group();wireGroup.name='Przewody_podlaczenia';group.add(wireGroup);
  wireGroup.userData.terminals=terminals;
  const wireMeshes=[];
  terminals.filter(p=>p.connected).forEach(({z,color,channel,label,polarity,index})=>{
    const path=new T.CatmullRomCurve3([new T.Vector3(-.0012,.00055,z),new T.Vector3(-.004,.002,z),new T.Vector3(-.013,.004,z*1.6),new T.Vector3(-.023,.001,z*2)]);
    const g=new T.TubeGeometry(path,24,.00045,10,false);geometries.push(g);
    const wire=new T.Mesh(g,mat(color,.52));wire.name=channel;wire.userData={terminal:label,polarity,padIndex:index,padZ:z};wire.castShadow=true;wireGroup.add(wire);wireMeshes.push(wire);
    const tipPath=new T.LineCurve3(new T.Vector3(0,.00039,z),new T.Vector3(-.0012,.00055,z)),tipGeo=new T.TubeGeometry(tipPath,1,.00022,8,false);geometries.push(tipGeo);
    const tip=new T.Mesh(tipGeo,silver);tip.name='Koncowka_lutowana_'+channel;tip.userData={terminal:label,padIndex:index};wireGroup.add(tip);
  });
  const liner=buildReleaseLiner(L,W,boardAt,state.backing);group.add(liner.mesh);
  function peel(amount,exit=0,enabled=true){liner.update(amount,exit,enabled,lastPoint,[previousBend,previousLateral].join('|'));}

  const protectionSpec=spec.sleeve||factorySilicone(t),verticalPCB=spec.sleeve?.shape==='side',core=new T.Group();core.name='Podklad_PCB';core.add(...group.children);group.add(core);
  const protection=spec.sleeve||t.encapsulation?buildSilicone(t,spec.sleeve,L):null;if(protection)group.add(protection.root);
  let wireKey='';
  let currentState=state,currentColor=new T.Color('#fff4df'),previousBend=-1,previousLateral=-1,lastPoint=(x,y,z)=>new T.Vector3(x,y,z),lastCurvature=0;
  function bend(amount,lateral=0){
    if(verticalPCB&&['product','sleeve','seal'].includes(currentState.detail))amount=0;
    lateral=serpentine?lateral:0;if(amount===previousBend&&lateral===previousLateral)return;previousBend=amount;previousLateral=lateral;
    const curvature=amount/Math.max(.070,L*.7);
    const sideways=lateral/Math.max(.070,L*.9);
    const point=(x,y,z)=>{if(sideways){const a=x*sideways,r=1/sideways;return new T.Vector3((r-z)*Math.sin(a),y,r*(1-Math.cos(a))+z*Math.cos(a));}if(!curvature)return new T.Vector3(x,y,z);const a=x*curvature,r=1/curvature;return new T.Vector3((r-y)*Math.sin(a),r*(1-Math.cos(a))+y*Math.cos(a),z);};
    lastPoint=point;lastCurvature=curvature;
    for(const {g,original,y}of ribbons){const p=g.attributes.position;for(let i=0;i<p.count;i++){const v=point(original[i*3],original[i*3+1]+y,original[i*3+2]);p.setXYZ(i,v.x,v.y,v.z);}p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();}
    const transform=new T.Object3D();
    for(const {o,points}of batches){points.forEach(([x,y,z],i)=>{transform.position.copy(point(x,y,z));transform.rotation.set(0,-x*sideways,x*curvature);transform.updateMatrix();o.setMatrixAt(i,transform.matrix);});o.instanceMatrix.needsUpdate=true;o.computeBoundingSphere();}
    wireGroup.position.copy(point(-L/2+.00085,0,0));wireGroup.rotation.set(0,-(-L/2+.00085)*sideways,(-L/2+.00085)*curvature);
    protection?.update(currentState,point,curvature,currentColor);
    if(spec.sleeve||whiteCOB)routeSleeveWires(currentState,point,curvature);
    group.userData.bend=amount;group.userData.lateralBend=lateral;group.userData.shape=serpentine?'s-shape':'straight';group.userData.arcLengthMm=stripLength;group.userData.quality=quality;
  }
  function routeSleeveWires(s,point,curvature){
    const routed=whiteCOB?(s.view!=='macro'||['product','seal','sleeve','segment'].includes(s.detail)):['product','seal','sleeve'].includes(s.detail)&&s.view==='macro',sleeve=protectionSpec;
    if(!routed){if(wireGroup.parent!==core){core.add(wireGroup);wireGroup.position.copy(point(-L/2+.00085,0,0));wireGroup.rotation.set(0,0,(-L/2+.00085)*curvature);}if(wireKey){for(const [i,wire]of wireMeshes.entries()){const z=terminals.filter(t=>t.connected)[i].z,path=new T.CatmullRomCurve3([new T.Vector3(-.0012,.00055,z),new T.Vector3(-.004,.002,z),new T.Vector3(-.013,.004,z*1.6),new T.Vector3(-.023,.001,z*2)]),g=new T.TubeGeometry(path,24,.00045,10,false),old=wire.geometry,at=geometries.indexOf(old);geometries[at]=g;wire.geometry=g;old.dispose();}for(const tip of wireGroup.children.filter(o=>o.name.startsWith('Koncowka_lutowana_')))tip.visible=true;}wireKey='';return;}
    group.add(wireGroup);wireGroup.position.set(0,0,0);wireGroup.rotation.set(0,0,0);
    const key=[s.view,s.detail,s.sealClosed,curvature].join('|');if(key===wireKey)return;wireKey=key;
    const offset=verticalPCB?0:(sleeve.pcbLift??.8)/1000,H=sleeve.height/1000,holeY=sleeve.wireHeight!==undefined?sleeve.wireHeight/1000-offset:verticalPCB?H*.45:Math.min(H*.45,offset+.0013)-offset,gap=s.view==='macro'&&s.detail==='seal'&&!s.sealClosed?.010:0,capX=-L/2-gap;
    const connected=terminals.filter(t=>t.connected);
    for(const [i,wire]of wireMeshes.entries()){
      const terminal=connected[i],a=2*Math.PI*i/connected.length,dy=connected.length===2?0:Math.cos(a)*.00062,dz=connected.length===2?(i-.5)*.00078:Math.sin(a)*.00062;
      const y=verticalPCB?terminal.z+H*.45:.00055,z=verticalPCB?sleeve.width/2000-.0011-.00055:terminal.z;
      const points=[[-L/2+.00085,y,z],[-L/2-.002,holeY+dy,dz],[capX-.00085,holeY+dy,dz],[capX-.0048,holeY+dy,dz],[capX-.014,holeY+dy,dz*2]];
      const curve=new T.CatmullRomCurve3(points.map(v=>point(...v))),g=new T.TubeGeometry(curve,32,.00032,10,false),old=wire.geometry,at=geometries.indexOf(old);if(at>=0)geometries[at]=g;else geometries.push(g);wire.geometry=g;old.dispose();
    }
    for(const tip of wireGroup.children.filter(o=>o.name.startsWith('Koncowka_lutowana_')))tip.visible=false;
  }
  bend(0);
  return{group,bend,peel,liner:liner.mesh,wiring:wireGroup,
    connectionPads(){core.updateWorldMatrix(true,false);return terminals.filter(t=>t.connected).map(t=>({...t,point:core.localToWorld(lastPoint(layout.contacts[0],.0004,t.z))}));},
    update(s,color){
    const side=verticalPCB&&(s.view!=='macro'||['product','sleeve','seal'].includes(s.detail));core.rotation.x=side?-Math.PI/2:0;core.position.set(0,side?spec.sleeve.height*.45/1000:whiteCOB?.00008:0,side?spec.sleeve.width/2000-.0011:0);core.scale.z=whiteCOB?.975:1;core.userData.orientation=side?'vertical':'horizontal';
    currentState=s;currentColor=color;protection?.update(s,lastPoint,lastCurvature,color);if(spec.sleeve||whiteCOB)routeSleeveWires(s,lastPoint,lastCurvature);
    const level=s.light&&!s.compare?s.dimmer/100*stripOutputScale(t,s):0,mix=cct?T.MathUtils.clamp((s.cct-t.cctMin)/(t.cctMax-t.cctMin),0,1):0;
    warm.emissive.copy(rgbw?colorCct(t.cct):cct&&!continuous?colorCct(t.cctMin):color);cool.emissive.copy(colorCct(t.cctMax||6500));
    const strength=level*(s.lightStudy?13:7.5);
    const channels=rgbw?rgbwChannels(s):null;
    warm.emissiveIntensity=strength*(rgbw?channels.W:cct&&!continuous?1-mix:1);if(rgbw)for(const key of ['R','G','B'])rgbMaterials[key].emissiveIntensity=level*1.35*channels[key];cool.emissiveIntensity=strength*mix;
    for(const {mesh,style,channel}of halos){const fraction=rgbw?Math.max(...Object.values(channels)):cct&&!continuous?(channel==='CW'?mix:1-mix):1;mesh.visible=level>0&&!(protection&&!spec.sleeve?.clear&&t.encapsulation!=='tube'&&['product','sleeve','seal'].includes(s.detail));style.material.color.copy(rgbw?color:cct&&!continuous?(channel==='CW'?cool.emissive:warm.emissive):color);style.material.opacity=level*fraction*(rgbw?(s.lightStudy?1.25:.75):(s.lightStudy?1.65:.8));}
    group.userData.light={on:level>0,warm:warm.emissiveIntensity,cool:cool.emissiveIntensity,color:color.getHexString(),pointHalos:!continuous,ledCount:count,package:continuous?t.technology||t.type:t.package||(wide?'5050':'2835'),channels};
    wireGroup.visible=!art&&(whiteCOB&&s.view==='macro'&&['product','segment','seal'].includes(s.detail)&&s.sleeveCaps!==false||s.view==='macro'&&['wiring','seal'].includes(s.detail)||s.showCable&&s.view!=='macro'&&s.view!=='zone');
  },dispose(){liner.dispose();protection?.dispose();for(const m of materials)m.dispose();for(const g of geometries)g.dispose();for(const x of textures)x.dispose();}};
}

function pcbTexture(t,print){
  const c=document.createElement('canvas');c.width=2048;c.height=Math.round(2048*t.width/t.cut);
  const x=c.getContext('2d'),w=c.width,h=c.height;
  x.fillStyle='#fffef9';x.fillRect(0,0,w,h);
  if(t.shape==='s'){
    x.strokeStyle='#d2c7ab';x.lineWidth=Math.max(1,h*.018);
    for(const y of[h*.30,h*.70]){x.beginPath();x.moveTo(0,y);x.lineTo(w,y);x.stroke();}
    x.fillStyle='#42463e';x.textAlign='center';x.textBaseline='middle';
    const px=mm=>mm/t.cut*w;
    for(let i=0;i<3;i++){
      const at=px(5+i*1000/t.density);drawPcbBrand(x,at,h*.86,px(5.4));
      x.font=`${h*.078}px Arial`;x.fillText(i===1?t.ref:i===2&&print==='concept'?'CE  RoHS':'12V DC',at,h*.11,px(3.85));
    }
    x.font=`bold ${h*.06}px Arial`;for(const at of[px(1),w-px(1)]){x.fillText('+',at,h*.05);x.fillText('−',at,h*.95);}
    x.setLineDash([4,4]);x.strokeStyle='#676d63';x.lineWidth=1.2;x.beginPath();x.moveTo(1,0);x.lineTo(1,h);x.stroke();
    return new T.CanvasTexture(c);
  }
  x.strokeStyle='#ddd9c8';x.lineWidth=1.2;
  for(const y of [h*.11,h*.89,...(t.type==='RGBW'?[h*.28,h*.5,h*.72]:t.type==='CCT'?[h*.5]:t.type==='3IN1'?[h*.37,h*.63]:[])]){x.beginPath();x.moveTo(0,y);x.lineTo(w,y);x.stroke();}
  x.fillStyle='#292c29';x.textAlign='center';x.textBaseline='middle';
  const brand=pcbBrandPlacement(t);
  if(brand){
    x.save();x.translate((brand.x/t.cut+.5)*w,h/2);x.rotate(Math.PI/2);
    drawPcbBrand(x,0,0,brand.width/t.cut*w);x.restore();
  }else if(t.width>5)drawPcbBrand(x,w*.35,h*.84,Math.min(h*1.45,w*.28));
  x.font=`${h*.080}px Arial`;x.fillText(t.ref,w*.68,h*.14);
  x.font=`bold ${h*.084}px Arial`;x.fillText(`${t.voltage}V DC${t.copperOz?' · '+t.copperOz+' oz':''}`,w*.34,h*.14);
  const terminals=tapeTerminals(t);
  x.font=`bold ${h*.073}px Arial`;
  terminals.forEach(({label,z})=>{const y=h*(.5+z/(t.width/1000));x.fillText(label,w*.042,y);x.fillText(label,w*.958,y);});
  if(t.type==='RGBW'&&print!=='concept'){x.font=`${h*.08}px Arial`;x.fillText('RGB + W 3000K',w*.73,h*.87);}
  else if(t.type==='CCT'&&print!=='concept'){x.font=`${h*.085}px Arial`;x.fillText('CCT · WW / CW',w*.73,h*.87);}
  else if(t.type==='3IN1'&&print!=='concept'){x.font=`${h*.081}px Arial`;x.fillText('L 3W   M 6W   H 11W',w*.72,h*.87);}
  else{x.font=`${h*.085}px Arial`;x.fillText('✂',w*.021,h*.50);}
  if(print==='concept'){x.font=`${h*.087}px Arial`;x.fillText('CE   RoHS',w*.80,h*.87);}
  x.setLineDash([5,5]);x.strokeStyle='#6f7168';x.lineWidth=1.2;x.beginPath();x.moveTo(1,0);x.lineTo(1,h);x.stroke();
  return new T.CanvasTexture(c);
}
