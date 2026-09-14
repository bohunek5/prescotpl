import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const url=new URL('konfigurator/',process.env.BASE_URL||'http://127.0.0.1:4178/').href,out='output/configurator/catalog';
await fs.mkdir(out,{recursive:true});
for(const [engine,width] of [[chromium,1440],[webkit,390]]){
 const browser=await engine.launch();try{
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce',hasTouch:width<781}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.locator('#start-configurator').click();await page.waitForFunction(()=>document.body.dataset.ready==='true');
  assert.equal(await page.locator('#profiles .card').count(),72);
  await page.locator('#choose-profile>summary').click();await page.locator('#profile-search').fill('KOPRO-30');assert.equal(await page.locator('#profiles .card:visible').count(),1);await page.locator('#profiles .card:visible').click();
  await page.locator('#choose-profile>summary').click();
  await page.evaluate(()=>location.hash='config='+encodeURIComponent(JSON.stringify({...studioDebug.state,endcaps:true,exploded:0})));
  await page.waitForFunction(()=>studioDebug.state.endcaps);assert.equal(await page.evaluate(()=>studioDebug.spec().fitStatus),'compatible');
  const parts=await page.evaluate(()=>studioDebug.project().components.accessories.filter(a=>a.selected&&a.kind.startsWith('endcap')));assert.equal(parts.length,2);assert.deepEqual(parts.map(a=>a.quantity),[1,1]);
  await page.locator('#choose-accessories>summary').click();
  const variant=page.locator('select[aria-label="Wariant zaślepki"]');await variant.selectOption('C24175L01');assert.equal(await page.evaluate(()=>studioDebug.project().components.accessories.find(a=>a.kind==='endcap').ref),'C24175L01');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.screenshot({path:`${out}/accessories-${engine.name()}-${width}.png`,fullPage:width<781});await page.locator('#choose-accessories>summary').click();
  for(const profile of ['hrslim','kozma22bok','micro']){
   await page.evaluate(profile=>location.hash='config='+encodeURIComponent(JSON.stringify({profile,strip:'slim',exploded:0,view:'assembly'})),profile);await page.waitForFunction(id=>studioDebug.state.profile===id,profile);await page.locator('#reset-camera').click();
   await page.locator('#viewport').screenshot({path:`${out}/smoke-${profile}-${engine.name()}-${width}.png`});
  }
  if(width===1440){
   await page.evaluate(()=>location.hash='config='+encodeURIComponent(JSON.stringify({profile:'kopro30',strip:'slim',endcaps:true,exploded:0,length:375})));await page.waitForFunction(()=>studioDebug.state.profile==='kopro30');
   await page.locator('#export-open').click();
   for(const [id,extension]of [['export-json','json'],['export-sheet','html'],['export-glb','glb']]){const wait=page.waitForEvent('download',{timeout:60000});await page.locator('#'+id).click();const file=await wait;await file.saveAs(`${out}/assembly.${extension}`);}
   const data=JSON.parse(await fs.readFile(`${out}/assembly.json`,'utf8'));assert.equal(data.components.profile.ref,'A07890');assert.equal(data.calculation.stripLengthMm,350);assert.equal(data.calculation.powerW,2.38);
   const glb=await fs.readFile(`${out}/assembly.glb`);assert.equal(glb.toString('utf8',0,4),'glTF');const gltf=JSON.parse(glb.toString('utf8',20,20+glb.readUInt32LE(12)).trim());assert.ok(gltf.nodes.some(n=>n.name==='KOPRO-30'));assert.ok(gltf.nodes.some(n=>n.name==='Zaslepka_C24175C02'));assert.ok(gltf.nodes.some(n=>n.name==='Zaslepka_C24174C02'));
   const sheet=await fs.readFile(`${out}/assembly.html`,'utf8');assert.ok(sheet.includes('C24175C02')&&sheet.includes('C24174C02'));await page.locator('#export-dialog .close').click();
  }
  await page.waitForTimeout(1300);const before=await page.evaluate(()=>studioDebug.inspect().renderCount);await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>studioDebug.inspect().renderCount),before);assert.deepEqual(errors,[]);console.log('PASS catalogue UI / save / export',engine.name(),width);
 }finally{await browser.close();}
}
