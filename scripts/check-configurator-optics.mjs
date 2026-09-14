import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/',out='output/configurator';
await fs.mkdir(out,{recursive:true});
const set=async(p,c)=>{await p.evaluate(c=>location.hash='config='+encodeURIComponent(JSON.stringify({...studioDebug.state,...c})),c);await p.waitForTimeout(400);await p.waitForFunction(()=>!studioDebug.inspect().cameraMoving);};
const inspect=p=>p.evaluate(()=>studioDebug.inspect());
const camera=d=>[d.camera,d.cameraTarget,d.cameraZoom];
for(const [engine,width,dpr]of[[chromium,1920,2],[chromium,3840,1],[webkit,390,2]]){
 const browser=await engine.launch();try{
  const p=await browser.newPage({viewport:{width,height:1080},deviceScaleFactor:dpr,reducedMotion:'reduce'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await p.goto(new URL('konfigurator/',base).href);await p.locator('#start-configurator').click();await p.waitForFunction(()=>document.body.dataset.ready==='true');
  for(const angle of ['perspective','end','entry','side']){
   await set(p,{housing:'profile',profile:'stos',strip:'cob',cover:'hs12-opal',view:'assembly',assemblyAngle:angle,exploded:100,lightStudy:true,dimmer:100,endcaps:true});await p.locator('#reset-camera').click();await p.waitForTimeout(400);const before=camera(await inspect(p));
   for(const exploded of [100,70,40,0]){
    await set(p,{exploded});const d=await inspect(p),points=d.productProjection;assert.ok(points.length);assert.deepEqual(camera(d),before);assert.ok(points.every(([x,y])=>Math.abs(x)<1.01&&Math.abs(y)<1.01),`${width} ${angle} ${exploded}: clipping`);
    if(exploded===0){const ys=points.map(p=>p[1]);assert.ok(Math.abs((Math.max(...ys)+Math.min(...ys))/2)<.38,`${width} ${angle}: low frame`);assert.ok(d.coverLight.beam.visible);}
   }
   await p.locator('#viewport').screenshot({path:`${out}/optics-${width}-${angle}.png`});
  }
  await set(p,{assemblyAngle:'perspective',endcaps:false,exploded:0,dimmer:20});const low=(await inspect(p)).coverLight.beam;
  await set(p,{dimmer:100});const high=(await inspect(p)).coverLight.beam;assert.ok(high.level>low.level&&high.reachMm>low.reachMm);
  await set(p,{cover:'hs12-clear'});assert.equal((await inspect(p)).coverLight.beam.transmission,.94);
  await set(p,{dimmer:0});assert.equal((await inspect(p)).coverLight.beam.visible,false);
  for(const strip of ['slim','delux-lb4014','cct','premium-rgbw']){
   await set(p,{view:'macro',strip,detail:'segment',light:false,lightStudy:false});await p.locator('#reset-camera').click();await p.waitForTimeout(400);await p.locator('#viewport').screenshot({path:`${out}/optics-${width}-${strip}.png`});
  }
  for(const sleeve of ['basic8','basic10','standard','side','top','oval']){
   await set(p,{housing:'sleeve',sleeve,strip:sleeve==='side'?'slim':'delux',detail:'seal',sealClosed:true,sleeveFixings:true,sleeveCaps:true,light:false});await p.locator('#reset-camera').click();await p.waitForTimeout(400);const data=(await inspect(p)).silicone;assert.equal(data.accessories.length,4);assert.ok(data.accessories.filter(a=>a.sign).every(a=>a.cup&&a.material==='white-silicone'));
   await p.locator('#viewport').screenshot({path:`${out}/optics-${width}-cap-${sleeve}.png`});
   await set(p,{detail:'sleeve',light:true,lightStudy:true,dimmer:75});assert.ok((await inspect(p)).silicone.beams.some(b=>b.visible));
   if(sleeve==='side')assert.equal((await inspect(p)).silicone.emissionDirection,'top');
  }
  await p.locator('#choose-sleeve>summary').click();await p.locator('#choose-sleeve').screenshot({path:`${out}/optics-${width}-sleeve-menu.png`});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await p.waitForTimeout(700);const d=await inspect(p);if(dpr===2)assert.ok(d.pixelRatio>=1.5);await p.waitForTimeout(500);assert.equal((await inspect(p)).renderCount,d.renderCount);
  assert.deepEqual(errors,[]);console.log('PASS optical detail / framing / sleeve fittings',engine.name(),width,'DPR',d.pixelRatio);
 }finally{await browser.close()}
}
