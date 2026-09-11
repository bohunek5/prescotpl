import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const base=process.env.BASE_URL||'http://127.0.0.1:4178/';
const routes=(process.env.ROUTES||'produkcja/,oferta/,tasmy-led/,zasilacze-led/,sterowniki-led/,').split(',');
const width=Number(process.env.WIDTH||390),height=844;
const folder=`output/mobile-${process.env.LABEL||'before'}-${width}`;
await fs.mkdir(folder,{recursive:true});
const browser=await chromium.launch();
try {
 for(const route of routes){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
  await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(2200);
  const name=route.replaceAll('/','')||'home';
  await page.screenshot({path:`${folder}/${name}-top.png`});
  const data=await page.evaluate(()=>{
   const rect=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {tag:e.tagName,id:e.id,cls:e.className,x:r.x,y:r.y,w:r.width,h:r.height,display:s.display,position:s.position,overflow:s.overflow,transform:s.transform,opacity:s.opacity,font:s.fontSize};};
   const visible=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).display!=='none';};
   return {title:document.title,base:document.baseURI,scrollWidth:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,
    roots:[...document.querySelectorAll('[data-elementor-type="wp-page"] > *, #content section')].filter(visible).map(rect),
    headings:[...document.querySelectorAll('h1,h2,h3')].filter(visible).map(e=>({...rect(e),text:e.innerText})),
    sliders:[...document.querySelectorAll('.as-slider,.dm-card-slider,.mdw-card-portfolio,.scroll-section,.scroll-div,.grid,.grid-wrapper')].map(rect),
    videos:[...document.querySelectorAll('video')].map(e=>({...rect(e),src:e.currentSrc,ready:e.readyState})),
    assets:[...document.scripts].map(e=>e.src).filter(Boolean),
    backgrounds:[...document.querySelectorAll('[data-settings*="background"],.as-slider-background img')].filter(visible).slice(0,8).map(e=>({...rect(e),bg:getComputedStyle(e).backgroundImage})),
    arrows:[...document.querySelectorAll('#prescotScrollDown,.p-hero-arrow-down')].map(rect)};
  });
  await page.evaluate(()=>scrollTo({top:innerHeight,behavior:'instant'}));await page.waitForTimeout(650);
  await page.screenshot({path:`${folder}/${name}-below.png`});
  await page.evaluate(()=>scrollTo({top:innerHeight*2.5,behavior:'instant'}));await page.waitForTimeout(650);
  await page.screenshot({path:`${folder}/${name}-lower.png`});
  await fs.writeFile(`${folder}/${name}.json`,JSON.stringify({...data,errors,failed},null,2));
  console.log(JSON.stringify({route,width,height:data.height,overflow:data.scrollWidth>width,errors,failed:failed.length,arrows:data.arrows.length}));
  await page.close();
 }
}finally{await browser.close();}
