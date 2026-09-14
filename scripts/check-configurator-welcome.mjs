import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out='output/configurator/welcome';await fs.mkdir(out,{recursive:true});const base=process.env.BASE_URL||'http://127.0.0.1:4178/konfigurator/';
for(const [engine,width]of [[chromium,1440],[webkit,390]].filter(([,w])=>!process.env.TEST_WIDTH||w===+process.env.TEST_WIDTH)){
 const browser=await engine.launch();try{
 const page=await browser.newPage({viewport:{width,height:width<780?844:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(base);await page.waitForFunction(()=>window.welcomeDebug);
 if(width===1440){
  await page.locator('#welcome-replay').click();assert.equal(await page.evaluate(()=>welcomeDebug.inspect().playing),false);
  const paused=await page.evaluate(()=>welcomeDebug.inspect().time);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>welcomeDebug.inspect().time),paused);
  const started=Date.now();await page.locator('#welcome-replay').click();await page.waitForFunction(()=>welcomeDebug.inspect().phase==='complete'&&!welcomeDebug.inspect().playing,null,{timeout:8500});
  assert.ok(Date.now()-started<8000,'a five-second film must finish promptly');
 }
 const sample=await page.evaluate(()=>welcomeDebug.inspect());assert.equal(sample.duration,5);assert.equal(sample.sampleLength,50);assert.equal(sample.connections.length,4);assert.equal(sample.throughCap,true);
 assert.equal(new Set(sample.connections.map(wire=>wire.terminal)).size,4,'all four distinct DELUX terminals are connected');
 assert.ok(sample.connections.every(wire=>wire.port[0]<-.025),'all four wires pass through the end-cap plane of the 50 mm sample');
 assert.ok(await page.locator('#start-configurator').isEnabled());assert.match(await page.locator('.welcome-product').textContent(),/DELUX\s*3 w 1/);assert.match(await page.locator('.welcome-warranty').textContent(),/7 lat.*gwarancji/);
 const states=new Map();
 for(const time of [0,1.1,1.7,1.95,2.3,2.45,2.8,3.2,3.85,4.1,4.25,5]){
  await page.evaluate(t=>welcomeDebug.seek(t),time);const state=await page.evaluate(()=>welcomeDebug.inspect());states.set(time,state);
  assert.equal(state.visibleWireCount,4,`four visible wires at ${time}s, before and after caps`);
  if(time<4.25)assert.equal(state.light,0,'LED waits until the assembly is closed');
  await page.locator('#welcome-film').screenshot({path:`${out}/${width}-${time}.png`});
 }
 assert.ok(Math.abs(states.get(2.45).pcbLiftMm-21)<.01);assert.ok(states.get(2.8).pcbLiftMm>0&&states.get(2.8).pcbLiftMm<21);assert.ok(Math.abs(states.get(3.2).pcbLiftMm)<.01,'the PCB lands on the channel floor');
 assert.equal(states.get(2.8).coverVisible,false,'the lowering PCB is unobstructed by the cover');assert.equal(states.get(3.2).coverVisible,true);
 assert.equal(states.get(1.95).liner.visible,true);assert.ok(states.get(1.95).liner.peel>0&&states.get(1.95).liner.peel<1);assert.equal(states.get(2.3).liner.peel,1);assert.ok(states.get(2.3).liner.exit>0&&states.get(2.3).liner.exit<1);
 assert.equal(states.get(2.45).liner.visible,false);assert.equal(states.get(2.45).liner.exit,1,'the backing is removed before the PCB is lowered');assert.equal(states.get(1.95).liner.backing,'200mp');
 assert.equal(await page.locator('#welcome-title').textContent(),'Zobacz, jakie to proste!');await page.screenshot({path:`${out}/full-${width}.png`});
 const startBounds=await page.locator('#start-configurator').boundingBox();assert.ok(startBounds&&startBounds.y>=0&&startBounds.y+startBounds.height<=page.viewportSize().height,'the start button is visible without scrolling');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'the welcome fits the mobile viewport');
 const count=await page.evaluate(()=>welcomeDebug.inspect().renderCount);await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>welcomeDebug.inspect().renderCount),count);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#welcome-replay').click();assert.equal(await page.evaluate(()=>welcomeDebug.inspect().phase),'complete');assert.equal(await page.evaluate(()=>welcomeDebug.inspect().playing),false);
 await page.locator('#start-configurator').click();await page.waitForFunction(()=>document.body.dataset.ready==='true');assert.equal(await page.locator('#welcome-film canvas').count(),0);assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 const reducedPage=await browser.newPage({viewport:page.viewportSize(),reducedMotion:'reduce'});await reducedPage.goto(base);await reducedPage.waitForFunction(()=>window.welcomeDebug);const staticState=await reducedPage.evaluate(()=>welcomeDebug.inspect());assert.equal(staticState.time,5);assert.equal(staticState.playing,false);assert.equal(staticState.phase,'complete');await reducedPage.close();
 const earlyPage=await browser.newPage({viewport:page.viewportSize()});earlyPage.on('pageerror',e=>errors.push(e.message));await earlyPage.goto(base);await earlyPage.waitForFunction(()=>window.welcomeDebug?.inspect().playing);await earlyPage.locator('#start-configurator').click();await earlyPage.waitForFunction(()=>document.body.dataset.ready==='true');assert.equal(await earlyPage.locator('#welcome-film canvas').count(),0,'starting during playback disposes the film immediately');await earlyPage.waitForTimeout(150);assert.deepEqual(errors,[]);await earlyPage.close();
 console.log('PASS five-second DELUX film, 3M peel, PCB seating, four wires, mobile CTA, reduced motion, disposal',engine.name(),width);
 }finally{await browser.close();}
}
