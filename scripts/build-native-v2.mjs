// Copy SILPRO and Oferta, including original Elementor styles and animateCards.
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {pages} from '../v2/catalogue-data.mjs';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFile(new URL(p,root),'utf8');
const write=async(p,s)=>{await fs.mkdir(new URL(p.substring(0,p.lastIndexOf('/')+1),root),{recursive:true});await fs.writeFile(new URL(p,root),s.replace(/[\t ]+$/gm,'')+'\n');};
const uri=async p=>'data:image/webp;base64,'+(await fs.readFile(new URL(p,root))).toString('base64');
const svg=body=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1620 1080"><defs><radialGradient id="light"><stop stop-color="#222831"/><stop offset="1" stop-color="#030507"/></radialGradient></defs><path fill="url(#light)" d="M0 0h1620v1080H0z"/>${body}</svg>`;
const image=(href,x,y,w,h,extra='')=>`<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
const room=await uri('assets/controllers/controller-living-room-hero-v2.webp');
const holder=await uri('assets/showcase/magnetic-holder-source.webp');
for(const key of ['mono','cct','rgb','rgbw','rgbcct']){
 const remote=await uri(`assets/showcase/${key}-remote.webp`),receiver=await uri(`assets/showcase/${key}-receiver.webp`);
 await write(`assets/showcase/${key}-scene-left.svg`,svg(image(room,0,0,1620,1080,'opacity=".38" preserveAspectRatio="xMidYMid slice"')+image(remote,150,0,1320,1080)));
 const mount=`<svg x="715" y="170" width="110" height="260" viewBox="375 438 193 450"><defs><clipPath id="holder"><path d="M430 443 Q504 442 525 459 Q543 492 563 503 L563 834 Q559 882 507 883 L423 883 Q379 878 379 833 L379 492 Q380 444 430 443Z"/></clipPath></defs>${image(holder,0,0,1024,1024,'clip-path="url(#holder)"')}</svg>`;
 await write(`assets/showcase/${key}-scene-right.svg`,svg('<path d="m460 750 510-145 235 180-510 145z" fill="#101419" stroke="#4b535e" stroke-width="2"/>'+mount+image(receiver,590,370,440,470)));
}
for(const w of [36,60,100,150,200,300])await write(`assets/showcase/pr-mad-${w}-scene.svg`,svg(image(await uri(`assets/showcase/pr-mad-${w}w.webp`),230,80,1160,920)));
await write('assets/showcase/pr-mad-terminals-scene.svg',svg(image(await uri('assets/showcase/pr-mad-terminals.webp'),170,-80,1280,1180)));
const modelsFor=p=>p.models.map((m,i)=>{
 if(p.slug==='sterowniki-led')return {...m,left:`assets/showcase/${m.key}-scene-left.svg`,right:`assets/controllers/${m.key}-main.webp`,description:m.description+' Pilot RF, odbiornik i uchwyt magnetyczny w zestawie.'};
 if(p.slug==='zasilacze-led'){
  const w=[36,60,100,150,200,300][i];return {...m,left:`assets/showcase/pr-mad-${w}-scene.svg`,right:`assets/prmad/pr-mad-${w}w.webp`,pdf:`assets/showcase/pr-mad-${w}w.pdf`,description:`${m.description} Autodetekcja 12/24 V DC. Moc ${w} W, IP20. Wymiary ${[145,145,176,199,218,240][i]} × 50 × 29 mm.`};
 }
 return {...m,left:m.image,right:['assets/offer/klus-profile.webp','assets/prmad/pr-mad-kitchen-hero.webp','assets/controllers/controller-living-room-hero-v2.webp'][i]};
});
const browser=await chromium.launch();
try{
 const page=await browser.newPage();
 const silpro=await read('silpro/index.html'),offer=await read('oferta/index.html');
 for(const p of pages.filter(p=>p.slug!=='akcesoria-led')){
  const models=modelsFor(p);
  for(const m of models)for(const file of [m.left,m.right,m.pdf].filter(Boolean))await fs.access(new URL(file,root));
  const html=await page.evaluate(({source,p,models})=>{
   const d=new DOMParser().parseFromString(source,'text/html');d.title=p.label+' · PRESCOT LED';d.body.dataset.prescotTemplate='silpro';d.querySelector('meta[name="robots"]').content='noindex,follow';
   d.querySelector('link[rel="canonical"]').setAttribute('href',p.slug+'/');
   d.querySelectorAll('link[type*="oembed"]').forEach(e=>e.remove());
   d.querySelectorAll('[data-gt-orig-url]').forEach(e=>e.dataset.gtOrigUrl='/v2/'+p.slug+'/');
   const css=d.createElement('link');css.rel='stylesheet';css.href='v2/native.css?v=20260913-native10';d.head.append(css);
   if(['sterowniki-led','zasilacze-led'].includes(p.slug))d.body.dataset.pmProductPhoto='true';
   const hero=d.querySelector('.elementor-element-19d3d39b');hero.style.setProperty('background-image',`url("${p.hero}")`,'important');
   hero.querySelectorAll('.elementor-widget-heading h2').forEach(e=>e.textContent=p.label);
   hero.querySelectorAll('.mdw-gradient').forEach(e=>['#e14e26','#ed724a','#f3ab8c','#f4d8cb','#fff'].forEach((tone,n)=>e.style.setProperty('--sun-'+(n+1),tone)));
   hero.querySelectorAll('.elementor-widget-text-editor p').forEach(e=>e.textContent=p.intro);
   const originals=[...d.querySelectorAll('.mdw-card-portfolio')],destination=originals[0].parentNode;
   models.forEach((m,i)=>{
    const card=originals[i%4].cloneNode(true);card.id='model-'+m.key;card.dataset.model=m.key;
    card.querySelectorAll('[data-id]').forEach(e=>e.dataset.id=e.dataset.id+'-model'+i);
    card.querySelector('.elementor-button-text').textContent=m.title;card.querySelector('.elementor-widget-heading h2').textContent=p.slug==='sterowniki-led'?m.label:p.slug==='zasilacze-led'?'PR-MAD '+m.label:m.title;
    const tones=p.slug==='sterowniki-led'?(m.key==='mono'?['#aab4c2','#c7d0dc','#eff3f8','#fff','#fff']:m.key==='cct'?['#e8b45e','#ead1a5','#e6e9ed','#fff','#fff']:['#fb5d9a','#b877ff','#79aafa','#b8e4dd','#fff']):['#e14e26','#ed724a','#f3ab8c','#f4d8cb','#fff'];
    card.querySelectorAll('.mdw-gradient').forEach(e=>tones.forEach((tone,n)=>e.style.setProperty('--sun-'+(n+1),tone)));
    const description=card.querySelector('.elementor-widget-text-editor .elementor-widget-container'),text=d.createElement('p');text.textContent=m.description;description.replaceChildren(text);
    for(const [side,src] of [['left',m.left],['right',m.right]]){
     const img=d.createElement('img');img.src=src;img.alt=m.title+(side==='left'?' — zastosowanie i produkt':' — szczegóły');img.loading='lazy';img.decoding='async';card.querySelector('.mdw-card-portfolio-image-'+side+' .elementor-widget-container').replaceChildren(img);
    }
    const actions=d.createElement('div');actions.className='pn-model-actions';const a=d.createElement('a');a.href=m.pdf||'kontakt/?temat='+encodeURIComponent(m.title);a.textContent=m.pdf?'Pobierz kartę katalogową':'Zapytaj o dobór';a.className='pm-download';if(m.pdf){a.target='_blank';a.rel='noopener';}actions.append(a);
    if(m.video){const video=d.createElement('a');video.href=m.video;video.target='_blank';video.rel='noopener';video.className='pn-film-link';video.textContent='Obejrzyj film modelu ↗';actions.append(video);}
    card.querySelector('.e-con-inner').append(actions);destination.insertBefore(card,originals[0]);
   });originals.forEach(e=>e.remove());
   d.querySelectorAll('a[href^="#true"]').forEach(a=>a.setAttribute('href','v2/'+p.slug+'/#model-'+models[0].key));
   return '<!doctype html>\n'+d.documentElement.outerHTML;
  },{source:silpro,p,models});
  await write(`v2/${p.slug}/index.html`,html);
  if(['sterowniki-led','zasilacze-led'].includes(p.slug))await write(`${p.slug}/index.html`,html.replace('content="noindex,follow"','content="max-image-preview:large"').replaceAll('v2/'+p.slug+'/',p.slug+'/'));
 }
 const accessories=pages.find(p=>p.slug==='akcesoria-led');
 const configs=[{path:'v2/akcesoria-led/index.html',title:accessories.label,models:accessories.models.map((m,i)=>({...m,image:i===0?m.detail:m.image,href:'akcesoria/#true'+(i+1)}))},{path:'v2/index.html',title:'Oferta · V2',models:pages.map(p=>({title:p.label,description:p.intro,image:p.hero,href:`v2/${p.slug}/`}))}];
 for(const config of configs){
  const html=await page.evaluate(({source,config})=>{
   const d=new DOMParser().parseFromString(source,'text/html');d.title=config.title+' · PRESCOT LED';d.body.dataset.prescotTemplate='oferta';d.querySelector('meta[name="robots"]').content='noindex,follow';const slider=d.querySelector('.as-slider');
   d.querySelector('link[rel="canonical"]').setAttribute('href',config.path.replace('index.html',''));
   for(const selector of ['.as-changing-widget h2','.as-changing-widget p','.as-changing-widget a.elementor-button']){
    [...slider.querySelectorAll(selector)].forEach((e,i)=>{const m=config.models[i];if(!m){e.closest('.elementor-widget').remove();return;}if(e.tagName==='H2')e.textContent=m.title;else if(e.tagName==='P')e.textContent=m.description;else{e.href=m.href;e.querySelector('.elementor-button-text').textContent='Zobacz produkty';}});
   }
   for(const selector of ['.as-side-slider .swiper-slide','.dm-card-slider .swiper-slide'])d.querySelectorAll(selector).forEach((e,i)=>{
    const m=config.models[i];if(!m){e.remove();return;}const img=e.querySelector('img');img.src=m.image;img.dataset.src=m.image;img.alt=m.title;e.querySelector('.elementor-testimonial__name').textContent=m.title;e.querySelector('.elementor-testimonial__title').textContent=m.description;
   });
   const settings=JSON.parse(slider.dataset.settings);settings.background_slideshow_gallery=config.models.map((m,i)=>({id:28000+i,url:m.image}));slider.dataset.settings=JSON.stringify(settings);
   d.querySelectorAll('script:not([src])').forEach(script=>{
    if(script.textContent.includes("const slider = document.querySelector('.dm-card-slider')"))script.textContent=script.textContent.replace(/const links = \[[\s\S]*?\];/,'const links = '+JSON.stringify(config.models.map(m=>m.href))+';');
   });
   return '<!doctype html>\n'+d.documentElement.outerHTML;
  },{source:offer,config});await write(config.path,html);
 }
}finally{await browser.close();}
console.log('Built SILPRO-based product pages and original offer-style V2 catalogues.');
