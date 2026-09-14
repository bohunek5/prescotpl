import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out='output/configurator/welcome';await fs.mkdir(out,{recursive:true});const base=process.env.BASE_URL||'http://127.0.0.1:4178/konfigurator/';
for(const [engine,width]of [[chromium,1440],[webkit,390]].filter(([,w])=>!process.env.TEST_WIDTH||w===+process.env.TEST_WIDTH)){
 const browser=await engine.launch();try{
 const page=await browser.newPage({viewport:{width,height:width<780?844:1000},deviceScaleFactor:width<780?2:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(base);await page.waitForFunction(()=>window.welcomeDebug);
 {
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
 for(const time of [0,.65,1.05,1.2,1.45,1.55,1.8,2.1,2.55,2.75,3.3,4,4.7,5]){
  await page.evaluate(t=>welcomeDebug.seek(t),time);const state=await page.evaluate(()=>welcomeDebug.inspect());states.set(time,state);
  assert.equal(state.visibleWireCount,4,`four visible wires at ${time}s, before and after caps`);
  if(time<2.9)assert.equal(state.light,0,'LED waits until the assembly is closed');
  await page.locator('#welcome-film').screenshot({path:`${out}/${width}-${time}.png`});
  if(['low','medium','high'].includes(state.phase)){assert.match(await page.locator('#welcome-phase').textContent(),new RegExp(`${state.powerMode.toUpperCase()} · ${state.wattsPerMeter} W/m`));assert.equal(await page.locator('.welcome-power-levels>[aria-current=true]').getAttribute('data-mode'),state.powerMode);assert.equal(await page.locator('.welcome-power-levels').getAttribute('aria-hidden'),'false');await page.screenshot({path:`${out}/${width}-power-${state.powerMode}.png`});}
 }
 assert.ok(Math.abs(states.get(1.55).pcbLiftMm-21)<.01);assert.ok(states.get(1.8).pcbLiftMm>0&&states.get(1.8).pcbLiftMm<21);assert.ok(Math.abs(states.get(2.1).pcbLiftMm)<.01,'the PCB lands on the channel floor');
 assert.equal(states.get(1.8).coverVisible,false,'the lowering PCB is unobstructed by the cover');assert.equal(states.get(2.1).coverVisible,true);
 assert.equal(states.get(1.2).liner.visible,true);assert.ok(states.get(1.2).liner.peel>0&&states.get(1.2).liner.peel<1);assert.equal(states.get(1.45).liner.peel,1);assert.ok(states.get(1.45).liner.exit>0&&states.get(1.45).liner.exit<1);
 assert.equal(states.get(1.55).liner.visible,false);assert.equal(states.get(1.55).liner.exit,1,'the backing is removed before the PCB is lowered');assert.equal(states.get(1.2).liner.backing,'200mp');
 const powers=[states.get(3.3),states.get(4),states.get(4.7)];assert.deepEqual(powers.map(p=>p.powerMode),['low','medium','high']);assert.deepEqual(powers.map(p=>p.wattsPerMeter),[3,6,11]);assert.deepEqual(powers.map(p=>p.lumensPerMeter),[460,930,1750]);
 assert.deepEqual(powers.map(p=>p.connections.filter(w=>w.active).map(w=>w.terminal)),[['+24V','−L'],['+24V','−M'],['+24V','−H']]);
 for(const field of ['pcb','cover','beam','bounce']){
  const values=powers.map(p=>p.emission[field]);assert.ok(values[0]>0&&values[1]>values[0]&&values[2]>values[1],`${field} must really emit more light at each power level`);
  assert.ok(Math.abs(values[0]/values[2]-460/1750)<1e-8,`${field} LOW follows manufacturer flux`);assert.ok(Math.abs(values[1]/values[2]-930/1750)<1e-8,`${field} MEDIUM follows manufacturer flux`);
 }
 assert.equal(await page.locator('#welcome-title').textContent(),'Zobacz, jakie to proste!');await page.screenshot({path:`${out}/full-${width}.png`});
 const startBounds=await page.locator('#start-configurator').boundingBox();assert.ok(startBounds&&startBounds.y>=0&&startBounds.y+startBounds.height<=page.viewportSize().height,'the start button is visible without scrolling');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'the welcome fits the mobile viewport');
 const count=await page.evaluate(()=>welcomeDebug.inspect().renderCount);await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>welcomeDebug.inspect().renderCount),count);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#welcome-replay').click();assert.equal(await page.evaluate(()=>welcomeDebug.inspect().phase),'complete');assert.equal(await page.evaluate(()=>welcomeDebug.inspect().playing),false);
 await page.locator('#start-configurator').click();await page.waitForFunction(()=>document.body.dataset.ready==='true');assert.equal(await page.locator('#welcome-film canvas').count(),0);assert.equal(await page.locator('.welcome-power-levels').count(),0);assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 const reducedPage=await browser.newPage({viewport:page.viewportSize(),reducedMotion:'reduce'});await reducedPage.goto(base);await reducedPage.waitForFunction(()=>window.welcomeDebug);const staticState=await reducedPage.evaluate(()=>welcomeDebug.inspect());assert.equal(staticState.time,5);assert.equal(staticState.playing,false);assert.equal(staticState.phase,'complete');await reducedPage.close();
 const earlyPage=await browser.newPage({viewport:page.viewportSize()});earlyPage.on('pageerror',e=>errors.push(e.message));await earlyPage.goto(base);await earlyPage.waitForFunction(()=>window.welcomeDebug?.inspect().playing);await earlyPage.locator('#start-configurator').click();await earlyPage.waitForFunction(()=>document.body.dataset.ready==='true');assert.equal(await earlyPage.locator('#welcome-film canvas').count(),0,'starting during playback disposes the film immediately');await earlyPage.waitForTimeout(150);assert.deepEqual(errors,[]);await earlyPage.close();
 console.log('PASS five-second DELUX film, 3M peel, PCB seating, LOW/MEDIUM/HIGH actual emission, four wires, mobile CTA, reduced motion, disposal',engine.name(),width);
 }finally{await browser.close();}
}
