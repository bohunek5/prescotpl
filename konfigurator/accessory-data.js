import {salesRegistry} from './profile-library.js?v=c3acda4e66c0';
// Matching references from KLUŚ product cards and the supplied 2026 workbook.
// Quantities of fixings depend on support spacing; never infer them from length.
const ends={micro:['MICRO-PLUS','C24392C02','C24392C07','C24392C10'],pds:['PDS-4-PLUS','C24337C02','C24337C07','C24337C10'],microk:['MICRO-K','C20126C02'],piko:['PIKO','C24202C02','C24202C07'],larko:['LARKO','C24006C02',null,'C24006C10'],kozus:['KOZUS','C24148C02'],pdszm:['PDS-ZM-PLUS','C24364C02','C24364C07','C24364C10'],alu45:['45-ALU','C20124C02','C20124C07','C20124C10'],pikozm:['PIKO-ZM','C24307C02','C24307C07','C24307C10'],pikoo:['PIKO-O','C24321C02','C24321C07','C24321C10'],giza:['GIZA','C24539C02','C24539C07','C24539C10'],lipod:['LIPOD','C24004C02','C24004C07','C24004C10']};
Object.assign(ends,{microh:['MICRO-H','C24261C02'],pdsh:['PDS-H','C24145C02'],siler:['SILER','C24236C02','C24236C07','C24236C10'],micronk:['MICRO-NK','C24346C02','C24346C07','C24346C10'],pdsnk:['PDS-NK','C24338C02','C24338C07','C24338C10'],plus45:['45-PLUS','C20007C02','C20007C07','C20007C10'],alu4516:['45-16','C24206C02'],tami:['TAMI EKO','C20051C10'],tako:['TAKO EKO','C20053C10'],tost:['TOST EKO','C20054C10'],pac:['PAC-ALU','C20107C02'],stos:['STOS-ALU','C20108C02']});
Object.assign(ends,{pdst:ends.pdszm,pdsust:ends.pdszm,pdszmg:['PDS-G','C24330C02','C24320C07']});
const entryProfiles=new Set(['micro','pds','piko','pikozm','pikoo','micronk','pdsnk','plus45']);
const brackets={micro:['PDS-STN','C24190N00'],pds:['PDS-STN','C24190N00'],alu45:['45-STN','C24144N00'],pdszm:['DS','C28096N00'],pikozm:['K-10','C24340C00'],pikoo:['PLD-10','C24375C00'],giza:['GIP-STN','C24447N00'],lipod:['GIP-STN','C24447N00']};
Object.assign(brackets,{microh:['PDS-H','C24214C02'],pdsh:['PDS-H','C24214C02'],alu4516:['PDS-STN','C24190N00'],plus45:['45-STN','C24144N00'],siler:['45-STN','C24144N00']});
function legacyAccessoryKit(p,state){
  const e=ends[p.id],b=brackets[p.id],result=[];
  if(e)result.push({id:'endcap',name:'Zaślepka '+e[0],ref:e[{silver:1,black:2,white:3}[state.finish]]||e[1],kind:'endcap',quantity:2,selected:state.endcaps,source:['micro','pds','microk','piko','larko','kozus'].includes(p.id)?'assets/sources/cap-'+p.id+'.pdf':p.source,note:'Dwie końcówki prostego odcinka. Przepust dobierz osobno.'});
  if(e&&state.endcaps&&state.showCable&&entryProfiles.has(p.id)){result[0].quantity=1;result.push({...result[0],id:'entrycap',kind:'entrycap',name:'Zaślepka '+e[0]+'-OTW',ref:result[0].ref+'TW',quantity:1,selected:true,note:'Wariant z otworem na przewód. Kształt przepustu pokazano poglądowo.'});}
  if(b)result.push({id:'bracket',name:'Mocownik '+b[0],ref:b[1],kind:'bracket',quantity:null,selected:state.showFixings,source:p.source,note:'Liczbę i rozstaw dobierz do długości, obciążenia i podłoża.'});
  if(['pdszm','pikozm','giza','lipod'].includes(p.id))result.push({id:'connector',name:'Łącznik ZM-MINI',ref:'C28083N00',kind:'connector',quantity:null,selected:false,source:p.source,note:'Do połączeń profili. Niepotrzebny przy jednym odcinku.'});
  if(p.id==='kozus')result.push({id:'protection',name:'Wkładka TECH-22',ref:'C24531C02',kind:'protection',quantity:null,selected:true,source:'assets/sources/tech-22.pdf',note:'Ochrona kanału podczas szpachlowania; usuwana po wykończeniu.'});
  if(p.screwDrywall)result.push({id:'protection',name:'Wkładka ochronna TECH-11',ref:'C24574C02',kind:'protection',quantity:null,selected:true,source:p.source,note:'Wkładka ochronna z aktualnej karty KLUŚ; chroni kanał na czas szpachlowania i malowania.'});
  return result;
}

export function accessoryOptions(p){return salesRegistry[p.ref]?.accessories||[];}
export function accessoryCapOptions(p){return accessoryOptions(p).filter(a=>ordinaryCap(a)&&(!p.capFamilies||p.capFamilies.includes(a.ref.slice(0,6))));}
const ordinaryCap=a=>a.kind==='endcap'&&!/NHQ|\bHQ\b|MW|ZAM|ALU|DUO-LIN|DUO-PRET/.test(a.name);
function matchingFinish(a,finish){
  if(finish==='black')return /(?:C|L)07(?:TW)?$/.test(a.ref);
  if(finish==='white')return /(?:C|L)10(?:TW)?$/.test(a.ref);
  return /(?:C02|L01)(?:TW)?$/.test(a.ref);
}
export function accessoryKit(p,state){
  const options=accessoryOptions(p);
  const legacy=legacyAccessoryKit(p,state);
  const caps=accessoryCapOptions(p).filter(a=>!p.capPair||a.ref.startsWith(p.capPair[0])).sort((a,b)=>a.name.length-b.name.length||a.ref.localeCompare(b.ref));
  const cap=caps.find(a=>a.ref===state.endcapRef)||caps.find(a=>a.ref===legacy.find(x=>x.kind==='endcap')?.ref)||caps.find(a=>matchingFinish(a,state.finish))||caps[0];
  const brackets=options.filter(a=>a.kind==='bracket');
  const bracket=brackets.find(a=>a.ref===state.bracketRef)||brackets.find(a=>a.ref===legacy.find(x=>x.kind==='bracket')?.ref)||brackets.find(a=>/PDS-H|GIP-STN$|PDS-STN$|Mocownik DS$/.test(a.name))||brackets[0];
  const result=[];
  const used=new Set();
  if(cap){
    const opposite=p.capPair?options.find(a=>a.ref===p.capPair[1]+cap.ref.slice(6))||options.find(a=>a.ref.startsWith(p.capPair[1])):null;
    // An OTW is used only when the exact row exists in both the matching card
    // and the price list. No synthetic SKU is ever added to the bill of materials.
    const entry=state.showCable?options.find(a=>a.kind==='entrycap'&&a.ref===cap.ref+'TW'):null;
    result.push({...cap,id:'endcap',quantity:entry||opposite?1:2,selected:!!state.endcaps,note:cap.dimensions?.width?'Gabaryt zaślepki według karty KLUŚ. Kształt i zatrzaski w podglądzie są uproszczone.':'Zakończenia prostego odcinka. Geometria zaślepki wymaga potwierdzenia w karcie.'});used.add(cap.ref);
    if(opposite){result.push({...opposite,id:'endcap-pair',kind:'endcap-pair',quantity:1,selected:!!state.endcaps,note:'Druga strona odcinka: dedykowana para lewa / prawa.'});used.add(opposite.ref);}
    if(entry&&state.endcaps){result.push({...entry,id:'entrycap',quantity:1,selected:true,note:'Wariant z otworem zastępuje jedną pełną zaślepkę.'});used.add(entry.ref);}
  }
  if(bracket){result.push({...bracket,id:'bracket',quantity:null,selected:!!state.showFixings,note:p.section&&p.id!=='micro'?'Mocownik w zestawieniu. Sposób montażu, ilość i rozstaw według instrukcji KLUŚ.':'Ilość i rozstaw według instrukcji, obciążenia i podłoża. Detale modelu są poglądowe.'});used.add(bracket.ref);}
  for(const a of options){
    if(used.has(a.ref)||a.kind==='bracket'||a.kind==='entrycap'||a.kind==='endcap'&&accessoryCapOptions(p).some(c=>c.ref===a.ref))continue;
    const previous=legacy.find(x=>x.ref===a.ref);
    result.push({...a,id:a.ref,kind:a.kind==='endcap'?'closure':a.kind,quantity:null,selected:!state.excludedAccessoryRefs?.includes(a.ref)&&(state.accessoryRefs?.includes(a.ref)||!!previous?.selected),note:previous?.note||'Akcesorium przypisane w karcie KLUŚ. Ilość i wariant montażu wymagają doboru.'});
  }
  // Preserve a source-documented protective insert by its real sale variants.
  for(const a of legacy.filter(a=>a.kind==='protection')){
    if(result.some(x=>x.ref===a.ref))continue;
    const sale=options.find(x=>x.kind==='protection'&&x.ref.split('_')[0]===a.ref);
    if(sale&&!result.some(x=>x.selected&&x.kind==='protection')){
      const row=result.find(x=>x.ref===sale.ref);if(row&&!state.excludedAccessoryRefs?.includes(row.ref)){row.selected=true;row.note=a.note;}
    }
  }
  return result;
}

export function accessoryFitIssues(p,state){
  const kit=accessoryKit(p,state),issues=[];
  if(state.endcaps&&!kit.some(a=>a.kind==='endcap'))issues.push({code:'endcap-unavailable',severity:'pending',message:'Brak potwierdzonej zaślepki tego profilu w bieżącym cenniku. Zakończenie wymaga doboru.'});
  if(state.endcaps&&state.showCable&&!kit.some(a=>a.kind==='entrycap'))issues.push({code:'cable-entry',severity:'pending',message:'Wyprowadzenie przewodu wymaga przygotowania przepustu według instrukcji. W zestawieniu pozostaje pełna zaślepka.'});
  if(state.showFixings&&!kit.some(a=>a.kind==='bracket'))issues.push({code:'fixing-unavailable',severity:'pending',message:'Dobierz sposób zamocowania według instrukcji tego profilu.'});
  if(state.accessoryRefs?.some(ref=>accessoryOptions(p).some(a=>a.ref===ref&&a.kind==='endcap'&&!accessoryCapOptions(p).some(c=>c.ref===ref))))issues.push({code:'accessory-variant',severity:'pending',message:'Dodatkowe zamknięcie wymaga sprawdzenia z wybraną osłoną i sposobem montażu.'});
  return issues;
}
