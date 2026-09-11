import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/';
const folder='output/production-motion-review';await fs.mkdir(folder,{recursive:true});
const report=[];
for(const [name,engine] of Object.entries({chromium,webkit})) {
 const browser=await engine.launch();
 for(const width of [390,1440]) {
  const page=await browser.newPage({viewport:{width,height:900}});
  const remote=[];page.on('request',r=>{if(/\.(webm|mp4)(\?|$)/.test(r.url())&&!r.url().startsWith(base))remote.push(r.url());});
  await page.goto(new URL('produkcja/',base).href,{waitUntil:'load'});
  await page.waitForSelector('.pm-five-films');
  const hero=page.locator(`[data-pm-production-hero="${width<768?'mobile':'desktop'}"] video`);
  await hero.evaluate(v=>v.play());await page.waitForFunction(()=>[...document.querySelectorAll('[data-pm-production-hero] video')].some(v=>!v.paused&&v.readyState>=2));
  const intro=await hero.evaluate(v=>({src:v.currentSrc,width:v.videoWidth,height:v.videoHeight}));
  assert.ok(intro.src.startsWith(base));
  assert.ok(intro.width<=(width<768?720:1920),'intro uses optimized resolution');
  assert.equal(await hero.evaluate(v=>getComputedStyle(v).objectFit),'cover');
  await page.screenshot({path:`${folder}/${name}-${width}-intro.png`});
  assert.equal(await page.locator('[data-pm-production-hero] video').evaluateAll(vs=>vs.filter(v=>v.currentSrc).length),1,'only visible hero loads');
  assert.equal(await page.locator('.pm-film-piece').count(),5);
  const geometry=await page.locator('.scroll-track').evaluate(e=>({top:e.getBoundingClientRect().top+scrollY,distance:e.offsetHeight-e.querySelector('.scroll-div').offsetHeight}));
  const seek=async p=>{await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),geometry.top+geometry.distance*p+1);await page.waitForTimeout(140);};
  await seek(0);
  await page.waitForFunction(()=>[...document.querySelectorAll('.pm-five-films video')].every(v=>v.readyState>=2&&!v.paused));
  assert.equal(await page.locator('.pm-five-films video').evaluateAll(vs=>new Set(vs.map(v=>v.currentSrc)).size),5,'each SVG part has a distinct film');
  const decoded=await page.locator('.pm-five-films video').evaluateAll(vs=>Promise.all(vs.map(v=>new Promise(resolve=>{
    if(v.requestVideoFrameCallback){let frames=0;const count=()=>{if(++frames>=3)resolve(true);else v.requestVideoFrameCallback(count);};v.requestVideoFrameCallback(count);}else resolve(!v.paused&&v.readyState>=2);
  }))));assert.ok(decoded.every(Boolean),'every film delivers new frames');
  assert.ok(await hero.evaluate(v=>v.paused),'intro pauses offscreen');
  for(const progress of [0,.21,.42,.63,.85,1]) {
   await seek(progress);
   const state=await page.locator('.scroll-track').evaluate(e=>({angle:+e.dataset.turn,zoom:+e.dataset.zoom,opacity:+e.querySelector('.grid').style.opacity,overflow:document.documentElement.scrollWidth>innerWidth+1}));
   assert.ok(Math.abs(state.angle-720*Math.min(progress/.84,1))<3);
   assert.ok(!state.overflow);
   if(progress===.85){assert.equal(state.angle,720);assert.ok(state.zoom>2);assert.equal(state.opacity,1);}
   if(progress===1){assert.equal(state.opacity,0);assert.ok(await page.locator('.pm-five-films video').evaluateAll(vs=>vs.every(v=>v.paused)));}
   await page.screenshot({path:`${folder}/${name}-${width}-${progress}.png`});
  }
  await seek(.42);await page.waitForFunction(()=>[...document.querySelectorAll('.pm-five-films video')].every(v=>!v.paused));
  assert.equal(remote.length,0,'no external video hosting requests');
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForSelector('.pm-five-films',{state:'attached'});
  await page.locator('.scroll-track').evaluate(e=>scrollTo({top:e.getBoundingClientRect().top+scrollY,behavior:'instant'}));await page.waitForTimeout(200);
  assert.equal(await page.locator('.scroll-track').getAttribute('data-turn'),'0');
  assert.ok(await page.locator('.pm-five-films video').evaluateAll(vs=>vs.every(v=>v.paused)));
  report.push({name,width,intro,status:'passed'});console.log(report.at(-1));await page.close();
 }
 await browser.close();
}
await fs.writeFile(`${folder}/report.json`,JSON.stringify({base,report},null,2));
