import {chromium,webkit} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url).pathname;
const base='https://bohunek5.github.io/prescotpl/';
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.webm':'video/webm','.mp4':'video/mp4','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
const report=[];
for(const engine of [chromium,webkit]){
 const browser=await engine.launch();
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  // Serve the exact local candidate under the real deployment prefix without
  // changing GitHub. This also tests the preload scanner and inline asset URLs.
  const missing=[];
  await context.route('https://bohunek5.github.io/**',async route=>{
   const url=new URL(route.request().url());
   if(!url.pathname.startsWith('/prescotpl/')){missing.push(url.pathname);return route.fulfill({status:404,body:''});}
   let relative=decodeURIComponent(url.pathname.slice('/prescotpl/'.length));
   if(!relative||relative.endsWith('/'))relative+='index.html';
   const file=path.resolve(root,relative);
   if(!file.startsWith(root)||relative.split('/').some(p=>p.startsWith('.')))return route.fulfill({status:403,body:''});
   try{
    let body=await fs.readFile(file);
    // Chromium's speculative prefetch can bypass request interception and pull
    // the old public HTML. Keep this candidate-only fixture off that path.
    if(file.endsWith('.html'))body=Buffer.from(body.toString().replaceAll('type="speculationrules"','type="application/json"'));
    return await route.fulfill({status:200,contentType:types[path.extname(file)]||'application/octet-stream',body});
   }
   catch{missing.push(relative);return route.fulfill({status:404,body:''});}
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'oferta/',{waitUntil:'load'});
  await page.locator('.pm-feature-counter').waitFor();
  await page.getByRole('button',{name:'Więcej stron',exact:true}).click();
  await page.locator('.pm-menu a').filter({hasText:'Sklep B2C'}).click();
  await page.getByRole('button',{name:'Zamknij dobór zestawu',exact:true}).waitFor();
  assert(!await page.locator('.pm-menu').isVisible());
  await page.getByRole('button',{name:'Zamknij dobór zestawu',exact:true}).click();
  if(engine.name()==='chromium'){
   const cdp=await context.newCDPSession(page);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:335,y:280}]});
   for(let x=315;x>=65;x-=25)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:280}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForTimeout(900);
   assert(!(await page.locator('.pm-feature-counter').textContent()).startsWith('01'),'Real touch swipe did not change slide');
  }
  await page.locator('.pm-feature-controls').getByRole('button',{name:'Następny model'}).click();await page.waitForTimeout(650);
  const selected=page.locator('.pm-feature:not([inert]) .pm-cta');
  const href=await selected.getAttribute('href');
  await selected.click();await page.waitForURL(href);await page.waitForLoadState('load');
  assert.equal(await page.evaluate(()=>document.baseURI),base);
  for(const route of ['produkcja/','zasilacze-led/','sterowniki-led/','wspolpraca-b2b/']){
   await page.goto(base+route,{waitUntil:'load'});await page.waitForTimeout(1800);
   if(route==='produkcja/'){
    const story=page.locator('.prescot-process-story').first();await story.scrollIntoViewIfNeeded();await page.waitForTimeout(1600);
    assert(await story.locator('.prescot-process-photo:visible').first().evaluate(e=>e.offsetHeight)>=210);
    await page.screenshot({path:`output/responsive-verification/${engine.name()}-production-final.png`});
   }else{
    assert(await page.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    if(route!=='wspolpraca-b2b/'){
     const background=await page.locator('.elementor-element-19d3d39b').evaluate(e=>getComputedStyle(e).backgroundImage);
     assert(background.includes('/prescotpl/assets/'),'Wrong deployment prefix for hero');
    }
    await page.screenshot({path:`output/responsive-verification/${engine.name()}-${route.replace('/','')}-final.png`});
   }
  }
  assert.deepEqual(errors,[]);
  assert.deepEqual([...new Set(missing)],[],'Missing deployment assets');
  report.push({browser:engine.name(),menuAndAssistant:true,cta:true,deploymentPrefix:true,productionPhotos:true,touchSwipe:engine.name()==='chromium',passed:true});
  console.log(engine.name(),'menu, assistant, CTA, deployment assets and final layouts OK');
  await context.close();
 }finally{await browser.close();}
}
await fs.writeFile('output/responsive-verification/interactions.json',JSON.stringify(report,null,2));
