import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/',out='output/app-navigation';
import fs from 'node:fs/promises';await fs.mkdir(out,{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch();try{for(const [width,height,safeBottom] of [[320,844,12],[390,844,46],[667,375,33],[1440,844,12]]){
  const p=await browser.newPage({viewport:{width,height},isMobile:width<768,hasTouch:width<768});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base);await p.locator('.pm-menu').waitFor({state:'attached'});
  await p.evaluate(bottom=>document.documentElement.style.setProperty('--pm-dock-bottom',bottom+'px'),safeBottom);
  if(width<768){
   assert.equal(await p.locator('.prescot-dock>.dock-item:visible,.prescot-dock>.pm-more:visible').count(),5);
   for(const code of ['pl','en','de'])assert.ok(await p.locator(`.pm-language-bar [data-language="${code}"]`).isVisible());
   await p.screenshot({path:`${out}/new-${engine.name()}-${width}-initial.png`});
   const more=p.getByRole('button',{name:'Więcej stron',exact:true});await more.click();
   const menu=p.locator('.pm-menu');await menu.waitFor({state:'visible'});const box=await menu.boundingBox(),dock=await p.locator('.prescot-dock').boundingBox();

   assert.ok(box.y>=0&&box.y+box.height<=dock.y, 'Menu above dock');assert.equal(await menu.locator('nav a').count(),8);
   await p.waitForTimeout(200);await p.screenshot({path:`${out}/new-${engine.name()}-${width}-more.png`});
   await more.click();await menu.waitFor({state:'hidden'});await more.click();await p.getByRole('button',{name:'Zamknij menu',exact:true}).click();await menu.waitFor({state:'hidden'});
   await more.click();await p.getByRole('button',{name:'Choose another language',exact:true}).click();await menu.waitFor({state:'hidden'});
   const languages=p.locator('.pm-language-menu');await languages.waitFor({state:'visible'});assert.equal(await languages.locator('[data-language]').count(),14);
   await p.screenshot({path:`${out}/new-${engine.name()}-${width}-languages.png`});
   const languageBox=await languages.boundingBox();assert.ok(languageBox.y>=0&&languageBox.y+languageBox.height<=dock.y);
   await languages.locator('[data-language="zh-CN"]').scrollIntoViewIfNeeded();
   assert.ok(await languages.locator('[data-language="zh-CN"]').evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Last language remains tappable on short screens');
   await p.keyboard.press('Escape');await languages.waitFor({state:'hidden'});
   // Verify forwarding through the real widget; stub only the external translation call.
   await p.waitForSelector('.gtranslate_wrapper a[data-gt-lang="en"]',{state:'attached'});
   await p.evaluate(()=>{window.translationCalls=[];window.doGTranslate=lang=>window.translationCalls.push(lang)});
   await p.locator('.pm-language-bar [data-language="en"]').click();await p.waitForTimeout(100);

   assert.ok((await p.evaluate(()=>window.translationCalls)).includes('pl|en'));
   assert.equal(await p.locator('.pm-language-bar [data-language="en"]').getAttribute('aria-pressed'),'true');
   await more.click();await p.mouse.click(width/2,12);await menu.waitFor({state:'hidden'});
  }else{assert.equal(await p.locator('.pm-language-bar').isVisible(),false);assert.ok(await p.locator('.dock-lang-item').isVisible());}
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(errors,[]);console.log('PASS',engine.name(),width);await p.close();
 }}finally{await browser.close()}
}
