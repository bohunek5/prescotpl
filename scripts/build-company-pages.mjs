import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const root=new URL('../',import.meta.url);
const configs=[{
 slug:'laboratorium',title:'Laboratorium pomiarowe',headline:'Światło sprawdzone<br><em>w pomiarach.</em>',
 intro:'Strumień świetlny, temperatura barwowa i oddawanie barw. Poznaj zaplecze pomiarowe Prescot LED.',
 hero:'wp-content/uploads/2026/02/lab2.webp',
 sections:[
  ['01 / Fotometria','Parametry, które opisują światło.','W wewnętrznym laboratorium sprawdzamy strumień świetlny, temperaturę barwową i współczynnik oddawania barw CRI. Pomiary pomagają porównać produkt z założeniami projektu.','wp-content/uploads/2026/02/lab2.webp'],
  ['02 / Kontrola jakości','Od próbki do serii.','Zaplecze pomiarowe jest częścią naszego procesu produkcyjnego. Pozwala sprawdzać parametry taśm i oceniać ich zgodność z ustaloną specyfikacją.','wp-content/uploads/2026/01/kulka.png'],
  ['03 / Dane produktu','Pomiary i dokumentacja.','Przy projekcie pod własną marką ustalamy zakres danych technicznych i materiałów potrzebnych do wprowadzenia produktu do oferty. Omów z nami model, jego zastosowanie i planowany zakres współpracy.','wp-content/uploads/2026/02/ce-rohs-eprel-2.webp']
 ], ep:true,cta:'Porozmawiajmy o parametrach Twojego produktu',related:'wlasny-brand/',relatedLabel:'Produkcja pod własną marką'
},{
 slug:'wlasny-brand',title:'Własny brand',headline:'Twoja marka.<br><em>Nasze zaplecze.</em>',
 intro:'Taśmy LED pod Twoją marką — od doboru parametrów po oznaczenia, opakowanie i materiały produktowe.',
 hero:'assets/offer/profile-led.webp',video:true,
 sections:[
  ['01 / Specyfikacja','Zaczynamy od światła.','Ustalamy zastosowanie, barwę, moc i wymiary taśmy. Na tej podstawie dobieramy rozwiązanie do Twojej oferty i uzgadniamy specyfikację produktu.','assets/offer/profile-led.webp'],
  ['02 / Twoja marka','Oznaczenia i opakowanie.','Nadruk na laminacie oraz opakowanie tworzą spójną identyfikację produktu. Zakres personalizacji ustalamy dla wybranej serii.','wp-content/uploads/2026/01/24d160-9-4080-1010_2124d160-9-4080-1010-2-scaled.png'],
  ['03 / Zaplecze','Produkcja i pomiary w jednym procesie.','Korzystasz z naszego zaplecza produkcyjnego i laboratorium. Parametry uzgadniamy przed realizacją, a zakres kontroli odnosimy do wybranego produktu.','wp-content/uploads/2026/02/lab2.webp'],
  ['04 / Materiały','Przygotowanie do Twojej oferty.','Możemy przygotować materiały graficzne, zdjęcia produktowe i dane techniczne. Omówimy również zakres wsparcia przy dokumentacji oraz rejestracji modeli w EPREL.','wp-content/uploads/2026/02/ce-rohs-eprel-2.webp']
 ],cta:'Zaplanujmy Twoją linię produktów',related:'laboratorium/',relatedLabel:'Poznaj laboratorium'
}];
const browser=await chromium.launch();
try{
 const p=await browser.newPage();const source=await fs.readFile(new URL('produkcja/index.html',root),'utf8');
 for(const c of configs){
  for(const image of [c.hero,...c.sections.map(s=>s[3])])await fs.access(new URL(image,root));
  const html=await p.evaluate(({source,c})=>{
   const d=new DOMParser().parseFromString(source,'text/html');
   const footer=d.querySelector('.footerSlide');footer.querySelectorAll('.footerFormCol').forEach(e=>e.remove());
   const footerMarkup=footer.outerHTML;
   d.title=c.title+' · PRESCOT LED';
   d.querySelectorAll('link[rel="canonical"],link[type*="oembed"],meta[name="description"]').forEach(e=>e.remove());
   const canonical=d.createElement('link');canonical.rel='canonical';canonical.href=c.slug+'/';d.head.append(canonical);
   const description=d.createElement('meta');description.name='description';description.content=c.intro;d.head.append(description);
   const style=d.createElement('link');style.rel='stylesheet';style.href='company-pages.css?v=20260913-app11';d.head.append(style);
   d.body.className='prescot-company-page';
   d.body.innerHTML=`<div id="top-sticky-logo"><a href="./" aria-label="Prescot — strona główna"><img src="wp-content/uploads/2025/12/biale-z-kolorem.svg" alt="PRESCOT LED"></a></div><main id="content"><section class="pc-hero"><img class="pc-hero-photo" src="${c.hero}" alt="${c.title}" fetchpriority="high">${c.video?'<video class="pc-hero-photo" autoplay muted loop playsinline preload="metadata" aria-hidden="true"><source src="assets/production/hero-mobile.mp4" media="(max-width:767px)" type="video/mp4"><source src="assets/production/hero-desktop.mp4" type="video/mp4"></video>':''}<div class="pc-hero-copy"><h1>${c.headline}</h1><p>${c.intro}</p><a class="pc-link" href="${c.slug}/#poznaj">Poznaj ${c.slug==='laboratorium'?'laboratorium':'możliwości'} ↓</a></div></section>${c.sections.map(([number,title,text,img],i)=>`<section class="pc-step" id="${i?'etap-'+(i+1):'poznaj'}"><div class="pc-step-copy"><span>${number}</span><h2>${title}</h2><p>${text}</p></div><figure><img src="${img}" alt="${title}" loading="lazy" decoding="async"></figure></section>`).join('')}${c.ep?'<section class="pc-eprel"><span>EPREL</span><h2>Dane o źródłach światła.</h2><p>EPREL to europejska baza produktów objętych etykietowaniem energetycznym. Publiczna część bazy pozwala sprawdzić informacje o zarejestrowanych modelach źródeł światła.</p><a class="pc-link" href="https://eprel.ec.europa.eu/screen/product/lightsources" target="_blank" rel="noopener">Otwórz oficjalną bazę EPREL ↗</a></section>':''}<section class="pc-contact"><h2>${c.cta}</h2><div><a class="pm-download" href="kontakt/?temat=${encodeURIComponent(c.title)}">Porozmawiaj z nami ↗</a><a class="pc-link" href="${c.related}">${c.relatedLabel} →</a></div></section>${footerMarkup}</main><script defer src="local-navigation.js?v=20260913-app11"></script><script type="module" src="company-pages.mjs?v=20260913-app11"></script>`;
   return '<!doctype html>\n'+d.documentElement.outerHTML;
  },{source,c});
  await fs.mkdir(new URL(c.slug+'/',root),{recursive:true});await fs.writeFile(new URL(c.slug+'/index.html',root),html.replace(/[\t ]+$/gm,'')+'\n');
 }
}finally{await browser.close();}
console.log('Built Laboratorium and Własny Brand using shared production typography, media and footer.');
