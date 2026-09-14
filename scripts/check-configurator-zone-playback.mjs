import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/',out='output/configurator';await fs.mkdir(out,{recursive:true});
const set=async(p,c)=>{await p.evaluate(c=>location.hash='config='+encodeURIComponent(JSON.stringify({...studioDebug.state,...c})),c);await p.waitForFunction(c=>Object.entries(c).every(([k,v])=>studioDebug.state[k]===v),c);await p.waitForFunction(()=>!studioDebug.inspect().cameraMoving);};
for(const [engine,width]of [[chromium,1440],[webkit,390],[chromium,320]].filter(([,width])=>!process.env.TEST_WIDTH||width===Number(process.env.TEST_WIDTH))){
 const browser=await engine.launch();try{
 const p=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:2}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(new URL('konfigurator/',base).href);await p.locator('#start-configurator').click();await p.waitForFunction(()=>document.body.dataset.ready==='true');
 await set(p,{housing:'profile',profile:'micro',cover:'hs-opal',strip:'delux',view:'zone',zone:'drawer',zoneDetail:false,zoneOpen:true,zoneTrigger:'door',light:true,dimmer:73,lightStudy:false});
 const camera=await p.evaluate(()=>[studioDebug.inspect().camera,studioDebug.inspect().cameraTarget]),textures=[];
 for(const material of ['white','black','graphite','sand','oak','oak-white','walnut','ash']){
  await p.locator(`#zone-materials [data-value="${material}"]`).click();const d=await p.evaluate(()=>studioDebug.inspect());assert.equal(d.surface.id,material);assert.equal(await p.locator(`#zone-materials [data-value="${material}"]`).getAttribute('aria-pressed'),'true');assert.deepEqual([d.camera,d.cameraTarget],camera);if(d.surface.mapped)textures.push(d.surface.textureId);
  if(width===1440||material==='ash')await p.locator('#studio-stage').screenshot({path:`${out}/zone-surface-${width}-${material}.png`});
 }
 assert.equal(new Set(textures).size,4);
 await p.evaluate(()=>{window.zoneFrames=[];window.zoneTimer=setInterval(()=>{const z=studioDebug.inspect().zone;zoneFrames.push([z.opening,z.lightOn,z.lightOutput.brightness,Number(document.querySelector('#dimmer').value)]);},40)});
 await p.locator('#zone-play').click();await p.waitForFunction(()=>studioDebug.inspect().zone.opening===0);assert.equal(await p.locator('#dimmer').inputValue(),'0');
 await p.waitForFunction(()=>studioDebug.inspect().zone.opening===1);assert.equal(await p.locator('#dimmer').inputValue(),'73');
 await p.waitForFunction(()=>{const o=studioDebug.inspect().zone.opening;return o<.8&&o>.2});await p.locator('#zone-play').click();assert.equal(await p.locator('#zone-play').getAttribute('aria-pressed'),'false');
 const paused=await p.evaluate(()=>studioDebug.inspect().zone.opening);await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>studioDebug.inspect().zone.opening),paused);
 // Changing the finish while paused keeps the exact drawer position and camera.
 await p.locator('#zone-materials [data-value=white]').click();assert.equal(await p.evaluate(()=>studioDebug.inspect().zone.opening),paused);
 await p.locator('#zone-play').click();await p.waitForFunction(()=>studioDebug.inspect().zone.opening===0);await p.locator('#zone-play').click();
 const frames=await p.evaluate(()=>{clearInterval(zoneTimer);return zoneFrames});assert.ok(frames.every(([,on,level,slider])=>level===slider&&on===(slider>0)));assert.deepEqual(await p.evaluate(()=>[studioDebug.inspect().camera,studioDebug.inspect().cameraTarget]),camera);
 await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#zone-play').click();assert.equal(await p.evaluate(()=>studioDebug.inspect().zone.opening),1);assert.equal(await p.locator('#zone-play').getAttribute('aria-pressed'),'false');
 await set(p,{view:'zone',zone:'shelf',zoneTrigger:'manual'});assert.ok(await p.locator('#zone-play').isHidden());assert.ok(await p.locator('#zone-materials').isVisible());
 await set(p,{view:'mounting',mounting:'recessed',mountStep:0,profile:'micro',strip:'delux',endcaps:true,showCable:false});
 await p.locator('[data-mount-step="0"]').click();assert.equal(await p.evaluate(()=>studioDebug.inspect().mount.stepParts.profile),false);
 await p.locator('[data-mount-step="1"]').click();assert.deepEqual(await p.evaluate(()=>studioDebug.inspect().mount.stepParts),{profile:true,pcb:false,cover:false,accessories:false});await p.locator('#viewport').screenshot({path:`${out}/mount-fitting-${width}.png`});
 const strips=width===1440?[['delux',2],['cct',3],['premium-rgbw',5],['threeinone',4]]:[['delux',2]];
 for(const [strip,count]of strips){
  await set(p,{strip,mountStep:3});const d=await p.evaluate(()=>studioDebug.inspect().mount);assert.equal(d.stepParts.pcb,true);assert.equal(d.stepParts.cover,false);assert.equal(d.wiring.connections.length,count);assert.equal(d.wiring.throughCap,true);assert.ok(d.wiring.connections.every(c=>c.start.every(Number.isFinite)&&c.port[0]<c.start[0]));
  if(width===1440||strip==='delux')await p.locator('#viewport').screenshot({path:`${out}/mount-wiring-${width}-${strip}.png`});
 }
 await set(p,{endcaps:false});assert.equal(await p.evaluate(()=>studioDebug.inspect().mount.wiring.throughCap),false);assert.equal(await p.evaluate(()=>studioDebug.inspect().mount.stepParts.accessories),false);
 await p.locator('[data-mount-step="4"]').click();assert.equal(await p.evaluate(()=>studioDebug.inspect().mount.stepParts.cover),true);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await p.waitForFunction(()=>{const d=studioDebug.inspect();return !d.cameraMoving&&!d.interactive&&!d.renderPending});await p.waitForTimeout(200);const frame=await p.evaluate(()=>studioDebug.inspect().renderCount);await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>studioDebug.inspect().renderCount),frame);assert.deepEqual(errors,[]);console.log('PASS zone loop / eight finishes / fitting / connected wiring',engine.name(),width);
 }finally{await browser.close()}
}
