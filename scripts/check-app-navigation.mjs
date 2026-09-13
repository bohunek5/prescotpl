import{chromium,webkit}from'playwright';
import assert from'node:assert/strict';
import fs from'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/';
const folder='output/app-navigation';await fs.mkdir(folder,{recursive:true});
for(const engine of process.env.BROWSER==='chromium'?[chromium]:[chromium,webkit]){
 const browser=await engine.launch();
 try{for(const width of(process.env.TEST_WIDTHS||'320,390,1440').split(',').map(Number)){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width<768,hasTouch:width<768});
  for(const route of(process.env.ROUTES||',kontakt/,baza-wiedzy/,silpro/,laboratorium/,wlasny-brand/').split(',')){
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(new URL(route,base).href,{waitUntil:'load'});await page.waitForSelector('.pm-menu',{state:'attached'});await page.waitForTimeout(300);
   assert.equal(await page.locator('.footerFormCol,.contactForm').count(),0,'No footer enquiry forms');
   assert.equal(await page.locator('#contact-form').count(),route==='kontakt/'?1:0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route} no overflow`);
   if(route===''){
    assert.equal(await page.locator('.pm-capability-link').count(),7);
    const lab=page.getByRole('link',{name:'Laboratorium pomiarowe',exact:true});
    assert.ok((await lab.getAttribute('href')).endsWith('/laboratorium/'));
    const colour=await lab.locator('.elementor-icon').evaluate(e=>getComputedStyle(e).backgroundColor);assert.notEqual(colour,'rgb(225, 78, 38)');
    await page.screenshot({path:`${folder}/${engine.name()}-${width}-home.png`});
   }
   if(width<768){
    const dock=await page.locator('.prescot-dock').boundingBox();assert.ok(Math.abs(dock.x+dock.width/2-width/2)<1);
    await page.getByRole('button',{name:'Więcej stron',exact:true}).click();await page.waitForTimeout(260);
    const menu=page.locator('.pm-menu');const box=await menu.boundingBox();assert.ok(box.height<=340,`Compact menu ${box.height}`);assert.ok(Math.abs(box.x+box.width/2-width/2)<1);
    const links=menu.locator('nav a');assert.equal(await links.count(),7);
    for(const row of await links.evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height)))assert.ok(row>=44&&row<=68,'Comfortable touch targets');
    const flag=await menu.locator('.gt-current-lang img').boundingBox();const control=await menu.locator('.dock-lang-item').boundingBox();if(flag)assert.ok(Math.abs(flag.y+flag.height/2-control.y-control.height/2)<2,'Vertically centred flag');
    await page.screenshot({path:`${folder}/${engine.name()}-${width}-${route.replaceAll('/','')||'home'}-menu.png`});
    await page.getByRole('button',{name:'Zamknij menu',exact:true}).click();
   }
   if(['laboratorium/','wlasny-brand/'].includes(route)){
    assert.equal(await page.locator('h1').count(),1);
    await page.locator('.pc-step').first().scrollIntoViewIfNeeded();await page.waitForTimeout(700);
    await page.locator('.pc-step img').evaluateAll(images=>Promise.all(images.map(i=>{i.loading='eager';return Promise.race([i.decode(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Image decode timeout: '+i.src)),15000))]);})));
    await page.screenshot({path:`${folder}/${engine.name()}-${width}-${route.replaceAll('/','')}.png`});
   }
   assert.deepEqual(errors,[]);console.log('PASS',engine.name(),width,route||'home');
  }await page.close();
 }}finally{await browser.close();}
}
