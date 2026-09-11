import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const folder = 'output/mobile-refine';
await fs.mkdir(folder,{recursive:true});
const browser = await chromium.launch();
try {
 const page = await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 await page.addInitScript(()=>{
   window.scrollCalls=[];
   for(const [object,key] of [[window,'scrollTo'],[Element.prototype,'scrollIntoView'],[HTMLElement.prototype,'focus']]){
     const original=object[key];object[key]=function(...args){window.scrollCalls.push({fn:key,args,stack:new Error().stack});return original.apply(this,args);};
   }
 });
 for(const route of ['', 'produkcja/', 'oferta/', 'tasmy-led/', 'dystrybucja/']){
   await page.goto(`http://127.0.0.1:4178/${route}`,{waitUntil:'domcontentloaded'});
   await page.waitForTimeout(2000);
   await page.screenshot({path:`${folder}/${route.replace('/','')||'home'}-top.png`});
   await page.evaluate(()=>scrollTo({top:1300,behavior:'instant'}));
   await page.waitForTimeout(700);
   await page.setViewportSize({width:390,height:740});
   await page.waitForTimeout(1000);
   const state=await page.evaluate(()=>({y:scrollY,calls:scrollCalls,
     hero:[...document.querySelectorAll('.elementor-element-216d8696,.elementor-element-216d8696 video')].map(e=>({cls:e.className,r:e.getBoundingClientRect().toJSON(),style:e.getAttribute('style')})),
     overflow:document.documentElement.scrollWidth>innerWidth}));
   await page.screenshot({path:`${folder}/${route.replace('/','')||'home'}-below.png`});
   console.log(JSON.stringify({route,...state}));
   await page.setViewportSize({width:390,height:844});
 }
} finally {await browser.close();}
