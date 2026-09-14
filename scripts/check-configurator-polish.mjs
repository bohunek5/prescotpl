import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out='output/configurator/polish';await fs.mkdir(out,{recursive:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4178/konfigurator/';
for(const [engine,width]of [[chromium,1440],[webkit,390]].filter(([,w])=>!process.env.TEST_WIDTH||w===+process.env.TEST_WIDTH)){
 const browser=await engine.launch();try{
 const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const set=async data=>{await page.evaluate(data=>location.hash='config='+encodeURIComponent(JSON.stringify({...studioDebug.state,...data})),data);await page.waitForFunction(data=>Object.entries(data).every(([k,v])=>studioDebug.state[k]===v)&&!studioDebug.inspect().cameraMoving&&!studioDebug.inspect().building,data);};
 await page.goto(base+'#config='+encodeURIComponent(JSON.stringify({profile:'pds',exploded:0,lightStudy:true})));
 await page.waitForFunction(()=>document.body.dataset.ready==='true');
 await page.evaluate(()=>{document.querySelector('#profiles [data-value=alu45]').click();window.loadingSeen=document.querySelector('#viewport').getAttribute('aria-busy')==='true';document.querySelector('#profiles [data-value=pds]').click();});
 await page.waitForFunction(()=>!studioDebug.inspect().building);
 assert.equal(await page.evaluate(()=>loadingSeen),true);assert.equal(await page.locator('#viewport').getAttribute('aria-busy'),'false');assert.equal(await page.locator('.studio-loading .loading-pattern i').count(),3);
 assert.ok(Math.abs((await page.evaluate(()=>studioDebug.inspect().profileSize)).y-.012)<.001,'latest requested profile was rendered');
 assert.ok(await page.locator('#live-section').isVisible());assert.ok(await page.locator('#mobile-assembly-play').isVisible());await page.locator('#studio-stage').screenshot({path:`${out}/profile-${width}.png`});
 await set({dimmer:0});assert.equal(await page.locator('#live-section').evaluate(el=>el.style.getPropertyValue('--section-level')),'0');
 await set({housing:'sleeve',sleeve:'standard',detail:'sleeve',strip:'delux',sleeveInsertion:0,dimmer:65});
 await page.locator('#viewport').screenshot({path:`${out}/sleeve-out-${width}.png`});
 assert.ok(await page.locator('#sleeve-play').isVisible());const camera=await page.evaluate(()=>studioDebug.inspect().camera);
 await page.locator('#sleeve-play').click();await page.waitForFunction(()=>studioDebug.state.sleeveInsertion>.2&&studioDebug.state.sleeveInsertion<.8);await page.locator('#sleeve-play').click();
 const paused=await page.evaluate(()=>studioDebug.state.sleeveInsertion);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>studioDebug.state.sleeveInsertion),paused);
 await page.locator('#sleeve-play').click();await page.waitForFunction(()=>studioDebug.state.sleeveInsertion===1);assert.deepEqual(await page.evaluate(()=>studioDebug.inspect().camera),camera);
 assert.equal(await page.evaluate(()=>studioDebug.inspect().silicone.insertedFraction),1);await page.locator('#viewport').screenshot({path:`${out}/sleeve-in-${width}.png`});
 await page.locator('#choose-settings summary').click();await page.locator('#length').scrollIntoViewIfNeeded();
 const before=await page.locator('#length').boundingBox();await page.locator('#length').evaluate(el=>{el.value='750';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>studioDebug.state.detail),'sleeve');const after=await page.locator('#length').boundingBox();assert.ok(Math.abs(before.y-after.y)<3,JSON.stringify({before,after}));
 await set({housing:'profile',profile:'micronk',view:'zone',zone:'stair-under',zoneDetail:false,mounting:'recessed',material:'oak'});
 assert.equal(await page.locator('#stair-controls').isVisible(),true);assert.equal(await page.locator('#zone-play').isHidden(),true);assert.equal(await page.evaluate(()=>studioDebug.inspect().zone.lighting.bounce.surface),'Stopien_1');await page.locator('#viewport').screenshot({path:`${out}/stairs-under-${width}.png`});
 const stairCamera=await page.evaluate(()=>studioDebug.inspect().camera);await set({stairThickness:40,stairRiser:false});assert.deepEqual(await page.evaluate(()=>studioDebug.inspect().camera),stairCamera);
 await set({zone:'stair-side',stairRiser:true,stairSideHeight:85});assert.ok(await page.locator('#stair-height').isVisible());await page.locator('#viewport').screenshot({path:`${out}/stairs-side-${width}.png`});
 await set({zoneDetail:true});await page.locator('#viewport').screenshot({path:`${out}/stairs-detail-${width}.png`});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await page.waitForFunction(()=>{const d=studioDebug.inspect();return !d.cameraMoving&&!d.interactive&&!d.renderPending});await page.waitForTimeout(300);const count=await page.evaluate(()=>studioDebug.inspect().renderCount);await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>studioDebug.inspect().renderCount),count);assert.deepEqual(errors,[]);console.log('PASS polish, sleeve insertion, stable length, stairs, idle',engine.name(),width);
 }finally{await browser.close();}
}
