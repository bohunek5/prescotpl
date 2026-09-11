import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/';
for(const engine of [chromium,webkit]){
 const browser=await engine.launch();
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(new URL('dslim4/',base).href);
  const intro=page.locator('.pm-intro-guide');
  await intro.waitFor({state:'visible'});
  await intro.click();
  await page.waitForTimeout(1800);
  assert.ok(await page.evaluate(()=>scrollY>70));
  assert.equal(await intro.isVisible(),false);
  const card=page.locator('.pm-mobile-showcase').first();
  await card.evaluate(e=>scrollTo({top:scrollY+e.getBoundingClientRect().top+100,behavior:'instant'}));
  await page.waitForTimeout(100);
  const guides=page.locator('.pm-scroll-guides');
  assert.equal(await guides.isVisible(),false);
  await page.waitForTimeout(1400);
  assert.equal(await guides.isVisible(),true);
  await guides.locator('.pm-guide-down').click();
  await page.waitForTimeout(1800);
  assert.ok(await card.evaluate(e=>Number(e.style.getPropertyValue('--pm-reveal'))>.95));
  await page.evaluate(()=>dispatchEvent(new Event('touchstart')));
  await page.waitForTimeout(1400);
  assert.equal(await guides.isVisible(),false);
  await page.evaluate(()=>dispatchEvent(new Event('touchend')));
  await page.waitForTimeout(1400);
  assert.equal(await guides.isVisible(),true);
  for(const route of ['prescotled/','dystrybucja/']){
   await page.goto(new URL(route,base).href);
   await page.waitForSelector('.pm-scroll-guides',{state:'attached'});
   const slide=page.locator('.distSlide').first();
   await slide.evaluate(e=>scrollTo({top:scrollY+e.getBoundingClientRect().top+100,behavior:'instant'}));
   await page.waitForTimeout(1500);
   assert.equal(await guides.isVisible(),false,`${route} floating retains its own controls`);
  }
  console.log('PASS idle, touch, reveal navigation and floating exceptions',engine.name());
 }finally{await browser.close();}
}
