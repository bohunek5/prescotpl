import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {parseRequest, buildSet, makeHandoff} from '../shop-assistant/engine.mjs';

const browser = await chromium.launch({headless: true});
try {
  const page = await browser.newPage({viewport: {width: 390, height: 844}});
  await page.addInitScript(() => {
    window.speechCalls = {starts: 0, aborts: 0};
    window.SpeechRecognition = class {
      start() {window.speechCalls.starts++; this.onstart?.();}
      abort() {window.speechCalls.aborts++; this.onend?.();}
      stop() {this.onend?.();}
    };
  });
  let loads = 0;
  await page.route('**/shop-assistant/catalog.json*', route => {
    loads++;
    return loads === 1 ? route.fulfill({status: 503, body: 'Unavailable'}) : route.continue();
  });
  await page.goto('http://127.0.0.1:4178/produkt/', {waitUntil: 'load'});
  const panel = page.locator('#prescot-set-assistant');
  await panel.locator('.teaser').waitFor({state: 'visible'});
  assert.equal(loads, 0, 'catalog stays unloaded until the user opens the panel');
  assert.equal(await page.evaluate(() => speechCalls.starts), 0, 'microphone never starts automatically');
  const teaser = await panel.locator('.teaser').boundingBox();
  const arrow = await page.locator('#prescotScrollDown').boundingBox();
  assert.ok(teaser.y + teaser.height < arrow.y, 'teaser does not cover the existing down arrow');
  await panel.locator('.teaser-main').click();
  await panel.locator('.retry').waitFor();
  assert.equal(await panel.locator('.handoff').isDisabled(), true);
  await panel.locator('.retry').click();
  await panel.locator('.product-card').first().waitFor();
  assert.equal(loads, 2);
  await panel.locator('.mic').click();
  assert.equal(await page.evaluate(() => speechCalls.starts), 1);
  await panel.locator('.close').click();
  assert.ok(await page.evaluate(() => speechCalls.aborts) >= 1, 'closing stops dictation');
  await page.locator('.prescot-dock [data-tooltip="Sklep B2C"]').click();
  assert.equal(loads, 2, 'reopening reuses the loaded catalog');
  assert.equal(await page.evaluate(() => speechCalls.starts), 1);
  console.log('PASS lazy loading, unavailable catalog/retry, microphone lifecycle, arrow clearance');

  if (process.env.BUILT_SHOP_URL) {
    const catalog = JSON.parse(await fs.readFile(new URL('../shop-assistant/catalog.json', import.meta.url))).products;
    const result = buildSet(catalog, parseRequest('4m COB RGB+CCT Scharfer 100W PR Touch').intent);
    const url = new URL('zestaw.html', process.env.BUILT_SHOP_URL);
    url.hash = new URLSearchParams({set: JSON.stringify(makeHandoff(result))}).toString();
    await page.goto(url.href, {waitUntil: 'load'});
    await page.locator('.summary').waitFor({state: 'visible'});
    assert.equal(await page.locator('#set-products article').count(), 3);
    await page.locator('#set-add').click();
    const items = await page.evaluate(() => JSON.parse(localStorage.getItem('prescot_cart')));
    assert.deepEqual(items.map(x => x.id), [13118, 9447, 19003]);
    assert.equal(items[0].qty, 1);
    await page.locator('#set-cart').click();
    // sklepSC intentionally redirects cart.html to its home-page cart drawer.
    await page.waitForURL('**/index.html?cart=open');
    await page.waitForFunction(() => /RGBCCT|RGB.CCT/.test(document.querySelector('#cartDrawerItems')?.textContent || ''));
    await page.waitForTimeout(1000);
    assert.equal(await page.locator('#cartDrawerItems').isVisible(), true);
    const bounds = await page.locator('#cartDrawerItems').boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 391, 'mobile cart content fits after its opening animation');
    await page.screenshot({path: 'output/set-panel/built-cart-390.png'});
    console.log('PASS production build at /sklepSC/, checkout cart integration');
  }
} finally {await browser.close();}
