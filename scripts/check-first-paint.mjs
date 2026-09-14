import {chromium, webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/';
// WebKit waits for DOMContentLoaded in fonts.ready; hydration is intentionally held here.
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
await fs.mkdir('output/first-paint',{recursive:true});
for(const engine of process.env.BROWSER==='webkit'?[webkit]:[chromium,webkit]){
 const browser=await engine.launch();
 try{for(const width of [390,1440])for(const route of ['', 'prescotled/','produkcja/','dystrybucja/','oferta/','tasmy-led/','silpro/','kontakt/']){
  const page=await browser.newPage({viewport:{width,height:900}});
  let release;const gate=new Promise(resolve=>{release=resolve;});
  await page.route('**/local-navigation.js*',async request=>{await gate;await request.continue();});
  await page.goto(new URL(route,base).href,{waitUntil:'commit'});
  await page.waitForSelector('body',{state:'attached'});
  await page.waitForFunction(()=>[...document.styleSheets].some(s=>s.href?.includes('mobile-refinement.css')));
  await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1500))]));await page.waitForTimeout(250);
  const caps=page.locator('.pm-capabilities');const home=['','prescotled/'].includes(route);
  const catalogue=['oferta/','tasmy-led/'].includes(route)&&width<768;
  if(catalogue){assert.equal(await page.locator('.pm-catalog').count(),1,'Final catalogue exists before hydration');assert.equal(await page.locator('.as-slider').isVisible(),false,'Old carousel never appears');}
  let before;
  if(home){
   assert.equal(await caps.locator('.pm-capability-link').count(),6,'Final links exist before JavaScript');
   assert.equal(await caps.locator('.e-font-icon-svg').count(),0,'No legacy hero icons');
   before=await caps.boundingBox();assert.ok(Math.abs(before.x+before.width/2-width/2)<2,'Centred before hydration');
  }
  const captions=await page.locator('.pm-production-caption').count();
  if(route==='produkcja/')assert.ok(captions>0,'Final production captions before hydration');
  await page.screenshot({path:`output/first-paint/${engine.name()}-${width}-${route.replaceAll('/','')||'home'}-before.png`});
  release();await page.waitForSelector('.pm-more',{state:'attached'});await page.waitForTimeout(300);
  if(home){const after=await caps.boundingBox();for(const key of ['x','y','width','height'])assert.ok(Math.abs(before[key]-after[key])<2,`No ${key} jump ${before[key]} -> ${after[key]}`);assert.equal(await caps.locator('.pm-capability-link').count(),6,'No duplicate hydration');}
  if(route==='produkcja/')assert.equal(await page.locator('.pm-production-caption').count(),captions,'No duplicate production captions');
  if(catalogue){assert.equal(await page.locator('.pm-catalog').count(),1);const counter=page.locator('.pm-feature-counter');const initial=await counter.innerText();await page.locator('.pm-catalog').getByRole('button',{name:'Następny model',exact:true}).click();await page.waitForTimeout(800);assert.notEqual(await counter.innerText(),initial,'Prerendered carousel is interactive');}
  await page.screenshot({path:`output/first-paint/${engine.name()}-${width}-${route.replaceAll('/','')||'home'}-after.png`});
  console.log('PASS delayed initialization',engine.name(),width,route||'home');await page.close();
 }}finally{await browser.close();}
}
