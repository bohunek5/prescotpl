import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const folder='output/mobile-details';
await fs.mkdir(folder,{recursive:true});
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const report=[];
 for(const route of ['d160s/','dslim4/','truecolor/','sterowniki-led/','zasilacze-led/','tasmy-led/','oferta/']) {
  await page.goto(`http://127.0.0.1:4178/${route}`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.pm-more',{state:'attached'});
  const cards=await page.locator('.mdw-card-portfolio').evaluateAll(cards=>cards.map(e=>({id:e.id,text:e.innerText,children:[...e.querySelector(':scope > .e-con-inner').children].map(c=>({cls:c.className,text:c.innerText,html:c.matches('.elementor-widget-text-editor')?c.innerHTML:undefined})),images:[...e.querySelectorAll('img')].map(i=>({src:i.getAttribute('src'),alt:i.alt})),links:[...e.querySelectorAll('a[href]')].map(a=>({text:a.innerText,href:a.getAttribute('href')}))})));
  const models=await page.locator('.pm-feature').evaluateAll(cards=>cards.map(e=>({title:e.querySelector('h2').innerText,src:e.querySelector('img').src,description:e.querySelector('.pm-feature-summary').innerText})));
  report.push({route,cards,models});
  if(cards.length){await page.locator('.mdw-card-portfolio').first().evaluate(e=>scrollTo({top:scrollY+e.getBoundingClientRect().top,behavior:'instant'}));await page.waitForTimeout(500);}
  await page.screenshot({path:`${folder}/${route.replace('/','')}-before.png`});
 }
 await fs.writeFile(`${folder}/before.json`,JSON.stringify(report,null,2));
 const refs=(await fs.readdir('output/mobile-reference')).filter(f=>f.endsWith('.PNG')).sort();
 await page.setViewportSize({width:1500,height:1400});
 for(let i=0;i<refs.length;i+=10){
  const images=await Promise.all(refs.slice(i,i+10).map(async f=>`<figure><figcaption>${f}</figcaption><img src="data:image/png;base64,${(await fs.readFile(`output/mobile-reference/${f}`)).toString('base64')}"></figure>`));
  await page.setContent(`<style>body{margin:0;background:#bbb;display:grid;grid-template-columns:repeat(5,1fr);gap:5px;font:18px sans-serif}figure{margin:0}img{width:100%;height:655px;object-fit:contain;background:#fff}</style>${images.join('')}`);
  await page.screenshot({path:`${folder}/references-${i/10}.png`,fullPage:true});
 }
}finally{await browser.close();}
