import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),folder=path.join(root,'output/configurator');await fs.mkdir(folder,{recursive:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4178/';
const browser=await chromium.launch(),report=[];
try{
  for(const width of [320,390,1440]){
    const page=await browser.newPage({viewport:{width,height:1000},hasTouch:width<768}),errors=[],missing=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(new URL('konfigurator/',base).href))missing.push(r.url());});
    await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('.pm-configurator-dock').waitFor({state:'attached'});
    if(width<768){
      await page.getByRole('button',{name:'Więcej stron',exact:true}).click();const menu=page.locator('.pm-menu');
      await menu.waitFor({state:'visible'});await page.waitForTimeout(400);
      const box=await menu.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1&&box.height<=390);
      assert.equal(await menu.locator('nav a').count(),6);
      await page.screenshot({path:path.join(folder,`menu-${width}.png`)});
      await page.locator('.pm-configurator-link').click();
    }else{
      const dock=await page.locator('.prescot-dock').boundingBox();assert.ok(dock.x>=0&&dock.x+dock.width<=width+1);
      await page.screenshot({path:path.join(folder,'dock-desktop.png')});await page.locator('.pm-configurator-dock').click();
    }
    await page.waitForURL('**/konfigurator/');
    await page.waitForFunction(()=>document.body.dataset.ready==='welcome');
    assert.equal(await page.locator('#viewport canvas').count(),0);
    assert.ok(await page.locator('#welcome-logo img').evaluate(e=>e.complete&&e.naturalWidth>0));
    assert.equal(await page.locator('#welcome-logo canvas').count(),0);
    await page.waitForTimeout(1700);
    await page.screenshot({path:path.join(folder,`welcome-${width}.png`)});
    await page.locator('#start-configurator').click();await page.waitForFunction(()=>document.body.dataset.ready==='true');
    assert.equal(await page.locator('#welcome canvas').count(),0);

    await page.waitForTimeout(600);
    assert.equal(await page.locator('.prescot-dock,.pm-menu,iframe').count(),0);
    assert.equal(await page.locator('header.header button').count(),0);
    assert.equal(await page.locator('.website-return').getAttribute('href'),'https://www.prescot.pl/');
    const logo=await page.locator('.header .brand').boundingBox(),back=await page.locator('.website-return').boundingBox();
    assert.ok(logo.x<40&&back.x>logo.x+logo.width&&width-back.x-back.width<40);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.equal(await page.locator('#viewport canvas').count(),1);
    await page.screenshot({path:path.join(folder,`studio-${width}.png`),fullPage:true});
    await page.getByRole('button',{name:'Taśma LED',exact:true}).click();await page.waitForTimeout(600);
    const camera=await page.evaluate(()=>studioDebug.inspect().camera);await page.locator('#led-toggle').click();await page.waitForTimeout(400);
    assert.deepEqual(await page.evaluate(()=>studioDebug.inspect().camera),camera);
    await page.locator('#export-open').click();await page.locator('#export-dialog').waitFor({state:'visible'});
    const pending=page.waitForEvent('download');await page.locator('#export-json').click();const download=await pending;const file=path.join(folder,`project-${width}.json`);await download.saveAs(file);
    assert.equal(JSON.parse(await fs.readFile(file,'utf8')).schema,'prescot-light-studio/v9');
    await page.locator('#export-dialog .close').click();await page.locator('#about').click();await page.locator('#about-dialog').waitFor({state:'visible'});await page.locator('#about-dialog .close').click();
    assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);report.push({width,menu:true,staticWelcome:true,model:true,return:true,exports:true,errors,missing});await page.close();
  }
  // GitHub Pages uses a /prescotpl/ prefix. Serve the reviewed files under that
  // origin to check imports and source links before publishing.
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),requests=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.pdf':'application/pdf'};
  await page.route('https://bohunek5.github.io/prescotpl/**',async route=>{
    const url=new URL(route.request().url()),relative=decodeURIComponent(url.pathname.slice('/prescotpl/'.length)),file=path.resolve(root,relative+(relative.endsWith('/')?'index.html':''));
    if(!file.startsWith(root))throw Error('Invalid route');
    try{await route.fulfill({body:await fs.readFile(file),contentType:mime[path.extname(file)]||'application/octet-stream'});requests.push({relative,status:200});}
    catch(e){if(e.code!=='ENOENT')throw e;requests.push({relative,status:404});await route.fulfill({status:404,body:'Missing'});}
  });
  await page.goto('https://bohunek5.github.io/prescotpl/konfigurator/#config=%7B%7D');await page.waitForFunction(()=>document.body.dataset.ready==='true');
  assert.equal(await page.locator('#welcome').isVisible(),false);
  const links=await page.evaluate(async()=>{const {profiles,strips,covers,sleeves}=await import('./catalog.js');return [...new Set([...profiles,...strips,...covers,...sleeves].flatMap(x=>[x.source,x.instruction,x.image,x.model]).filter(x=>x?.startsWith('assets/')))];});
  for(const link of links)assert.equal(await page.evaluate(async href=>(await fetch(href)).status,link),200,link);
  assert.deepEqual(requests.filter(x=>x.status!==200),[]);assert.deepEqual(errors,[]);
  report.push({prefix:'/prescotpl/konfigurator/',sourceLinks:links.length,errors});
  await fs.writeFile(path.join(folder,'report.json'),JSON.stringify({status:'PASS',report},null,2));console.log('PASS',report);
}finally{await browser.close();}
