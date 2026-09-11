import {chromium,webkit} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pages} from '../v2/catalogue-data.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/';
const folder='output/v2-review';await fs.mkdir(folder,{recursive:true});
const report=[];
for(const engine of [chromium,webkit]){
 const browser=await engine.launch();
 try{
  for(const width of (process.env.TEST_WIDTHS||'320,390,768,1440').split(',').map(Number)){
   const page=await browser.newPage({viewport:{width,height:width<768?844:1000},hasTouch:width<768});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const config of pages){
    await page.goto(new URL(`v2/${config.slug}/`,base).href,{waitUntil:'load'});
    await page.waitForTimeout(180);
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,follow');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const hero=await page.locator('.v-hero-copy').evaluate(e=>({right:e.getBoundingClientRect().right,buttonBottom:e.querySelector('.v-button').getBoundingClientRect().bottom}));
    assert.ok(hero.right<=width+1);
    if(width<768) assert.ok(hero.buttonBottom<await page.locator('.v-mobile-nav').evaluate(e=>e.getBoundingClientRect().top),'Hero CTA must not be hidden by mobile dock');
    await page.screenshot({path:`${folder}/${engine.name()}-${width}-${config.slug}-hero.png`});
    await page.locator('.v-hero-copy .v-button').click();await page.waitForTimeout(450);
    assert.ok(page.url().includes(`/v2/${config.slug}/#modele`),'Hero CTA stays on V2');
    for(const m of config.models){
     await page.locator(`[data-model-select="${m.key}"]`).click();
     assert.equal(await page.locator('.v-model:visible').count(),1);
     assert.ok(await page.locator(`#model-${m.key}`).isVisible());
     const panel=page.locator(`#model-${m.key}`);
     await panel.scrollIntoViewIfNeeded();
     const img=panel.locator('.v-main-image');
     await img.evaluate(e=>e.decode());
     assert.ok(await img.evaluate(e=>e.naturalWidth>0));
     if(m.detail){const before=await img.getAttribute('src');await panel.locator('.v-gallery-toggle').click();await img.evaluate(e=>e.decode());assert.notEqual(await img.getAttribute('src'),before);}
     const metric=await panel.evaluate(e=>{const photo=e.querySelector('.v-model-visual').getBoundingClientRect(),text=e.querySelector('.v-model-copy').getBoundingClientRect();return {photo:photo.toJSON(),text:text.toJSON()};});
     assert.ok(width<768?metric.photo.bottom<=metric.text.top+1:metric.photo.right<=metric.text.left+1,'Photos and copy never overlap');
    }
    await page.screenshot({path:`${folder}/${engine.name()}-${width}-${config.slug}-model.png`});
    const first=page.locator('[data-model-select]').first();await first.focus();await page.keyboard.press('End');
    assert.equal(await page.locator('[role="tab"][aria-selected="true"]').textContent(),config.models.at(-1).label);
    if(config.slug==='sterowniki-led'){
     await page.locator('.v-model:visible [data-video]').click();
     assert.ok(await page.locator('.v-video-dialog').isVisible());
     await page.keyboard.press('Escape');assert.ok(!await page.locator('.v-video-dialog').isVisible());
     await page.waitForFunction(()=>!document.querySelector('.v-video-dialog video').hasAttribute('src'));
     assert.equal(await page.locator('.v-video-dialog video').getAttribute('src'),null);
    }
    assert.deepEqual(errors,[]);report.push({engine:engine.name(),width,slug:config.slug,models:config.models.length,passed:true});
    console.log(engine.name(),width,config.slug,'passed');
   }
   await page.goto(new URL('v2/',base).href);assert.equal(await page.locator('.v-hub-grid>a').count(),4);
   await page.close();
  }
 }finally{await browser.close();}
}
await fs.writeFile(`${folder}/report.json`,JSON.stringify(report,null,2));
