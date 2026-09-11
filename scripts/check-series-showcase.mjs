import {chromium, webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base = process.env.BASE_URL || 'http://127.0.0.1:4178/';
const widths = (process.env.TEST_WIDTHS || '320,390,768,1440').split(',').map(Number);
const folder = 'output/series-review';
await fs.mkdir(folder, {recursive:true});
const report = [];
for (const [name, engine] of Object.entries({chromium, webkit})) {
  const browser = await engine.launch();
  for (const width of widths) {
    const page = await browser.newPage({viewport:{width,height:900}});
    for (const [route, count] of [['sterowniki-led/',5],['zasilacze-led/',6]]) {
      await page.goto(new URL(route,base).href, {waitUntil:'load'});
      await page.waitForSelector('.pm-series-showcase');
      assert.equal(await page.locator('.pm-series-showcase').count(), count);
      for (let i = 0; i < count; i++) {
        const card = page.locator('.pm-series-showcase').nth(i);
        await card.evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * .7));
        await page.waitForTimeout(100);
        const before = await card.locator('.mdw-card-portfolio-image-left').evaluate(el=>getComputedStyle(el).transform);
        await card.evaluate(el => scrollTo(0, el.getBoundingClientRect().top + scrollY));
        await page.waitForTimeout(180);
        await card.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
        const data = await card.evaluate(el => {
          const copy = el.querySelector('.pm-series-copy').getBoundingClientRect();
          const images = [...el.querySelectorAll('img')].map(img=>img.getBoundingClientRect());
          return {
            overflow:document.documentElement.scrollWidth>innerWidth+1,
            transform:getComputedStyle(el.querySelector('.mdw-card-portfolio-image-left')).transform,
            overlap:images.some(r=>r.left<copy.right&&r.right>copy.left&&r.top<copy.bottom&&r.bottom>copy.top),
            links:[...el.querySelectorAll('a[href]')].map(a=>a.href)
          };
        });
        assert.notEqual(before, data.transform, `${name} ${width} ${route} ${i}: animation`);
        assert.ok(!data.overflow, 'no horizontal overflow');
        assert.ok(!data.overlap, `${name} ${width} ${route} ${i}: photographs do not cover copy`);
        for (const url of data.links.filter(url=>url.includes('/assets/'))) {
          const response = await page.request.head(url);
          assert.ok(response.ok(), `document/video exists: ${url}`);
        }
        if (i===0 || i===count-1) await page.screenshot({path:`${folder}/${name}-${width}-${route.replace('/','')}-${i}.png`});
      }
      await page.emulateMedia({reducedMotion:'reduce'});
      assert.equal(await page.locator('.pm-series-showcase').first().evaluate(el=>getComputedStyle(el).getPropertyValue('--pm-series-progress').trim()), '1');
      await page.emulateMedia({reducedMotion:'no-preference'});
      report.push({engine:name,width,route,models:count,status:'passed'});
      console.log(report.at(-1));
    }
    if ([390,1440].includes(width)) for (const route of ['produkty/','oferta/']) {
      await page.goto(new URL(route,base).href, {waitUntil:'load'});
      await page.waitForSelector('.pm-catalog', {state:'attached'});
      for (const [index, file] of [[3,'controller-living-room-hero-v2.webp'],[4,'pr-mad-kitchen-hero.webp']]) {
        const thumb = page.locator('.as-side-slider .swiper-slide:not(.swiper-slide-duplicate) img').nth(index);
        assert.ok((await thumb.getAttribute('src')).endsWith(file));
        const photo = page.locator('.pm-feature-photo').nth(index);
        assert.ok((await photo.getAttribute('src')).endsWith(file));
        if (width>767) {
          await page.waitForFunction(()=>document.querySelector('.as-side-slider .elementor-main-swiper')?.swiper);
          await page.locator('.as-bar .dot').nth(index).click();
          await page.waitForTimeout(700);
          assert.ok(await page.locator('.as-slider-background img.currentForward,.as-slider-background img.currentBackward').evaluateAll((imgs,file)=>imgs.some(img=>img.src.endsWith(file)&&img.complete&&img.naturalWidth>0),file));
        } else {
          await page.locator('.pm-feature-track').evaluate((el,i)=>el.scrollTo({left:el.clientWidth*i,behavior:'instant'}),index);
          await photo.evaluate(img=>img.decode());
          await page.waitForTimeout(250);
        }
        await page.screenshot({path:`${folder}/${name}-${width}-${route.replace('/','')}-${index}.png`});
      }
      report.push({engine:name,width,route,status:'passed'});
    }
    await page.close();
  }
  await browser.close();
}
await fs.writeFile(`${folder}/report.json`, JSON.stringify({base,report},null,2));
console.log(`PASS: ${report.length} route/viewport/engine checks`);
