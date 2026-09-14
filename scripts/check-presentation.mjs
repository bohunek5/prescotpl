import {chromium,webkit} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/';
await fs.mkdir('output/presentation',{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch();
 try{for(const width of [390,1920]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  for(const route of ['', 'oferta/','tasmy-led/','sterowniki-led/','zasilacze-led/','baza-wiedzy/']){
   await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded'});await page.waitForSelector('.pm-more',{state:'attached'});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route+' no overflow');
   if(!route){assert.match(await page.locator('.pm-entrance-caption').innerText(),/Poznaj nas bliżej/);assert.equal(await page.locator('.pm-closer').evaluate(e=>getComputedStyle(e).color),'rgb(229, 89, 51)');}
   if(['oferta/','tasmy-led/'].includes(route)&&width>767){
    const cite=page.locator('.as-side-slider .elementor-testimonial__cite').first();
    assert.match(await cite.evaluate(e=>getComputedStyle(e).backgroundColor),/255, 255, 255/);
    assert.ok(await cite.locator('.elementor-testimonial__name').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=16));
    for(const text of await page.locator('.as-changing-widget p').allTextContents())assert.ok(text.trim().length<=175,'Short catalogue copy');
   }
   if(['sterowniki-led/','zasilacze-led/'].includes(route)){
    assert.ok(!(await page.locator('.elementor-element-19d3d39b').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('gradient'),'No dark layer on white product photo');
    if(width>767)assert.ok(await page.locator('.elementor-element-19d3d39b p').first().evaluate(e=>e.getBoundingClientRect().width>=300),'Readable hero copy width');
    const images=page.locator('.mdw-card-portfolio-image-right img');
    assert.equal(await images.count(),route==='sterowniki-led/'?5:6);
    const sources=await images.evaluateAll(es=>es.map(e=>e.getAttribute('src')));assert.ok(sources.every(s=>s.includes(route==='sterowniki-led/'?'assets/controllers/':'assets/prmad/')));
    assert.ok(sources.every(s=>s.endsWith('.webp')));
    for(const source of sources)await fs.access(source);
    await page.locator('.mdw-card-portfolio').first().evaluate(e=>e.scrollIntoView({behavior:'instant',block:'start'}));
   }
   if(route==='baza-wiedzy/'){await page.locator('#kalkulator-led').scrollIntoViewIfNeeded();assert.match(await page.locator('.calc-rec-card').evaluate(e=>getComputedStyle(e).backgroundColor),/255, 255, 255/);}
   await page.screenshot({path:`output/presentation/${engine.name()}-${width}-${route.replaceAll('/','')||'home'}.png`});console.log('PASS appearance',engine.name(),width,route||'home');
  }
  for(const route of ['', 'dystrybucja/','oferta/']){
   await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded'});await page.waitForSelector('.pm-configurator-dock');
   await page.locator('.pm-configurator-dock').click();await page.waitForURL('**/konfigurator/');
   assert.ok((await page.title()).includes('Konfigurator'));
  }
  await page.goto(new URL('dystrybucja/',base).href,{waitUntil:'domcontentloaded'});await page.waitForSelector('.pm-more',{state:'attached'});
  await page.locator('.dist-pill[href$="#sl-elba"]').click();await page.waitForTimeout(400);assert.ok(new URL(page.url()).pathname.endsWith('/dystrybucja/'));assert.equal(new URL(page.url()).hash,'#sl-elba');
  console.log('PASS configurator and ELBA links',engine.name(),width);await page.close();
 }}finally{await browser.close();}
}
