const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL || 'http://127.0.0.1:4178/';
const engine=process.env.BROWSER==='webkit'?webkit:chromium;
const browser=await engine.launch({headless:true});
const folder='output/layout-review';await fs.mkdir(folder,{recursive:true});
const findings=[],errors=[];let checks=0;
const check=(ok,label,data={})=>{checks++;if(!ok)errors.push({label,...data});};
const viewports=[{width:1440,height:900},{width:390,height:844},{width:320,height:740},{width:768,height:1024}].filter(v=>!process.env.TEST_WIDTHS||process.env.TEST_WIDTHS.split(',').includes(String(v.width)));
const extraRoutes=['zasilacze-led/','silpro/','sterowniki-led/','oprawy/','d160s/','akcesoria/'];
for(const viewport of viewports){
 const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce'});const page=await context.newPage();
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
 const go=async route=>{await page.goto(new URL(route,base).href,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(650);};
 const audit=async route=>{
  const result=await page.evaluate(()=>{
   const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
   const slots=[...document.querySelectorAll('.as-changing-widget')].filter(visible).map(el=>({slot:el.getBoundingClientRect().toJSON(),text:[...el.querySelectorAll('.elementor-widget.currentUp,.elementor-widget.currentDown')].map(x=>({text:x.innerText,rect:x.getBoundingClientRect().toJSON()}))}));
   const buttons=[...document.querySelectorAll('.elementor-button,.mdw-email-box a')].filter(visible).map(el=>{const s=getComputedStyle(el);return{text:el.innerText,shadow:s.boxShadow,filter:s.filter};});
   const dock=document.querySelector('.prescot-dock')?.getBoundingClientRect().toJSON();
   return {slots,buttons,dock,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth};
  });
  check(result.scrollWidth<=viewport.width+1,'horizontal overflow',{route,viewport,result});
  check(result.dock?.x>=0&&result.dock.right<=viewport.width+1,'dock fits',{route,viewport,dock:result.dock});
  for(let i=0;i<result.slots.length;i++){
   const current=result.slots[i];check(current.text.length===1,'one active text per slot',{route,viewport,slot:i});
   for(const text of current.text){check(text.rect.top>=current.slot.top-1&&text.rect.bottom<=current.slot.bottom+1,'text stays within slot',{route,viewport,slot:i,text,current});}
   if(i>0)check(current.slot.top>=result.slots[i-1].slot.bottom-1,'title, description and CTA do not overlap',{route,viewport,slot:i});
  }
  for(const b of result.buttons)check(b.shadow==='none'&&b.filter==='none','flat button surface',{route,viewport,button:b});
  findings.push({route,viewport,slots:result.slots.length,buttons:result.buttons.length});return result;
 };
 for(const route of process.env.ONLY_EXTRA?[]:['oferta/','tasmy-led/']){
  await go(route);
  const desktopSlider=page.locator('.as-slider');
  if(await page.locator('.pm-catalog').isVisible()){
   await page.locator('.pm-feature-controls').getByRole('button',{name:'Następny model'}).click();
   await page.waitForTimeout(650);
   check((await page.locator('.pm-feature-counter').textContent()).startsWith('02'),'mobile catalogue next button works',{route,viewport});
   await audit(route);
   await page.screenshot({path:`${folder}/catalogue-${route.replace('/','')}-${viewport.width}.png`});
  }else if(await desktopSlider.isVisible()){
   await page.waitForFunction(()=>document.querySelector('.as-side-slider .elementor-main-swiper')?.swiper);
   const count=await page.locator('.as-bar .dot').count();
   for(let i=0;i<count;i++){
    await page.locator('.as-bar .dot').nth(i).click();
    await page.waitForTimeout(650);
    const selected=await page.evaluate(()=>document.querySelector('.as-side-slider .elementor-main-swiper').swiper.realIndex);
    check(selected===i,'dot selects its model',{route,viewport,index:i,selected});
    await audit(route+'#model-'+i);
    if(route==='tasmy-led/'&&i===5)await page.screenshot({path:`${folder}/bread-${viewport.width}.png`});
   }
  }else{
   await audit(route);
   const next=page.locator('.card-next:visible a').first();
   const before=await page.evaluate(()=>document.querySelector('.dm-card-slider .elementor-main-swiper').swiper.realIndex);
   check((await next.innerText()).includes('→'),'mobile next arrow is visible',{viewport});
   await next.click();await page.waitForTimeout(650);
   const after=await page.evaluate(()=>document.querySelector('.dm-card-slider .elementor-main-swiper').swiper.realIndex);
   check(after!==before,'mobile offer next button works',{viewport,before,after});
   await page.screenshot({path:`${folder}/offer-${viewport.width}.png`});
  }
 }
 const routes=process.env.ONLY_EXTRA?[]:await page.locator('.as-changing-widget a.elementor-button').evaluateAll(els=>els.map(el=>el.getAttribute('href')));
 for(const route of [...new Set([...routes,...extraRoutes])]){
  await go(route.endsWith('/')?route:route+'/');await audit(route);
  const data=await page.evaluate(()=>{
   const hero=document.querySelector('.elementor-element-19d3d39b');
   const paras=[...hero?.querySelectorAll('p')||[]].filter(el=>el.getBoundingClientRect().height>0);
   const cards=[...document.querySelectorAll('.mdw-card-portfolio')];
   return {textColors:paras.map(el=>getComputedStyle(el).color),cards:cards.length};
  });
  check(data.textColors.every(c=>c==='rgb(248, 250, 252)'),'product hero copy has light text',{route,viewport,...data});
  // Every model's lower showcase and PDF controls share the same button finish.
  for(const card of await page.locator('.mdw-card-portfolio:visible').all()){
   await card.scrollIntoViewIfNeeded();await page.waitForTimeout(70);
   const b=await card.locator('.elementor-button,.mdw-email-box a').evaluateAll(els=>els.map(el=>({shadow:getComputedStyle(el).boxShadow,filter:getComputedStyle(el).filter,text:el.textContent.trim()})));
   check(b.every(x=>x.shadow==='none'&&x.filter==='none'),'showcase buttons have no double shadow',{route,viewport,buttons:b});
  }
  if(route==='produkt/'){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${folder}/product-${viewport.width}.png`});}
 }
 for(const route of process.env.ONLY_EXTRA?[]:['', 'dystrybucja/']){
  await go(route);await audit(route||'home');
  const arrow=page.locator('#prescotScrollDown');
  check(await arrow.count()===1,'one initial hero arrow',{route,viewport});
  check(await arrow.getAttribute('aria-hidden')==='false','hero arrow starts visible',{route,viewport});
  check(await arrow.locator('svg').evaluate(el=>getComputedStyle(el).fill)==='rgb(255, 255, 255)','initial arrow is white',{route,viewport});
  await arrow.click();await page.waitForTimeout(600);
  check(await page.evaluate(()=>scrollY)>200,'hero arrow moves to content',{route,viewport});
  check(await arrow.getAttribute('aria-hidden')==='true','white arrow disappears below hero',{route,viewport});
  for(const brand of ['prescot','klus','scharfer','elba','miboxer']){
   await page.locator('#sl-'+brand).scrollIntoViewIfNeeded();await page.waitForTimeout(150);
   check(await arrow.getAttribute('aria-hidden')==='true','white arrow stays hidden over brands',{route,viewport,brand});
   const controls=page.locator('#sl-'+brand+' .distArrow, #sl-'+brand+' .distArrowUp');
   check(await controls.count()>=1,'brand arrows remain',{route,viewport,brand});
  }
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(250);
  check(await arrow.getAttribute('aria-hidden')==='false','returning to hero restores its arrow',{route,viewport});
  await page.screenshot({path:`${folder}/${route?'distribution':'home'}-${viewport.width}.png`});
 }
 await go('kontakt/');await audit('kontakt/');
 const groups=await page.locator('#centrala,#ksiegowosc-zarzad').evaluateAll(els=>els.map(el=>({title:el.querySelector('h2').textContent.trim(),cards:[...el.querySelectorAll('.p-dept-card h3')].map(h=>h.textContent.trim()),phones:[...el.querySelectorAll('.p-person-links a[href^="tel:"]')].map(a=>a.textContent.trim())})));
 check(groups.length===2&&groups[0].cards.length===2&&groups[1].cards.length===2,'two contact groups with two departments each',{viewport,groups});
 check(groups[0]?.title==='Sekretariat i reklamacje'&&groups[1]?.title==='Księgowość i zarząd firmy','contact group names',{viewport,groups});
 check(groups[0]?.phones.every(p=>p.includes('wew. 25'))&&['51','52','61','62'].every(ext=>groups[1]?.phones.some(p=>p.includes('wew. '+ext))),'verified department extensions',{viewport,groups});
 await page.locator('#centrala').scrollIntoViewIfNeeded();await page.waitForTimeout(500);
 check(await page.locator('.prescot-smart-logo').evaluate(el=>getComputedStyle(el).opacity)==='0','logo hides over contact details',{viewport});
 await page.screenshot({path:`${folder}/contact-${viewport.width}.png`});
 check(pageErrors.length===0,'no JavaScript errors',{viewport,pageErrors});
 await context.close();console.log(JSON.stringify({viewport,checks,failures:errors.length})); await fs.writeFile(`${folder}/verification-${process.env.BROWSER||'chromium'}.json`,JSON.stringify({checks,errors,findings},null,2));
}
await browser.close();
await fs.writeFile(`${folder}/verification-${process.env.BROWSER||'chromium'}.json`,JSON.stringify({checks,errors,findings},null,2));
console.log(JSON.stringify({checks,failures:errors.length,errors:errors.slice(0,10)},null,2));
assert.equal(errors.length,0,'See output/layout-review/verification report');
