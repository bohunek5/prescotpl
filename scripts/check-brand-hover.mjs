import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/';
await fs.mkdir('output/brand-hover',{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch();
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080},reducedMotion:'reduce'});
  for(const brand of ['prescot','klus','scharfer','elba','miboxer']){
   await page.goto(new URL('dystrybucja/',base).href,{waitUntil:'domcontentloaded'});
   await page.waitForSelector('.pm-more',{state:'attached'});
   const pill=page.locator(`.dist-pill[href$="#sl-${brand}"]`),logo=pill.locator('.dist-pill-logo');
   await logo.locator('img').evaluate(img=>img.decode());
   assert.equal(await logo.evaluate(e=>getComputedStyle(e).opacity),'0');
   const before=await pill.boundingBox();await pill.hover();
   assert.equal(await logo.evaluate(e=>getComputedStyle(e).opacity),'1');
   assert.equal(await pill.locator('.dist-pill-title').evaluate(e=>getComputedStyle(e).opacity),'0');
   const after=await pill.boundingBox();assert.equal(before.width,after.width);assert.equal(before.height,after.height);
   await page.screenshot({path:`output/brand-hover/${engine.name()}-${brand}.png`});
   await page.mouse.move(0,0);assert.equal(await logo.evaluate(e=>getComputedStyle(e).opacity),'0');
   await page.keyboard.press('Tab');await pill.focus();
   assert.equal(await logo.evaluate(e=>getComputedStyle(e).opacity),'1','Keyboard focus reveals the logo');
   await pill.click();await page.waitForURL(`**/dystrybucja/#sl-${brand}`);
   console.log('PASS brand hover, focus and destination',engine.name(),brand);
  }
  await page.close();
  const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await phone.goto(new URL('dystrybucja/',base).href,{waitUntil:'domcontentloaded'});
  assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  // The mobile layout intentionally hides hero pills; navigation elsewhere is unchanged.
  const pill=phone.locator('.dist-pill[href$="#sl-miboxer"]');
  if(await pill.isVisible()){await pill.tap();await phone.waitForURL('**/dystrybucja/#sl-miboxer');}
  await phone.close();
 }finally{await browser.close();}
}
