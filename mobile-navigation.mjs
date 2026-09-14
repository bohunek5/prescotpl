const asset=path=>new URL(path,import.meta.url).href;
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
const paths={more:'M5 9l7 7 7-7',close:'M6 6l12 12M6 18 18 6',external:'M7 17 17 7M7 7h10v10',layers:'m3 7 9-4 9 4-9 4-9-4Zm0 5 9 4 9-4M3 17l9 4 9-4',lab:'M8 3h8m-6 0v7l-6 9h16l-6-9V3M8 15h8',globe:'M3 12h18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c-5 5-5 13 0 18 5-5 5-13 0-18'};
const icon=name=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.6');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[name]);svg.append(path);return svg;};
const languages=[['pl','Polski'],['en','English'],['de','Deutsch'],['cs','Čeština'],['da','Dansk'],['et','Eesti'],['fi','Suomi'],['fr','Français'],['it','Italiano'],['lt','Lietuvių'],['es','Español'],['sv','Svenska'],['ar','العربية'],['zh-CN','中文']];

export function initializeMobileMenu(){
 const dock=document.querySelector('.prescot-dock');if(!dock||dock.querySelector('.pm-more'))return;
 const originals=[...dock.querySelectorAll('a.dock-item')];
 for(const [i,link]of originals.entries()){
  link.append(node('span','pm-dock-label',['Start','Oferta','Taśmy','Produkcja','Dystrybucja'][i]||link.dataset.tooltip));
  if(i>=3)link.dataset.pmSecondary='true';
 }
 const configurator=node('a','dock-item pm-configurator-dock');configurator.href=asset('konfigurator/');configurator.dataset.tooltip='Konfigurator LED';configurator.setAttribute('aria-label','Konfigurator LED');configurator.append(icon('layers'),node('span','pm-dock-label','Konfigurator'));
 dock.insertBefore(configurator,dock.querySelector('.dock-lang-item'));
 const more=node('button','pm-more');more.type='button';more.append(icon('more'),node('span','pm-dock-label','Więcej'));more.setAttribute('aria-label','Więcej stron');dock.insertBefore(more,dock.querySelector('.dock-lang-item'));
 function panel(id,label,trigger,cls){
  const p=node('div',`pm-nav-popover ${cls}`);p.id=id;p.setAttribute('popover','auto');p.setAttribute('role','dialog');p.setAttribute('aria-label',label);
  trigger.setAttribute('popovertarget',id);trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');
  const header=node('header');header.append(node('span','pm-menu-title',label));const close=node('button','pm-menu-close');close.type='button';close.setAttribute('aria-label',cls==='pm-menu'?'Zamknij menu':'Close language menu');close.append(icon('close'));close.onclick=()=>p.hidePopover();header.append(close);p.append(header);
  p.addEventListener('toggle',e=>{const open=e.newState==='open';trigger.setAttribute('aria-expanded',String(open));p.dataset.open=String(open);});document.body.append(p);return p;
 }
 const menu=panel('prescot-more-menu','Więcej',more,'pm-menu');const nav=node('nav');nav.setAttribute('aria-label','Pozostałe strony');
 const feature=(href,label,description,kind)=>{const a=node('a','pm-menu-feature');a.href=asset(href);a.append(icon(kind));const copy=node('span','pm-menu-copy');copy.append(node('strong','',label),node('small','',description));a.append(copy);const arrow=icon('external');arrow.classList.add('pm-configurator-arrow');a.append(arrow);a.onclick=()=>menu.hidePopover();return a;};
 nav.append(feature('konfigurator/','Konfigurator LED','Skomponuj zestaw','layers'),feature('laboratorium/','Laboratorium','Pomiary światła','lab'));
 for(const i of[3,4,7,5,6]){
  const original=originals[i];if(!original)continue;const a=node('a');a.href=original.href;const svg=original.querySelector('svg');if(svg)a.append(svg.cloneNode(true));a.append(node('span','',original.dataset.tooltip||original.getAttribute('aria-label')));
  a.onclick=event=>{menu.hidePopover();if(i===6){event.preventDefault();original.click();}};nav.append(a);
 }
 const b2b=node('a');b2b.href='https://prescot.abstore.pl/';const cart=originals[6]?.querySelector('svg');if(cart)b2b.append(cart.cloneNode(true));b2b.append(node('span','','Sklep B2B'));b2b.onclick=()=>menu.hidePopover();nav.append(b2b);menu.append(nav);

 // Native-language shortcuts are visible before opening More or loading translation.
 const bar=node('div','pm-language-bar notranslate');bar.setAttribute('translate','no');bar.setAttribute('aria-label','Choose language');dock.prepend(bar);
 const all=node('button','pm-language-trigger');all.type='button';all.setAttribute('aria-label','Choose another language');all.append(icon('globe'));bar.append(all);
 const languageMenu=panel('prescot-language-menu','Choose language',all,'pm-language-menu notranslate');languageMenu.setAttribute('translate','no');const list=node('div','pm-language-list');languageMenu.append(list);
 const buttons=[];let requested=null;
 const current=()=>document.querySelector('.gt-lang-code')?.textContent.trim().toLowerCase()||document.cookie.match(/(?:^|;\s*)googtrans=\/pl\/([^;]+)/)?.[1]||'pl';
 const sync=()=>{const code=current();for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.language.toLowerCase()===code));};
 function selectLanguage(code){
  const option=document.querySelector(`.gtranslate_wrapper a[data-gt-lang="${code}"]`);if(!option){requested=code;return;}
  const wrapper=option.closest('.gtranslate_wrapper');wrapper.dispatchEvent(new Event('pointerenter'));
  wrapper.querySelectorAll('img[data-gt-lazy-src]').forEach(img=>{if(!img.getAttribute('src'))img.src=img.dataset.gtLazySrc;});
  option.click();requested=null;if(languageMenu.matches(':popover-open'))languageMenu.hidePopover();sync();
 }
 for(const [code,label]of languages){
  const choice=()=>{const b=node('button','pm-language-choice');b.type='button';b.dataset.language=code;b.setAttribute('lang',code);b.setAttribute('aria-label',label);const img=node('img');img.src=asset(`wp-content/plugins/gtranslate/flags/32/${code}.png`);img.alt='';img.width=24;img.height=24;b.append(img,node('span','',label));b.onclick=()=>selectLanguage(code);buttons.push(b);return b;};
  list.append(choice());if(['pl','en','de'].includes(code))bar.insertBefore(choice(),all);
 }
 const translationHost=dock.querySelector('.dock-lang-item');
 if(translationHost){const observer=new MutationObserver(()=>{sync();if(requested)selectLanguage(requested);});observer.observe(translationHost,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});}
 sync();const mobile=matchMedia('(max-width:767px)');mobile.addEventListener('change',()=>{if(!mobile.matches)for(const p of[menu,languageMenu])if(p.matches(':popover-open'))p.hidePopover();});
}
