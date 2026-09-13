import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/',out='output/lab-menu';
await fs.mkdir(out,{recursive:true});
for(const engine of [chromium,webkit]){
 const browser=await engine.launch();
 try{for(const width of [320,390,1440]){
  const p=await browser.newPage({viewport:{width,height:900},hasTouch:width<768}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(new URL('laboratorium/',base).href);await p.locator('.pm-menu').waitFor({state:'attached'});
  await p.locator('main img').evaluateAll(es=>Promise.all(es.map(e=>{e.loading='eager';return e.decode()})));
  const logo=await p.locator('.pc-brand img').evaluate(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height,ratio:e.naturalWidth/e.naturalHeight}));
  assert.ok(logo.w<=150);assert.ok(Math.abs(logo.w/logo.h-logo.ratio)<.05);
  await p.screenshot({path:`${out}/lab-${engine.name()}-${width}.png`,fullPage:true});
  if(width<768){
   await p.getByRole('button',{name:'Więcej stron',exact:true}).click();await p.waitForTimeout(300);
   await p.locator('.pm-menu .gt-current-lang').click();await p.locator('.pm-menu .gt_options').waitFor({state:'visible'});
   await p.waitForFunction(()=>getComputedStyle(document.querySelector('.pm-menu .gt_options')).opacity==='1');
   const options=await p.locator('.pm-menu .gt_options').boundingBox();assert.ok(options.x>=0&&options.x+options.width<=width&&options.y>=0);
   assert.ok(await p.evaluate(({x,y})=>!!document.elementFromPoint(x+30,y+20)?.closest('.gt_options a'),options),'Language options are clickable above the menu');
   await p.screenshot({path:`${out}/language-${engine.name()}-${width}.png`});
   await p.locator('.pm-menu .gt-current-lang').click();await p.getByRole('button',{name:'Zamknij menu',exact:true}).click();
  }
  await p.goto(new URL('wlasny-brand/',base).href);await p.waitForURL('**/produkcja/');
  assert.deepEqual(errors,[]);console.log('PASS Lab / language / old URL',engine.name(),width);await p.close();
 }}finally{await browser.close();}
}
