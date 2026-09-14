import {previewLight,hasDoorSwitch} from './light-state.js?v=c3acda4e66c0';
import {sleeveAccessoryKit} from './sleeve-accessory-data.js?v=c3acda4e66c0';
import {profiles,strips,covers,sleeves,finishesFor,finishFor,displayLength,defaults,normalize,specification} from './catalog.js?v=c3acda4e66c0';
import {accessoryKit,accessoryOptions,accessoryCapOptions} from './accessory-data.js?v=c3acda4e66c0';
import {workbookRefs,universalRefs} from './catalog-provenance.js?v=c3acda4e66c0';
import {zones} from './zones.js?v=c3acda4e66c0';
import {mountingSteps} from './mounting.js?v=c3acda4e66c0';
import {coverIcon} from './cover-shapes.js?v=c3acda4e66c0';
import {profileIcon} from './profile-shapes.js?v=c3acda4e66c0';
import {sleeveIcon} from './sleeve-shapes.js?v=c3acda4e66c0';
import {projectSheet} from './sheet.js?v=c3acda4e66c0';
import {uiIcon,actionLabel} from './ui-icons.js?v=c3acda4e66c0';
import {surfaceFinishes,surfaceFinish,surfaceCanvas} from './surface-finishes.js?v=c3acda4e66c0';
import {createZonePlayback} from './zone-playback.js?v=c3acda4e66c0';
const $=id=>document.getElementById(id);
let s=normalize(defaults),assemblyTarget=null;
try{const raw=location.hash.startsWith('#config=')?JSON.parse(decodeURIComponent(location.hash.slice(8))):JSON.parse(localStorage.getItem('prescot-light-studio-v9')||localStorage.getItem('prescot-light-studio-v8')||localStorage.getItem('prescot-light-studio-v7')||localStorage.getItem('prescot-light-studio-v6')||localStorage.getItem('prescot-light-studio-v5')||localStorage.getItem('prescot-light-studio-v4')||'{}');s=normalize(raw);}catch{}
let studio,toastTimer,animation=0,stripFilter='all',profileFilter='all';
const num=(v,d=0)=>v.toLocaleString('pl-PL',{maximumFractionDigits:d});
let playbackZone=s.zone;
const zonePlayer=createZonePlayback({
  getOpening:()=>studio?.getOpening()??(s.zoneOpen?1:0),
  onOpening:opening=>{studio?.setOpening(opening);syncLightControls(opening);},
  onEndpoint:opening=>{s.zoneOpen=opening===1;update();},
  onChange:syncZonePlay,
  reducedMotion:()=>matchMedia('(prefers-reduced-motion: reduce)').matches
});
function syncZonePlay(){
  const playing=zonePlayer.playing;actionLabel($('zone-play'),playing?'Pauza':'Odtwórz',playing?'pause':'play');
  $('zone-play').setAttribute('aria-pressed',String(playing));$('zone-play').setAttribute('aria-label',playing?'Wstrzymaj ruch strefy':'Odtwórz ruch strefy');
}
const surfaceSwatches=new Map(surfaceFinishes.filter(f=>f.grain).map(f=>[f.id,surfaceCanvas(f).toDataURL()]));
for(const id of ['materials','zone-materials']){
  $(id).replaceChildren(...surfaceFinishes.map(f=>{const b=document.createElement('button');b.type='button';b.dataset.value=f.id;b.setAttribute('aria-label',f.name);b.title=f.name;const swatch=document.createElement('span');swatch.style.background=f.grain?`url("${surfaceSwatches.get(f.id)}") center / cover`:f.color;b.style.setProperty('--swatch',f.color);swatch.setAttribute('aria-hidden','true');b.append(swatch);return b;}));
}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),5000);}
let lastDimmer=s.dimmer>0?s.dimmer:defaults.dimmer;
function syncLightControls(opening){
  const light=previewLight(s,opening);
  if(s.dimmer>0)lastDimmer=s.dimmer;
  $('led-toggle').innerHTML='<i></i>'+(light.on?'LED włączone':'LED wyłączone');
  $('led-toggle').setAttribute('aria-pressed',String(light.on));
  $('led-toggle').disabled=light.blocked;$('light').checked=light.on;
  $('dimmer').value=light.brightness;$('dimmer-value').textContent=num(light.brightness)+'%';$('dimmer').disabled=light.blocked;
  const closed=s.zone==='drawer'?'Szuflada zamknięta':'Front zamknięty';
  const note=light.automatic?(light.blocked?`${closed} · krańcówka wyłącza LED.`:light.on?`Krańcówka · LED ${num(light.brightness)}%.`:'Krańcówka zwolniona · LED wyłączone ręcznie.'):'Światło sterowane przyciskiem w podglądzie.';
  $('trigger-status').textContent=note;
  $('light-trigger-note').hidden=!light.automatic;$('light-trigger-note').textContent=$('trigger-status').textContent;
}
function switchLight(on){s.light=on;if(on&&s.dimmer===0)s.dimmer=lastDimmer;update();}
function chooseProfile(p){s.catalogMigration=null;s.profile=p.id;s.mounting=p.mount==='surface'?'surface':'recessed';const t=strips.find(t=>t.id===s.strip);if(t.width>p.channel){s.strip='slim';s.cct=3000;toast(`${p.name}: kanał ${p.channel} mm. Dobrano taśmę Delux Slim 4 mm.`);}if(p.mount==='drywall'||p.id==='larko')s.zone='drywall';else if(s.zone==='drywall')s.zone='under';s.mountStep=0;}
function cards(target,data,key,icon,description){
  $(target).replaceChildren(...data.map(item=>{const b=document.createElement('button');b.className='card';b.dataset.value=item.id;b.innerHTML=`${icon(item)}<span class="card-copy"><strong>${item.name}</strong><small>${description(item)}</small></span>`;b.onclick=()=>{stopAnimation();if(key==='profile')chooseProfile(item);else s[key]=item.id;if(key==='strip')s.cct=item.cct;update();};return b;}));
}
function filterProfiles(){
  const query=$('profile-search').value.trim().toLocaleLowerCase('pl');let count=0;
  for(const b of $('profiles').children){const p=profiles.find(p=>p.id===b.dataset.value),family=profileFilter==='all'||profileFilter==='universal'&&universalRefs.has(p.ref)||p.family===profileFilter||profileFilter==='Wpust'&&p.family==='Regips';b.hidden=!family||!`${p.name} ${p.ref} ${p.application}`.toLocaleLowerCase('pl').includes(query);if(!b.hidden)count++;}
  $('profile-count').textContent=count?`${count} z ${profiles.length} profili · przekroje i dokumentacja`:'Brak profili dla tego wyszukiwania.';
}
function updateSleeves(spec){
  const sleeveKit=sleeveAccessoryKit(spec.sleeve,s,spec.strip);
  const capPair=sleeveKit.filter(a=>a.kind==='cap');
  const sleeveRows=sleeveKit.flatMap(a=>a.kind==='cap'&&capPair.length>1?(a===capPair[0]?[{...a,ref:capPair.map(c=>c.ref).join(' · '),pair:true}]:[]):[a]);
  $('sleeve-accessories').replaceChildren(...sleeveRows.map(a=>{
    const row=document.createElement('div');row.className='accessory-row';
    const label=document.createElement('label'),input=document.createElement('input'),copy=document.createElement('span');
    input.type='checkbox';input.checked=a.selected;input.onchange=()=>{s[a.kind==='holder'?'sleeveFixings':'sleeveCaps']=input.checked;update();};
    copy.innerHTML=`<strong>${a.kind==='holder'?'Uchwyt '+(a.material==='metal'?'metalowy':'z tworzywa'):'Białe zaślepki silikonowe'+(a.kit?' · komplet':a.pair?' · pełna i z otworem':'')}</strong><small>${a.ref||'Nasadka z przewodami · pełna zaślepka'}</small>`;
    label.append(input,copy);const link=document.createElement(a.source?'a':'button');if(a.source){link.href=a.source;link.target='_blank';link.rel='noreferrer';}else{link.type='button';link.className='quiet';link.onclick=()=>{s.view='macro';s.detail='seal';update();showMobilePreview();};}actionLabel(link,a.source?'Dane':'Zobacz','external');row.append(label,link);return row;
  }));
  $('sleeve-accessories').hidden=!sleeveKit.length;
  const t=spec.strip,selected=s.sleeve;
  $('sleeve').replaceChildren(...[{id:'none',name:t.encapsulation?'Fabryczna ochrona '+t.ip:'Bez dodatkowej koszulki'},...sleeves].map(x=>{const o=document.createElement('option');o.value=x.id;o.disabled=!!x.pcbMax&&(t.width>x.pcbMax||t.shape==='s');o.hidden=x.id==='none'&&s.housing==='sleeve'&&!t.encapsulation;o.textContent=x.name+(x.width?' · '+x.width+' × '+x.height+' mm':'');return o;}));$('sleeve').value=selected;$('sleeve').disabled=!!t.encapsulation;
  $('sleeve-note').textContent=t.encapsulation==='tube'?'COB IP67. Detal silikonowej osłony i zakończenia jest poglądowy. Cięcie wymaga ponownego uszczelnienia.':t.encapsulation==='coating'?'WCOB IP62 · mleczny przekrój 8 × 5 mm i cięcie co 25 mm według karty. Diody są schowane pod zaokrągloną osłoną.':selected!=='none'?'Zobacz wsunięcie PCB i zamknięcie końców. Szczelność zależy od wykonania całego zestawu.':'Wybierz koszulkę, aby obejrzeć jej przekrój i zakończenia.';
  $('sleeve-detail').hidden=!spec.sleeve;if(spec.sleeve){const x=spec.sleeve;const title=document.createElement('strong'),size=document.createElement('span'),drawing=document.createElement('span');drawing.className='sleeve-drawing';drawing.innerHTML=sleeveIcon(x);title.textContent=x.ref;size.textContent=`${x.width} × ${x.height} mm · ${x.shape==='side'?'PCB w pionie · światło górą':x.clear?'przezroczysta powierzchnia światła':'mleczna powierzchnia światła'}`;$('sleeve-detail').replaceChildren(drawing,title,size);if(x.fitNote)$('sleeve-note').textContent=x.fitNote;}
  $('sleeve-source').hidden=!spec.sleeve;$('sleeve-source').href=spec.sleeve?.source||'#';
  for(const key of ['sleeve','seal']){const b=document.querySelector(`[data-detail=${key}]`);b.hidden=selected==='none'&&!t.encapsulation;b.textContent=key==='sleeve'?(t.encapsulation==='coating'?'Przekrój WCOB':'Koszulka'):'Zakończenie';}
  document.querySelector('#cct-channels p').textContent=t.technology==='WCOB'?'Dwa kanały barwy pod białą powłoką WCOB. Wspólny plus.':'Dwa kanały barwy. Wspólny plus. Model obudowy 5050 z ciepłą i zimną diodą.';
}
function updateAccessories(p){
  const kit=accessoryKit(p,s);$('selected-accessories').textContent=p.name+' · lista akcesoriów';
  const expanded=$('accessories').querySelector('details')?.open,options=accessoryOptions(p);
  const makeRow=a=>{const el=document.createElement('div');el.className='accessory-row';const label=document.createElement('label');
    if(!['entrycap','endcap-pair'].includes(a.kind)){const input=document.createElement('input');input.type='checkbox';input.checked=a.selected;input.onchange=()=>{if(['endcap','bracket'].includes(a.kind))s[a.kind==='endcap'?'endcaps':'showFixings']=input.checked;else {s.accessoryRefs=input.checked?[...s.accessoryRefs,a.ref]:s.accessoryRefs.filter(ref=>ref!==a.ref);s.excludedAccessoryRefs=input.checked?s.excludedAccessoryRefs.filter(ref=>ref!==a.ref):[...s.excludedAccessoryRefs,a.ref];}update();};label.append(input);}
    const span=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=a.name;small.textContent=a.ref;span.append(strong,small);label.append(span);const link=document.createElement('a');link.href=a.source;link.target='_blank';link.rel='noreferrer';actionLabel(link,'Dane','external');link.setAttribute('aria-label','Dokumentacja: '+a.name);const note=document.createElement('p');note.textContent=a.note;el.append(label,link,note);
    if(['endcap','bracket'].includes(a.kind)){
      const variants=a.kind==='endcap'?accessoryCapOptions(p).filter(a=>!p.capPair||a.ref.startsWith(p.capPair[0])):options.filter(x=>x.kind==='bracket');
      if(variants.length>1){const select=document.createElement('select');select.className='accessory-variant';select.setAttribute('aria-label',a.kind==='endcap'?'Wariant zaślepki':'Wariant mocownika');for(const variant of variants){const option=document.createElement('option');option.value=variant.ref;option.textContent=variant.name+' · '+variant.ref;select.append(option);}select.value=a.ref;select.onchange=()=>{s[a.kind==='endcap'?'endcapRef':'bracketRef']=select.value;update();};el.append(select);}
    }
    return el;
  };
  const primary=kit.filter(a=>['endcap','endcap-pair','entrycap','bracket'].includes(a.kind)),extra=kit.filter(a=>!primary.includes(a));
  $('accessories').replaceChildren(...primary.map(makeRow));
  if(extra.length){const details=document.createElement('details'),summary=document.createElement('summary');details.className='additional-accessories';details.open=!!expanded;summary.textContent=`Pozostałe akcesoria · ${extra.length}`;details.append(summary,...extra.map(makeRow));$('accessories').append(details);}
  if(!kit.length){const note=document.createElement('p');note.className='subtle';note.textContent='Mocowanie i zakończenia dobierz według instrukcji tego profilu.';$('accessories').append(note);}
  $('inspect-endcap').disabled=!kit.some(a=>a.kind==='endcap'&&(!p.section||a.dimensions?.width&&a.dimensions?.height));
  $('bom-accessories').textContent=kit.filter(a=>a.selected).map(a=>a.name+' · '+a.ref+(a.quantity?' · '+a.quantity+' szt.':' · ilość do doboru')).join(' / ');
}
cards('profiles',profiles,'profile',p=>profileIcon(p,covers.find(c=>c.id===p.covers[0])),p=>`${num(p.width,1)} × ${num(p.height,1)} mm · ${p.application}`);
cards('strips',strips,'strip',t=>`<span class="strip-icon ${t.technology==='WCOB'?'wcob':t.type==='COB'?'cob':t.shape==='s'?'serpentine':t.width<=5?'slim':''}"></span>`,t=>`${t.width} mm · ${t.type==='3IN1'?'3 / 6 / 11':num(t.watts,1)} W/m · ${t.voltage} V · ${t.type==='CCT'?t.cctMin+'–'+t.cctMax:t.cct} K`);
cards('covers',covers,'cover',coverIcon,c=>`${c.ref}${c.width?' · '+num(c.width,1)+' mm':''}<span class="cover-transmission"><i style="--transmission:${c.transmission*100}%"></i>${Math.round(c.transmission*100)}% światła</span>${c.maxWatts?'maks. '+c.maxWatts+' W/m':''}`);
$('zones').replaceChildren(...zones.map(z=>{const b=document.createElement('button');b.dataset.zone=z.id;b.innerHTML=`<svg viewBox="0 0 32 34" aria-hidden="true"><path d="${z.icon}"/></svg><span><strong>${z.name}</strong><small>${z.subtitle}</small></span>`;b.onclick=()=>{stopAnimation();if(z.id==='drywall'&&!(profiles.find(p=>p.id===s.profile).mount==='drywall'||s.profile==='larko'))chooseProfile(profiles.find(p=>p.id==='kozus'));else if(z.id!=='drywall'&&(profiles.find(p=>p.id===s.profile).mount==='drywall'||s.profile==='larko'))chooseProfile(profiles[0]);s.zone=z.id;s.zoneTrigger=hasDoorSwitch(z.id)?'door':'manual';s.zoneOpen=true;s.zoneDetail=false;update();showMobilePreview();};return b;}));
function filterStrips(){
  const query=$('strip-search').value.trim().toLocaleLowerCase('pl'),p=profiles.find(p=>p.id===s.profile);let visible=0;
  for(const b of $('strips').children){const t=strips.find(t=>t.id===b.dataset.value),family=stripFilter==='all'||stripFilter==='slim'&&t.width<=5||stripFilter==='s'&&t.shape==='s'||stripFilter==='cob'&&(t.type==='COB'||t.technology==='WCOB')||stripFilter==='cct'&&['CCT','RGBW','3IN1'].includes(t.type);b.hidden=!family||!`${t.name} ${t.ref} ${t.width} mm`.toLocaleLowerCase('pl').includes(query);const candidate=specification(normalize({...s,strip:t.id}));b.disabled=s.housing==='sleeve'?(t.shape==='s'||!t.encapsulation&&t.width>(specification(s).sleeve?.pcbMax||99)):candidate.fitStatus==='blocked'&&s.view!=='macro';const reason=candidate.issues.find(x=>x.severity==='blocked')?.message;b.title=reason||t.ref;let warning=b.querySelector('.choice-reason');if(!warning){warning=document.createElement('small');warning.className='choice-reason';b.querySelector('.card-copy').append(warning);}warning.textContent=reason||'';warning.hidden=!reason;if(!b.hidden)visible++;}
  $('strip-empty').hidden=visible>0;
}
function updateFit(spec){
  $('fit-dimensions').textContent=`PCB ${spec.strip.width} mm → kanał ${spec.profile.channel} mm · wysokość pod osłoną ok. ${num(spec.availableHeight,1)} mm`;
  $('fit-issues').replaceChildren(...spec.issues.map(x=>{const li=document.createElement('li');li.textContent=x.message;li.dataset.severity=x.severity;return li;}));
  $('fit-report').dataset.status=spec.fitStatus;
  const alternatives=spec.assemblyBlocked?profiles.filter(p=>p.id!==s.profile&&specification({...s,profile:p.id,cover:p.covers[0],finish:finishesFor(p)[0]}).fitStatus==='compatible').slice(0,3):[];
  $('fit-alternatives').replaceChildren(...alternatives.map(p=>{const b=document.createElement('button');actionLabel(b,p.name,'external');b.onclick=()=>{chooseProfile(p);update();};return b;}));
  $('export-glb').disabled=spec.fitStatus==='blocked'||spec.assemblyBlocked;
  $('export-glb').title=$('export-glb').disabled?'Rozwiąż wykluczenia zestawu przed eksportem złożonego modelu.':'';
}
function update(){
  s=normalize(s);const spec=specification(s),p=spec.profile,t=spec.strip;
  if(spec.assemblyBlocked&&s.view!=='macro'){s.view='assembly';s.exploded=100;}
  if(s.view!=='zone'||playbackZone!==s.zone){zonePlayer.reset();playbackZone=s.zone;}
  const z=s.view==='zone',installed=['installation','section','mounting'].includes(s.view),walk=s.view==='mounting',site=zones.find(z=>z.id===s.zone);
  filterProfiles();updateAccessories(p);updateSleeves(spec);updateFit(spec);
  for(const profile of profiles){
    const cover=profile.id===p.id?spec.cover:covers.find(c=>c.id===profile.covers[0]);
    const icon=$('profiles').querySelector(`[data-value="${profile.id}"] .profile-section-icon`);
    if(icon.dataset.cover!==cover.id)icon.outerHTML=profileIcon(profile,cover);
  }
  $('finish-note').textContent=spec.finish.name+' · '+spec.finish.ref;
  $('cover-count').textContent=`${p.covers.length} osłon przypisanych do ${p.name}`;
  $('cover-note').textContent=[spec.cover.material,spec.cover.beamAngle?'Soczewka '+spec.cover.beamAngle+'°':null,spec.cover.maxWatts?'Maksymalnie '+spec.cover.maxWatts+' W/m':null,spec.cover.capNote].filter(Boolean).join(' · ');
  $('cover-source').href=spec.cover.source||p.source;
  document.querySelectorAll('[data-scale]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scale===s.productScale&&!['end','entry'].includes(s.assemblyAngle))));
  $('zone-position').value=s.zonePosition;$('zone-position').disabled=['drywall','plinth'].includes(s.zone);$('zone-position').querySelector('[value=shelf]').hidden=s.zone!=='cabinet';$('zone-trigger').value=s.zoneTrigger;$('zone-trigger').disabled=['drywall','under','shelf','plinth'].includes(s.zone);$('trigger-status').textContent=s.zoneTrigger==='door'?(s.zoneOpen?'Front otwarty · krańcówka załącza LED.':'Front zamknięty · LED wyłączone.'):'Światło sterowane przyciskiem w podglądzie.';
  $('profile-source').href=p.source;$('profile-instruction').href=p.instruction||p.source;$('strip-source').href=t.source;
  $('selected-profile').textContent=p.name;$('selected-strip').textContent=t.name;$('selected-cover').textContent=spec.cover.name;$('selected-settings').textContent=`${num(s.length/1000,2)} m · ${num(spec.power,1)} W`;
  $('detail-width').textContent=num(p.width,1)+' mm';$('detail-height').textContent=num(p.height,1)+' mm';$('detail-pcb').textContent=t.width+' mm';$('detail-color').textContent=t.type==='CCT'?t.cctMin+'–'+t.cctMax+' K':(t.type==='RGBW'?'RGB + ':'')+t.cct+' K';
  $('detail-color').dataset.wide=String(['CCT','RGBW'].includes(t.type));$('detail-channel').textContent=num(p.channel,1)+' mm';$('detail-finish').textContent={silver:'Srebrna anoda',raw:'Surowe',black:'Czarna anoda',white:'Biały lakier'}[s.finish];$('detail-cri').textContent='CRI '+t.cri+(t.type==='RGBW'?' · W':'');$('detail-power').textContent=num(spec.wattsPerMeter,1)+' W';$('technical-profile').textContent=spec.finish.ref;$('technical-tape').textContent=t.ref+(t.copperOz?' · PCB '+t.copperOz+' oz':'');
  const sleeveDetail=s.view==='macro'&&(spec.sleeve||t.encapsulation)&&['sleeve','seal','segment'].includes(s.detail),housing=spec.sleeve||(t.encapsulation?spec.envelope:null);
  $('technical-profile-label').textContent=sleeveDetail?(spec.sleeve?'KOSZULKA PRESCOT':'OSŁONA TAŚMY PRESCOT'):'PROFIL KLUŚ';
  for(const [i,label]of(sleeveDetail?['Szerokość','Wysokość','PCB','Materiał']:['Szerokość','Wysokość','Kanał na taśmę','Wykończenie']).entries())$('profile-metric-label-'+i).textContent=label;
  if(sleeveDetail){$('detail-width').textContent=num(housing.width,1)+' mm';$('detail-height').textContent=num(housing.height,1)+' mm';$('detail-channel').textContent=(spec.sleeve?.pcbMax??t.width)+' mm';$('detail-finish').textContent=spec.sleeve?.clear||t.encapsulation==='tube'?'Silikon przezroczysty':'Silikon mleczny';$('technical-profile').textContent=spec.sleeve?.ref||t.ip;}
  const logoSource=s.lightStudy?'assets/logo-white.svg':'assets/logo.svg';
  document.querySelectorAll('.brand img,.welcome-logo-fallback').forEach(img=>{
    if(img.getAttribute('src')!==logoSource)img.setAttribute('src',logoSource);
  });
  $('product-wire').setAttribute('aria-pressed',String(s.showCable));document.body.dataset.view=s.view;document.body.dataset.lightStudy=String(s.lightStudy);document.querySelectorAll('button[data-light-study]').forEach(b=>{b.setAttribute('aria-pressed',String(s.lightStudy));actionLabel(b,s.lightStudy?'Tryb dzienny':'Tryb nocny',s.lightStudy?'sun':'moon');});document.querySelector('meta[name=theme-color]').content=s.lightStudy?'#1c1f24':'#f7f7f2';document.querySelector('.canvas-help').textContent=z?'Obrót w obrębie strefy · kółko: zbliżenie':'Obrót 360° · kółko: zbliżenie · prawy przycisk: przesunięcie';
  document.querySelector('.installation-toolbar').hidden=!installed;document.querySelector('.assembly-toolbar').hidden=s.view!=='assembly';document.querySelector('.macro-toolbar').hidden=s.view!=='macro';document.querySelector('.zone-toolbar').hidden=!z;document.querySelector('.assembly-steps').hidden=s.view!=='assembly';document.querySelector('.mount-guide').hidden=!walk;document.querySelector('.detail-metrics').hidden=false;$('zone-settings').hidden=!z;
  $('rgbw-controls').hidden=t.type!=='RGBW';$('rgb-color').value=s.rgbColor;document.querySelectorAll('[data-rgb-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.rgbMode===s.rgbMode)));
  $('cct-control').hidden=t.type!=='CCT';$('cct-note').hidden=['CCT','RGBW'].includes(t.type);
  $('cct').disabled=t.type!=='CCT';$('cct').hidden=t.type!=='CCT';document.querySelector('label[for=cct]').hidden=t.type!=='CCT';$('cct').min=t.cctMin||2700;$('cct').max=t.cctMax||6500;
  document.querySelector('[data-detail=curve]').hidden=t.shape!=='s';
  $('backing').value=s.backing;$('backing').disabled=t.technology==='WCOB';$('backing').querySelector('[value=wcob-3m]').hidden=t.technology!=='WCOB';$('backing-control').hidden=!!spec.sleeve||!!t.encapsulation&&t.technology!=='WCOB';
  document.querySelector('.sample-note>span').textContent=z?'ODCINEK 300 MM · STREFA POGLĄDOWA':s.view==='assembly'&&['end','entry'].includes(s.assemblyAngle)?'ZAKOŃCZENIE · DETAL':s.view==='section'?'PRZEKRÓJ · FRAGMENT 24 MM':s.view==='macro'&&s.detail==='wiring'?'DETAL PODŁĄCZENIA':displayLength(s)>100?'ODCINEK '+num(displayLength(s)/1000,3)+' M':'PRÓBKA 100 MM';
  $('sample-length-note').textContent=`Projekt: ${num(s.length/1000,2)} m`;
  for(const [selector,key] of [['[data-angle]','assemblyAngle'],['[data-detail]','detail'],['[data-power]','powerMode'],['[data-mount]','mounting'],['[data-zone]','zone']])document.querySelectorAll(selector).forEach(b=>{const attr={assemblyAngle:'angle',detail:'detail',powerMode:'power',mounting:'mount',zone:'zone'}[key];b.setAttribute('aria-pressed',String(b.dataset[attr]===s[key]));});
  document.querySelectorAll('[data-step]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.step)===(s.exploded>75?100:s.exploded>25?50:0))));
  document.querySelectorAll('[data-mount-step]').forEach(b=>{b.setAttribute('aria-pressed',String(Number(b.dataset.mountStep)===s.mountStep));b.setAttribute('aria-label',`Etap ${Number(b.dataset.mountStep)+1}: ${mountingSteps(p,s.mounting==='recessed')[Number(b.dataset.mountStep)]?.[0]||'Instrukcja KLUŚ'}`);});
  document.querySelectorAll('[data-zone-detail]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.zoneDetail==='true')===s.zoneDetail)));
  $('zone-motion').hidden=['drywall','shelf','plinth'].includes(s.zone);actionLabel($('zone-motion'),s.zone==='drawer'?(s.zoneOpen?'Wsuń szufladę':'Wysuń szufladę'):(s.zoneOpen?'Zamknij front':'Otwórz front'),'external');$('zone-motion').setAttribute('aria-pressed',String(s.zoneOpen));
  document.querySelector('.zone-demo').hidden=!z;$('zone-play').hidden=$('zone-motion').hidden;syncZonePlay();
  $('zone-surface-name').textContent=surfaceFinish(s.material).name;
  $('zone-materials').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===s.material)));
  $('zone-cable').hidden=s.zone==='drywall';$('zone-cable').setAttribute('aria-pressed',String(s.showCable));
  $('zone-compatibility').textContent=s.zone==='drywall'?`${p.name} · ${p.screwDrywall?'płyta '+num(p.boardThickness,1)+' mm, skrzydła pod płytą i wkręty':p.id==='kozus'?'płyta 16 mm, klej i wkładka TECH-22':'wpust i dedykowane sprężyny'}.`:['shelf','plinth'].includes(s.zone)?'Fragment płyty i trasa przewodu pokazują zasadę osadzenia. Wymiary frezu wymagają doboru.':'Front i prowadnice pokazują zasadę zabudowy. Odcinek światła pozostaje na korpusie.';
  const steps=mountingSteps(p,s.mounting==='recessed');$('mount-heading').textContent=steps[s.mountStep][0];$('mount-copy').textContent=steps[s.mountStep][1];$('mount-source').href=p.instruction;$('mount-prev').disabled=s.mountStep===0;$('mount-next').disabled=s.mountStep===4;
  $('mounting').disabled=p.mount!=='surface';document.querySelectorAll('[data-mount=surface]').forEach(b=>b.disabled=p.mount!=='surface');
  document.querySelectorAll('button[data-view]').forEach(b=>{if(['installation','mounting','zone'].includes(b.dataset.view))b.hidden=p.mount==='special';});
  $('seal-close').hidden=s.view!=='macro'||s.detail!=='seal';$('seal-close').textContent=s.sealClosed?'Rozsuń końcówki':'Zamknij końcówki';$('seal-close').setAttribute('aria-pressed',String(s.sealClosed));
  $('macro-spec').textContent=`${t.width} mm · ${t.technology|| (t.type==='COB'?'COB':'SMD '+(t.package|| (t.type==='CCT'?'5050':'2835')))} · ${spec.terminals.join(' / ')}${t.copperOz?' · PCB '+t.copperOz+' oz':''}`;
  $('power-modes').hidden=t.type!=='3IN1';$('power-details').hidden=t.type!=='3IN1';$('power-mode-value').textContent=t.type==='3IN1'?num(spec.lumensPerMeter)+' lm/m':'';$('power-wiring').textContent=`Cztery żyły: +24V / L / M / H. Aktywne: +24V i ${spec.selectedTerminal||'−'} · ${num(spec.current,2)} A dla ${num(spec.stripLength/1000,2)} m.`;
  $('print').value=s.print;$('print-note').textContent=s.print==='concept'?'Projekt nadruku CE / RoHS — wymaga potwierdzenia dla produktu.':'Układ nadruku i ścieżek poglądowy.';$('cct-channels').hidden=t.type!=='CCT';
  const availableFinishes=finishesFor(p);$('finishes').querySelectorAll('button').forEach(b=>b.hidden=!availableFinishes.includes(b.dataset.value));
  $('covers').querySelectorAll('button').forEach(b=>{b.hidden=!p.covers.includes(b.dataset.value);const c=covers.find(c=>c.id===b.dataset.value);b.disabled=!!c.maxWatts&&spec.wattsPerMeter>c.maxWatts;b.title=b.disabled?`Maks. ${c.maxWatts} W/m. Wybrana taśma: ${spec.wattsPerMeter} W/m.`:c.name;});
  for(const [id,k] of [['profiles','profile'],['strips','strip'],['covers','cover'],['finishes','finish'],['materials','material']])$(id).querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===s[k])));
  document.querySelectorAll('button[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===s.view||(installed&&b.dataset.view==='installation'&&!!b.closest('.views')))));
  for(const k of ['exploded','cct','repeat','mounting'])$(k).value=s[k];
  $('length-value').textContent=`${num(s.length/1000,3)} m`;$('cct-value').textContent=s.cct+' K';$('cct-note').textContent=t.type==='CCT'?`CCT: regulacja ${t.cctMin}–${t.cctMax} K, kanały WW + CW.`:`Wybrana taśma: stałe ${t.cct} K.`;
  $('assembly-value').textContent=s.exploded===0?'Zestaw zamknięty':s.exploded<=50?'Osadź przesłonę':'Ułóż taśmę w profilu';$('geometry-note').textContent=p.geometry;
  $('bom-title').textContent=p.name+' + '+t.name;$('fit-badge').textContent=spec.fitStatus==='blocked'?'Zestaw niezgodny':spec.fitStatus==='pending'?'Do potwierdzenia':'Gabaryt pasuje';$('fit-badge').classList.toggle('error',spec.fitStatus==='blocked');
  $('bom-length').textContent=num(spec.stripLength/1000,3)+' m';$('bom-power').textContent=num(spec.power,2)+' W';$('bom-voltage').textContent=t.voltage+' V DC';$('bom-transmission').textContent=Math.round(spec.cover.transmission*100)+'%';
  $('envelope-note').textContent=spec.envelope?`${spec.sleeve?spec.sleeve.name:t.ip}: ${spec.fitVerified?'obrys '+spec.envelope.width+' × '+spec.envelope.height+' mm':'gabaryt osłony lub jej wnętrza do potwierdzenia'}. ${spec.fitVerified&&!spec.envelopeFits?'Wybierz szerszy lub głębszy profil.':''}`:'';
  $('cut-note').textContent=spec.cutVerified?`${spec.segments} segmentów × ${num(t.cut,2)} mm${spec.offcut>.01?` · ${num(spec.offcut,2)} mm wolnego profilu`:''}. Potwierdź skok cięcia na PCB.`:`Podgląd ${num(spec.stripLength/1000,2)} m. ${t.cutNote} Obliczenia długości i mocy są orientacyjne.`;
  const titles={assembly:['KLUŚ × PRESCOT',p.name],installation:['DETAL MONTAŻU','Od spodu.'],section:['OSADZENIE / PRZEKRÓJ',p.name],mounting:['MONTAŻ / '+p.name,'Krok po kroku.'],macro:['PRESCOT LED / DETAL',t.name],zone:['STREFA MONTAŻU',site.name+'.']};
  const descriptions={assembly:`${t.name} · ${spec.cover.name} · ${p.application}.`,installation:s.mounting==='recessed'?'Profil we wpuście. Zobacz, jak wykańcza powierzchnię.':'Linia światła, mocowanie i styk z powierzchnią.',section:`${p.name} · kanał ${num(p.channel,1)} mm · ${p.id==='kozus'?'płyta 16 mm i warstwa wykończenia':'podłoże i osadzenie przesłony'}.`,mounting:'Od przygotowania podłoża do zamkniętej linii światła.',macro:s.detail==='sleeve'?(t.encapsulation==='coating'?'WCOB · półokrągła mleczna osłona 8 × 5 mm.':`${spec.sleeve?.name||t.ip} · taśma i koszulka PRESCOT, bez przesłony.`):s.detail==='seal'?'Przewód, silikon i zakończenia. Zobacz zamknięcie odcinka.':s.detail==='wiring'?`Przewody: ${spec.connections.map(p=>p.label).join(' / ')}.${t.type==='3IN1'?' Czerwony plus · trzy czarne żyły L / M / H.':''}`:s.detail==='curve'?'S-shape. Elastyczne mostki pozwalają prowadzić taśmę po łuku.':t.shape==='s'?'Falujący laminat, wycięcia i pola miedziane. Zasilanie 12 V.':t.technology==='WCOB'?'Biała powierzchnia White COB, także przy wyłączonym świetle.':`Cienki laminat i ${t.type==='COB'?'ciągłe pasmo COB':'obudowy SMD '+(t.package||(t.type==='CCT'?'5050':'2835'))}.`,zone:site.description};
  $('stage-overline').textContent=titles[s.view][0];$('stage-heading').textContent=titles[s.view][1].replace(/(\d+)\s+K\b/g,'$1\u00a0K');$('detail-description').textContent=descriptions[s.view];
  $('mobile-assembly-play').hidden=s.view!=='assembly';$('mobile-assembly-play').disabled=spec.assemblyBlocked;syncAssemblyButton();$('exploded').disabled=s.view!=='assembly'||spec.assemblyBlocked;$('animate').disabled=s.view!=='assembly'||spec.assemblyBlocked;document.querySelectorAll('[data-step]').forEach(b=>b.disabled=spec.assemblyBlocked&&b.dataset.step!=='100');filterStrips();
  try{localStorage.setItem('prescot-light-studio-v9',JSON.stringify(s));}catch{}
  applyHousingUI(spec);
  studio?.update(s);
  if(z&&zonePlayer.opening!==null)studio?.setOpening(zonePlayer.opening);
  syncLightControls(z?(zonePlayer.opening??studio?.getOpening()):undefined);
}
function showMobilePreview(){if(innerWidth<=780)document.querySelector('.stage-shell').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
for(const k of ['length','exploded','cct','dimmer','repeat'])$(k).oninput=()=>{if($(k).value==='')return;stopAnimation();s[k]=Number($(k).value);update();};
$('dimmer').oninput=()=>{stopAnimation();s.dimmer=Number($('dimmer').value);s.light=s.dimmer>0;update();};
let lengthTimer=0,lastLengthUpdate=0;
function applyLength(){clearTimeout(lengthTimer);lengthTimer=0;lastLengthUpdate=performance.now();update();}
$('length').oninput=()=>{stopAnimation();s.length=Number($('length').value);s.view=s.housing==='sleeve'?'macro':'assembly';s.productScale='length';s.assemblyAngle='perspective';$('length-value').textContent=num(s.length/1000,3)+' m';clearTimeout(lengthTimer);const delay=Math.max(0,140-(performance.now()-lastLengthUpdate));lengthTimer=setTimeout(applyLength,delay);};
$('length').onchange=applyLength;
document.querySelectorAll('[data-scale]').forEach(b=>b.onclick=()=>{stopAnimation();s.productScale=b.dataset.scale;s.assemblyAngle='perspective';update();});
$('light').onchange=()=>switchLight($('light').checked);$('mounting').onchange=()=>{s.mounting=$('mounting').value;s.mountStep=0;update();};$('print').onchange=()=>{s.print=$('print').value;update();};
$('strip-search').oninput=filterStrips;
$('profile-search').oninput=filterProfiles;document.querySelectorAll('[data-profile-filter]').forEach(b=>b.onclick=()=>{profileFilter=b.dataset.profileFilter;document.querySelectorAll('[data-profile-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filterProfiles();});
$('sleeve').onchange=()=>{stopAnimation();s.sleeve=$('sleeve').value;s.housing='sleeve';s.view='macro';s.detail='product';update();showMobilePreview();};
$('product-wire').onclick=()=>{s.showCable=!s.showCable;s.assemblyAngle=s.showCable?'entry':'perspective';s.endcaps=true;s.exploded=0;update();};
$('rgb-color').oninput=()=>{s.rgbColor=$('rgb-color').value;s.rgbMode=s.rgbMode==='white'?'rgb':s.rgbMode;s.light=true;update();};document.querySelectorAll('[data-rgb-mode]').forEach(b=>b.onclick=()=>{s.rgbMode=b.dataset.rgbMode;s.light=true;update();});document.querySelectorAll('[data-rgb]').forEach(b=>b.onclick=()=>{s.rgbColor=b.dataset.rgb;s.rgbMode='rgb';s.light=true;update();});
$('backing').onchange=()=>{stopAnimation();s.backing=$('backing').value;update();};
$('seal-close').onclick=()=>{s.sealClosed=!s.sealClosed;update();};
$('inspect-endcap').onclick=()=>{s.view='assembly';s.assemblyAngle='end';s.exploded=50;s.endcaps=true;s.showCable=true;update();showMobilePreview();};
$('zone-position').onchange=()=>{s.zonePosition=$('zone-position').value;update();};$('zone-trigger').onchange=()=>{s.zoneTrigger=$('zone-trigger').value;update();};document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{stripFilter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filterStrips();});
for(const [attr,key]of [['angle','assemblyAngle'],['power','powerMode'],['detail','detail'],['mount','mounting']])document.querySelectorAll(`[data-${attr}]`).forEach(b=>b.onclick=()=>{stopAnimation();s[key]=b.dataset[attr];if(key==='assemblyAngle'&&s.assemblyAngle==='end'){s.endcaps=true;s.exploded=50};if(key!=='powerMode')s.mountStep=0;update();});
document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{stopAnimation();s.exploded=Number(b.dataset.step);update();});
document.querySelectorAll('[data-mount-step]').forEach(b=>b.onclick=()=>{s.mountStep=Number(b.dataset.mountStep);update();});
$('mount-prev').onclick=()=>{s.mountStep=Math.max(0,s.mountStep-1);update();};$('mount-next').onclick=()=>{s.mountStep=Math.min(4,s.mountStep+1);update();};
for(const [id,k]of [['finishes','finish'],['materials','material'],['zone-materials','material']])$(id).querySelectorAll('button').forEach(b=>b.onclick=()=>{s[k]=b.dataset.value;update();});
document.querySelectorAll('button[data-view]').forEach(b=>b.onclick=()=>{stopAnimation();s.view=b.dataset.view;if(s.view==='zone'&&innerWidth<=780)s.zoneDetail=true;update();showMobilePreview();});
document.querySelectorAll('button[data-light-study]').forEach(b=>b.onclick=()=>{s.lightStudy=!s.lightStudy;if(s.lightStudy){s.light=true;s.dimmer=100;}update();});
$('inspect-tape').onclick=()=>{s.view='macro';update();showMobilePreview();};$('reset-camera').onclick=()=>studio?.frame();$('led-toggle').onclick=()=>switchLight(!previewLight(s,s.view==='zone'?studio?.getOpening():undefined).on);
$('zone-mount').onclick=()=>{s.view='mounting';s.mountStep=0;update();};$('zone-cable').onclick=()=>{s.showCable=!s.showCable;if(s.showCable)s.zoneDetail=true;update();};
document.querySelectorAll('[data-zone-detail]').forEach(b=>b.onclick=()=>{s.zoneDetail=b.dataset.zoneDetail==='true';update();});
$('zone-motion').onclick=()=>{
  const from=studio?.getOpening()??(s.zoneOpen?1:0);stopAnimation();s.zoneOpen=from<=.5;const to=s.zoneOpen?1:0;update();
  if(!studio||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  studio.setOpening(from);syncLightControls(from);const start=performance.now();const tick=t=>{const f=Math.min(1,(t-start)/800),ease=f*f*(3-2*f);const opening=from+(to-from)*ease;studio.setOpening(opening);syncLightControls(opening);if(f<1)animation=requestAnimationFrame(tick);else animation=0;};animation=requestAnimationFrame(tick);
};
$('zone-play').onclick=()=>{if(zonePlayer.playing)zonePlayer.pause();else{cancelAnimationFrame(animation);animation=0;zonePlayer.play();}};
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(animation){stopAnimation();update();}else zonePlayer.pause();}});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches)zonePlayer.pause();});
function syncAssemblyButton(){
  const target=assemblyTarget===null?(s.exploded>50?0:100):(assemblyTarget===0?100:0),label=target===0?'Złóż':'Rozłóż';
  $('mobile-assembly-play').querySelector('span').textContent=label;
  $('mobile-assembly-play').setAttribute('aria-label',label+' zestaw');
  $('mobile-assembly-play').title=assemblyTarget===null?label+' zestaw':'Odwróć animację · '+label.toLowerCase()+' zestaw';
  $('mobile-assembly-play').dataset.playing=String(assemblyTarget!==null);
}
function stopAnimation(){zonePlayer.reset();cancelAnimationFrame(animation);animation=0;assemblyTarget=null;$('animate').innerHTML=uiIcon('play');$('animate').setAttribute('aria-label','Odtwórz animację montażu');actionLabel($('play-mount'),'Odtwórz montaż','play');$('play-mount').setAttribute('aria-label','Odtwórz montaż');syncAssemblyButton();}
function playAssembly(to){
  cancelAnimationFrame(animation);animation=0;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){s.exploded=to;assemblyTarget=null;update();return;}
  const start=performance.now(),from=s.exploded,duration=Math.max(1,6200*Math.abs(to-from)/100);assemblyTarget=to;
  $('animate').innerHTML=uiIcon('pause');$('animate').setAttribute('aria-label','Wstrzymaj animację montażu');actionLabel($('play-mount'),'Wstrzymaj','pause');$('play-mount').setAttribute('aria-label','Wstrzymaj montaż');syncAssemblyButton();
  const tick=t=>{const f=Math.min(1,(t-start)/duration);s.exploded=from+(to-from)*f;$('exploded').value=s.exploded;studio?.setAssembly(s.exploded);if(f<1)animation=requestAnimationFrame(tick);else{stopAnimation();update();}};animation=requestAnimationFrame(tick);
}
$('play-mount').onclick=()=>$('animate').click();$('animate').onclick=()=>{
  if(animation){stopAnimation();update();return;}
  playAssembly(s.exploded>40?0:100);
};
$('mobile-assembly-play').onclick=()=>playAssembly(assemblyTarget===null?(s.exploded>50?0:100):(assemblyTarget===0?100:0));
for(const [button,dialog]of [['export-open','export-dialog'],['about','about-dialog']])$(button).onclick=()=>$(dialog).showModal();document.querySelectorAll('dialog .close').forEach(b=>b.onclick=()=>b.closest('dialog').close());
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function project(){const spec=specification(s);return{schema:'prescot-light-studio/v9',configuration:s,displaySampleMm:displayLength(s),components:{housing:s.housing,finish:spec.isSleeve?null:spec.finish,profile:spec.isSleeve?null:spec.profile,strip:spec.strip,cover:spec.isSleeve?null:spec.cover,sleeve:spec.sleeve,accessories:(spec.isSleeve?sleeveAccessoryKit(spec.sleeve,s,spec.strip):[...accessoryKit(spec.profile,s),...(spec.strip.technology==='WCOB'?sleeveAccessoryKit(null,s,spec.strip):[])]).filter(a=>a.selected)},calculation:{stripLengthMm:spec.stripLength,powerW:spec.power,currentA:spec.current,wattsPerMeter:spec.wattsPerMeter,selectedTerminal:spec.selectedTerminal,freeSpaceMm:spec.offcut,cutVerified:spec.cutVerified,envelopeFits:spec.envelopeFits,fitVerified:spec.fitVerified,fitStatus:spec.fitStatus,issues:spec.issues},mounting:spec.isSleeve?null:{zone:s.zone,source:spec.profile.instruction,steps:mountingSteps(spec.profile,s.mounting==='recessed')},notes:['Product and installation illustration; not fabrication or electrical documentation.','Profile sections reconstructed from KLUŚ product drawings; retaining details and accessory silhouettes are simplified.','PCB and print are illustrative. CE/RoHS option is a print concept, not certification evidence.','Drill, groove, fastener and cable dimensions require project-specific selection.','Accessory references follow KLUŚ cards; fixing quantities are unspecified. Sleeve and sealing geometry is illustrative and does not establish IP compliance.','GLB contains full project length. Custom artwork is embedded only in GLB.','Release paper marked 3M is illustrative; adhesive grade is not specified. RGB light preview does not simulate spectral colour rendering; CRI is catalog data.']};}
async function busy(id,fn){const b=$(id);b.disabled=true;try{await fn();}catch(e){console.error(e);toast(`Eksport nie powiódł się: ${e.message}`);}finally{b.disabled=false;}}
$('export-json').onclick=()=>download(new Blob([JSON.stringify(project(),null,2)],{type:'application/json'}),'prescot-projekt.json');
$('export-glb').onclick=()=>busy('export-glb',async()=>{if(!studio)throw Error('Model jeszcze się wczytuje.');if(specification(s).fitStatus==='blocked'||specification(s).assemblyBlocked)throw Error('Najpierw rozwiąż wykluczenia w sekcji Dopasowanie.');toast('Przygotowuję model 3D…');download(new Blob([await studio.exportGLB()],{type:'model/gltf-binary'}),'prescot-zestaw.glb');toast(s.housing==='sleeve'?'Zapisano model taśmy z koszulką.':'Zapisano model GLB z animacją montażu.');});
$('export-png').onclick=()=>busy('export-png',async()=>{if(!studio)throw Error('Model jeszcze się wczytuje.');download(await studio.exportPNG(),'prescot-produkt.png');toast('Zapisano detal z przezroczystym tłem.');});
$('export-sheet').onclick=()=>busy('export-sheet',async()=>{if(!studio)throw Error('Model jeszcze się wczytuje.');const blob=await studio.exportPNG();const image=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});download(new Blob([projectSheet(s,specification(s),image)],{type:'text/html;charset=utf-8'}),'prescot-koncepcja.html');toast('Zapisano kartę. Otwórz ją i wybierz Drukuj / Zapisz jako PDF.');});
$('copy-link').onclick=()=>busy('copy-link',async()=>{const url=new URL(location.href);url.hash='config='+encodeURIComponent(JSON.stringify(s));await navigator.clipboard.writeText(url.href);toast('Skopiowano link. Własny rysunek przeniesiesz plikiem GLB.');});
$('artwork').onchange=async()=>{
  const file=$('artwork').files[0];if(!file)return;
  try{
    if(!studio)throw Error('Poczekaj na wczytanie modelu.');if(file.size>15*1024*1024)throw Error('Maksymalny rozmiar rysunku to 15 MB.');
    if(!/\.(svg|png|webp)$/i.test(file.name))throw Error('Wybierz SVG, PNG lub WebP.');
    if(/\.svg$/i.test(file.name)){const xml=await file.text(),doc=new DOMParser().parseFromString(xml,'image/svg+xml');if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('Nieprawidłowy plik SVG.');if(doc.querySelector('script,foreignObject')||/\bon\w+\s*=|(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/)|@import|url\(\s*["']?https?:/i.test(xml))throw Error('Zapisz samodzielny SVG bez skryptów i zewnętrznych odwołań.');}
    const url=URL.createObjectURL(file);try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');const scale=Math.min(1,4096/Math.max(image.naturalWidth,image.naturalHeight));canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);studio.setArtwork(canvas);}finally{URL.revokeObjectURL(url);}
    $('artwork-name').textContent=`Rysunek: ${file.name}`;s.view='macro';update();toast('Rysunek jest na taśmie. Ustaw długość jego segmentu.');
  }catch(e){toast(e.message);}$('artwork').value='';
};
$('artwork-clear').onclick=()=>{studio?.setArtwork(null);$('artwork-name').textContent='Obecnie: schemat poglądowy PCB.';toast('Przywrócono schemat PCB.');};

let starting;
async function startConfigurator(){
  if(starting)return starting;
  starting=(async()=>{
    document.body.dataset.screen='studio';document.body.dataset.ready='loading';$('welcome').hidden=true;$('configurator').hidden=false;
    $('start-configurator').disabled=true;
    await new Promise(resolve=>requestAnimationFrame(resolve));
    try{
      const {createStudio}=await import('./scene.js?v=c3acda4e66c0');
      const initial=s;studio=await createStudio($('viewport'),initial);
      if(s!==initial){studio.update(s);studio.frame();}
      $('loading').remove();document.body.dataset.ready='true';
      window.studioDebug={get state(){return{...s};},spec:()=>specification(s),inspect:()=>studio.inspect(),project};
      $('stage-heading').focus({preventScroll:true});
    }catch(e){console.error(e);$('loading').textContent='Nie udało się uruchomić 3D. Sprawdź obsługę WebGL i odśwież stronę.';document.body.dataset.ready='error';}
  })();
  return starting;
}
$('start-configurator').onclick=startConfigurator;
window.addEventListener('hashchange',()=>{try{if(location.hash.startsWith('#config=')){s=normalize(JSON.parse(decodeURIComponent(location.hash.slice(8))));stopAnimation();update();startConfigurator();}}catch{toast('Link nie zawiera prawidłowej konfiguracji.');}});
update();
if(location.hash.startsWith('#config='))startConfigurator();
else{
  document.body.dataset.ready='welcome';
  $('welcome-logo').dataset.logo='static';
}

function applyHousingUI(spec){
 const sleeveMode=spec.isSleeve,t=spec.strip,housing=spec.sleeve||spec.envelope;
 document.body.dataset.housing=s.housing;
 $('export-glb').lastElementChild.textContent=sleeveMode?'GLB · pełna długość taśmy i koszulki, materiały':'GLB · pełna długość projektu, materiały i animacja montażu';
 document.querySelector('.config-footer').textContent=sleeveMode?'PRESCOT LED · LIGHT STUDIO':'KLUŚ × PRESCOT · LIGHT STUDIO';
 for(const id of ['choose-profile','choose-cover','choose-accessories'])$(id).hidden=sleeveMode;
 $('choose-sleeve').hidden=!sleeveMode;
 document.querySelector('.views').hidden=sleeveMode;document.querySelector('.sleeve-view-label').hidden=!sleeveMode;
 document.querySelectorAll('button[data-housing]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.housing===s.housing));b.disabled=b.dataset.housing==='sleeve'&&t.shape==='s';b.title=b.disabled?'S-shape wymaga prowadzenia bez koszulki.':'';});
 document.querySelector('[data-detail=product]').hidden=!sleeveMode;
 $('mounting').closest('label').hidden=sleeveMode;$('materials').closest('.field-row').hidden=sleeveMode;
 $('bom-transmission').parentElement.hidden=sleeveMode;$('bom-accessories').hidden=false;if(sleeveMode)$('bom-accessories').textContent=sleeveAccessoryKit(spec.sleeve,s,spec.strip).filter(a=>a.selected).map(a=>a.ref||a.name).join(' · ');if(!sleeveMode&&t.technology==='WCOB'&&s.sleeveCaps)$('bom-accessories').textContent+=' / '+sleeveAccessoryKit(null,s,t)[0].name;
 if(!sleeveMode)return;
 const name=spec.sleeve?.name||(t.encapsulation==='coating'?'WCOB · powłoka fabryczna':'COB · koszulka fabryczna');
 $('selected-sleeve').textContent=name;
 $('sleeve-source').hidden=false;$('sleeve-source').href=spec.sleeve?.source||t.source;
 $('stage-overline').textContent='PRESCOT LED';$('stage-heading').textContent=['product','sleeve','seal'].includes(s.detail)?name:t.name;
 if(s.detail==='product')$('detail-description').textContent=t.name+' · '+(spec.sleeve?.clear||t.encapsulation==='tube'?'przezroczysty silikon':'mleczna powierzchnia światła')+'.';
 $('technical-profile-label').textContent=spec.sleeve?'KOSZULKA PRESCOT':'OCHRONA FABRYCZNA';$('technical-profile').textContent=spec.sleeve?.ref||t.ip;
 for(const [i,label]of ['Szerokość','Wysokość','Szerokość PCB do','Materiał'].entries())$('profile-metric-label-'+i).textContent=label;
 $('detail-width').textContent=num(housing.width,1)+' mm';$('detail-height').textContent=num(housing.height,1)+' mm';$('detail-channel').textContent=(spec.sleeve?.pcbMax||t.width)+' mm';$('detail-finish').textContent=spec.sleeve?.clear||t.encapsulation==='tube'?'Silikon przezroczysty':'Silikon mleczny';
 $('bom-title').textContent=name+' + '+t.name;
 $('fit-dimensions').textContent=spec.sleeve?`PCB ${t.width} mm · koszulka do ${spec.sleeve.pcbMax} mm`:`Fabryczny obrys ${housing.width} × ${housing.height} mm`;
 $('envelope-note').textContent=spec.sleeve?`${spec.sleeve.ref} · ${housing.width} × ${housing.height} mm`:'';
 $('cut-note').textContent=`${spec.segments} sekcji × ${num(t.cut,2)} mm · odcinek taśmy ${num(spec.stripLength/1000,3)} m.`;
 document.querySelector('[data-detail=sleeve]').textContent=t.encapsulation==='coating'?'Przekrój WCOB':'Wsunięcie PCB';
}
document.querySelectorAll('button[data-housing]').forEach(b=>b.onclick=()=>{
 stopAnimation();s.housing=b.dataset.housing;
 if(s.housing==='profile'){s.sleeve='none';s.view='assembly';s.exploded=100;s.detail='segment';}
 else{s.view='macro';s.detail='product';}
 update();
});
