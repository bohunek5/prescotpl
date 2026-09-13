import * as T from 'three';
import {buildAccessories} from './accessories.js?v=cef4f759d5e8';
import {accessoryKit} from './accessory-data.js?v=cef4f759d5e8';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export function seatingHeight(p,recessed){
  if(!recessed)return .0008;
  return -(p.seatDepth??(p.id==='microk'?4.9:p.id==='larko'?22.8:p.id==='kozus'?15:p.height-1))/1000;
}
export function mountingSteps(p,recessed){
  if(p.id==='kozus')return[
    ['Przepust na przewód','Przygotuj wyjście przewodu w profilu i otwór w zabudowie. Ten wariant KOZUS jest przeznaczony do płyty 16 mm.'],
    ['Taśma i wkładka ochronna','Wklej taśmę, wyprowadź przewód i włóż TECH-22. Wkładka chroni kanał i utrzymuje jego szerokość podczas prac.'],
    ['Wklejenie profilu','Osadź profil z wkładką ochronną, używając kleju montażowego. Rozprowadzenie kleju przedstawiono poglądowo.'],
    ['Szpachlowanie i malowanie','Wykończ skrzydełka profilu razem z płytą. Wkładka TECH-22 pozostaje w kanale na czas szpachlowania i malowania.'],
    ['Gotowa linia światła','Odetnij warstwę wykończenia przy krawędzi wkładki, wyjmij ją i osadź docelową przesłonę.']
  ];
  if(p.id==='larko')return[
    ['Miejsce pod wpust','Przygotuj otwór i przestrzeń za płytą na korpus oraz sprężyny. Wymiary wycięcia ustala dokumentacja montażu.'],
    ['Zestaw w profilu','Wklej taśmę, osadź przesłonę i zakończenia. Przewód pozostaje dostępny do podłączenia.'],
    ['Sprężyny montażowe','Wsuń dedykowane sprężyny w kanały profilu. Pokazujemy zasadę ich osadzenia.'],
    ['Przewód za płytą','Przygotuj połączenie po stronie niskiego napięcia i dostęp do zasilania. Nie zamykaj połączenia wymagającego serwisu.'],
    ['Osadzenie we wpuście','Ugnij sprężyny i osadź profil. Kołnierz wykańcza krawędź otworu.']
  ];
  if(recessed)return[
    ['Frez w przekroju','Przekrój pokazuje zagłębienie pod korpus. Szerokość, głębokość i luz wykonawczy dobierz do konkretnej płyty i profilu.'],
    ['Przymiarka profilu','Sprawdź głębokość i wykończenie krawędzi. W modelu pozostawiono poglądowy luz — nie jest to wymiar frezu.'],
    ['Wklejenie taśmy','Odsłoń warstwę kleju, ułóż PCB w oczyszczonym kanale i dociśnij podkład, omijając diody i elementy elektroniczne.'],
    ['Ukrycie przewodu','Zaplanuj wyjście przy końcu profilu oraz trasę w zabudowie. Średnicę przepustu dobierz do przewodu i ochrony krawędzi.'],
    ['Osadzenie przesłony','Zamknij kanał dobraną osłoną. Sprawdź linię światła i styk profilu z powierzchnią.']
  ];
  if(['piko','tami','tost','pac','stos'].includes(p.id))return[
    ['Przygotowanie powierzchni','Przymierz odcinek i przygotuj podłoże pod mocowanie klejone.'],
    ['Taśma, osłona i zakończenia','Złóż oprawę i wyprowadź przewód. Dobierz taśmę montażową lub klej do powierzchni i instrukcji profilu.'],
    ['Taśma montażowa pod profilem','Nałóż taśmę dwustronną na spód aluminium. Jest to osobna warstwa mocująca profil do podłoża.'],
    ['Przewód poza frontem','Poprowadź przewód w zabudowie, z dala od zawiasów i prowadnic.'],
    ['Dociśnięcie zestawu','Przyklej złożony profil do przygotowanego podłoża. Dobierz system klejący do powierzchni.']
  ];
  return[
    ['Przygotowanie mocowania','Wyznacz miejsca pod mocowniki. Otwory i wkręty dobierz do podłoża oraz wybranych akcesoriów.'],
    ['Mocowniki i wkręty','Przykręć dedykowane mocowniki do podłoża. Wkręty znajdują się pod profilem; nie przebijają taśmy LED.'],
    ['Wklejenie taśmy','Zdejmij papier zabezpieczający klej. Ułóż PCB w kanale i dociśnij podkład, omijając diody.'],
    ['Wyjście przewodu','Przygotuj przepust z ochroną krawędzi, wyprowadź przewód i osadź przesłonę oraz zakończenia.'],
    ['Zatrzaśnięcie oprawy','Wciśnij złożony profil w mocowniki. Sprawdź osadzenie i dostęp do połączenia.']
  ];
}

// A short mounting specimen, with no implied tooling dimensions.
export function buildMount(p,state,wood){
  const root=new T.Group();root.name='Probka_podloza';
  const parts=new T.Group(),fixings=new T.Group(),cable=new T.Group(),finish=new T.Group();root.add(parts,fixings,cable,finish);
  const mats=[],geos=[];const material=options=>{const m=new T.MeshStandardMaterial(options);mats.push(m);return m;};
  const steel=material({color:'#b7bcc0',metalness:.83,roughness:.25}),dark=material({color:'#383a39',roughness:.6}),paper=material({color:'#dbca9f',roughness:.7}),plaster=material({color:'#efece5',roughness:.88}),gypsum=material({color:'#d5d0c5',roughness:1});
  const add=(g,m,parent,x=0,y=0,z=0)=>{geos.push(g);const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
  const box=(parent,w,h,d,m,x=0,y=0,z=0,round=.00018)=>add(new RoundedBoxGeometry(w,h,d,2,Math.min(round,h*.2)),m,parent,x,y,z);
  const recessed=state.mounting==='recessed',dry=p.id==='kozus',H=p.height/1000,W=p.bodyWidth/1000,depth=dry?.016:Math.max(.018,H+.007),span=Math.max(.064,p.width/1000+.030),gap=W+.001,seat=seatingHeight(p,recessed);
  if(recessed){
    for(const sign of [-1,1])box(parts,.100,depth,(span-gap)/2,dry?gypsum:wood,0,-depth/2,sign*(gap/2+(span-gap)/4));
    if(!dry&&p.id!=='larko')box(parts,.1,depth+seat,gap,wood,0,(-depth+seat)/2);
  }else box(parts,.100,depth,span,wood,0,-depth/2);
  const mountedAccessories=!recessed&&accessoryKit(p,state).some(a=>a.kind==='bracket')?buildAccessories(p,{...state,endcaps:false,showFixings:true,view:'assembly',exploded:0},.1):null;
  if(mountedAccessories){mountedAccessories.root.position.y=.0007;fixings.add(mountedAccessories.root);}
  const pilot=new T.Group();root.add(pilot);
  if(!recessed&&!['piko','tami','tost','pac','stos'].includes(p.id))for(const x of [-.034,.034]){
    add(new T.CircleGeometry(.0013,20),dark,pilot,x,.00008,0).rotation.x=-Math.PI/2;
    const bracket=new T.Group();fixings.add(bracket);
    if(!mountedAccessories)box(bracket,.009,.00065,W+.0014,steel,x,.000325);
    if(!mountedAccessories)for(const sign of [-1,1]){box(bracket,.009,.0032,.0005,steel,x,.0017,sign*(W/2+.00045));box(bracket,.009,.0005,.0013,steel,x,.003,sign*(W/2));}
    const screw=new T.Group();screw.name='Wkret_mocownika';bracket.add(screw);
    add(new T.CylinderGeometry(.00115,.0008,.007,16),steel,screw,x,-.0025);
    add(new T.CylinderGeometry(.0024,.00115,.0013,24),steel,screw,x,.0011);
    for(const angle of [0,Math.PI/2]){const slot=box(screw,.0028,.00012,.0005,dark,x,.00177);slot.rotation.y=angle;}
  }
  if(['piko','tami','tost','pac','stos'].includes(p.id))box(fixings,.085,.0004,Math.min(.010,W*.65),paper,0,.0002);
  if(p.id==='larko')for(const x of [-.029,.029])for(const sign of [-1,1]){
    const points=[[x,seat+.003,sign*(W/2)],[x,seat+.010,sign*(W/2+.007)],[x,seat+.022,sign*(W/2+.013)]];
    const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));add(new T.TubeGeometry(curve,16,.00065,6,false),steel,fixings);
  }
  if(dry)for(const sign of [-1,1])box(fixings,.091,.00045,.014,paper,0,-.0001,sign*.024);
  const shield=box(root,.1,.001,.0217,material({color:'#547d80',roughness:.45}),0,seat+H-.00025);shield.name='Wkladka_ochronna_TECH_22';
  if(dry)for(const sign of [-1,1])box(finish,.1,.0025,(span-.022)/2,plaster,0,.00125,sign*(.011+(span-.022)/4));
  const route=new T.CatmullRomCurve3([new T.Vector3(-.048,seat+.0015,0),new T.Vector3(-.051,seat+.002,0),new T.Vector3(-.053,-.009,0),new T.Vector3(-.053,-.015,-span*.33),new T.Vector3(-.035,-.015,-span*.4)]);
  add(new T.TubeGeometry(route,36,.0011,10,false),dark,cable);cable.name='Trasa_przewodu';
  function update(s,sample){
    const walk=s.view==='mounting',step=s.mountStep;
    fixings.traverse(o=>{if(o.name==='Wkret_mocownika')o.position.y=walk&&step===1?.009:0;});
    pilot.visible=walk&&step===0;fixings.visible=!walk||step>=1;shield.visible=dry&&walk&&step>=1&&step<4;finish.visible=dry&&(!walk||step>=3);cable.visible=walk&&step>=3||!walk&&s.showCable;
    if(dry)cable.visible=walk&&step>=1;
    sample.group.position.y=seat;sample.profile.visible=true;sample.pcb.visible=true;sample.cover.visible=true;sample.group.visible=true;
    if(walk){
      if(dry){sample.assemble(step===0?100:0);sample.group.position.y=step<2?seat+.018:seat;sample.cover.visible=step===4;sample.pcb.visible=step>0;shield.position.y=sample.group.position.y+H-.00025;}
      else if(['piko','tami','tost','pac','stos','larko'].includes(p.id)){sample.group.visible=step>0;sample.assemble(step===1?100:0);sample.group.position.y=seat+(step>0&&step<4?.012:0);}
      else{sample.group.visible=step>=2;sample.assemble(step===2?100:step===3?50:0);sample.group.position.y=seat+(step>=2&&step<4?.011:0);}
    }
  }
  return{root,seat,span,depth,update,dispose(){mountedAccessories?.dispose();for(const g of geos)g.dispose();for(const m of mats)m.dispose();}};
}
