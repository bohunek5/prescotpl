import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/',out='output/configurator';await fs.mkdir(out,{recursive:true});
const set=async(p,c)=>{await p.evaluate(c=>location.hash='config='+encodeURIComponent(JSON.stringify({...studioDebug.state,...c})),c);await p.waitForFunction(()=>!studioDebug.inspect().cameraMoving);await p.waitForTimeout(200);};
const output=async p=>p.evaluate(()=>({on:studioDebug.inspect().zone?.lightOn,level:studioDebug.inspect().zone?.lightOutput?.brightness,label:document.querySelector('#led-toggle').textContent,pressed:document.querySelector('#led-toggle').getAttribute('aria-pressed'),slider:Number(document.querySelector('#dimmer').value),saved:studioDebug.state.dimmer}));
for(const [engine,width]of [[chromium,1440],[chromium,320],[webkit,390]]){
 const browser=await engine.launch();try{
 const p=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:2}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(new URL('konfigurator/',base).href);await p.locator('#start-configurator').click();await p.waitForFunction(()=>document.body.dataset.ready==='true');
 await set(p,{view:'assembly',housing:'profile',profile:'pds',strip:'threeinone',cover:'hs11-opal',exploded:0,light:true,dimmer:80,lightStudy:true});await p.locator('#reset-camera').click();await p.waitForFunction(()=>!studioDebug.inspect().cameraMoving);
 assert.ok(await p.locator('.stage-light-controls #power-modes').isVisible());assert.equal(await p.locator('#choose-strip').getAttribute('open'),null);
 const camera=await p.evaluate(()=>[studioDebug.inspect().camera,studioDebug.inspect().cameraTarget]),modes=[];
 for(const mode of ['low','medium','high']){
  await p.locator(`[data-power=${mode}]`).click();await p.waitForTimeout(300);const d=await p.evaluate(()=>({state:studioDebug.state,cover:studioDebug.inspect().coverLight,led:studioDebug.inspect().ledLight,spec:studioDebug.spec()}));
  assert.equal(d.state.dimmer,80);assert.equal(d.state.powerMode,mode);assert.equal(d.state.cct,3000);assert.equal(await p.locator(`[data-power=${mode}]`).getAttribute('aria-pressed'),'true');modes.push({cover:d.cover.intensity,led:d.led.warm,watts:d.spec.wattsPerMeter,lm:d.spec.lumensPerMeter});
  assert.deepEqual(await p.evaluate(()=>[studioDebug.inspect().camera,studioDebug.inspect().cameraTarget]),camera);
  if(mode!=='medium')await p.locator('#studio-stage').screenshot({path:`${out}/power-${width}-${mode}.png`});
 }
 assert.deepEqual(modes.map(m=>m.watts),[3,6,11]);assert.deepEqual(modes.map(m=>m.lm),[460,930,1750]);assert.ok(modes[2].cover>modes[1].cover&&modes[1].cover>modes[0].cover);assert.ok(modes[2].led>modes[1].led&&modes[1].led>modes[0].led);
 await set(p,{housing:'sleeve',sleeve:'milk10',strip:'threeinone',detail:'product'});const silicone=[];for(const mode of ['low','high']){await p.locator(`[data-power=${mode}]`).click();await p.waitForFunction(()=>!studioDebug.inspect().building);silicone.push(await p.evaluate(()=>studioDebug.inspect().silicone.beams[0].level));}assert.ok(silicone[1]>silicone[0]*3);
 await set(p,{housing:'profile',view:'zone',zone:'under',profile:'pds',strip:'delux',cover:'hs11-opal',dimmer:73,light:true});
 for(const zone of ['drawer','cabinet']){
  await p.locator(`[data-zone=${zone}]`).click();assert.equal(await p.evaluate(()=>studioDebug.state.zoneTrigger),'door');
  await p.waitForFunction(()=>!studioDebug.inspect().cameraMoving);const camera=await p.evaluate(()=>studioDebug.inspect().camera);
  await p.evaluate(()=>{window.lightFrames=[];window.lightTimer=setInterval(()=>{const z=studioDebug.inspect().zone;lightFrames.push([z.lightOn,z.lightOutput.brightness,document.querySelector('#led-toggle').getAttribute('aria-pressed')==='true',Number(document.querySelector('#dimmer').value)]);},30)});
  await p.locator('#zone-motion').click();await p.waitForFunction(()=>studioDebug.inspect().zone.opening===0);let d=await output(p);assert.deepEqual(d,{on:false,level:0,label:'LED wyłączone',pressed:'false',slider:0,saved:73});assert.ok(await p.locator('#dimmer').isDisabled());
  await p.screenshot({path:`${out}/switch-${width}-${zone}-closed.png`,fullPage:width<781});
  await p.locator('#zone-motion').click();await p.waitForFunction(()=>studioDebug.inspect().zone.opening===1);d=await output(p);assert.equal(d.slider,73);assert.equal(d.on,true);assert.equal(d.pressed,'true');assert.equal(await p.locator('#dimmer').isDisabled(),false);
  const frames=await p.evaluate(()=>{clearInterval(lightTimer);return lightFrames});assert.ok(frames.every(([on,level,pressed,slider])=>on===pressed&&level===slider),'UI and model must agree during the whole movement');assert.deepEqual(await p.evaluate(()=>studioDebug.inspect().camera),camera);
 }
 // Dimmer zero and manual off remain off; reopening must not erase manual intent.
 await p.locator('#led-toggle').click();assert.equal((await output(p)).slider,0);await p.locator('#zone-motion').click();await p.waitForFunction(()=>studioDebug.inspect().zone.opening===0);await p.locator('#zone-motion').click();await p.waitForFunction(()=>studioDebug.inspect().zone.opening===1);assert.equal((await output(p)).on,false);await p.locator('#led-toggle').click();assert.equal((await output(p)).slider,73);
 await p.locator('#dimmer').fill('0');assert.equal((await output(p)).pressed,'false');assert.equal((await output(p)).on,false);await p.locator('#led-toggle').click();assert.equal((await output(p)).slider,73);
 await set(p,{zoneTrigger:'manual',zoneOpen:false});assert.equal((await output(p)).on,true);assert.equal((await output(p)).slider,73);
 await set(p,{view:'assembly',zoneTrigger:'door',zoneOpen:false});assert.equal(await p.locator('#led-toggle').getAttribute('aria-pressed'),'true');assert.ok(await p.locator('#power-modes').isHidden());
 await p.emulateMedia({reducedMotion:'reduce'});await set(p,{view:'zone',zone:'drawer',zoneTrigger:'door',zoneOpen:true});await p.locator('#zone-motion').click();assert.equal((await output(p)).slider,0);await p.locator('#zone-motion').click();assert.equal((await output(p)).slider,73);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await p.waitForTimeout(750);const frame=await p.evaluate(()=>studioDebug.inspect().renderCount);await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>studioDebug.inspect().renderCount),frame);assert.deepEqual(errors,[]);console.log('PASS power modes / switch / dimmer / motion',engine.name(),width);
 }finally{await browser.close()}
}
