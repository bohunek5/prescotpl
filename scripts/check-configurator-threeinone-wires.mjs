import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/',out='output/configurator';await fs.mkdir(out,{recursive:true});
const labels=['+24V','−L','−M','−H'];
const set=async(p,c)=>{await p.evaluate(c=>location.hash='config='+encodeURIComponent(JSON.stringify({...studioDebug.state,...c})),c);await p.waitForFunction(c=>Object.entries(c).every(([k,v])=>studioDebug.state[k]===v),c);await p.waitForFunction(()=>!studioDebug.inspect().cameraMoving);};
const check=wires=>{assert.equal(wires.length,4);assert.deepEqual(wires.map(w=>w.terminal),labels);assert.equal(wires.filter(w=>w.active).length,2);};
for(const [engine,width]of [[chromium,1440],[webkit,390]]){
 const browser=await engine.launch();try{
 const p=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:2,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(new URL('konfigurator/?check='+Date.now(),base).href);await p.locator('#start-configurator').click();await p.waitForFunction(()=>document.body.dataset.ready==='true');
 await set(p,{housing:'profile',profile:'micro',strip:'threeinone',cover:'hs-opal',view:'macro',detail:'wiring',length:100,showCable:true,endcaps:true,light:false,lightStudy:false});
 await p.locator('#reset-camera').click();await p.waitForFunction(()=>!studioDebug.inspect().cameraMoving);
 const camera=await p.evaluate(()=>[studioDebug.inspect().camera,studioDebug.inspect().cameraTarget]);let padOrder;
 for(const [mode,selected]of [['low','−L'],['medium','−M'],['high','−H']]){
  await p.locator(`[data-power="${mode}"]`).click();const wires=await p.evaluate(()=>studioDebug.inspect().wires);check(wires);assert.ok(wires.every(w=>w.visible));assert.deepEqual(wires.map(w=>w.color),['d52f27','292d31','292d31','292d31']);assert.deepEqual(wires.filter(w=>w.active).map(w=>w.terminal),['+24V',selected]);
  const order=wires.map(w=>[w.padIndex,w.padZ]);if(padOrder)assert.deepEqual(order,padOrder);else padOrder=order;
  assert.deepEqual(await p.evaluate(()=>[studioDebug.inspect().camera,studioDebug.inspect().cameraTarget]),camera);
  if(mode!=='medium')await p.locator('#viewport').screenshot({path:`${out}/four-wires-${width}-${mode}.png`});
 }
 for(const view of ['assembly','mounting','zone']){
  await set(p,{view,exploded:0,assemblyAngle:'entry',mounting:'recessed',mountStep:3,zone:'drawer',zoneOpen:true,zoneTrigger:'door',zoneDetail:true,light:true,dimmer:70});
  for(const mode of ['low','medium','high']){
   await p.locator(`[data-power="${mode}"]`).click();const d=await p.evaluate(()=>studioDebug.inspect());const wires=view==='assembly'?d.wires:view==='mounting'?d.mount.wiring.connections:d.zone.wiring.connections;check(wires);if(view!=='assembly')assert.equal((view==='mounting'?d.mount:d.zone).wiring.throughCap,true);
  }
  await p.locator('#viewport').screenshot({path:`${out}/four-wires-${width}-${view}.png`});
 }
 await p.locator('#zone-motion').click();assert.equal(await p.locator('#dimmer').inputValue(),'0');check(await p.evaluate(()=>studioDebug.inspect().zone.wiring.connections));await p.locator('#zone-motion').click();assert.equal(await p.locator('#dimmer').inputValue(),'70');
 if(width===1440){
  // The plinth reverses angled profiles; its wire route must follow that end.
  await set(p,{view:'zone',zone:'plinth',profile:'alu45',mounting:'surface',zoneTrigger:'manual'});check(await p.evaluate(()=>studioDebug.inspect().zone.wiring.connections));
  await set(p,{view:'assembly',profile:'micro',strip:'threeinone',powerMode:'low',exploded:0,assemblyAngle:'perspective'});await p.locator('#export-open').click();const waiting=p.waitForEvent('download',{timeout:45000});await p.locator('#export-glb').click();const download=await waiting;await download.saveAs(`${out}/threeinone-four-wires.glb`);
  const b=await fs.readFile(`${out}/threeinone-four-wires.glb`),n=b.readUInt32LE(12),g=JSON.parse(b.toString('utf8',20,20+n).trim()),wireNodes=g.nodes.filter(n=>n.extras?.polarity);check(wireNodes.map(n=>n.extras));assert.deepEqual(wireNodes.filter(n=>n.extras.active).map(n=>n.extras.terminal),['+24V','−L']);await p.locator('#export-dialog .close').click();
 }
 for(const [strip,count]of [['delux',2],['cct',3],['premium-rgbw',5]]){await set(p,{view:'macro',detail:'wiring',profile:'micro',strip});assert.equal(await p.evaluate(()=>studioDebug.inspect().wires.length),count);}
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(errors,[]);console.log('PASS persistent four leads / active L-M-H / mounting / zones / GLB',engine.name(),width,base);
 }finally{await browser.close()}
}
