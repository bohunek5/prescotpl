// Finish follows the actual accessory row, independently of the profile finish.
// The MICRO-LNK card explicitly calls C24427L10 silver, despite its L10 suffix.
const transparentRefs=new Set(['C24340C00','C24375C00']);
export function accessoryFinish(accessory={}){
  const name=(accessory.name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const ref=accessory.ref||'',metal=/alumin(?:um|ium)|steel/i.test(accessory.material||'');
  let id='gray';
  if(transparentRefs.has(ref)||/transparent|przezrocz/.test(name))id='clear';
  else if(/metaliz|srebrn|silver/.test(name)||ref==='C24427L10')id='silver';
  else if(/ral\s*9010|bia[lł]|white/.test(name))id='white';
  else if(/ral\s*9005|czarn|black/.test(name))id='black';
  else if(/ral\s*7035|szar|gray|grey/.test(name))id='gray';
  else if(metal)id='metal';
  // C suffixes are an established colour encoding; L suffixes are not uniform.
  else if(/C10(?:TW|P)?$/.test(ref))id='white';
  else if(/C07(?:TW|P)?$/.test(ref))id='black';
  const paint=/lakier|ral\s*90|bia[lł]|czarn|white|black/.test(name);
  const finishes={
    gray:{color:'#c1c3c1',metalness:metal&&!paint?.72:0,roughness:.38},
    white:{color:'#f6f6f2',metalness:0,roughness:.37},
    black:{color:'#252829',metalness:0,roughness:.38},
    silver:{color:'#c5cbcd',metalness:.72,roughness:.27},
    metal:{color:'#c1c7ca',metalness:.86,roughness:.24},
    clear:{color:'#e8eeee',metalness:0,roughness:.19,transparent:true,opacity:.48},
  };
  return{id,...finishes[id]};
}
