import {chromium,webkit} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.BASE_URL || 'http://127.0.0.1:4178/';
const widths = (process.env.TEST_WIDTHS || '320,390,1440').split(',').map(Number);
const routes = (process.env.ROUTES || ',dystrybucja/,produkty/,prescotled/,sterowniki-led/,produkcja/').split(',');
const folder = 'output/brand-footer-review'; await fs.mkdir(folder,{recursive:true});
const report = [];
for (const [name,engine] of Object.entries({chromium,webkit})) {
  const browser = await engine.launch();
  for (const width of widths) {
    const page = await browser.newPage({viewport:{width,height:width<768?740:900}});
    let canonical;
    for (const route of routes) {
      await page.goto(new URL(route,base).href,{waitUntil:'load'});
      await page.waitForSelector('.pm-footer',{state:'attached'});
      const footer = page.locator('.pm-footer');
      assert.equal(await page.locator('.footerSlide:visible').count(),1,'one visible footer');
      assert.equal(await page.locator('[id="stopka"]').count(),1,'one canonical footer anchor');
      const contacts = await footer.locator('.infoContent a').evaluateAll(links=>links.map(a=>a.getAttribute('href')));
      if (canonical) assert.deepEqual(contacts,canonical,'same company contact links'); else canonical=contacts;
      assert.ok((await footer.locator('.pm-full-contact').getAttribute('href')).endsWith('/kontakt/'));
      assert.equal(await footer.locator('.contactForm').count(),1);
      await footer.locator('.bottomStack').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
      await page.waitForTimeout(150);
      const state = await footer.evaluate(el=>{
        const legal=[...el.querySelectorAll('.legalLink')].map(e=>e.getBoundingClientRect());
        return {overflow:document.documentElement.scrollWidth>innerWidth+1,legalRow:Math.max(...legal.map(r=>r.top))-Math.min(...legal.map(r=>r.top))<2,socialBelow:el.querySelector('.socialRow').getBoundingClientRect().top>=Math.max(...legal.map(r=>r.bottom)),background:getComputedStyle(el).backgroundColor};
      });
      assert.ok(!state.overflow);assert.ok(state.legalRow);assert.ok(state.socialBelow);assert.equal(state.background,'rgb(13, 27, 48)');
      await page.screenshot({path:`${folder}/${name}-${width}-${route.replace('/','')||'home'}-footer.png`});
      const slides = page.locator('.pm-brand');
      for (let i=0;i<await slides.count();i++) {
        const slide=slides.nth(i);
        await slide.evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
        await page.waitForTimeout(250);
        assert.ok((await slide.locator('.distText').innerText()).length<190);
        const arrow=slide.locator('.distArrow');
        await arrow.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
        await page.waitForTimeout(100);
        const rects=await slide.evaluate(el=>({arrow:el.querySelector('.distArrow').getBoundingClientRect().toJSON(),box:el.querySelector('.distContentBox').getBoundingClientRect().toJSON(),dock:document.querySelector('.prescot-dock').getBoundingClientRect().toJSON(),opacity:getComputedStyle(el.querySelector('.floatLayer')).opacity}));
        assert.ok(rects.arrow.top>=rects.box.bottom,'arrow below description');
        assert.ok(rects.arrow.bottom<rects.dock.top,'arrow above dock');
        assert.ok(+rects.opacity>.4,'floating products visible');
        const before=await page.evaluate(()=>scrollY);
        await arrow.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(700);
        assert.ok(await page.evaluate(y=>scrollY>y+10,before),'keyboard down arrow advances');
        if (i>=3) {await slide.evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.waitForTimeout(100);await page.screenshot({path:`${folder}/${name}-${width}-${route.replace('/','')||'home'}-brand-${i}.png`});}
      }
      if (route==='produkcja/') {
        const track=page.locator('.scroll-track');const next=page.locator('.prescot-production-motion + .prescot-process-step');
        await next.evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY-innerHeight*.84,behavior:'instant'}));await page.waitForTimeout(180);
        assert.equal(await page.locator('.pm-brand-mask').evaluate(el=>getComputedStyle(el).opacity),'0','D fades before next introduction enters its space');
        if (width>=768) {
          assert.ok(await track.evaluate(el=>el.offsetHeight<=innerHeight*1.61),'short desktop animation track');
          await page.locator('#kreci').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await page.waitForTimeout(120);
          const gap=await page.evaluate(()=>{const grid=document.querySelector('.pm-brand-mask').getBoundingClientRect(),p=document.querySelector('#kreci p').getBoundingClientRect();return grid.top+(grid.height-grid.width*595.3/841.9)/2+19.5/841.9*grid.width-p.bottom;});
          assert.ok(gap>=0&&gap<110,`introduction-to-artwork gap ${gap}`);
          await page.screenshot({path:`${folder}/${name}-${width}-production-spacing.png`});
        }
      }
      report.push({name,width,route:route||'home',status:'passed'});console.log(report.at(-1));
    }
    await page.close();
  }
  await browser.close();
}
await fs.writeFile(`${folder}/report.json`,JSON.stringify({base,report},null,2));
console.log(`PASS ${report.length} route/viewport/engine scenarios`);
