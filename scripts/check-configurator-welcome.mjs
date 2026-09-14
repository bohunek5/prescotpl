import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out='output/configurator/welcome';await fs.mkdir(out,{recursive:true});const base=process.env.BASE_URL||'http://127.0.0.1:4178/konfigurator/';
for(const [engine,width]of [[chromium,1440],[webkit,390]].filter(([,w])=>!process.env.TEST_WIDTH||w===+process.env.TEST_WIDTH)){
 const browser=await engine.launch();try{
 const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(base);await page.waitForFunction(()=>window.welcomeDebug);
 if(width===1440){
  await page.locator('#welcome-replay').click();assert.equal(await page.evaluate(()=>welcomeDebug.inspect().playing),false);
  const paused=await page.evaluate(()=>welcomeDebug.inspect().time);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>welcomeDebug.inspect().time),paused);
  await page.locator('#welcome-replay').click();await page.waitForFunction(()=>welcomeDebug.inspect().phase==='complete'&&!welcomeDebug.inspect().playing,null,{timeout:25000});
 }
 assert.equal((await page.evaluate(()=>welcomeDebug.inspect().connections)).length,4);assert.ok(await page.locator('#start-configurator').isEnabled());
 for(const time of [0,3.4,4.7,6.5,8,10,12.8]){
  await page.evaluate(t=>welcomeDebug.seek(t),time);await page.locator('#welcome-film').screenshot({path:`${out}/${width}-${time}.png`});
 }
 assert.equal(await page.locator('#welcome-title').textContent(),'Zobacz, jakie to proste!');await page.screenshot({path:`${out}/full-${width}.png`});
 const count=await page.evaluate(()=>welcomeDebug.inspect().renderCount);await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>welcomeDebug.inspect().renderCount),count);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#welcome-replay').click();assert.equal(await page.evaluate(()=>welcomeDebug.inspect().phase),'complete');assert.equal(await page.evaluate(()=>welcomeDebug.inspect().playing),false);
 await page.locator('#start-configurator').click();await page.waitForFunction(()=>document.body.dataset.ready==='true');assert.equal(await page.locator('#welcome-film canvas').count(),0);assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);console.log('PASS welcome sequence, four wires, reduced motion, disposal',engine.name(),width);
 }finally{await browser.close();}
}
