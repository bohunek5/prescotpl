// Matching references from KLUŚ product cards and the supplied 2026 workbook.
// Quantities of fixings depend on support spacing; never infer them from length.
const ends={micro:['MICRO-PLUS','C24392C02','C24392C07','C24392C10'],pds:['PDS-4-PLUS','C24337C02','C24337C07','C24337C10'],microk:['MICRO-K','C20126C02'],piko:['PIKO','C24202C02','C24202C07'],larko:['LARKO','C24006C02',null,'C24006C10'],kozus:['KOZUS','C24148C02'],pdszm:['PDS-ZM-PLUS','C24364C02','C24364C07','C24364C10'],alu45:['45-ALU','C20124C02','C20124C07','C20124C10'],pikozm:['PIKO-ZM','C24307C02','C24307C07','C24307C10'],pikoo:['PIKO-O','C24321C02','C24321C07','C24321C10'],giza:['GIZA','C24539C02','C24539C07','C24539C10'],lipod:['LIPOD','C24004C02','C24004C07','C24004C10']};
Object.assign(ends,{microh:['MICRO-H','C24261C02'],pdsh:['PDS-H','C24145C02'],siler:['SILER','C24236C02','C24236C07','C24236C10'],micronk:['MICRO-NK','C24346C02','C24346C07','C24346C10'],pdsnk:['PDS-NK','C24338C02','C24338C07','C24338C10'],plus45:['45-PLUS','C20007C02','C20007C07','C20007C10'],alu4516:['45-16','C24206C02'],tami:['TAMI EKO','C20051C10'],tako:['TAKO EKO','C20053C10'],tost:['TOST EKO','C20054C10'],pac:['PAC-ALU','C20107C02'],stos:['STOS-ALU','C20108C02']});
const entryProfiles=new Set(['micro','pds','piko','pikozm','pikoo','micronk','pdsnk','plus45']);
const brackets={micro:['PDS-STN','C24190N00'],pds:['PDS-STN','C24190N00'],alu45:['45-STN','C24144N00'],pdszm:['DS','C28096N00'],pikozm:['K-10','C24340C00'],pikoo:['PLD-10','C24375C00'],giza:['GIP-STN','C24447N00'],lipod:['GIP-STN','C24447N00']};
Object.assign(brackets,{microh:['PDS-H','C24214C02'],pdsh:['PDS-H','C24214C02'],alu4516:['PDS-STN','C24190N00'],plus45:['45-STN','C24144N00'],siler:['45-STN','C24144N00']});
export function accessoryKit(p,state){
  const e=ends[p.id],b=brackets[p.id],result=[];
  if(e)result.push({id:'endcap',name:'Zaślepka '+e[0],ref:e[{silver:1,black:2,white:3}[state.finish]]||e[1],kind:'endcap',quantity:2,selected:state.endcaps,source:['micro','pds','microk','piko','larko','kozus'].includes(p.id)?'assets/sources/cap-'+p.id+'.pdf':p.source,note:'Dwie końcówki prostego odcinka. Przepust dobierz osobno.'});
  if(e&&state.endcaps&&state.showCable&&entryProfiles.has(p.id)){result[0].quantity=1;result.push({...result[0],id:'entrycap',kind:'entrycap',name:'Zaślepka '+e[0]+'-OTW',ref:result[0].ref+'TW',quantity:1,selected:true,note:'Wariant z otworem na przewód. Kształt przepustu pokazano poglądowo.'});}
  if(b)result.push({id:'bracket',name:'Mocownik '+b[0],ref:b[1],kind:'bracket',quantity:null,selected:state.showFixings,source:p.source,note:'Liczbę i rozstaw dobierz do długości, obciążenia i podłoża.'});
  if(['pdszm','pikozm','giza','lipod'].includes(p.id))result.push({id:'connector',name:'Łącznik ZM-MINI',ref:'C28083N00',kind:'connector',quantity:null,selected:false,source:p.source,note:'Do połączeń profili. Niepotrzebny przy jednym odcinku.'});
  if(p.id==='kozus')result.push({id:'protection',name:'Wkładka TECH-22',ref:'C24531C02',kind:'protection',quantity:null,selected:true,source:'assets/sources/tech-22.pdf',note:'Ochrona kanału podczas szpachlowania; usuwana po wykończeniu.'});
  return result;
}
