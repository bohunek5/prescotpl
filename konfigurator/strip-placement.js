import {accessoryKit} from './accessory-data.js?v=130bc2896fcd';

// The original MICRO-PLUS 3DS has 7 mm retaining fingers with a 5.5 mm
// central opening. These are measured presentation-model dimensions, not
// manufacturing tolerances. Do not infer the same shape for an OTW variant.
const fullMicroCap=part=>part?.selected&&/^C24392(?:C02|C07|C10|L01)$/.test(part.ref||'');
export function stripPlacement(profile,strip,state,lengthMm=state.length){
  if(!Number.isFinite(lengthMm)||lengthMm<0)throw new RangeError('Długość odcinka musi być nieujemną liczbą.');
  if(!Number.isFinite(strip.cut)||strip.cut<=0)throw new RangeError('Moduł cięcia taśmy musi być dodatnią liczbą.');
  let startReserve=0,endReserve=0;
  if(state.housing!=='sleeve'&&profile?.id==='micro'&&strip.width>5.5){
    const kit=accessoryKit(profile,state),cap=kit.find(a=>a.kind==='endcap'&&a.selected);
    const start=kit.find(a=>a.kind==='entrycap'&&a.selected)||cap;
    const end=kit.find(a=>a.kind==='endcap-pair'&&a.selected)||cap;
    startReserve=fullMicroCap(start)?7:0;endReserve=fullMicroCap(end)?7:0;
  }
  const availableLength=Math.max(0,lengthMm-startReserve-endReserve);
  const minimumLengthMm=strip.cut+startReserve+endReserve;
  const fit=lengthMm+1e-7>=minimumLengthMm;
  // Keep one real cutting segment when the housing is too short; the caller
  // must block assembly rather than drawing an empty or stretched strip.
  const segments=Math.max(1,Math.floor((availableLength+1e-7)/strip.cut));
  return{startReserve,endReserve,availableLength,segments,stripLength:segments*strip.cut,
    offset:(startReserve-endReserve)/2,minimumLengthMm,fit,
    note:startReserve||endReserve?'Pełna zaślepka MICRO-PLUS ma w źródłowym modelu 3DS języczki wsuwane na 7 mm. Dla PCB szerszego niż 5,5 mm pozostawiono miejsce na wybranych końcach. Wymiary modelu i rzeczywiste dopasowanie wymagają potwierdzenia; nie są tolerancjami produkcyjnymi.':null};
}
