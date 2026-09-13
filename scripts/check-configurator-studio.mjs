import{chromium,webkit}from'playwright';
import assert from'node:assert/strict';
import fs from'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/',url=new URL('konfigurator/',base).href,out='output/configurator',report=[];
await fs.mkdir(out,{recursive:true});
const ready=p=>p.waitForFunction(()=>document.body.dataset.ready==='true');
const settle=async p=>{await p.waitForTimeout(500);await p.waitForFunction(()=>!studioDebug.inspect().cameraMoving);};
const set=async(p,c)=>{await p.evaluate(c=>location.hash='config='+encodeURIComponent(JSON.stringify(c)),c);await settle(p);};
const inspect=p=>p.evaluate(()=>studioDebug.inspect());
const camera=d=>({position:d.camera,target:d.cameraTarget,zoom:d.cameraZoom});
async function checkLayout(p,width){
 const l=await p.evaluate(()=>{const b=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};return{overflow:document.documentElement.scrollWidth>innerWidth,view:b(document.querySelector('#viewport')),tools:b(document.querySelector('.stage-controls')),footer:b(document.querySelector('.technical-footer')),values:[...document.querySelectorAll('.technical-values strong')].map(e=>{const range=document.createRange();range.selectNodeContents(e);return{id:e.id,text:e.textContent,lines:range.getClientRects().length,font:parseFloat(getComputedStyle(e).fontSize),textRight:range.getBoundingClientRect().right,...b(e)}}),float:document.querySelector('#mobile-assembly-play').getClientRects().length?b(document.querySelector('#mobile-assembly-play')):null,buttons:[...document.querySelectorAll('.stage-controls button,.stage-controls input')].filter(e=>e.getClientRects().length).map(e=>({id:e.id||e.textContent,...b(e)}))};});
 assert.equal(l.overflow,false);assert.ok(l.view.h>=230);assert.ok(l.footer.y>=l.view.bottom-1);
 for(const b of l.buttons){assert.ok(b.bottom<=l.view.y+1,b.id+' overlaps model');assert.ok(b.x>=l.tools.x-1&&b.right<=l.tools.right+1,b.id+' overflows tools');}
 for(const v of l.values){assert.ok(v.textRight<=v.right+1,v.id+' text overflows');if(v.id!=='detail-finish'){assert.equal(v.lines,1,v.id+' wraps');if(width<781)assert.ok(v.font<=14);}}
 if(l.float){assert.ok(width<=780);assert.ok(l.float.x>l.view.x+l.view.w*.5);assert.ok(l.float.bottom<=l.view.bottom-8);assert.ok(l.float.h>=48);}
 return{modelHeight:l.view.h,controlsHeight:l.tools.h};
}
for(const engine of[chromium,webkit]){
 const browser=await engine.launch();
 try{for(const width of engine===chromium?[320,390,834,1440]:[390]){
  const p=await browser.newPage({viewport:{width,height:1000},hasTouch:width<781}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.waitForFunction(()=>document.body.dataset.ready==='welcome');await p.locator('#welcome-logo img').evaluate(e=>e.decode());
  assert.equal(await p.locator('canvas').count(),0);assert.equal(await p.locator('#welcome-logo img').getAttribute('src'),'assets/logo.svg');
  await p.screenshot({path:`${out}/v11-welcome-${engine.name()}-${width}.png`});await p.locator('#start-configurator').click();await ready(p);await settle(p);
  const measurements=await checkLayout(p,width);
  await p.screenshot({path:`${out}/v11-product-${engine.name()}-${width}.png`,fullPage:width<781});
  if(width===390&&engine===chromium){
   const before=camera(await inspect(p));await p.locator('#mobile-assembly-play').click();await p.waitForTimeout(1000);let amount=await p.evaluate(()=>studioDebug.state.exploded);assert.ok(amount<100&&amount>0);
   await p.locator('#mobile-assembly-play').click();await p.waitForFunction(()=>studioDebug.state.exploded===100);assert.deepEqual(camera(await inspect(p)),before);
   for(const end of[0,100]){await p.locator('#mobile-assembly-play').click();await p.waitForFunction(v=>studioDebug.state.exploded===v,end,{timeout:12000});assert.deepEqual(camera(await inspect(p)),before);}
   report.push({mobileAssembly:'fold, unfold, reverse in motion',cameraPreserved:true});
  }
  for(const c of[{view:'macro',strip:'wcob-cct',profile:'pds',detail:'sleeve'},{view:'macro',strip:'premium-rgbw',profile:'pds'},{view:'macro',strip:'sshape'},{view:'mounting',profile:'pds'},{view:'zone',zone:'drawer'}]){await set(p,c);await checkLayout(p,width);}
  await set(p,{view:'macro',strip:'delux',lightStudy:false});const before=camera(await inspect(p));await p.locator('button[data-light-study]').click();await settle(p);assert.deepEqual(camera(await inspect(p)),before);
  for(const selector of['body','.header','.config']){const rgb=await p.locator(selector).evaluate(e=>getComputedStyle(e).backgroundColor.match(/[\d.]+/g).slice(0,3).map(Number));assert.ok(rgb.every(n=>n<65),selector+' remains light in night mode');}
  await p.locator('#choose-strip>summary').click();await p.locator('#export-open').click();await p.locator('#export-dialog').waitFor({state:'visible'});const dialog=await p.locator('#export-dialog').evaluate(e=>getComputedStyle(e).backgroundColor);assert.equal(dialog,'rgb(36, 40, 46)');await p.locator('#export-dialog .close').click();await p.locator('#choose-strip>summary').click();
  await p.screenshot({path:`${out}/v11-night-${engine.name()}-${width}.png`,fullPage:width<781});await p.waitForTimeout(1300);const n=(await inspect(p)).renderCount;await p.waitForTimeout(800);assert.equal((await inspect(p)).renderCount,n);
  if(engine===webkit){await p.emulateMedia({reducedMotion:'reduce'});await set(p,{view:'assembly',exploded:100});await p.locator('#mobile-assembly-play').click();assert.equal(await p.evaluate(()=>studioDebug.state.exploded),0);await p.locator('#mobile-assembly-play').click();assert.equal(await p.evaluate(()=>studioDebug.state.exploded),100);}
  assert.deepEqual(errors,[]);report.push({engine:engine.name(),width,...measurements,staticLogo:true,nightMode:true,noIdleFrames:true,errors});await p.close();console.log('PASS studio',engine.name(),width);
 }}finally{await browser.close()}
}
await fs.writeFile(`${out}/v11-studio-report.json`,JSON.stringify({status:'PASS',report},null,2));
