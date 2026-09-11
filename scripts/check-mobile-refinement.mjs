import {chromium,webkit} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/';
const folder='output/mobile-refinement'; await fs.mkdir(folder,{recursive:true});
const widths=(process.env.TEST_WIDTHS||'390,320,1440').split(',').map(Number);
const height=Number(process.env.TEST_HEIGHT||844);
const routes=(process.env.ROUTES||'dslim4/,d160s/,truecolor/,onecut/,silpro/,sterowniki-led/,zasilacze-led/,tasmy-led/,oferta/,dystrybucja/,prescotled/').split(',');
const engines=process.env.BROWSER==='chromium'?[chromium]:[chromium,webkit];
const report=[];
for(const engine of engines){
 const browser=await engine.launch();
 try{
  for(const width of widths)for(const route of routes){
   const page=await browser.newPage({viewport:{width,height},isMobile:width<768,hasTouch:width<768});
   try{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.pm-scroll-guides',{state:'attached'});
    const cards=page.locator('.pm-mobile-showcase');
    const count=await cards.count();
    if(count){
     const card=cards.first();
     for(const progress of [0,.5,1]){
      await card.evaluate((e,p)=>scrollTo({top:scrollY+e.getBoundingClientRect().top+(e.offsetHeight-innerHeight)*p,behavior:'instant'}),progress);
      await page.waitForTimeout(200);
      await card.locator('img').evaluateAll(images=>Promise.all(images.map(image=>image.decode().catch(()=>{}))));
      if(width===390)await page.screenshot({path:`${folder}/${engine.name()}-${route.replaceAll('/','')}-${progress}.png`});
     }
     const state=await card.evaluate(e=>{
      const copy=e.querySelector('.pm-reveal-copy').getBoundingClientRect();
      return {copy:{top:copy.top,bottom:copy.bottom,left:copy.left,right:copy.right},images:[...e.querySelectorAll('img')].map(i=>({loaded:i.complete&&i.naturalWidth>0,src:i.src})),overflow:document.documentElement.scrollWidth>innerWidth+1};
     });
     assert.ok(state.images.every(i=>i.loaded),`Images load: ${JSON.stringify(state.images.filter(i=>!i.loaded))}`);
     assert.ok(!state.overflow,`${route} horizontal overflow`);
     if(width<768){assert.ok(state.copy.top>=0&&state.copy.bottom<=height,`${route} copy fits: ${JSON.stringify(state.copy)}`);}
     const details=card.locator('.pm-full-description');
     if(width<768&&await details.count()){
      await details.first().locator('summary').click();await page.waitForTimeout(100);
      assert.equal(await details.first().getAttribute('open'),'');
      await details.first().locator('summary').click();
     }
     const downloads=page.locator('a.pm-download');
     for(const href of await downloads.evaluateAll(links=>links.map(a=>a.href).filter(href=>href.includes('/assets/showcase/'))))assert.ok((await page.request.get(href)).ok());
     if(width<768){
      const last=cards.last();
      await last.evaluate(e=>scrollTo({top:scrollY+e.getBoundingClientRect().bottom-innerHeight,behavior:'instant'}));
      await page.waitForTimeout(200);
      const r=await last.locator('.pm-reveal-copy').evaluate(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom};});
      assert.ok(r.top>=0&&r.bottom<=height,`${route} last copy/downloads fit ${JSON.stringify(r)}`);
      if(width===390)await page.screenshot({path:`${folder}/${engine.name()}-${route.replaceAll('/','')}-last.png`});
     }
    }
    if(width<768){
     await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(100);
     await page.getByRole('button',{name:'Więcej stron',exact:true}).click();
     await page.waitForTimeout(240);
     const geometry=await page.locator('.pm-menu').evaluate(e=>{const r=e.getBoundingClientRect(),dock=document.querySelector('.prescot-dock').getBoundingClientRect();return {top:r.top,bottom:r.bottom,dockTop:dock.top,width:r.width};});
     assert.ok(geometry.top>=0&&geometry.bottom<=geometry.dockTop+1,`Sheet above dock ${JSON.stringify(geometry)}`);
     if(route==='prescotled/')await page.screenshot({path:`${folder}/${engine.name()}-${width}-menu.png`});
     await page.getByRole('button',{name:'Zamknij menu',exact:true}).click();
    }
    if(['tasmy-led/','oferta/'].includes(route)){
     assert.equal(await page.locator('.pm-collection').count(),0);
     assert.equal(await page.locator('.pm-intro-guide:visible').count(),0);
     if(width===390){
      const features=page.locator('.pm-feature');
      for(let i=0;i<await features.count();i++){
       await page.locator('.pm-feature-track').evaluate((e,i)=>e.scrollTo({left:i*e.clientWidth,behavior:'instant'}),i);await page.waitForTimeout(600);
       await features.nth(i).locator('img').evaluate(e=>e.decode());
       if(route==='tasmy-led/'&&[6,8,9,12,13,14].includes(i))await page.screenshot({path:`${folder}/${engine.name()}-catalogue-${i}.png`});
      }
     }
    }
    const footer=page.locator('.pm-footer');
    if(await footer.count()){
     await footer.scrollIntoViewIfNeeded();
     await page.waitForTimeout(200);
     assert.equal(await footer.evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(245, 247, 250)');
     assert.ok((await footer.locator('.footerLogo img').getAttribute('src')).includes('PRESCOT_logo-podstawowe.svg'));
     if(route==='prescotled/')await page.screenshot({path:`${folder}/${engine.name()}-${width}-footer.png`});
    }
    assert.deepEqual(errors,[]);
    report.push({engine:engine.name(),width,route,cards:count,status:'pass'});console.log('PASS',engine.name(),width,route);
   }finally{await page.close();}
  }
 }finally{await browser.close();}
}
await fs.writeFile(`${folder}/report.json`,JSON.stringify(report,null,2));
