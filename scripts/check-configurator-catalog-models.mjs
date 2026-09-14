import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {additionalProfiles} from '../konfigurator/profile-library.js';
const url=process.env.CATALOG_URL||'http://127.0.0.1:4178/konfigurator/';
const output=new URL('../output/configurator/catalog-models/',import.meta.url);await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.locator('#start-configurator').click();await page.waitForFunction(()=>document.body.dataset.ready==='true');
 for(const p of additionalProfiles){
  const config={profile:p.id,view:'assembly',strip:'slim',endcaps:false,showFixings:false,exploded:0};
  await page.evaluate(c=>location.hash='config='+encodeURIComponent(JSON.stringify({...studioDebug.state,...c})),config);
  await page.waitForFunction(id=>studioDebug.state.profile===id,p.id);await page.locator('#reset-camera').click();await page.waitForTimeout(180);
  assert.equal(await page.evaluate(()=>studioDebug.inspect().productVisible),true,p.name);
  assert.equal(await page.evaluate(()=>studioDebug.spec().fitStatus),'compatible',p.name);
  await page.locator('#viewport').screenshot({path:new URL(p.id+'.png',output).pathname});
  console.log('PASS',p.name);
 }
 assert.deepEqual(errors,[]);await fs.writeFile(new URL('report.json',output),JSON.stringify({profiles:additionalProfiles.length,errors},null,2));
}finally{await browser.close();}
