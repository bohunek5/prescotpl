import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'output/configurator');
await fs.mkdir(out,{recursive:true});
const url=new URL('konfigurator/',process.env.BASE_URL||'http://127.0.0.1:4178/').href;
const browser=await chromium.launch(),report=[];
const startupOnly=process.argv.includes('--startup-only');
const configLink=c=>url+'#config='+encodeURIComponent(JSON.stringify(c));
const ready=p=>p.waitForFunction(()=>document.body.dataset.ready==='true');
const settle=async p=>{await p.waitForTimeout(450);await p.waitForFunction(()=>!studioDebug.inspect().cameraMoving);};
const set=async(p,c)=>{await p.evaluate(c=>location.hash='config='+encodeURIComponent(JSON.stringify(c)),c);await settle(p);};
async function layout(p){return p.evaluate(()=>{
 const box=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,right:b.right,bottom:b.bottom}};
 return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,summary:box(document.querySelector('.stage-summary')),controls:box(document.querySelector('.stage-controls')),viewport:box(document.querySelector('#viewport')),footer:box(document.querySelector('.technical-footer')),buttons:[...document.querySelectorAll('.stage-controls button,.stage-controls input')].filter(e=>e.getClientRects().length).map(e=>({label:e.id||e.textContent,...box(e)}))};
 });}
function checkLayout(l){
 assert.equal(l.overflow,false);assert.ok(l.viewport.h>=230);assert.ok(l.footer.y>=l.viewport.bottom-1);
 for(const c of l.buttons){assert.ok(c.bottom<=l.viewport.y+1,c.label+' overlaps model');assert.ok(c.x>=l.controls.x-1&&c.right<=l.controls.right+1,c.label+' outside controls');}
 if(l.width>=1300){assert.equal(l.summary.y,l.controls.y);assert.ok(l.controls.x>=l.summary.right);}
}
try{
 for(const [width,height,previous]of (startupOnly?[]:[[1366,900,304.9375],[1440,1000,402.609375],[1920,1080,452.828125],[1280,900,0],[834,1000,0],[390,844,0],[320,800,0]])){
  const p=await browser.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.waitForFunction(()=>document.querySelector('#welcome-logo').dataset.logo==='ready');
  await p.waitForTimeout(1900);const welcome=await p.evaluate(()=>welcomeDebug.inspect());assert.ok(welcome.meshes>0&&welcome.triangles>1000);assert.equal(await p.locator('#viewport canvas').count(),0);
  await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>welcomeDebug.inspect().renderCount),welcome.renderCount,'Welcome keeps rendering while idle');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await p.screenshot({path:path.join(out,`welcome-final-${width}.png`)});
  if(width===1440){const box=await p.locator('#welcome-logo').boundingBox();await p.mouse.move(box.x+box.width*.8,box.y+box.height*.8);await p.waitForTimeout(800);assert.notDeepEqual(await p.evaluate(()=>welcomeDebug.inspect().rotation),welcome.rotation);}
  await p.locator('#start-configurator').focus();await p.keyboard.press('Enter');await ready(p);await settle(p);
  assert.equal(await p.locator('#welcome canvas').count(),0);assert.equal(await p.evaluate(()=>welcomeDebug.inspect().active),false);
  assert.equal(await p.evaluate(()=>document.activeElement.id),'stage-heading');
  const l=await layout(p);checkLayout(l);if(previous)assert.ok(l.viewport.h/previous>1.4,'Model should gain at least 40% height');
  await p.screenshot({path:path.join(out,`studio-final-${width}.png`),fullPage:true});
  report.push({width,height,modelHeight:l.viewport.h,gain:previous?Math.round((l.viewport.h/previous-1)*100)+'%':null,welcome3D:true,logoStops:true,keyboardEntry:true});
  if(width===1440||width===390||width===320){
   for(const c of[{view:'macro',strip:'premium-rgbw',profile:'pds',lightStudy:true},{view:'macro',strip:'wcob-cct',profile:'pds',detail:'sleeve'},{view:'installation',profile:'plus45'},{view:'section',profile:'kozus'},{view:'mounting',profile:'pds'},{view:'zone',zone:'drawer'}]){await set(p,c);checkLayout(await layout(p));}
   await p.screenshot({path:path.join(out,`mount-zone-final-${width}.png`),fullPage:true});
  }
  if(width===1440){
   for(const angle of ['end','entry']){
    await set(p,{profile:'plus45',strip:'slim',cover:'ka11r-opal',endcaps:true,showCable:true,assemblyAngle:angle,exploded:100});await p.locator('#reset-camera').click();await settle(p);await p.locator('#play-mount').click();
    for(let i=0;i<13;i++){await p.waitForTimeout(500);const d=await p.evaluate(()=>studioDebug.inspect());assert.ok(d.coverProjection.length);for(const corner of d.coverProjection)assert.ok(corner.every(v=>Math.abs(v)<1.005),'Cover clipped during assembly '+angle);}
    assert.equal(await p.evaluate(()=>studioDebug.state.exploded),0);
   }
   report.push({assemblyFrames:'end + entry',coverClipping:false});
  }
  assert.deepEqual(errors,[]);await p.close();console.log('PASS layout and welcome',width);
 }
 // Opening a saved link must go straight to the model without allocating the logo renderer.
 {
  const p=await browser.newPage();await p.goto(configLink({strip:'slim',profile:'pds'}));await ready(p);assert.equal(await p.locator('#welcome').isVisible(),false);assert.equal(await p.evaluate(()=>typeof welcomeDebug),'undefined');assert.equal(await p.evaluate(()=>studioDebug.state.strip),'slim');await p.close();report.push({sharedLinkSkipsIntro:true});
 }
 // A user can enter while the SVG is still downloading; no late renderer should appear.
 {
  const p=await browser.newPage();let release;const gate=new Promise(resolve=>release=resolve);let requested;const svgRequest=new Promise(resolve=>requested=resolve);
  await p.route('**/assets/logo.svg',async route=>{requested();await gate;await route.continue();});
  await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.body.dataset.ready==='welcome');await svgRequest;
  await p.locator('#start-configurator').click();release();await ready(p);await p.waitForTimeout(700);assert.equal(await p.locator('#welcome canvas').count(),0);assert.equal(await p.evaluate(()=>typeof welcomeDebug),'undefined');await p.close();report.push({earlyEntryCancelsLogo:true});
 }
 // Selection made while the model is loading must become the first rendered view.
 {
  const p=await browser.newPage();let release,requested;const gate=new Promise(resolve=>release=resolve),modelRequest=new Promise(resolve=>requested=resolve);
  await p.route('**/assets/sources/micro-plus.3ds',async route=>{requested();await gate;await route.continue();});
  await p.goto(configLink({profile:'micro',strip:'delux'}));await modelRequest;
  await p.locator('.views [data-view=macro]').click();release();await ready(p);assert.equal(await p.evaluate(()=>studioDebug.inspect().view),'macro');await p.close();report.push({selectionDuringLoadingPreserved:true});
 }
 // The vector fallback must leave the actual configurator usable if welcome rendering fails.
 {
  const p=await browser.newPage();await p.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(document.body?.dataset.screen==='welcome'&&String(type).startsWith('webgl'))return null;return original.call(this,type,...args)};});
  await p.goto(url);await p.waitForFunction(()=>document.querySelector('#welcome-logo').dataset.logo==='fallback');assert.equal(await p.locator('.welcome-logo-fallback').isVisible(),true);await p.locator('#start-configurator').click();await ready(p);await p.close();report.push({welcomeFallback:true});
 }
 const safari=await webkit.launch();
 try{
  const p=await safari.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url);await p.waitForFunction(()=>document.querySelector('#welcome-logo').dataset.logo==='ready');await p.waitForTimeout(500);const before=await p.evaluate(()=>welcomeDebug.inspect());await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>welcomeDebug.inspect().renderCount),before.renderCount);assert.deepEqual(before.rotation.slice(0,3),[.13,-.13,0]);
  const box=await p.locator('#welcome-logo').boundingBox();await p.mouse.move(box.x+box.width*.8,box.y+box.height*.8);await p.mouse.move(0,0);await p.waitForTimeout(700);assert.ok((await p.evaluate(()=>welcomeDebug.inspect().renderCount))-before.renderCount<=1,'Reduced motion must stay static after pointer leave');
  await p.screenshot({path:path.join(out,'welcome-webkit-390.png')});await p.locator('#start-configurator').click();await ready(p);await settle(p);checkLayout(await layout(p));assert.deepEqual(errors,[]);report.push({webkit:true,reducedMotion:true});
 }finally{await safari.close();}
 await fs.writeFile(path.join(out,startupOnly?'studio-startup-report.json':'studio-layout-report.json'),JSON.stringify({status:'PASS',report},null,2));console.log('PASS',report);
}finally{await browser.close();}
