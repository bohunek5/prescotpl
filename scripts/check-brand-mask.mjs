import {chromium, webkit} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.BASE_URL || 'http://127.0.0.1:4178/';
const folder = 'output/brand-mask';
await fs.mkdir(folder, {recursive: true});
const results = [];
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch();
  try {
    for (const width of [320, 390, 1440]) {
      const page = await browser.newPage({viewport: {width, height: width < 768 ? 844 : 1000}});
      await page.goto(new URL('produkcja/', base).href);
      await page.waitForSelector('.pm-brand-mask', {state:'attached'});
      const geometry = await page.locator('.scroll-track').evaluate(e => ({top: e.getBoundingClientRect().top + scrollY, height: e.offsetHeight, stage: e.querySelector('.scroll-div').offsetHeight}));
      let firstVideoRect;
      for (const progress of [0, .3, .65, 1]) {
        await page.evaluate(y => scrollTo({top:y, behavior:'instant'}), geometry.top + (geometry.height - geometry.stage) * progress);
        await page.waitForTimeout(180);
        const state = await page.locator('.pm-brand-mask').evaluate(e => {
          const plane = e.querySelector('.pm-film-plane');
          const total = new DOMMatrix(getComputedStyle(e).transform).multiply(new DOMMatrix(getComputedStyle(plane).transform));
          const video = plane.querySelector('video').getBoundingClientRect();
          // Bounding box of the actual SVG artwork, not the larger square element.
          const rect = e.getBoundingClientRect(), size = e.offsetWidth;
          const m = new DOMMatrix(getComputedStyle(e).transform);
          const points = [[21.8,19.5],[824.8,19.5],[824.8,567.2],[21.8,567.2]].map(([x,y]) => {
            const px = (x / 841.9 - .5) * size, py = (y - 595.3 / 2) / 841.9 * size;
            return rect.x + rect.width / 2 + m.a * px + m.c * py;
          });
          return {mask:getComputedStyle(e).maskImage || getComputedStyle(e).webkitMaskImage,
            matrix:[total.a,total.b,total.c,total.d], video:{x:video.x,y:video.y,w:video.width,h:video.height},
            left:Math.min(...points),right:Math.max(...points),videos:plane.querySelectorAll('video').length};
        });
        assert.match(state.mask, /PRESCOT_pattern2-1\.svg/);
        assert.equal(state.videos, 9);
        state.matrix.forEach((value,i) => assert.ok(Math.abs(value - (i % 3 === 0 ? 1 : 0)) < .001, 'Footage must not rotate or scale'));
        assert.ok(state.left >= -1 && state.right <= width + 1, 'Complete brand silhouette fits the phone');
        if (firstVideoRect) for (const key of ['x','y','w','h']) assert.ok(Math.abs(state.video[key]-firstVideoRect[key]) < 2, 'Footage stays fixed during the sticky rotation');
        firstVideoRect = state.video;
        if (progress === 0 || progress === .65) await page.screenshot({path:`${folder}/${engine.name()}-${width}-${progress}.png`});
      }
      await page.evaluate(y => scrollTo({top:y,behavior:'instant'}), geometry.top+geometry.height);
      await page.waitForTimeout(200);
      assert.equal(await page.locator('.pm-brand-mask').evaluate(e=>getComputedStyle(e).opacity), '0');
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.reload();
      await page.waitForSelector('.pm-brand-mask', {state:'attached'});
      assert.equal(await page.locator('.pm-brand-mask').evaluate(e=>getComputedStyle(e).transform), 'matrix(1, 0, 0, 1, 0, 0)');
      await page.emulateMedia({reducedMotion:'no-preference'});
      for (const route of ['', 'prescotled/']) {
        await page.goto(new URL(route,base).href);
        const video = page.locator('.elementor-element-216d8696 video');
        await video.evaluate(v=>v.play());
        await page.waitForFunction(()=>document.querySelector('.elementor-element-216d8696 video')?.readyState>=2);
        const state = await video.evaluate(v=>({src:v.currentSrc,width:v.videoWidth,height:v.videoHeight,fit:getComputedStyle(v).objectFit,position:getComputedStyle(v).objectPosition,paused:v.paused,muted:v.muted,inline:v.playsInline}));
        assert.ok(state.src.startsWith(base));
        assert.ok(state.src.endsWith('/START.mp4'));
        assert.equal(state.fit,'cover');
        assert.equal(state.position,'50% 50%');
        assert.ok(!state.paused && state.muted && state.inline);
        results.push({engine:engine.name(),width,route,video:state,mask:'passed'});
      }
      await page.close();
      console.log(engine.name(),width,'mask, stationary footage, fade and hero passed');
    }
  } finally { await browser.close(); }
}
await fs.writeFile(`${folder}/results.json`,JSON.stringify(results,null,2));
