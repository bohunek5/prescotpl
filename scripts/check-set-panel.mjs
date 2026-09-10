import {chromium, webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.BASE_URL || 'http://127.0.0.1:4178/';
const shop = process.env.SHOP_URL || 'http://127.0.0.1:4179/';
const browser = await (process.env.BROWSER === 'webkit' ? webkit : chromium).launch({headless: true});
const output = 'output/set-panel';
await fs.mkdir(output, {recursive: true});
try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({viewport: {width, height: width > 760 ? 1000 : 844}, reducedMotion: 'reduce'});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(new URL('produkt/', base).href, {waitUntil: 'load'});
    const assistant = page.locator('#prescot-set-assistant');
    await assistant.locator('.teaser').waitFor({state: 'visible'});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    // The small automatic prompt leaves the website interactive.
    assert.equal(await assistant.locator('dialog').evaluate(el => el.open), false);
    await assistant.locator('.teaser-main').click();
    await assistant.locator('.product-card').first().waitFor();
    await page.waitForTimeout(300);
    await assistant.locator('.product-image img').first().waitFor();
    assert.equal(await assistant.locator('.product-card').count(), 3);
    assert.equal(await assistant.locator('.handoff').isDisabled(), true);
    assert.match(await assistant.locator('.status').innerText(), /Ile metrów/);
    await page.screenshot({path: `${output}/panel-${width}.png`});
    const bounds = await assistant.locator('dialog').evaluate(el => ({width: el.clientWidth, scroll: el.scrollWidth}));
    assert.ok(bounds.scroll <= bounds.width + 1, `sheet overflow at ${width}`);
    await assistant.locator('[data-prompt="4 m"]').click();
    await page.waitForTimeout(150);
    assert.equal(await assistant.locator('.handoff').isEnabled(), true);
    assert.match(await assistant.locator('.status').innerText(), /80 W/);
    const input = assistant.locator('textarea');
    await input.fill('5 m'); await input.press('Enter');
    await page.waitForTimeout(150);
    assert.equal(await assistant.locator('.handoff').isDisabled(), true);
    assert.match(await assistant.locator('.status').innerText(), /120 W/);
    await assistant.locator('.resolve').click();
    await page.waitForTimeout(150);
    assert.equal(await assistant.locator('.handoff').isEnabled(), true);
    assert.match(await assistant.locator('.cards').innerText(), /Scharfer 150 W/);
    await assistant.locator('.close').click();
    assert.equal(await assistant.locator('dialog').evaluate(el => el.open), false);
    await page.locator('.prescot-dock [data-tooltip="Sklep B2C"]').click();
    assert.equal(await assistant.locator('dialog').evaluate(el => el.open), true);
    assert.match(await assistant.locator('.cards').innerText(), /Scharfer 150 W/);
    await page.keyboard.press('Escape');
    assert.equal(await assistant.locator('dialog').evaluate(el => el.open), false);
    // Re-open and follow the exact encoded handoff produced by the panel.
    await page.locator('.prescot-dock [data-tooltip="Sklep B2C"]').click();
    await page.route('https://bohunek5.github.io/sklepSC/zestaw.html*', route => route.fulfill({status: 200, contentType: 'text/html', body: '<title>Handoff</title>'}));
    await assistant.locator('.handoff').click();
    await page.waitForURL('**/sklepSC/zestaw.html*');
    const hash = new URL(page.url()).hash;
    const review = new URL('zestaw.html', shop); review.hash = hash;
    await page.goto(review.href, {waitUntil: 'load'});
    await page.locator('.summary').waitFor({state: 'visible'});
    assert.equal(await page.locator('#set-products article').count(), 3);
    await page.waitForFunction(() => [...document.querySelectorAll('#set-products img')].every(img => img.complete));
    assert.equal(await page.locator('#set-products img').evaluateAll(imgs => imgs.every(img => img.naturalWidth > 0)), true, 'product photos load');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({path: `${output}/shop-${width}.png`});
    // Keep an existing cart item, merge once, and prevent duplicate imports on refresh.
    await page.evaluate(() => localStorage.setItem('prescot_cart', JSON.stringify([{id: 1, title: 'Existing', qty: 2, price: 5}])));
    await page.locator('#set-add').click();
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('prescot_cart')));
    assert.equal(cart.length, 4); assert.equal(cart[0].qty, 2);
    assert.deepEqual(cart.slice(1).map(p => p.id), [13118, 9450, 19003]);
    await page.reload({waitUntil: 'load'});
    await page.locator('#set-cart').waitFor({state: 'visible'});
    assert.equal(await page.locator('#set-add').isDisabled(), true);
    // A changed product ID cannot be used to smuggle arbitrary products/prices.
    const params = new URLSearchParams(hash.slice(1));
    const payload = JSON.parse(params.get('set')); payload.items[0].id = 1;
    review.hash = new URLSearchParams({set: JSON.stringify(payload)}).toString();
    await page.goto(review.href); await page.reload({waitUntil: 'load'});
    await page.waitForFunction(() => document.querySelector('#set-status').hasAttribute('data-error'));
    assert.equal(await page.locator('.summary').isHidden(), true);
    assert.deepEqual(errors, [], errors.join('\n'));
    console.log(`PASS ${process.env.BROWSER || 'chromium'} ${width}: panel, clarification, handoff, cart, invalid payload`);
    await context.close();
  }
} finally {await browser.close();}
