import {chromium,webkit} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const folder='output/mobile-polish';
await fs.mkdir(folder,{recursive:true});
const results=[];
for(const engine of [chromium,webkit]) {
 const browser=await engine.launch();
 try {
  for(const width of [320,390,430,1440]) {
   const page=await browser.newPage({viewport:{width,height:844},hasTouch:width<768,isMobile:width<768});
   await page.addInitScript(()=>{
    window.__userScroll=window.scrollTo.bind(window);window.__scrollCalls=[];
    window.scrollTo=(...args)=>{window.__scrollCalls.push(args);return window.__userScroll(...args);};
   });
   const goto=async route=>{await page.goto(`http://127.0.0.1:4178/${route}`,{waitUntil:'domcontentloaded'});await page.waitForSelector('.pm-more',{state:'attached'});await page.waitForTimeout(650);};
   await goto('');
   assert.equal(await page.locator('.pm-capabilities > *').count(),6);
   assert.match(await page.locator('.pm-capabilities').innerText(),/Linia produkcyjna SMT/);
   assert.match(await page.locator('.pm-capabilities').innerText(),/Laboratorium pomiarowe/);
   assert.equal(await page.locator('.elementor-element-216d8696 .elementor-shape-bottom:visible').count(),0);
   const heroState=await page.locator('.elementor-element-216d8696').evaluate(e=>{
    const r=e.getBoundingClientRect(),v=e.querySelector('video'),vr=v.getBoundingClientRect();
    return {left:r.left,right:r.right,videoLeft:vr.left,videoRight:vr.right,videoHeight:vr.height,heroHeight:r.height,fit:getComputedStyle(v).objectFit};
   });
   assert.ok(Math.abs(heroState.videoLeft)<1&&Math.abs(heroState.videoRight-width)<1);
   assert.equal(heroState.videoHeight,heroState.heroHeight);assert.equal(heroState.fit,'cover');
   if(width<768) {
    const dock=page.locator('.prescot-dock');
    assert.equal(await dock.locator('a.dock-item:visible').count(),5);
    assert.match(await dock.innerText(),/Dystrybucja/);
    await page.getByRole('button',{name:'Więcej stron',exact:true}).click();
    assert.equal(await page.locator('.pm-menu nav a').count(),4);
    assert.equal(await page.locator('.pm-menu a[href="https://prescot.abstore.pl/"]').count(),1);
    assert.equal(await page.locator('.pm-menu .dock-lang-item').count(),1);
    assert.equal(await page.locator('.pm-menu nav a').filter({hasText:'Dystrybucja'}).count(),0);
    await page.locator('.pm-menu .gt-selected').click();
    await page.waitForTimeout(300);
    const languages=await page.locator('.pm-menu .gt_options').evaluate(e=>{
     const r=e.getBoundingClientRect(),dialog=e.closest('dialog').getBoundingClientRect();
     return {visible:getComputedStyle(e).display!=='none',fits:r.top>=dialog.top&&r.bottom<=dialog.bottom&&r.left>=dialog.left&&r.right<=dialog.right};
    });
    assert.ok(languages.visible&&languages.fits,'Language choices stay within the mobile menu');
    await page.locator('.pm-menu .gt-selected').click();
    await page.screenshot({path:`${folder}/${engine.name()}-${width}-menu.png`});
    await page.getByRole('button',{name:'Zamknij menu',exact:true}).click();
   }
   await page.screenshot({path:`${folder}/${engine.name()}-${width}-home.png`});
   const homeCaption=await page.locator('.pm-entrance-caption').evaluate(e=>e.getBoundingClientRect().bottom);
   await page.evaluate(()=>{window.__userScroll({top:1300,behavior:'instant'});window.__scrollCalls=[];});
   for(const height of [760,820,700,844]){await page.setViewportSize({width,height});await page.waitForTimeout(280);}
   const scroll=await page.evaluate(()=>({y:scrollY,calls:window.__scrollCalls}));
   assert.ok(scroll.y>1100,'Resizing mobile browser must not return to hero');
   assert.deepEqual(scroll.calls,[],'No scripted scroll during viewport resizing');
   await goto('produkcja/');
   const caption=page.locator('.pm-production-hero:visible .pm-entrance-caption');
   assert.ok(Math.abs(await caption.evaluate(e=>e.getBoundingClientRect().bottom)-homeCaption)<2,'Shared entrance caption baseline');
   assert.equal(await caption.locator('.pm-brand-accent').evaluate(e=>getComputedStyle(e).color),'rgb(225, 78, 38)');
   await page.screenshot({path:`${folder}/${engine.name()}-${width}-production.png`});
   if(width<768) for(const route of ['oferta/','tasmy-led/']) {
    await goto(route);
    const count=await page.locator('.pm-feature').count();
    for(let i=0;i<count;i++) {
     await page.locator('.pm-feature-track').evaluate((e,i)=>e.scrollTo({left:e.clientWidth*i,behavior:'instant'}),i);
     await page.waitForTimeout(120);
     const fit=await page.locator('.pm-feature').nth(i).evaluate(e=>{
      const title=e.querySelector('h2').getBoundingClientRect(),cta=e.querySelector('.pm-cta').getBoundingClientRect();
      const controls=e.closest('.pm-catalog-hero').querySelector('.pm-feature-controls').getBoundingClientRect();
      return {titleTop:title.top,ctaBottom:cta.bottom,controlsTop:controls.top,height:cta.height,font:parseFloat(getComputedStyle(e.querySelector('h2')).fontSize)};
     });
     assert.ok(fit.titleTop>=100&&fit.ctaBottom<=fit.controlsTop&&fit.height>=44&&fit.font<=30,`${route} slide ${i+1} copy and controls fit: ${JSON.stringify(fit)}`);
    }
    await page.screenshot({path:`${folder}/${engine.name()}-${width}-${route.replace('/','')}.png`});
   }
   results.push({engine:engine.name(),width,hero:true,menu:true,scroll:true,captions:true,allCatalogueSlides:true});
   console.log(engine.name(),width,'hero, menu, resize stability, captions and all slides passed');
   await page.close();
  }
 } finally {await browser.close();}
}
await fs.writeFile(`${folder}/results.json`,JSON.stringify(results,null,2));
