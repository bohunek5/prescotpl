import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const root=new URL('../',import.meta.url),version='20260913-studio4';
const media={lab:'wp-content/uploads/2026/02/lab2.webp',sphere:'wp-content/uploads/2026/01/kulka.png',tape:'wp-content/uploads/2026/01/24d160-9-4080-1010_2124d160-9-4080-1010-2-1024x683.png'};
for(const file of Object.values(media))await fs.access(new URL(file,root));
const browser=await chromium.launch();
try{
 const page=await browser.newPage(),source=await fs.readFile(new URL('produkcja/index.html',root),'utf8');
 const html=await page.evaluate(({source,media,version})=>{
  const d=new DOMParser().parseFromString(source,'text/html'),footer=d.querySelector('.footerSlide');footer.querySelectorAll('.footerFormCol').forEach(e=>e.remove());
  d.title='Laboratorium pomiarowe · PRESCOT LED';
  d.querySelectorAll('link[rel="canonical"],link[type*="oembed"],meta[name="description"]').forEach(e=>e.remove());
  const canonical=d.createElement('link');canonical.rel='canonical';canonical.href='laboratorium/';d.head.append(canonical);
  const description=d.createElement('meta');description.name='description';description.content='Laboratorium PRESCOT LED. Sprawdzamy strumień świetlny, temperaturę barwową i oddawanie barw taśm LED.';d.head.append(description);
  const style=d.createElement('link');style.rel='stylesheet';style.href='company-pages.css?v='+version;d.head.append(style);
  d.body.className='prescot-company-page prescot-lab';
  d.body.innerHTML=`
<header class="pc-header"><a class="pc-brand" href="./" aria-label="PRESCOT — strona główna"><img src="wp-content/uploads/2025/12/PRESCOT_logo-podstawowe.svg" alt="PRESCOT LED" width="150" height="32"></a><a class="pc-back" href="./"><span aria-hidden="true">←</span> Strona główna</a></header>
<main id="content">
<section class="lab-hero" aria-labelledby="lab-title"><div class="lab-hero-copy"><p class="lab-eyebrow">PRESCOT LAB</p><h1 id="lab-title">Mierzymy<br><em>światło.</em></h1><p class="lab-intro">Strumień, barwa i oddawanie kolorów. Sprawdzamy parametry taśm LED w naszym laboratorium.</p><a class="pc-link" href="laboratorium/#pomiary">Poznaj nasze pomiary <span aria-hidden="true">↓</span></a></div><figure class="lab-hero-image"><img src="${media.lab}" alt="Stanowisko pomiarowe z kulą całkującą i aparaturą do badania światła" width="1536" height="1024" fetchpriority="high"><figcaption>Stanowisko pomiarowe PRESCOT LED</figcaption></figure></section>
<section class="lab-measurements" id="pomiary" aria-labelledby="measurements-title"><div class="lab-section-heading"><p class="lab-eyebrow">OD ŚWIATŁA DO DANYCH</p><h2 id="measurements-title">Trzy parametry.<br>Konkretny obraz produktu.</h2></div><div class="lab-metrics"><article><span class="lab-metric-symbol">Φ <small>lm</small></span><h3>Strumień świetlny</h3><p>Ile światła emituje badana taśma. Wynik pomiaru wyrażamy w lumenach.</p></article><article><span class="lab-metric-symbol">CCT <small>K</small></span><h3>Temperatura barwowa</h3><p>Ciepła, neutralna czy chłodna biel. Sprawdzamy barwę emitowanego światła.</p></article><article><span class="lab-metric-symbol">CRI <small>Ra</small></span><h3>Oddawanie barw</h3><p>Współczynnik opisujący odwzorowanie kolorów w porównaniu ze światłem odniesienia.</p></article></div></section>
<section class="lab-equipment pc-step"><figure><img src="${media.sphere}" alt="Kula całkująca GL Optic" width="1024" height="1024" loading="lazy" decoding="async"></figure><div class="pc-step-copy"><p class="lab-eyebrow">ZAPLECZE POMIAROWE</p><h2>Kontrola zaczyna się<br>od pomiaru.</h2><p>Kula całkująca i aparatura pomiarowa pozwalają sprawdzić parametry źródła światła. Odnosimy wyniki do specyfikacji wybranej taśmy.</p><p>Laboratorium jest częścią naszego zaplecza produkcyjnego. Pomaga przejść od próbki do danych produktu.</p><a class="pc-link" href="produkcja/">Zobacz produkcję PRESCOT <span aria-hidden="true">↗</span></a></div></section>
<section class="lab-process pc-step"><div class="pc-step-copy"><p class="lab-eyebrow">PRÓBKA → POMIAR → DANE</p><h2>Od taśmy do<br>jej parametrów.</h2><ol class="lab-process-list"><li><span>01</span><div><h3>Określamy produkt</h3><p>Model taśmy, zastosowanie i parametry, które chcemy sprawdzić.</p></div></li><li><span>02</span><div><h3>Wykonujemy pomiar</h3><p>Badamy próbkę w ustalonych warunkach i porównujemy wynik ze specyfikacją.</p></div></li><li><span>03</span><div><h3>Pracujemy na danych</h3><p>Wyniki pomagają opisać produkt i ocenić jego parametry.</p></div></li></ol></div><figure><img src="${media.tape}" alt="Detal taśmy LED PRESCOT z diodami i polami lutowniczymi" width="1024" height="683" loading="lazy" decoding="async"></figure></section>
<section class="pc-contact"><p class="lab-eyebrow">POROZMAWIAJMY O TWOIM PRODUKCIE</p><h2>Jakie światło<br>chcesz sprawdzić?</h2><p>Przekaż nam model taśmy i zakres potrzebnych pomiarów.</p><div><a class="pm-download" href="kontakt/?temat=Laboratorium">Kontakt z PRESCOT <span aria-hidden="true">↗</span></a><a class="pc-link" href="konfigurator/">Skomponuj zestaw w 3D <span aria-hidden="true">↗</span></a></div></section>
${footer.outerHTML}</main><script defer src="local-navigation.js?v=${version}"></script>`;
  return '<!doctype html>\n'+d.documentElement.outerHTML;
 },{source,media,version});
 await fs.mkdir(new URL('laboratorium/',root),{recursive:true});await fs.writeFile(new URL('laboratorium/index.html',root),html.replace(/[\t ]+$/gm,'')+'\n');
 // The retired page has no navigation entry; old links resolve to production.
 await fs.writeFile(new URL('wlasny-brand/index.html',root),'<!doctype html>\n<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=../produkcja/"><link rel="canonical" href="../produkcja/"><title>Produkcja · PRESCOT LED</title></head><body><a href="../produkcja/">Przejdź do produkcji PRESCOT LED</a></body></html>\n');
}finally{await browser.close();}
console.log('Built PRESCOT Lab and retired the separate brand page.');
