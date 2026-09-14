import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/',out='output/configurator';
await fs.mkdir(out,{recursive:true});
const set=async(p,c)=>{await p.evaluate(c=>location.hash='config='+encodeURIComponent(JSON.stringify({...studioDebug.state,...c})),c);await p.waitForTimeout(450);await p.waitForFunction(()=>!studioDebug.inspect().cameraMoving);};
const glbJson=buffer=>{assert.equal(buffer.toString('utf8',0,4),'glTF');const n=buffer.readUInt32LE(12);return JSON.parse(buffer.toString('utf8',20,20+n).trim());};
for(const [engine,width]of[[chromium,1440],[chromium,320],[webkit,390]]){
 const browser=await engine.launch();try{
 const p=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce',hasTouch:width<781}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.goto(new URL('konfigurator/',base).href);await p.locator('#start-configurator').click();await p.waitForFunction(()=>document.body.dataset.ready==='true');
 await set(p,{strip:'premium-rgbw',profile:'micro',cover:'hs-opal',rgbMode:'rgb',rgbColor:'#a620ff',lightStudy:true,exploded:0});
 const rgb=await p.evaluate(()=>studioDebug.inspect());assert.equal(rgb.coverLight.color,'a620ff');assert.ok(rgb.coverLight.intensity>0);
 await p.locator('#viewport').screenshot({path:`${out}/housing-${engine.name()}-${width}-rgb.png`});
 await p.locator('button[data-housing=sleeve]').click();await p.waitForTimeout(400);
 for(const selector of['#choose-profile','#choose-cover','#choose-accessories','.views'])assert.equal(await p.locator(selector).isVisible(),false);
 await p.locator('#choose-sleeve>summary').click();await p.locator('#sleeve').selectOption('milk10');
 await p.locator('#viewport').screenshot({path:`${out}/housing-${engine.name()}-${width}-sleeve.png`});
 await p.locator('#choose-sleeve>summary').click();
 const project=await p.evaluate(()=>studioDebug.project());assert.equal(project.components.profile,null);assert.equal(project.components.cover,null);assert.deepEqual(project.components.accessories.map(a=>a.ref),['KSC-10MM','KSC-10MM-O']);assert.equal(project.components.sleeve.ref,'KSM-10MM');
 for(const detail of['sleeve','seal','segment','wiring','product']){await p.locator(`button[data-detail=${detail}]`).click();await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>studioDebug.state.housing),'sleeve');}
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await p.screenshot({path:`${out}/housing-${engine.name()}-${width}-ui.png`,fullPage:width<781});
 if(width===1440){
  await p.locator('#export-open').click();
  for(const [id,name]of[['export-json','json'],['export-sheet','html'],['export-glb','glb']]){
   const waiting=p.waitForEvent('download',{timeout:45000});await p.locator('#'+id).click();const download=await waiting;await download.saveAs(`${out}/housing-export.${name}`);
  }
  const exported=glbJson(await fs.readFile(`${out}/housing-export.glb`));assert.ok(exported.nodes.some(n=>n.name?.startsWith('Koszulka_')));assert.ok(!exported.nodes.some(n=>n.name?.startsWith('KLUŚ_')));assert.equal(exported.animations?.length||0,0);
  const html=await fs.readFile(`${out}/housing-export.html`,'utf8');assert.ok(html.includes('KSM-10MM'));assert.ok(!html.includes('MICRO-PLUS'));
  await p.locator('#export-dialog .close').click();
 }
 await p.locator('button[data-housing=profile]').click();assert.equal(await p.locator('#choose-sleeve').isVisible(),false);assert.equal(await p.evaluate(()=>studioDebug.state.sleeve),'none');assert.equal(await p.locator('#choose-cover').isVisible(),true);
 for(const profile of['pdszmg','pdst','pdsust']){
  await set(p,{housing:'profile',profile,strip:'delux',cover:'hs11-opal',view:'assembly',exploded:100,lightStudy:false,endcaps:true});
  await p.locator('#reset-camera').click();assert.equal(await p.evaluate(()=>studioDebug.spec().fitStatus),'compatible');
  await p.locator('#viewport').screenshot({path:`${out}/new-${profile}-${engine.name()}-${width}.png`});
  if(profile!=='pdszmg'){await set(p,{view:'mounting',mountStep:3});assert.equal(await p.evaluate(()=>studioDebug.state.zone),'drywall');await p.locator('#viewport').screenshot({path:`${out}/new-${profile}-mount-${engine.name()}-${width}.png`});}
 }
 await set(p,{housing:'sleeve',sleeve:'milk10',strip:'premium-rgbw',detail:'product',productScale:'length',length:1000});assert.equal(await p.evaluate(()=>studioDebug.inspect().sampleLengthMm),1000);
 await set(p,{productScale:'detail',housing:'profile',profile:'micro',strip:'delux',view:'assembly',cover:'hs-opal',exploded:100});
 const camera=await p.evaluate(()=>{const x=studioDebug.inspect();return[x.camera,x.cameraTarget,x.cameraZoom]});await set(p,{strip:'threeinone'});assert.deepEqual(await p.evaluate(()=>{const x=studioDebug.inspect();return[x.camera,x.cameraTarget,x.cameraZoom]}),camera);
 await p.waitForTimeout(1100);const frames=await p.evaluate(()=>studioDebug.inspect().renderCount);await p.waitForTimeout(600);assert.equal(await p.evaluate(()=>studioDebug.inspect().renderCount),frames);
 assert.deepEqual(errors,[]);console.log('PASS housing / RGB / new profiles',engine.name(),width);
 }finally{await browser.close();}
}
