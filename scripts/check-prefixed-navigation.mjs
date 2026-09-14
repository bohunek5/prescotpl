import { chromium, webkit } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(new URL('../', import.meta.url).pathname);
const base = 'https://bohunek5.github.io/prescotpl/';
const mime = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.json':'application/json','.woff2':'font/woff2','.woff':'font/woff','.mp4':'video/mp4'};
for (const engine of [chromium, webkit]) {
 const browser = await engine.launch();
 try {
  const context = await browser.newContext({ viewport:{width:390,height:844}, reducedMotion:'reduce' });
  // Exercise production URLs against local files; do not publish or hit production.
  await context.route('https://bohunek5.github.io/**', async route => {
   const url = new URL(route.request().url());
   if (!url.pathname.startsWith('/prescotpl/')) return route.fulfill({status:404,body:'Missing repository prefix'});
   let rel = decodeURIComponent(url.pathname.slice('/prescotpl/'.length));
   if (!rel || rel.endsWith('/')) rel += 'index.html';
   const file = path.resolve(root, rel);
   if (!file.startsWith(root + '/')) return route.abort();
   try { await route.fulfill({status:200,body:await fs.readFile(file),contentType:mime[path.extname(file)] || 'application/octet-stream'}); }
   catch { await route.fulfill({status:404,body:'Not found'}); }
  });
  const page = await context.newPage();
  for (const source of ['', 'oferta/', 'dystrybucja/']) {
   await page.goto(base + source, {waitUntil:'domcontentloaded'});
   await page.locator('.pm-more').click();
   await page.locator('.pm-menu-feature').filter({hasText:'Konfigurator LED'}).click();
   await page.waitForURL(base+'konfigurator/');
   assert.match(await page.title(), /Konfigurator/);
  }
  await page.goto(base+'dystrybucja/', {waitUntil:'domcontentloaded'});
  await page.locator('.dist-pill[href$="#sl-elba"]').click();
  await page.waitForURL(base+'dystrybucja/#sl-elba');
  await page.waitForSelector('.pm-more', {state:'attached'});
  // Legacy fragment links must stay on their own page despite <base>.
  await page.evaluate(()=>{const a=document.createElement('a');a.href='#sl-elba';a.id='test-fragment';a.textContent='ELBA';document.body.append(a);a.click();});
  assert.equal(page.url(), base+'dystrybucja/#sl-elba');
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base+'oferta/', {waitUntil:'domcontentloaded'});
  await page.waitForSelector('.pm-more', {state:'attached'});
  // This is the root-relative form injected by the exported carousel script.
  await page.evaluate(()=>{const a=document.createElement('a');a.href='/sterowniki-led/';document.body.append(a);a.click();});
  await page.waitForURL(base+'sterowniki-led/');
  assert.match(await page.title(), /Sterowniki LED/);
  console.log('PASS prefixed More/configurator, ELBA and catalogue links', engine.name());
 } finally { await browser.close(); }
}
