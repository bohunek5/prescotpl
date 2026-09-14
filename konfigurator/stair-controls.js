import {isStairZone,stairLayout} from './stair-layout.js?v=a9d8f23925dd';

export function createStairControls({host,getState,onUpdate,format}){
 const root=document.createElement('div');root.id='stair-controls';root.hidden=true;
 root.innerHTML=`<label class="select-label">Osadzenie profilu<select id="stair-mounting"><option value="surface">Na powierzchni</option><option value="recessed">We frezie</option></select></label>
 <div class="stair-range"><label class="range-label" for="stair-thickness">Grubość stopnia <output id="stair-thickness-value"></output></label><input id="stair-thickness" type="range" min="24" max="50" step="1"></div>
 <div class="stair-range" id="stair-inset-control"><label class="range-label" for="stair-inset">Od krawędzi do osi profilu <output id="stair-inset-value"></output></label><input id="stair-inset" type="range" min="8" max="90" step="1"></div>
 <div class="stair-range" id="stair-height-control"><label class="range-label" for="stair-height">Wysokość nad stopniem <output id="stair-height-value"></output></label><input id="stair-height" type="range" min="35" max="110" step="1"></div>
 <label class="stair-check"><input id="stair-riser" type="checkbox">Z podstopnicami</label><p class="subtle" id="stair-fit-note"></p>`;
 host.querySelector('#zone-compatibility').after(root);
 const $=id=>document.getElementById(id);
 let timer=0,lastUpdate=0;
 const flush=()=>{clearTimeout(timer);timer=0;lastUpdate=performance.now();onUpdate();};
 for(const [id,key]of[['stair-thickness','stairThickness'],['stair-inset','stairInset'],['stair-height','stairSideHeight']]){
  $(id).oninput=()=>{getState()[key]=Number($(id).value);$(id+'-value').textContent=format(getState()[key])+' mm';clearTimeout(timer);timer=setTimeout(flush,Math.max(0,160-(performance.now()-lastUpdate)));};
  $(id).onchange=flush;
 }
 $('stair-mounting').onchange=()=>{getState().mounting=$('stair-mounting').value;flush();};
 $('stair-riser').onchange=()=>{getState().stairRiser=$('stair-riser').checked;flush();};
 return{update(profile){
  const s=getState(),active=isStairZone(s.zone),side=s.zone==='stair-side';root.hidden=!active;
  $('zone-position').closest('label').hidden=active;$('zone-trigger').closest('label').hidden=active;$('trigger-status').hidden=active;
  $('zone-mount').textContent=active?(s.zoneDetail?'Całe schody':'Detal osadzenia'):'Jak zamontować';
  if(!active)return;
  const q=stairLayout(profile,s);
  $('stair-mounting').value=s.mounting;$('stair-mounting').querySelector('[value=surface]').disabled=profile.mount!=='surface';
  $('stair-thickness').min=Math.max(24,Math.ceil(q.recess*1000+6));
  $('stair-inset').min=Math.ceil(q.minInset*1000);$('stair-inset').max=Math.floor(q.maxInset*1000);
  $('stair-inset-control').hidden=side;$('stair-height-control').hidden=!side;
  for(const [id,key]of[['stair-thickness','stairThickness'],['stair-inset','stairInset'],['stair-height','stairSideHeight']]){$(id).value=s[key];$(id+'-value').textContent=format(s[key],1)+' mm';}
  $('stair-riser').checked=s.stairRiser;
  $('zone-compatibility').textContent='Fragment trzech stopni · profil 300 mm. Porównaj powierzchnie w świetle dziennym i nocnym.';
  $('stair-fit-note').textContent=s.mounting==='recessed'?`Frez poglądowy: ${format(q.gap*1000,1)} × ${format(q.recess*1000,1)} mm. ${side?'Linia na wysokości osi profilu.':`Nad frezem ${format(q.remainingWood*1000,1)} mm materiału.`}`:`${side?'Oś profilu nad drugim stopniem.':'Nosek '+format(q.nosing*1000,1)+' mm; odsunięcie uwzględnia miejsce przed podstopnicą.'} Mocowanie dobierz według instrukcji profilu.`;
 }};
}
