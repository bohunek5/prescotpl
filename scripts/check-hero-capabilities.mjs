import {chromium, webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.BASE_URL || 'http://127.0.0.1:4178/';
const folder = 'output/hero-capabilities';
await fs.mkdir(folder, {recursive: true});
const results = [];
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch();
  try {
    for (const width of [390, 768, 1024, 1440, 1920]) {
      const page = await browser.newPage({viewport: {width, height: 900}, hasTouch: width < 768, isMobile: width < 768});
      try {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(base, {waitUntil: 'domcontentloaded'});
        await page.waitForSelector('.pm-capability-outline', {state: 'attached'});
        await page.waitForTimeout(600);
        const badges = page.locator('.pm-capabilities > .elementor-widget-icon-box');
        assert.equal(await badges.count(), 6);
        assert.equal(await page.locator('.pm-capabilities a, .pm-capabilities button, .pm-capabilities [tabindex]').count(), 0, 'Informational icons do not pretend to be links');
        const mobile = width < 768;
        assert.equal(await page.locator('.pm-capability-outline:visible').count(), mobile ? 0 : 6);
        assert.equal(await page.locator('.pm-capabilities svg:visible').count(), 6);
        const dimensions = await page.locator('.pm-capabilities').evaluate(element => {
          const r = element.getBoundingClientRect();
          return {left: r.left, right: r.right, columns: getComputedStyle(element).gridTemplateColumns.split(' ').length};
        });
        assert.ok(dimensions.left >= 0 && dimensions.right <= width);
        assert.equal(dimensions.columns, mobile ? 3 : 6);
        for (let index = 0; index < 6; index++) {
          const badge = badges.nth(index);
          if (!mobile) await badge.hover();
          await page.waitForTimeout(mobile ? 0 : 270);
          const state = await badge.evaluate(element => {
            const icon = element.querySelector('.elementor-icon');
            const svg = [...icon.querySelectorAll('svg')].find(item => getComputedStyle(item).display !== 'none');
            const path = svg.querySelector('path');
            const box = svg.getBoundingClientRect();
            const title = element.querySelector('.elementor-icon-box-title').getBoundingClientRect();
            return {background: getComputedStyle(icon).backgroundColor, stroke: getComputedStyle(path).stroke,
              fill: getComputedStyle(path).fill, strokeWidth: getComputedStyle(path).strokeWidth,
              iconWidth: icon.getBoundingClientRect().width, svgWidth: box.width, gap: title.top - box.bottom,
              text: element.textContent.trim()};
          });
          assert.equal(state.iconWidth, mobile ? 38 : 68);
          assert.ok(state.gap >= 0, `${state.text}: icon must not overlap the label`);
          if (!mobile) {
            assert.equal(state.stroke, 'rgb(255, 255, 255)');
            assert.equal(state.fill, 'none');
            assert.equal(state.strokeWidth, '1.5px');
            assert.notEqual(state.background, 'rgb(225, 78, 38)');
            assert.equal(state.svgWidth, 36);
          }
        }
        if (!mobile) {
          const separator = await page.locator('.pm-entrance-caption .elementor-divider-separator').evaluate(element => ({width: element.getBoundingClientRect().width, line: getComputedStyle(element, '::before').width}));
          assert.ok(separator.width < 460, 'Entrance caption must not span the screen');
          assert.equal(separator.line, '28px');
          await badges.nth(4).hover();
          await page.waitForTimeout(270);
        }
        await page.screenshot({path: `${folder}/${engine.name()}-${width}.png`});
        assert.deepEqual(errors, [], 'No JavaScript runtime errors');
        results.push({engine: engine.name(), width, icons: 6, hover: !mobile, mobilePreserved: mobile});
        console.log(`PASS ${engine.name()} ${width}px`);
      } finally { await page.close(); }
    }
    const page = await browser.newPage({viewport: {width: 1440, height: 900}, reducedMotion: 'reduce'});
    try {
      await page.goto(new URL('prescotled/', base).href, {waitUntil: 'domcontentloaded'});
      await page.waitForSelector('.pm-capability-outline');
      await page.locator('.pm-capabilities > *').nth(4).hover();
      const state = await page.locator('.pm-capabilities > *').nth(4).locator('.elementor-icon').evaluate(element => ({transition: getComputedStyle(element).transitionDuration, transform: getComputedStyle(element).transform}));
      assert.equal(state.transition, '0s');
      assert.equal(state.transform, 'none');
      console.log(`PASS ${engine.name()} prescotled alias + reduced motion`);
    } finally { await page.close(); }
  } finally { await browser.close(); }
}
await fs.writeFile(`${folder}/results.json`, JSON.stringify(results, null, 2));
