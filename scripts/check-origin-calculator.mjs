import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/';
await fs.mkdir('output/origin-calculator',{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch();
 try{for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await context.route('https://www.prescot.com.pl/pl/searchquery/**',request=>request.fulfill({status:200,contentType:'text/html',body:'<title>Verified calculator destination</title>'}));
  const page=await context.newPage();await page.goto(new URL('produkcja/',base).href,{waitUntil:'domcontentloaded'});
  const flag=page.locator('.pm-origin-flag');await flag.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));await page.waitForTimeout(600);
  assert.ok(await flag.isVisible());
  const flagBox=await flag.boundingBox(),copyBox=await page.locator('.pm-origin-copy').boundingBox();
  if(width<768){const section=await page.locator('.elementor-element-455940b2').boundingBox();assert.ok(flagBox.y-section.y>=width*2/3-2,'Flag and heading below the background photo');}
  assert.ok(Math.abs(flagBox.width/copyBox.width-.3)<.02,'Flag is 30% of caption block');
  assert.equal(await flag.evaluate(e=>getComputedStyle(e).animationName),'none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  assert.equal(await flag.evaluate(e=>getComputedStyle(e).animationName),'pm-flag-wave');
  await page.screenshot({path:`output/origin-calculator/${engine.name()}-${width}-flag.png`});
  for(const route of (process.env.ROUTES||'baza-wiedzy/').split(',')){
   await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded'});await page.waitForSelector('.pm-more',{state:'attached'});await page.waitForTimeout(700);
   for(const voltage of [24,12,48]){
    await page.locator(`#seg-voltage [data-val="${voltage}"]`).click();
    const link=page.locator('#rec-psu-link');await link.scrollIntoViewIfNeeded();
    const expected=await link.getAttribute('href');assert.ok(decodeURIComponent(expected).includes(`150W ${voltage}V`));
    const popupPromise=page.waitForEvent('popup');await link.click();const popup=await popupPromise;await popup.waitForLoadState();
    assert.equal(popup.url(),expected,'Calculator opens the current search instead of shop home');
    assert.equal(await page.locator('#prescotB2CDialog').evaluate(e=>e.open),false);
    await popup.close();
   }
   await page.screenshot({path:`output/origin-calculator/${engine.name()}-${width}-${route.replaceAll('/','')}.png`});
  }
  console.log('PASS flag, reduced motion and calculator links',engine.name(),width);await context.close();
 }}finally{await browser.close();}
}
