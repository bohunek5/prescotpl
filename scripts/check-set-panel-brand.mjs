import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/';
await fs.mkdir('output/panel-brand',{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch();
 try{for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  await page.goto(new URL('produkt/?dobierz=1',base).href);
  const panel=page.locator('#prescot-set-assistant');await panel.locator('.product-card').first().waitFor();
  assert.equal(await panel.locator('.length-options').count(),0);
  assert.equal(await panel.locator('form label').count(),0);
  assert.equal(await panel.locator('.status').isVisible(),false);
  assert.equal(await panel.locator('.handoff').isDisabled(),true,'Missing length still prevents unsafe set approval');
  assert.match(await panel.locator('h2').innerText(),/Dobierz wszystkie elementy w jednym miejscu/);
  assert.match(await panel.locator('.identity .brand-pattern').evaluate(e=>getComputedStyle(e).maskImage),/PRESCOT_pattern2-1.svg/);
  assert.equal(await panel.locator('.submit').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(23, 43, 69)');
  await panel.locator('textarea').fill('4 m');await panel.locator('textarea').press('Enter');
  await page.waitForTimeout(400);assert.equal(await panel.locator('.handoff').isEnabled(),true);
  await panel.locator('textarea').fill('5 m');await panel.locator('textarea').press('Enter');
  await page.waitForTimeout(400);assert.equal(await panel.locator('.handoff').isDisabled(),true);
  await panel.locator('.resolve').click();await page.waitForTimeout(400);
  assert.equal(await panel.locator('.handoff').isEnabled(),true);assert.match(await panel.locator('.cards').innerText(),/Scharfer 150 W/);
  assert.ok(await panel.locator('dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  await page.screenshot({path:`output/panel-brand/${engine.name()}-${width}.png`});
  console.log('PASS panel branding and text-based selection',engine.name(),width);await page.close();
 }}finally{await browser.close();}
}
