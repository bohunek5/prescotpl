import {chromium,webkit} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/';
const folder='output/native-showcase';await fs.mkdir(folder,{recursive:true});
const height=Number(process.env.TEST_HEIGHT||900);
for(const engine of process.env.BROWSER==='chromium'?[chromium]:[chromium,webkit]){
 const browser=await engine.launch();
 try{for(const width of (process.env.TEST_WIDTHS||'390,1440').split(',').map(Number)){
  const page=await browser.newPage({viewport:{width,height},isMobile:width<768,hasTouch:width<768});let originalMotion;
  for(const route of ['silpro/','sterowniki-led/','zasilacze-led/','v2/sterowniki-led/','v2/zasilacze-led/','v2/profile-led/','v2/akcesoria-led/','v2/','']){
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(new URL(route,base).href,{waitUntil:'load'});await page.waitForSelector('.pm-scroll-guides',{state:'attached'});await page.waitForTimeout(1800);
   const cards=page.locator('.mdw-card-portfolio');const count=await cards.count();
   if(count){
    const motion=await page.evaluate(()=>window.animateCards.toString());
    if(route==='silpro/')originalMotion=motion;else assert.equal(motion,originalMotion,'Exact original SILPRO animation');
    assert.equal(await page.locator('.pm-series-showcase,.pm-series-copy,.pm-product-scene,.v-model').count(),0,'No alternative layout');
    for(const progress of [0,.6,1]){
     await cards.first().evaluate((e,p)=>scrollTo({top:scrollY+e.getBoundingClientRect().top+(e.offsetHeight-innerHeight)*p,behavior:'instant'}),progress);
     await cards.first().locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await page.waitForTimeout(150);
     await page.screenshot({path:`${folder}/${engine.name()}-${width}-${route.replaceAll('/','_')}-${progress}.png`});
    }
    for(let i=0;i<count;i++){
     const c=cards.nth(i);await c.evaluate(e=>scrollTo({top:scrollY+e.getBoundingClientRect().bottom-innerHeight,behavior:'instant'}));await page.waitForTimeout(80);
     await c.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
     if(width<768){const r=await c.locator('.pm-reveal-copy').evaluate(e=>e.getBoundingClientRect().toJSON());assert.ok(r.top>=0&&r.bottom<=height,`${route} ${i} mobile copy fits`);}
    }
    for(const href of await page.locator('.mdw-card-portfolio a[href$=".pdf"]').evaluateAll(links=>links.map(a=>a.href)))assert.ok((await page.request.head(href)).ok(),href);
   }else if(route===''){
    if(width>=768){const delta=await page.locator('.pm-capabilities').evaluate(e=>{const r=e.getBoundingClientRect(),h=e.closest('.elementor-element-216d8696').getBoundingClientRect();return Math.abs((r.top+r.bottom-h.top-h.bottom)/2);});assert.ok(delta<12,`Benefits centred in hero: ${delta}`);}
    await page.screenshot({path:`${folder}/${engine.name()}-${width}-home.png`});
   }else{
    assert.equal(await page.locator('.as-slider').count(),1);assert.equal(await page.locator('.v-model').count(),0);
    const expected=route==='v2/'?4:7;assert.equal(await page.locator('.pm-feature').count(),expected);
    await page.screenshot({path:`${folder}/${engine.name()}-${width}-${route.replaceAll('/','_')}.png`});
    if(width<768){await page.locator('.pm-feature-controls button').last().click();await page.waitForTimeout(700);assert.ok((await page.locator('.pm-feature-counter').textContent()).startsWith('02'));}
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route} no overflow`);
   assert.deepEqual(errors,[]);console.log('PASS',engine.name(),width,route||'home',count);
  }await page.close();
 }}finally{await browser.close();}
}
