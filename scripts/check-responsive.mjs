import {chromium, webkit} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.BASE_URL || 'http://127.0.0.1:4178/';
const engine = process.env.BROWSER === 'webkit' ? webkit : chromium;
const widths = (process.env.TEST_WIDTHS || '320,390,430,768,1440').split(',').map(Number);
const routes = (process.env.ROUTES || 'produkcja/,oferta/,tasmy-led/,zasilacze-led/,sterowniki-led/,onecut/,dystrybucja/,kontakt/,baza-wiedzy/,wspolpraca-b2b/,').split(',');
const folder = 'output/responsive-verification';
await fs.mkdir(folder,{recursive:true});
const results = [], failures = [];
const check = (condition, label, context) => { results.push({label,...context,passed:Boolean(condition)}); if(!condition) failures.push({label,...context}); };
const browser = await engine.launch();
try {
 for (const width of widths) {
  const height = width <= 360 ? 740 : width < 768 ? 844 : 1000;
  const context = await browser.newContext({viewport:{width,height},hasTouch:width<768});
  const page = await context.newPage();
  for (const route of routes) {
   const errors = []; const onError = e => errors.push(e.message); page.on('pageerror',onError);
   const meta = {width,route};
   await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded'});
   await page.waitForTimeout(1500);
   await page.waitForFunction(()=>document.querySelector('.pm-more'));
   check(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth + 1),'no horizontal overflow',meta);
   const arrow = page.locator('#prescotScrollDown');
   check(await arrow.count() === 1,'one global arrow',meta);
   if(width < 768) {
    const dock = await page.locator('.prescot-dock').evaluate(e=>({x:e.getBoundingClientRect().x,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width,targets:[...e.querySelectorAll('.dock-item,.pm-more,.dock-lang-item')].filter(e=>e.getBoundingClientRect().width>0).map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))}));
    check(dock.x>=0 && dock.right<=width && dock.targets.every(t=>t.w>=44&&t.h>=44),'dock fits with 44px touch targets',{...meta,dock});
    await page.getByRole('button',{name:'Więcej stron',exact:true}).click();
    check(await page.locator('.pm-menu').isVisible(),'mobile menu opens',meta);
    check(await page.locator('.pm-menu nav a').count()===4,'secondary pages remain accessible',meta);
    await page.getByRole('button',{name:'Zamknij menu',exact:true}).click();
    check(!await page.locator('.pm-menu').isVisible(),'mobile menu closes',meta);
   }
   if (['oferta/','tasmy-led/'].includes(route) && width < 768) {
    const total = route==='oferta/'?7:15;
    check(await page.locator('.pm-feature').count()===total,'all models available',meta);
    check(await page.locator('.pm-model').count()===total,'all models in collection',meta);
    check(!await page.locator('.as-slider').isVisible(),'no duplicate desktop carousel',meta);
    await page.locator('.pm-feature-controls').getByRole('button',{name:'Następny model'}).click();
    await page.waitForTimeout(650);
    check((await page.locator('.pm-feature-counter').textContent()).startsWith('02'),'next model works',meta);
    await page.locator('.pm-feature-controls').getByRole('button',{name:'Poprzedni model'}).click();
    await page.waitForTimeout(650);
    check((await page.locator('.pm-feature-counter').textContent()).startsWith('01'),'previous model works',meta);
    // Native scrolling is the same path used by touch swipes.
    await page.locator('.pm-feature-track').evaluate((e,i)=>e.scrollTo({left:e.clientWidth*i,behavior:'instant'}),total-1);
    await page.waitForTimeout(200);
    check((await page.locator('.pm-feature-counter').textContent()).startsWith(String(total).padStart(2,'0')),'native horizontal scroll selects last model',meta);
    const composition = await page.locator('.pm-feature').last().evaluate(e=>{
     const copy=e.querySelector('.pm-feature-copy'),image=e.querySelector('img'),title=e.querySelector('h2'),cta=e.querySelector('.pm-cta');
     const controls=e.closest('.pm-catalog-hero').querySelector('.pm-feature-controls');
     return {titleTop:title.getBoundingClientRect().top,ctaBottom:cta.getBoundingClientRect().bottom,controlsTop:controls.getBoundingClientRect().top,imageHeight:image.getBoundingClientRect().height,cardHeight:e.getBoundingClientRect().height};
    });
    check(composition.titleTop>85&&composition.ctaBottom<=composition.controlsTop&&composition.imageHeight>=composition.cardHeight-1,'hero photo, text and controls fit',{...meta,composition});
    await arrow.click(); await page.waitForTimeout(750);
    check(await page.locator('.pm-collection').evaluate(e=>Math.abs(e.getBoundingClientRect().top)<80),'arrow opens collection',meta);
    await page.screenshot({path:`${folder}/${engine.name()}-${width}-${route.replace('/','')}-collection.png`});
   }
   if (route==='produkcja/') {
    const geometry = await page.locator('.scroll-track').evaluate(e=>({top:e.getBoundingClientRect().top+scrollY,height:e.offsetHeight,stage:e.querySelector('.scroll-div').offsetHeight}));
    const samples=[];
    for(const fraction of [.08,.45]){
     await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),geometry.top+(geometry.height-geometry.stage)*fraction);
     await page.waitForTimeout(150);
     samples.push(await page.locator('.scroll-track .grid').evaluate(e=>({transform:getComputedStyle(e).transform,opacity:Number(getComputedStyle(e).opacity),y:e.getBoundingClientRect().y,h:e.getBoundingClientRect().height})));
    }
    check(samples[0].transform!==samples[1].transform,'production rotates with scroll',meta);
    check(samples.every(s=>s.opacity>.9&&s.y+s.h>0&&s.y<height),'production stays visible during rotation',{...meta,samples});
    await page.screenshot({path:`${folder}/${engine.name()}-${width}-production-rotation.png`});
    const next=page.locator('.prescot-production-motion + .prescot-process-step');
    await next.evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY-100,behavior:'instant'})); await page.waitForTimeout(250);
    check(await page.locator('.scroll-track .grid').evaluate(e=>Number(getComputedStyle(e).opacity))===0,'production fades before lower content',meta);
    await page.screenshot({path:`${folder}/${engine.name()}-${width}-production-content.png`});
    if(width<768){await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));check(await page.locator('.elementor-element-280b012').evaluate(e=>Math.abs(e.getBoundingClientRect().height-innerHeight)<2),'original vertical video entrance retained',meta);}
   }
   if (['zasilacze-led/','sterowniki-led/'].includes(route)) {
    for (const card of await page.locator('.mdw-card-portfolio').all()) {
     await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(100);
     const metrics=await card.evaluate(e=>{
      const images=[...e.querySelectorAll('.elementor-widget-image')].map(e=>e.getBoundingClientRect().toJSON());
      const text=e.querySelector('.elementor-widget-text-editor')?.getBoundingClientRect().toJSON();
      return {images,text,fits:[...e.querySelectorAll('img')].every(e=>getComputedStyle(e).objectFit==='contain')};
     });
     check(metrics.fits&&metrics.images.every(r=>r.bottom<=metrics.text.top+1),'series images do not crop or cover specifications',{...meta,id:await card.getAttribute('id')});
    }
   }
   check(errors.length===0,'no JS errors',{...meta,errors});
   page.removeListener('pageerror',onError);
   console.log(engine.name(),width,route||'home','checked');
  }
  await context.close();
 }
}finally{await browser.close();}
await fs.writeFile(`${folder}/${engine.name()}.json`,JSON.stringify({checks:results.length,failures,results},null,2));
console.log(JSON.stringify({checks:results.length,failures},null,2));
assert.equal(failures.length,0,'Responsive checks failed');
