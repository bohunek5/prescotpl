import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const root=new URL('../',import.meta.url).pathname, version='20260914-polish2';
const descriptions={
 'Taśmy LED':'Polska produkcja. Taśmy SMD, COB, CCT i Digital — dobierz serię do swojej instalacji.',
 'Oprawy LED':'Oświetlenie wnętrz i ekspozycji. Sprawdź dostępne oprawy.',
 'Koszulki silikonowe PRO':'Jednolita linia światła. Elastyczne koszulki do zabudowy taśm LED.',
 'Sterowniki LED':'Pilot, odbiornik i opakowanie. Wybierz MONO, CCT, RGB, RGBW lub RGB+CCT.',
 'Zasilacze LED':'PR-MAD: sześć mocy od 36 do 300 W. Autodetekcja 12/24 V DC.',
 'Profile LED':'Profile KLUŚ i akcesoria do zabudowy linii światła.',
 'Akcesoria LED':'Złączki, przewody i elementy montażowe do instalacji LED.'
};
const browser=await chromium.launch();
try{
 const page=await browser.newPage();
 async function walk(dir){for(const item of await fs.readdir(dir,{withFileTypes:true})){
  if(item.name.startsWith('.')||['node_modules','output','konfigurator'].includes(item.name))continue;
  const file=path.join(dir,item.name);if(item.isDirectory()){await walk(file);continue;}
  if(!item.name.endsWith('.html'))continue;
  let html=await fs.readFile(file,'utf8');if(!html.includes('local-navigation.js'))continue;
  const rel=path.relative(root,file);
  if(!html.includes('presentation-polish.css'))html=html.replace('</head>',`<link rel="stylesheet" href="presentation-polish.css?v=${version}">\n</head>`);
  html=html.replace(/local-navigation\.js\?v=[\w-]+/g,`local-navigation.js?v=${version}`);
  html=html.replace(/Poznaj PRESCOT\s*<span[^>]*>LED<\/span>/g,'Poznaj nas <span class="pm-closer">bliżej</span>');
  const product=/^(v2\/)?(sterowniki-led|zasilacze-led)\/index\.html$/.test(rel);
  if(product){
   if(!html.includes('data-pm-product-photo='))html=html.replace(/<body\b/,'<body data-pm-product-photo="true"');
   for(const mode of ['mono','cct','rgb','rgbw','rgbcct'])html=html.replaceAll(`assets/showcase/${mode}-scene-right.svg`,`assets/controllers/${mode}-main.webp`);
   let i=0;html=html.replaceAll('assets/showcase/pr-mad-terminals-scene.svg',()=>`assets/prmad/pr-mad-${[36,60,100,150,200,300][i++%6]}w.webp`);
  }
  if(product||html.includes('as-slider')){
   html=html.replaceAll('assets/controllers/controller-living-room-hero-v2.webp','assets/controllers/mono-main.webp').replaceAll('assets/prmad/pr-mad-kitchen-hero.webp','assets/prmad/pr-mad-family.webp');
  }
  if(product)html=html.replace(/linear-gradient\(0deg,\s*rgba\([^)]+\),\s*rgba\([^)]+\)\),\s*url\(/g,'url(').replace(/linear-gradient\(0deg,#[a-f0-9]+,#[a-f0-9]+\),url\(/g,'url(');
  if(html.includes('as-slider')){
   const changes=await page.evaluate(({html,descriptions})=>{
    const d=new DOMParser().parseFromString(html,'text/html'),changes=[];
    const titles=[...d.querySelectorAll('.as-changing-widget h2')], paragraphs=[...d.querySelectorAll('.as-changing-widget p')];
    const short=(title,text)=>descriptions[title]||text.split(/(?<=[.!?])\s/)[0];
    paragraphs.forEach((p,i)=>{const title=titles[i]?.textContent.trim();let text=short(title,p.textContent.trim());if(text.length>170)text=text.slice(0,160).replace(/\s+\S*$/,'')+'…';changes.push([p.innerHTML,text]);});
    d.querySelectorAll('.elementor-testimonial__cite').forEach(c=>{const p=c.querySelector('.elementor-testimonial__title'),title=c.querySelector('.elementor-testimonial__name')?.textContent.trim();if(p&&descriptions[title])changes.push([p.innerHTML,descriptions[title]]);});
    d.querySelectorAll('.pm-feature').forEach(c=>{const p=c.querySelector('.pm-feature-summary'),title=c.querySelector('h2')?.textContent.trim();if(p)changes.push([p.innerHTML,short(title,p.textContent.trim())]);});
    return changes;
   },{html,descriptions});
   for(const [before,after]of changes)if(before&&before!==after)html=html.replaceAll(before,after.replaceAll('&','&amp;'));
  }
  if(rel.startsWith('dystrybucja'))html=html.replace(/href="#(sl-[^"]+)"/g,'href="dystrybucja/#$1"');
  await fs.writeFile(file,html);
 }}await walk(root);
}finally{await browser.close();}
for(const file of ['local-navigation.js','site-experience.mjs']){
 const full=path.join(root,file),old=await fs.readFile(full,'utf8');
 await fs.writeFile(full,old.replace(/((?:site-experience|mobile-refinement|mobile-navigation)\.mjs\?v=)[\w-]+/g,`$1${version}`));
}
