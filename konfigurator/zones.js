import {suspensionFor} from './suspension-data.js?v=130bc2896fcd';
import {buildStairZone} from './stair-zone.js?v=130bc2896fcd';
import {isStairZone} from './stair-layout.js?v=130bc2896fcd';
import {previewLight} from './light-state.js?v=20260922-refine1';
import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {buildProduct} from './product.js?v=20260922-refine1';
import {buildMount,seatingHeight} from './mounting.js?v=130bc2896fcd';
import {surfaceFinish} from './surface-finishes.js?v=130bc2896fcd';
import {buildInstallationCable} from './installation-wiring.js?v=130bc2896fcd';

export const zones=[
  {id:'ceiling',name:'Na suficie',subtitle:'Profil przy powierzchni',icon:'M2 6h28v5H2z M8 11v5h16v-5 M10 21l-3 6 M16 21v7 M22 21l3 6',description:'Profil pod sufitem, z widocznym stykiem z podłożem. Zbliż model, aby obejrzeć mocowanie i wyjście przewodu.'},
  {id:'suspended',name:'Na linkach',subtitle:'Oprawa podwieszona',icon:'M2 4h28 M8 4v16 M24 4v16 M5 20h22v5H5z M10 29h12',description:'Dwie stalowe linki i zawieszki przypisane do profilu. Zmień zwis, obróć oprawę i obejrzyj osobno przewód zasilający.'},
  {id:'stair-under',name:'Pod stopniem',subtitle:'Profil pod noskiem',icon:'M3 27h8V19h9V11h9V4 M12 22h6 M21 14h6',description:'Trzy stopnie z widocznym noskiem i frezem. Światło spod środkowego stopnia pada na podstopnicę i niższy stopień.'},
  {id:'stair-side',name:'Z boku schodów',subtitle:'Linia w bocznej zabudowie',icon:'M3 27h8V19h9V11h9V4 M4 5v16 M7 6v12',description:'Profil w bocznej zabudowie oświetla powierzchnie stopni. Zmień wysokość linii i porównaj cień przy podstopnicy.'},
  {id:'under',name:'Pod szafką',subtitle:'Światło pod dolnym wieńcem',icon:'M4 5h24v15H4z M4 12h24 M8 24h16',description:'Krótki odcinek pod szafką. Obejrzyj profil od spodu i przeprowadzenie przewodu do zabudowy.'},
  {id:'cabinet',name:'Za frontem',subtitle:'Otwierana szafka',icon:'M5 4h20v24H5z M5 4l12 4v24L5 28 M21 13v5',description:'Otwórz front, aby zobaczyć światło pod górną płytą i przewód poprowadzony przy korpusie.'},
  {id:'drawer',name:'Szuflada',subtitle:'Wysuwany moduł',icon:'M5 5h22v10H5z M3 17h22v12H3z M10 22h8 M25 17l4-7',description:'Profil pozostaje na korpusie. Szuflada wysuwa się pod nim, a przewód omija ruchome prowadnice.'},
  {id:'shelf',name:'Krawędź półki',subtitle:'Wpust i wyjście przewodu',icon:'M3 12h26v8H3z M6 20v4h20v-4 M12 12v5h8v-5',description:'Fragment półki z widoczną krawędzią. Obejrzyj osadzenie w płycie, koniec profilu i wyjście przewodu.'},
  {id:'plinth',name:'Przy cokole',subtitle:'Światło przy podłodze',icon:'M3 6h26v6H3z M7 12v15h18V12 M2 29h28 M9 17h14',description:'Krótki fragment podstawy mebla. Profil świeci na podłogę, a przewód przechodzi za cokół.'},
  {id:'drywall',name:'Regips',subtitle:'Przekrój zabudowy',icon:'M2 12h9V6h10v6h9 M2 17h11V9h6v8h11 M11 23h10',description:'Przekrój płyty, korpusu i krawędzi światła. Przejdź do montażu, aby zobaczyć kolejne warstwy.'}
];

export function buildZone(source,sourceSize,spec,state,{sourceCover,art,wood}){
  const root=new T.Group();root.name='Strefa_montazu_'+state.zone;
  const mats=[],geos=[];const material=options=>{const m=new T.MeshStandardMaterial(options);mats.push(m);return m;};
  const ivory=material({color:'#eae7df',roughness:.48}),edge=material({color:'#c7bdab',roughness:.7}),steel=material({color:'#aab0b4',metalness:.8,roughness:.24}),black=material({color:'#444441',roughness:.55});
  const add=(g,m,parent,x=0,y=0,z=0)=>{geos.push(g);const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
  const box=(parent,w,h,d,m,x=0,y=0,z=0,r=.0006)=>add(r?new RoundedBoxGeometry(w,h,d,3,Math.min(r,h*.2)):new T.BoxGeometry(w,h,d),m,parent,x,y,z);
  const product=buildProduct(source,sourceSize,spec,{...state,view:'zone',exploded:0},{length:300,art,sourceCover});root.add(product.group);
  const wire=new T.Group();wire.name='Ukryty_przewod_niskiego_napiecia';root.add(wire);
  let door=null,drawer=null,fixture=null,sensor=null,plunger=null,cableTail=[];
  const p=spec.profile,zone=state.zone,H=p.height/1000,seat=seatingHeight(p,state.mounting==='recessed');
  let focus,normal,stair=null;
  if(['ceiling','suspended'].includes(zone)){
    const ceilingY=.32, suspended=zone==='suspended',drop=suspended?state.suspensionDrop/1000:0;
    const slab=new T.Group();slab.name='Fragment_sufitu';root.add(slab);
    box(slab,.42,.018,.24,wood,0,ceilingY+.009,0,.0004).name='Wykonczenie_sufitu';
    box(slab,.42,.005,.24,edge,0,ceilingY+.0205).name='Przekroj_podloza';
    const fixtureY=ceilingY-drop-(suspended?0:seat);
    product.group.rotation.x=Math.PI;product.group.position.set(0,fixtureY,0);
    focus=new T.Vector3(0,fixtureY-H,0);normal=new T.Vector3(0,-1,0);
    if(suspended){
      const data=suspensionFor(p,state.finish);
      if(!data)throw new Error('Brak udokumentowanej zawieszki dla '+p.name);
      const hangerMat=material({color:state.finish==='black'?'#303438':state.finish==='white'?'#eeefed':'#bdc4ca',metalness:state.finish==='white'?.05:.8,roughness:.3});
      for(const x of[-.11,.11]){
        const h=data.height/1000,r=data.diameter/2000;
        const base=add(new T.CylinderGeometry(data.baseDiameter/2000,data.baseDiameter/2000,.0012,32),hangerMat,root,x,fixtureY+.0006);base.name=data.name+'_podstawa';
        const body=add(new T.CylinderGeometry(r,r,h-.0012,32),hangerMat,root,x,fixtureY+.0012+(h-.0012)/2);body.name=data.name;body.userData.ref=data.ref;
        const screw=add(new T.CylinderGeometry(.0013,.0013,.0015,6),steel,root,x,fixtureY+h*.7,r+.0005);screw.rotation.x=Math.PI/2;screw.name='Docisk_linki';
        const wireLength=drop-h-.009;
        const line=add(new T.CylinderGeometry(.0005,.0005,wireLength,12),steel,root,x,fixtureY+h+wireLength/2);line.name='Linka_FI_1';line.userData.ref=data.wireRef;
        const top=add(new T.CylinderGeometry(.0045,.0045,.009,28),hangerMat,root,x,ceilingY-.0045);top.name='Mocowanie_do_sufitu_do_doboru';
      }
      root.userData.suspension={ref:data.ref,source:data.source,dropMm:state.suspensionDrop,wireDiameterMm:1,ceilingFixing:'project-specific'};
      // Route beside the left steel suspension, with a small service bend
      // above the end cap and a consistent 3 mm clearance from the steel.
      const cableX=-.113,cableZ=.0025;
      cableTail=[new T.Vector3(-.158,fixtureY+.003,0),new T.Vector3(-.158,fixtureY+.016,cableZ),new T.Vector3(-.123,fixtureY+.019,cableZ),new T.Vector3(cableX,fixtureY+.028,cableZ),new T.Vector3(cableX,fixtureY+drop*.45,cableZ),new T.Vector3(cableX,ceilingY-.020,cableZ),new T.Vector3(cableX,ceilingY+.009,cableZ)];
      root.userData.suspension.cableRoute='beside-left-suspension';
      root.userData.suspension.cableClearanceMm=3;
    }else{
      fixture=buildMount(p,{...state,mounting:'surface'},wood);fixture.root.rotation.x=Math.PI;fixture.root.position.y=ceilingY;fixture.root.scale.x=3;root.add(fixture.root);
      // The slab is the visible substrate; this helper contributes the matching clips.
      fixture.root.children[0].visible=false;
      cableTail=[new T.Vector3(-.158,fixtureY,0),new T.Vector3(-.163,ceilingY+.01,0),new T.Vector3(-.17,ceilingY+.018,-.045)];
    }
    box(root,.48,.01,.35,ivory,0,Math.min(-.075,fixtureY-H-.18),.025).name='Powierzchnia_pod_oprawa';
  }else if(isStairZone(zone)){
    stair=buildStairZone({root,product,profile:p,state,box,wood,plaster:ivory,edge});cableTail=stair.cableTail;focus=new T.Vector3();normal=new T.Vector3();
  }else if(zone==='drywall'){
    fixture=buildMount(p,{...state,mounting:'recessed'},wood);fixture.root.scale.x=3.2;fixture.root.rotation.x=Math.PI;root.add(fixture.root);
    product.group.rotation.x=Math.PI;product.group.position.y=-seat;
    focus=new T.Vector3(0,-(seat+H),0);normal=new T.Vector3(0,-1,0);
  }else if(['shelf','plinth'].includes(zone)){
    const baseY=zone==='plinth'?.12:0,depth=.16,thickness=Math.max(.018,H+.005),z=zone==='plinth'?.045:state.zonePosition==='back'?-.045:.045;
    const panel=new T.Group();panel.name='Fragment_plyty_z_osadzeniem';root.add(panel);
    const recess=Math.max(0,-seat),gap=(p.bodyWidth+1)/1000;
    if(recess){
      box(panel,.38,thickness-recess,depth,wood,0,baseY+recess+(thickness-recess)/2);
      for(const [lo,hi]of[[-depth/2,z-gap/2],[z+gap/2,depth/2]])box(panel,.38,recess,hi-lo,wood,0,baseY+recess/2,(lo+hi)/2);
      for(const x of[-.171,.171])box(panel,.038,recess,gap,wood,x,baseY+recess/2,z);
    }else box(panel,.38,thickness,depth,wood,0,baseY+thickness/2);
    product.group.rotation.x=Math.PI;product.group.position.set(0,baseY-seat,z);focus=new T.Vector3(0,baseY-seat-H,z);normal=new T.Vector3(0,-1,0);
    if(zone==='plinth'){
      const floor=box(root,.43,.008,.25,ivory,0,-.004,.015);floor.name='Fragment_podlogi';
      const kick=box(root,.38,.116,.014,wood,0,.058,-.038);kick.name='Cokol_cofniety';
      for(const x of[-.135,.135])add(new T.CylinderGeometry(.009,.012,.10,24),black,root,x,.066,-.059);
    }
    cableTail=[new T.Vector3(-.158,baseY+.003,z),new T.Vector3(-.164,baseY+thickness+.004,z-.008),new T.Vector3(-.164,baseY+thickness+.005,-.068)];
    const grommet=add(new T.TorusGeometry(.0023,.0006,8,24),ivory,wire,-.159,baseY+.0003,z);grommet.rotation.x=Math.PI/2;grommet.name='Przelotka_pogladowa';
  }else{
    const cabinet=new T.Group();root.add(cabinet);cabinet.name='Fragment_korpusu';
    box(cabinet,.38,.016,.20,wood,0,.008);
    box(cabinet,.38,.016,.20,wood,0,.248);
    box(cabinet,.016,.224,.20,wood,-.182,.128);
    // The right side is cut away to expose the installation, not a room wall.
    box(cabinet,.006,.224,.20,ivory,.188,.128);
    cabinet.children.at(-1).visible=zone==='under';
    box(cabinet,.348,.224,.006,ivory,0,.128,-.097);
    const y=zone==='under'?0:zone==='drawer'?.1945:state.zonePosition==='shelf'?.133:.240,z=state.zonePosition==='back'?-.068:zone==='drawer'?.091:.074;
    if(zone==='cabinet'&&state.zonePosition==='shelf'){const shelf=box(cabinet,.348,.016,.180,wood,0,.141,.005);shelf.name='Polka_nad_profilem';}
    product.group.rotation.x=Math.PI;product.group.position.set(0,y-seat,z);focus=new T.Vector3(0,y-seat-H,z);normal=new T.Vector3(0,-1,0);
    if(zone==='under'){
      box(root,.42,.014,.32,ivory,0,-.125,.055).name='Fragment_blatu';
      box(root,.42,.112,.006,ivory,0,-.060,-.096).name='Powierzchnia_nad_blatem';
    }
    if(zone!=='drawer'){
      door=new T.Group();door.name='Front_z_zawiasem';door.position.set(-.188,.003,.105);root.add(door);
      box(door,.375,.25,.016,wood,.1875,.125,.008,.0011);
      const pull=box(door,.0025,.035,.0035,black,.355,.105,.019);pull.name='Uchwyt';
      for(const y of [.055,.195]){
        const hinge=box(cabinet,.020,.021,.009,steel,-.174,y,.080);hinge.name='Zawias';
        add(new T.CylinderGeometry(.006,.006,.018,20),steel,cabinet,-.174,y,.087);
      }
    }else{
      drawer=new T.Group();drawer.name='Szuflada_wysuwana';root.add(drawer);
      box(drawer,.332,.008,.176,wood,0,.036,.002);
      for(const sign of [-1,1])box(drawer,.010,.067,.176,ivory,sign*.164,.073,.002);
      box(drawer,.33,.067,.010,ivory,0,.073,-.082);
      // Close against the upper rail with a 2.5 mm reveal, covering the switch.
      box(drawer,.375,.189,.018,wood,0,.0975,.108,.0012);
      box(drawer,.082,.003,.004,steel,0,.165,.120);
      for(const sign of [-1,1]){
        box(cabinet,.005,.022,.16,steel,sign*.174,.049,-.005);
        box(drawer,.004,.014,.16,steel,sign*.173,.049,.022);
        box(drawer,.002,.003,.15,black,sign*.174,.047,.022);
      }
      box(cabinet,.38,.045,.020,wood,0,.217,.093);
    }
    sensor=new T.Group();sensor.name='Krancowka_pogladowa';root.add(sensor);sensor.position.set(-.16,zone==='drawer'?.177:.225,.091);
    box(sensor,.021,.011,.012,ivory);plunger=add(new T.CylinderGeometry(.002,.002,.006,12),black,sensor,0,0,.008);plunger.rotation.x=Math.PI/2;
    const sensorWire=new T.CatmullRomCurve3([new T.Vector3(-.01,0,-.005),new T.Vector3(-.009,-.003,-.04),new T.Vector3(-.009,-.008,-.176)]);add(new T.TubeGeometry(sensorWire,18,.0007,8,false),black,sensor);
    cableTail=[new T.Vector3(-.16,y+(zone==='under'?.004:-.006),z),new T.Vector3(-.169,y+(zone==='under'?.022:-.012),z-.006),new T.Vector3(-.169,y+(zone==='under'?.027:-.014),-.055),new T.Vector3(-.169,.075,-.083),new T.Vector3(-.13,.044,-.083)];
    // A modest cable channel along the static cabinet side.
    const conduit=box(wire,.006,.15,.005,ivory,-.167,.125,-.085);conduit.name='Maskownica_przewodu';
    for(const y of [.07,.15,.20])box(wire,.006,.002,.005,steel,-.167,y,-.081);
  }
  // Follow the actual lens face, including the 45-degree profiles. Shadowed
  // emitters let the cabinet and drawer stop the light at their real surfaces.
  if(zone==='plinth'&&p.ledAngle){product.group.rotation.y=Math.PI;cableTail.forEach(point=>point.x*=-1);}
  product.assemble(0);root.updateMatrixWorld(true);
  const lens=product.cover.children.find(o=>o.isMesh&&!o.name.startsWith('Poswiata_'));
  // Morph bounds include the raised ends; installed light starts at the
  // straight lens face, not at the envelope of its assembly animation.
  const lensBounds=new T.Box3().setFromBufferAttribute(lens.geometry.attributes.position);
  normal.set(0,1,0).applyQuaternion(product.cover.getWorldQuaternion(new T.Quaternion())).normalize();
  const lightFace=new T.Vector3(0,lensBounds.max.y+.00035,(lensBounds.min.z+lensBounds.max.z)/2);
  focus.copy(product.cover.localToWorld(lightFace.clone()));
  const emitterPositions=stair?Array.from({length:9},(_,i)=>(i-4)*.03):[-.105,0,.105];
  const lights=emitterPositions.map(x=>{
    const light=new T.SpotLight(0xffd4a3,0,.8,Math.min(Math.PI/3,(spec.cover.beamAngle||120)*Math.PI/360),.8,2);
    light.name='Swiatlo_strefy';light.position.copy(product.cover.localToWorld(lightFace.clone().add(new T.Vector3(x,0,0))));
    light.target.position.copy(light.position).addScaledVector(normal,.3);light.castShadow=true;
    light.shadow.mapSize.set(stair?256:512,stair?256:512);light.shadow.camera.near=.0005;light.shadow.camera.far=.8;light.shadow.bias=-.000005;light.shadow.normalBias=.00002;
    root.add(light,light.target);return light;
  });
  root.userData.lighting={type:'shadowed-strip',normal:normal.toArray(),origin:focus.toArray(),emitters:lights.length};
  // A small reflected contribution starts on an actual receiving surface.
  // This is a presentation approximation, not a calibrated radiosity solution.
  let bounce=null,bounceSurface=null;
  if(stair){
    const ray=normal.clone();if(zone==='stair-side')ray.y-=.65;ray.normalize();
    const hit=new T.Raycaster(focus,ray,.001,.65).intersectObjects(stair.receivers,false)[0];
    if(hit){
      const outward=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
      bounce=new T.SpotLight(0xffffff,0,.5,Math.PI*.46,1,2);bounce.name='Odbicie_od_stopnia';
      bounce.position.copy(hit.point).addScaledVector(outward,.003);bounce.target.position.copy(bounce.position).add(outward);
      bounce.castShadow=true;bounce.shadow.mapSize.set(256,256);bounce.shadow.camera.near=.001;bounce.shadow.camera.far=.5;bounce.shadow.bias=-.000005;bounce.shadow.normalBias=.00005;
      root.add(bounce,bounce.target);bounceSurface=hit.object.material;
      root.userData.lighting.bounce={surface:hit.object.name,point:hit.point.toArray(),normal:outward.toArray(),approximate:true};
    }
    // Keep the nearby atmospheric glow on the open side of the riser and floor.
    const planes=zone==='stair-under'?[new T.Plane(new T.Vector3(0,1,0),0),...(stair.layout.showRiser?[new T.Plane(new T.Vector3(0,0,1),-stair.layout.run/2-.001)]:[])]:[new T.Plane(new T.Vector3(-1,0,0),stair.layout.wallInner)];
    product.group.traverse(o=>{if(o.name.startsWith('Poswiata_przestrzenna_'))o.material.clippingPlanes=planes;});
  }
  const connection=cableTail.length?buildInstallationCable(product,p):null;
  let opening=state.zoneOpen?1:0,currentState=state,currentColor=new T.Color('#fff4df'),lastLight=null;
  function applyLight(){
    const output=previewLight({...currentState,view:'zone'},opening),on=output.on;
    for(const light of lights){light.color.copy(currentColor);light.visible=on;light.intensity=on?output.brightness/100*(.9/lights.length)*spec.cover.transmission*(spec.lumensPerMeter/1000):0;}
    if(bounce){const reflected=bounceSurface===wood?new T.Color(surfaceFinish(currentState.material).color):bounceSurface.color;bounce.color.copy(currentColor).multiply(reflected);bounce.visible=on;bounce.intensity=on?output.brightness/100*.012*spec.cover.transmission*(spec.lumensPerMeter/1000):0;}
    if(lastLight!==on){product.update({...currentState,view:'zone',exploded:0,light:on,dimmer:output.brightness},currentColor);lastLight=on;}
    if(sensor){sensor.visible=currentState.zoneTrigger==='door';plunger.position.z=.006+Math.min(1,opening*8)*.003;}
    root.userData.lightOn=on;root.userData.lightOutput=output;
  }
  function setOpening(value){opening=T.MathUtils.clamp(value,0,1);if(door)door.rotation.y=-(zone==='under'?.95:1.65)*opening;if(drawer)drawer.position.z=.137*opening;applyLight();root.updateMatrixWorld(true);}
  function update(s,color){
    currentState=s;currentColor=color;lastLight=null;product.update({...s,view:'zone',exploded:0},color);product.assemble(0);product.profile.visible=true;product.pcb.visible=s.stripEnabled!==false;product.cover.visible=true;
    wire.visible=s.showCable;const finish=surfaceFinish(s.material);ivory.color.set(finish.grain?'#eae7df':finish.color);
    setOpening(s.zoneOpen?1:0);
    if(fixture){fixture.update({...s,view:'installation',showCable:zone==='ceiling'?false:s.showCable},product);if(zone==='ceiling'){fixture.root.children[0].visible=false;product.group.rotation.x=Math.PI;product.group.position.set(0,.32-seat,0);}}
    if(zone==='drywall'){product.group.rotation.x=Math.PI;product.group.position.y=-seat;}
    if(connection){
      root.updateWorldMatrix(true,true);
      connection.update(s,cableTail.map(point=>product.group.worldToLocal(root.localToWorld(point.clone()))),s.showCable&&s.stripEnabled!==false);
      root.userData.connection=s.showCable?connection.root.userData:null;
    }else root.userData.connection=fixture?.root.userData.connection??null;
  }
  return{root,product,focus,normal,update,setOpening,get opening(){return opening;},get motion(){return door?'door':drawer?'drawer':null;},dispose(){connection?.dispose();product.dispose();fixture?.dispose();for(const light of lights)light.shadow.dispose();bounce?.shadow.dispose();stair?.geometries.forEach(g=>g.dispose());for(const g of geos)g.dispose();for(const m of mats)m.dispose();}};
}
