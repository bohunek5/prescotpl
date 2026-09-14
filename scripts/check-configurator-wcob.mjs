import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/',out='output/configurator';await fs.mkdir(out,{recursive:true});
const set=async(p,c)=>{await p.evaluate(c=>location.hash='config='+encodeURIComponent(JSON.stringify({...studioDebug.state,...c})),c);await p.waitForTimeout(450);await p.waitForFunction(()=>!studioDebug.inspect().cameraMoving);};
for(const [engine,width]of [[chromium,1440],[webkit,390]]){
 const browser=await engine.launch();try{
  const p=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:2,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await p.goto(new URL('konfigurator/',base).href);await p.locator('#start-configurator').click();await p.waitForFunction(()=>document.body.dataset.ready==='true');
  for(const strip of ['wcob','wcob-cct']){
   await set(p,{housing:'sleeve',sleeve:'none',strip,detail:'product',sealClosed:false,light:true,dimmer:40,lightStudy:true,sleeveCaps:true});await p.locator('#reset-camera').click();
   const d=await p.evaluate(()=>studioDebug.inspect());assert.equal(d.silicone.accessories.length,2);assert.equal(d.liner.visible,true);assert.equal(d.liner.backing,'wcob-3m');assert.ok(d.silicone.capLight.lightLevel>0);assert.ok(await p.locator('[data-detail=seal]').isVisible());
   await p.locator('#viewport').screenshot({path:`${out}/wcob-${width}-${strip}-lit.png`});
   await p.locator('[data-detail=seal]').click();await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>studioDebug.state.detail),'seal');assert.equal(await p.evaluate(()=>studioDebug.inspect().silicone.capLight.lightLevel),0);
   await p.locator('#seal-close').click();assert.ok(await p.evaluate(()=>studioDebug.inspect().silicone.capLight.lightLevel>0));await p.locator('#viewport').screenshot({path:`${out}/wcob-${width}-${strip}-ends.png`});
   const project=await p.evaluate(()=>studioDebug.project());assert.equal(project.components.accessories.length,1);assert.match(project.components.accessories[0].name,/WCOB/);assert.equal(project.components.profile,null);
   await set(p,{housing:'profile',profile:'pds',view:'assembly',assemblyAngle:'perspective',exploded:100,endcaps:false,strip,light:false});await p.locator('#reset-camera').click();const camera=await p.evaluate(()=>{const d=studioDebug.inspect();return[d.camera,d.cameraTarget,d.cameraZoom]});
   for(const amount of [100,88,75,65,62,55,0]){await set(p,{exploded:amount});const d=await p.evaluate(()=>studioDebug.inspect());assert.deepEqual([d.camera,d.cameraTarget,d.cameraZoom],camera);assert.equal(d.liner.backing,'wcob-3m');if(amount>62){assert.ok(d.liner.visible);if(amount<100)assert.ok(d.liner.peel>0);}if(amount<=62)assert.equal(d.liner.visible,false);if(amount>=62)assert.ok(d.assembly.pcbLiftMm>19);if(amount===0)assert.equal(d.assembly.pcbLiftMm,0);if(amount===88)await p.locator('#viewport').screenshot({path:`${out}/wcob-${width}-${strip}-peel.png`});}
  }
  if(width===1440){
   await p.locator('#export-open').click();const waiting=p.waitForEvent('download',{timeout:45000});await p.locator('#export-glb').click();const download=await waiting;await download.saveAs(`${out}/wcob-assembly.glb`);const b=await fs.readFile(`${out}/wcob-assembly.glb`),n=b.readUInt32LE(12),gltf=JSON.parse(b.toString('utf8',20,20+n).trim());
   const paper=gltf.nodes.findIndex(n=>n.name==='Podklad_od_srodka');assert.ok(paper>=0);assert.ok(gltf.animations[0].channels.some(c=>c.target.node===paper&&c.target.path==='weights'));assert.ok(gltf.animations[0].channels.some(c=>c.target.node===paper&&c.target.path==='scale'));assert.ok(gltf.nodes.some(n=>n.name==='WCOB_nasadka_przewodowa'));assert.ok(gltf.nodes.some(n=>n.name==='WCOB_zaslepka_pelna'));
   await p.locator('#export-dialog .close').click();
  }
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await p.waitForTimeout(650);const frame=await p.evaluate(()=>studioDebug.inspect().renderCount);await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>studioDebug.inspect().renderCount),frame);assert.deepEqual(errors,[]);console.log('PASS WCOB fittings / 3M peel / export',engine.name(),width);
 }finally{await browser.close()}
}
