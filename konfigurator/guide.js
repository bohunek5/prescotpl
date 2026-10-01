import {guideArt,createGuideArt} from './guide-art.js?v=20260922-refine1';

export const GUIDE_STORAGE = 'prescot-guide-v1';
const $ = selector => document.querySelector(selector);
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${{close:'<path d="m6 6 12 12M18 6 6 18"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>'}[name]}</svg>`;
const faqs = [
 ['Jak odznaczyć taśmę?', 'Kliknij ponownie wybrany model na liście taśm. Taśma zniknie z podglądu i zestawienia, a światło się wyłączy. Kolejne kliknięcie doda ją z powrotem.'],
 ['Od czego zacząć?', 'Wybierz profil odpowiedni do miejsca montażu, następnie taśmę, osłonę i akcesoria. Długość ustawisz w „Parametrach projektu”. Jeśli używasz koszulki silikonowej, przełącz obudowę na „Koszulki”.'],
 ['Gdzie obejrzę modele 3D taśm LED?', 'Wybierz taśmę i kliknij „Obejrzyj taśmę z bliska” pod jej listą lub zakładkę „Taśma LED” nad modelem. „Detal PCB” pokazuje diody i budowę taśmy, a „Pola i przewody” — jej podłączenie. Obracaj model palcem lub myszą i przybliżaj, żeby obejrzeć szczegóły. Do profilu z osłoną wrócisz zakładką „Produkt”.'],
 ['Dlaczego taśma lub składanie są niedostępne?', 'Przy opcji albo w zestawieniu znajdziesz przyczynę: na przykład szerokość PCB, brak miejsca pod osłoną lub niepotwierdzone osadzenie. Przeczytaj wynik dopasowania przed przekazaniem zestawu do wyceny.'],
 ['Co oznaczają wyniki dopasowania?', '„Gabaryt pasuje” opisuje sprawdzone wymiary. „Do potwierdzenia” wskazuje brakujące dane. „Zestaw niezgodny” oznacza wykryte wykluczenie. Szczegóły są pod wynikiem. Dobór obejmuje także zasilacz, połączenia i chłodzenie.'],
 ['Dlaczego model jest krótszy niż mój projekt?', 'Detal ułatwia obejrzenie konstrukcji. Widok „Odcinek do 1 m” pokazuje dłuższy fragment. Zestawienie i eksport GLB uwzględniają długość projektu; odcinek taśmy zależy również od skoku cięcia.'],
 ['Jak działa jasność, RGB i tryb nocny?', 'Przycisk LED włącza światło, suwak ustawia jasność, a przełącznik dnia i nocy zmienia otoczenie. Sterowanie barwą pojawia się dla obsługujących je taśm. Podgląd jest orientacyjny: ekran nie odwzorowuje dokładnego efektu w pomieszczeniu ani widma światła.'],
 ['Dlaczego zdjęcie ma inny kolor lub akcesoria?', 'Fotografie katalogowe mogą pokazywać przykładowe wykończenie i osprzęt. Zdjęcia rodzin osłon są opisane jako przykładowe. Wybrane w konfiguratorze wykończenie zobaczysz w modelu 3D.'],
 ['Jak wysłać kilka wariantów handlowcowi?', 'Po każdej konfiguracji wybierz „Dodaj zestaw do PDF”. Potem otwórz „Generuj PDF”, nazwij warianty, wpisz ilości i pobierz plik. Dołącz go do swojej wiadomości. Jeden PDF może zawierać do 12 zestawów. Konfigurator nie wysyła wiadomości automatycznie.'],
 ['Jak wrócić do projektu lub przekazać link?', 'Przeglądarka zapamiętuje ustawienia i listę PDF, jeśli pozwala na zapis lokalny. W „Eksport projektu” możesz skopiować link do ustawień zestawu. Lista wariantów PDF oraz własny rysunek PCB nie są częścią tego linku — warianty pobierz jako PDF.'],
];

export function createGuide({start, getState, getSpec}) {
 const artPreview=createGuideArt(getState,getSpec);
 const trigger = $('#guide-open');
 if (!trigger) return {ready(){}};
 let seen = false, active = false, autoSuppressed = false;
 let path = 'full', index = 0, snapshot, frame = 0, resizeFrame = 0, resizeObserver, lastHousing;
 let target = null, panelPosition = 'side';
 try { seen = JSON.parse(localStorage.getItem(GUIDE_STORAGE) || '{}').seen === true; } catch {}
 const markSeen = () => { seen = true; try { localStorage.setItem(GUIDE_STORAGE, JSON.stringify({seen:true})); } catch {} };
 const center = document.createElement('dialog');
 center.id = 'guide-center'; center.className = 'guide-dialog'; center.setAttribute('aria-labelledby', 'guide-center-title');
 const shade = document.createElement('div'); shade.className = 'guide-shade'; shade.hidden = true; shade.setAttribute('aria-hidden','true');
 shade.innerHTML = '<div class="guide-spotlight"></div>';
 const spot = shade.firstElementChild;
 const panel = document.createElement('section'); panel.id = 'guide-tour'; panel.hidden = true;
 panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','false'); panel.setAttribute('aria-labelledby','guide-step-title'); panel.setAttribute('aria-describedby','guide-step-text');
 panel.innerHTML = `<div class="guide-tour-head"><span class="guide-kicker">TWÓJ ZESTAW · KROK PO KROKU</span><button id="guide-exit" class="guide-icon" aria-label="Zamknij przewodnik">${icon('close')}</button></div><div class="guide-tour-content"><div id="guide-step-art"></div><div class="guide-step-meta"><span id="guide-step-count"></span><span id="guide-step-topic"></span></div><h2 id="guide-step-title" tabindex="-1"></h2><p id="guide-step-text"></p></div><button id="guide-target" class="guide-text-button">Przejdź do wskazanego miejsca ${icon('arrow')}</button><div class="guide-tour-foot"><div><button id="guide-prev" class="guide-secondary">Wstecz</button><button id="guide-next" class="guide-primary">Dalej ${icon('arrow')}</button></div></div><div class="guide-progress" aria-hidden="true"><i></i></div>`;
 document.body.append(center, shade, panel);
 const button = (id,label,cls='guide-primary') => `<button type="button" id="${id}" class="${cls}">${label}</button>`;
 const busy = () => !!document.querySelector('.config[inert], #studio-stage[inert], #quote-dialog[aria-busy="true"]');
 function showCenter(page='help') {
  if (busy() || [...document.querySelectorAll('dialog[open]')].some(d=>d!==center)) return;
  if(active)finishTour({restore:true});
  center.dataset.guidePage=page;
  const head=`<div class="guide-dialog-head"><span class="guide-kicker">PRESCOT · POMOC W KONFIGURATORZE</span><button type="button" class="guide-icon" data-guide-close aria-label="Zamknij pomoc">${icon('close')}</button></div>`;
  const footer='';
  if (page==='welcome') {
   center.innerHTML=head+`<div class="guide-welcome-art">${guideArt('intro')}</div><div class="guide-welcome-copy"><span class="guide-pill">PIERWSZA WIZYTA · OK. 1 MINUTY</span><h2 id="guide-center-title" tabindex="-1">Zbuduj swój<br>pierwszy zestaw.</h2><p>Przejdź od profilu i taśmy do światła oraz PDF dla handlowca. Pokażemy Ci, gdzie kliknąć i na co zwrócić uwagę.</p><div class="guide-welcome-actions">${button('guide-start','Prowadź mnie '+icon('arrow'))}${button('guide-skip','Wybieram samodzielnie','guide-secondary')}</div></div>`+footer;
  } else if(page==='complete') {
   center.innerHTML=head+`<div class="guide-welcome-art">${guideArt('quote')}</div><div class="guide-welcome-copy"><span class="guide-pill">MASZ JUŻ PUNKT WYJŚCIA</span><h2 id="guide-center-title" tabindex="-1">Teraz Twój projekt.</h2><p>Wybierz elementy i sprawdź dopasowanie. Gotowe warianty dodaj do jednego PDF, który możesz przekazać handlowcowi.</p><div class="guide-welcome-actions">${button('guide-done','Wracam do zestawu '+icon('arrow'))}${button('guide-pdf-place','Pokaż miejsce na PDF','guide-secondary')}</div></div>`+footer;
  } else {
   center.innerHTML=head+`<div class="guide-help-intro"><h2 id="guide-center-title" tabindex="-1">Od czego zaczynamy?</h2><p>Krótka ścieżka po konfiguratorze albo odpowiedź na jedno pytanie.</p></div><div class="guide-paths">${[['full','01','Pierwszy zestaw','Profil, taśma, osłona i gotowy PDF.'],['components','02','Osłony i akcesoria','Wykończenie, zakończenia i dopasowanie.'],['light','03','Światło i montaż','Jasność, dzień i noc oraz podgląd modelu.'],['quote','04','Warianty dla handlowca','Kilka zestawów w jednym pliku.']].map(([id,n,title,body])=>`<button type="button" data-guide-path="${id}"><span>${n}</span><strong>${title}</strong><small>${body}</small>${icon('arrow')}</button>`).join('')}</div><div class="guide-answers"><label for="guide-search">Szybka odpowiedź</label><div class="guide-search-wrap"><input id="guide-search" type="search" placeholder="Szukaj: PDF, kolor, długość…" autocomplete="off"></div><div class="guide-faq">${faqs.map(([q,a])=>`<details><summary>${q}<span aria-hidden="true">+</span></summary><p>${a}</p></details>`).join('')}</div><p id="guide-no-answer" hidden role="status">Nie ma odpowiedzi dla tego hasła. Spróbuj krótszej nazwy, np. „PDF” lub „światło”.</p></div>`+footer;
  }
  center.querySelector('[data-guide-close]').onclick=()=>{markSeen();center.close();};
  center.querySelector('#guide-start')?.addEventListener('click',()=>startTour('full'));
  center.querySelector('#guide-skip')?.addEventListener('click',()=>{markSeen();center.close();});
  center.querySelector('#guide-done')?.addEventListener('click',()=>center.close());
  center.querySelector('#guide-pdf-place')?.addEventListener('click',()=>{center.close();const el=$('#quote-actions');el?.scrollIntoView({block:'center',behavior:'instant'});$('#quote-save')?.focus({preventScroll:true});});
  center.querySelectorAll('[data-guide-path]').forEach(b=>b.onclick=()=>startTour(b.dataset.guidePath));
  center.querySelector('#guide-search')?.addEventListener('input',event=>{
   const normal=t=>t.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replaceAll('ł','l');
   const query=normal(event.target.value.trim());let count=0;
   center.querySelectorAll('.guide-faq details').forEach(d=>{const matches=normal(d.textContent).includes(query);d.hidden=!matches; if(matches)count++;});
   center.querySelector('#guide-no-answer').hidden=!!count;
  });
  if(!center.open)center.showModal();
  artPreview.show(center,page==='complete'?'quote':'intro');
  trigger.setAttribute('aria-expanded','true');
  (center.querySelector('#guide-start')||center.querySelector('#guide-center-title')).focus({preventScroll:true});
 }
 center.addEventListener('cancel',()=>markSeen());
 center.addEventListener('close',()=>{if(!active)artPreview.dispose();if(center.dataset.guidePage==='welcome')markSeen();trigger.setAttribute('aria-expanded','false');});
 center.addEventListener('click',event=>{if(event.target!==center)return;const r=center.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom){markSeen();center.close();}});
 trigger.onclick=()=>showCenter('help');
 $('#welcome-guide')?.addEventListener('click',()=>startTour('full'));
 function steps() {
  const sleeve=getState().housing==='sleeve';const blocked=getSpec().assemblyBlocked;
  const all=[
   {id:'profile',kind:sleeve?'sleeve':'profile',topic:'OBUDOWA',title:sleeve?'Dobierz koszulkę.':'Zacznij od profilu.',text:sleeve?'Wybierz koszulkę pasującą do szerokości taśmy. Pod wyborem znajdziesz kartę produktu. Do profili aluminiowych wrócisz przełącznikiem „Profile”.':'Wyszukaj profil odpowiedni do miejsca montażu. Sprawdź przekrój, dostępne wykończenie i zdjęcia katalogowe.',selector:sleeve?'#choose-sleeve > summary':'#choose-profile > summary',open:sleeve?'#choose-sleeve':'#choose-profile',focus:sleeve?'#sleeve':'#profile-search'},
   {id:'strip',kind:'strip',topic:'ŹRÓDŁO ŚWIATŁA',title:'Wybierz taśmę i obejrzyj ją w 3D.',text:'Porównaj szerokość PCB, barwę i moc. Pod listą kliknij „Obejrzyj taśmę z bliska”: zobaczysz diody, nadruk PCB oraz pola i przewody. Model możesz obracać i przybliżać. Przy niedostępnej taśmie znajdziesz przyczynę.',selector:'#choose-strip > summary',open:'#choose-strip',focus:'#strip-search'},
   {id:'cover',kind:sleeve?'sleeve':'cover',topic:sleeve?'SILIKON':'OSŁONA',title:sleeve?'Sprawdź rodzaj koszulki.':'Dopasuj linię światła.',text:sleeve?'Koszulka jest obudową taśmy. Sprawdź jej przekrój, wymiary i kartę produktu. W tym trybie nie dobierasz osobnej osłony profilu KLUŚ.':'Lista pokazuje osłony przypisane do wybranego profilu. Porównaj wykończenie i przepuszczalność. Dostępne fotografie otworzysz nad listą.',selector:sleeve?'#choose-sleeve > summary':'#choose-cover > summary',open:sleeve?'#choose-sleeve':'#choose-cover',focus:sleeve?'#sleeve':'#choose-cover > summary'},
   {id:'accessories',kind:'accessories',topic:'ZAKOŃCZENIA I MOCOWANIE',title:'Zadbaj o szczegóły.',text:sleeve?'Dostępne zakończenia i mocowania koszulki znajdziesz przy jej wyborze. Symbole i dokumentację sprawdź przed kompletacją.':'Dobierz zaślepki i sposób mocowania. Przy akcesoriach znajdziesz symbole oraz dokumentację. Część elementów jest opisana w zestawieniu, bez osobnego modelu 3D.',selector:sleeve?'#sleeve-accessories':'#choose-accessories > summary',fallback:'#choose-sleeve > summary',open:sleeve?'#choose-sleeve':'#choose-accessories'},
   {id:'settings',kind:'profile',topic:'WYMIARY',title:'Ustaw długość projektu.',text:'Wpisz długość w milimetrach. Zestawienie niżej uwzględnia odcinek taśmy po cięciu i jego moc. Przeczytaj też wynik dopasowania oraz uwagi.',selector:'#length',open:'#choose-settings',focus:'#length'},
   {id:'light',kind:'light',topic:'PODGLĄD ŚWIATŁA',title:'Zobacz, jak świeci.',text:'Przycisk LED włącza światło. Suwak zmienia jasność, a przełącznik dnia i nocy — otoczenie. Opcje barwy zależą od taśmy. To podgląd orientacyjny.',selector:'#led-toggle',focus:'#led-toggle'},
   {id:'assembly',kind:'assembly',topic:'MODEL 3D',title:blocked?'Sprawdź uwagę o montażu.':'Obejrzyj z każdej strony.',text:blocked?'Dla tego zestawu składanie wymaga wyjaśnienia dopasowania. Przeczytaj przyczynę w zestawieniu i dokumentację elementów.':sleeve?'Obracaj model palcem lub myszą. Widoki taśmy pokazują PCB, przewody i dostępne etapy wsunięcia do koszulki.':'Obracaj model palcem lub myszą. „Złóż” pokazuje składanie, a „Osadzenie” — przekrój i dostępne etapy montażu. Widok detalu ułatwia obejrzenie konstrukcji.',selector:blocked?'#fit-report':sleeve?'.macro-toolbar':'#mobile-assembly-play',fallback:sleeve?'#stage-heading':'.views',focus:blocked?'#fit-badge':sleeve?'#stage-heading':'#mobile-assembly-play'},
   {id:'quote',kind:'quote',topic:'DLA CIEBIE I HANDLOWCA',title:'Kilka wariantów. Jeden PDF.',text:'Wybierz „Dodaj zestaw do PDF”, zmień konfigurację i dodaj kolejny wariant. „Generuj PDF” otwiera listę z nazwami i ilościami. Pobierz plik i dołącz go do wiadomości. Zmieści się w nim maksymalnie 12 zestawów.',selector:'#quote-actions',focus:'#quote-save'},
  ];
  return path==='full'?all:all.filter(s=>({components:['cover','accessories','settings'],light:['light','assembly'],quote:['settings','quote']}[path]||[]).includes(s.id));
 }
 const visible = e => e && !e.closest('[hidden]') && getComputedStyle(e).display!=='none' && e.getBoundingClientRect().width>0 && e.getBoundingClientRect().height>0;
 function restoreDetails(except=null) { if(!snapshot)return;for(const [el,open] of snapshot.details)if(el.isConnected&&el!==except)el.open=open; }
 async function startTour(which='full') {
  if(busy())return;
  markSeen();autoSuppressed=true;if(center.open)center.close();
  await start();if(document.body.dataset.ready!=='true')return;
  if(active)finishTour({restore:true});
  path=which;index=0;snapshot={x:scrollX,y:scrollY,config:$('.config').scrollTop,details:[...document.querySelectorAll('.component-picker')].map(d=>[d,d.open]),focus:trigger};
  active=true;panel.hidden=false;shade.hidden=false;document.body.classList.add('guide-running');trigger.setAttribute('aria-expanded','true');
  resizeObserver=new ResizeObserver(schedulePosition);resizeObserver.observe(panel);
  showStep();
 }
 function showStep({scroll=true,focus=true}={}) {
  if(!active)return;
  const list=steps();index=Math.min(index,list.length-1);const step=list[index];
  restoreDetails();if(step.open)$(step.open).open=true;
  target=$(step.selector);if(!visible(target))target=$(step.fallback||'#stage-heading');
  $('#guide-step-art').innerHTML=guideArt(step.kind);artPreview.show($('#guide-step-art'),step.kind);$('#guide-step-count').textContent=`${index+1} / ${list.length}`;$('#guide-step-topic').textContent=step.topic;
  $('#guide-step-title').textContent=step.title;$('#guide-step-text').textContent=step.text;
  $('#guide-prev').disabled=index===0;$('#guide-next').innerHTML=index===list.length-1?'Gotowe '+icon('arrow'):'Dalej '+icon('arrow');
  panel.querySelector('.guide-progress i').style.width=`${(index+1)/list.length*100}%`;
  panel.dataset.step=step.id;panel.querySelector('.guide-tour-content').scrollTop=0;
  if(scroll&&target)target.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
  position();
  if(scroll){makeRoom();position();}
  if(focus)$('#guide-step-title').focus({preventScroll:true});
 }
 function viewport(){const v=window.visualViewport;return {width:v?.width||innerWidth,height:v?.height||innerHeight,top:v?.offsetTop||0,left:v?.offsetLeft||0};}
 function makeRoom(){
  if(!target)return;
  const v=viewport(),r=target.getBoundingClientRect(),p=panel.getBoundingClientRect();
  if(panelPosition==='bottom'){
   const available=Math.max(65,p.top-v.top-32),desired=v.top+Math.min(84,Math.max(16,(available-Math.min(r.height,available))/2));
   const offset=r.top-desired;
   const config=target.closest('.config');
   if(config&&getComputedStyle(config).overflowY==='auto'&&config.scrollHeight>config.clientHeight&&matchMedia('(min-width:781px)').matches)config.scrollTop+=offset;
   else window.scrollBy({top:offset,behavior:'instant'});
  }
 }
 function position(){
  frame=0;if(!active||!target)return;
  const v=viewport(),w=Math.min(362,v.width-24);panel.style.width=w+'px';
  const r=target.getBoundingClientRect(),h=panel.getBoundingClientRect().height;
  const right=v.width-r.right-20,left=r.left-20;
  panelPosition=v.width<=780||(left<w&&right<w)?'bottom':'side';panel.dataset.placement=panelPosition;
  let x,y;
  if(panelPosition==='bottom'){x=v.left+(v.width-w)/2;y=v.top+v.height-h-12;}
  else{x=right>=w?r.right+18:r.left-w-18;y=Math.max(v.top+12,Math.min(r.top,v.top+v.height-h-12));}
  panel.style.left=Math.max(v.left+12,Math.min(x,v.left+v.width-w-12))+'px';panel.style.top=y+'px';
  let bounds={left:Math.max(8,r.left-7),top:Math.max(v.top+8,r.top-7),right:Math.min(v.width-8,r.right+7),bottom:Math.min(v.top+v.height-8,r.bottom+7)};
  const config=target.closest('.config');if(config&&matchMedia('(min-width:781px)').matches){const c=config.getBoundingClientRect();bounds.top=Math.max(bounds.top,c.top+4);bounds.bottom=Math.min(bounds.bottom,c.bottom-4);}
  if(panelPosition==='bottom')bounds.bottom=Math.min(bounds.bottom,y-10);
  const height=bounds.bottom-bounds.top,width=bounds.right-bounds.left;
  spot.hidden=height<8||width<8;
  if(!spot.hidden){Object.assign(spot.style,{left:bounds.left+'px',top:bounds.top+'px',width:width+'px',height:height+'px'});}
 }
 function schedulePosition(){if(active&&!frame)frame=requestAnimationFrame(position);}
 function followResize(){
  if(!active)return;cancelAnimationFrame(resizeFrame);
  resizeFrame=requestAnimationFrame(()=>{
   resizeFrame=0;if(!active)return;
   target?.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
   position();makeRoom();position();
  });
 }
 function finishTour({restore=true,focus=true}={}) {
  if(!active)return;
  artPreview.dispose();active=false;panel.hidden=true;shade.hidden=true;resizeObserver?.disconnect();cancelAnimationFrame(frame);cancelAnimationFrame(resizeFrame);frame=resizeFrame=0;
  document.body.classList.remove('guide-running');trigger.setAttribute('aria-expanded','false');
  if(restore&&snapshot){restoreDetails();$('.config').scrollTop=snapshot.config;window.scrollTo({left:snapshot.x,top:snapshot.y,behavior:'instant'});}
  if(focus)trigger.focus({preventScroll:true});
 }
 $('#guide-exit').onclick=()=>finishTour();
 $('#guide-prev').onclick=()=>{if(index>0){index--;showStep();}};
 $('#guide-next').onclick=()=>{if(index<steps().length-1){index++;showStep();}else{finishTour();showCenter('complete');}};
 $('#guide-target').onclick=()=>{
  const step=steps()[index],el=target,details=step.open?$(step.open):null;
  finishTour({restore:false,focus:false});restoreDetails(details);if(details)details.open=true;
  el?.scrollIntoView({block:'center',behavior:'instant'});
  const requestedFocus=$(step.focus||step.selector),focus=visible(requestedFocus)?requestedFocus:el;if(focus){if(!focus.matches('button,input,select,a,summary,[tabindex]'))focus.tabIndex=-1;focus.focus({preventScroll:true});}
 };
 addEventListener('scroll',schedulePosition,true);addEventListener('resize',followResize);window.visualViewport?.addEventListener('resize',followResize);
 document.addEventListener('keydown',event=>{
  if(!active)return;
  if(event.key==='Escape'){event.preventDefault();finishTour();return;}
  if(!panel.contains(event.target)||event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.key==='ArrowRight'&&index<steps().length-1){event.preventDefault();index++;showStep();}
  if(event.key==='ArrowLeft'&&index>0){event.preventDefault();index--;showStep();}
 });
 // Other native dialogs take precedence. The guide never creates stacked modals.
 const dialogsObserver=new MutationObserver(()=>{
  if(active&&[...document.querySelectorAll('dialog[open]')].some(d=>d!==center))finishTour({restore:false,focus:false});
  if(active&&lastHousing!==document.body.dataset.housing){lastHousing=document.body.dataset.housing;showStep({scroll:true,focus:false});}
 });
 dialogsObserver.observe(document.body,{attributes:true,attributeFilter:['open','data-housing'],subtree:true});
 addEventListener('hashchange',()=>{if(active)finishTour({restore:false});if(center.open)center.close();autoSuppressed=true;});
 return {
  ready(){
   lastHousing=document.body.dataset.housing;
   if(!seen&&!autoSuppressed&&!center.open&&!location.hash.startsWith('#config='))requestAnimationFrame(()=>{if(!seen&&!autoSuppressed&&!center.open)showCenter('welcome');});
  }
 };
}
