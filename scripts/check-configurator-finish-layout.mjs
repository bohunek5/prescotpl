import {chromium, webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = new URL(process.env.BASE_URL || 'http://127.0.0.1:4184/');
const out = process.env.QA_DIR || '/private/tmp/prescot-configurator-finish-layout';
const before = process.env.QA_MODE === 'before';
await fs.mkdir(out, {recursive: true});
const reports = [];

for (const [engine, width] of [[chromium, 1440], [webkit, 390]].filter(([,width]) => !process.env.TEST_WIDTH || width === Number(process.env.TEST_WIDTH))) {
  const tag = `${engine.name()}-${width}`;
  const browser = await engine.launch();
  const page = await browser.newPage({viewport:{width,height:1000},hasTouch:width<781});
  const report = {engine:engine.name(),width,screenshots:[],coverCards:[],issues:[]};
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {if(message.type()==='error') errors.push(message.text());});
  const capture = async (selector, name) => {
    const file = `${out}/${tag}-${name}.png`;
    await page.locator(selector).screenshot({path:file});
    report.screenshots.push(file);
  };
  const settle = async () => page.waitForFunction(() => {
    const state = window.studioDebug?.inspect();
    return state && !state.building && !state.cameraMoving && !state.renderPending && !state.interactive;
  },null,{timeout:60000});
  const set = async values => {
    await page.evaluate(values => location.hash='config='+encodeURIComponent(JSON.stringify({...studioDebug.state,...values})), values);
    await page.waitForFunction(values => Object.entries(values).every(([key,value]) => studioDebug.state[key]===value),values);
    await settle();
  };
  const check = (ok, message) => {if(!ok)report.issues.push(message);};
  try {
    if(before){
      await page.goto(base.href,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(() => window.welcomeDebug,{timeout:60000});
      for(const [time,name] of [[0,'intro-front'],[2.1,'intro-profile'],[4.9,'intro-final']]){
        await page.evaluate(time=>welcomeDebug.seek(time),time);
        await capture('#welcome',name);
      }
    }
    const start={profile:'hrmax',strip:'cob',cover:'hr21-opal',view:'assembly',finish:'silver',exploded:0,lightStudy:false,light:true,dimmer:65};
    await page.goto(base.href+'#config='+encodeURIComponent(JSON.stringify(start)),{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});
    await settle();
    const catalogue=await page.evaluate(async()=>{
      const c=await import(new URL('catalog.js',location.href));
      return {profiles:c.profiles.map(p=>({id:p.id,name:p.name,covers:p.covers,finishes:c.finishesFor(p)})),covers:c.covers.map(c=>({id:c.id,name:c.name}))};
    });
    for(const [profile,strip,cover] of [['hrmax','cob','hr21-opal'],['micro','threeinone','hs11-opal'],['poli','cob','hs11-opal']]){
      const p=catalogue.profiles.find(p=>p.id===profile);
      await set({profile,strip,cover,finish:p.finishes.includes('silver')?'silver':p.finishes[0],lightStudy:false,exploded:0});
      await page.locator('#reset-camera').click();await settle();
      await capture('#studio-stage',`${profile}-day`);
      if(!before&&profile==='hrmax'){
        await set({light:false});await capture('#viewport','hrmax-day-led-off');
        await set({light:true});await capture('#viewport','hrmax-day-led-on');
      }
      const geometry=await page.evaluate(()=>({profile:studioDebug.state.profile,finish:studioDebug.state.finish,projection:(()=>{const points=studioDebug.inspect().productProjection||[];return points.length?{left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),bottom:Math.min(...points.map(p=>p[1])),top:Math.max(...points.map(p=>p[1]))}:null;})(),section:(()=>{const r=document.querySelector('#live-section').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})(),play:(()=>{const r=document.querySelector('#mobile-assembly-play').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};})()}));
      report[profile]=geometry;
      check(await page.locator('#live-section').isVisible(),`${profile}: permanent section is hidden`);
      check(geometry.section.x+geometry.section.width<=geometry.play.x+1,`${profile}: permanent section overlaps assembly play`);
      if(width<781)check(geometry.section.width>=100&&geometry.section.height>=45,`${profile}: permanent section is too small to read`);
      if(!before&&width<781){
        const svg=await page.locator('#live-section svg').boundingBox();
        check(svg.width>=64&&svg.height>=54,`${profile}: phone section did not get its larger drawing`);
        check(Math.abs(geometry.section.height-geometry.play.height)<=1,`${profile}: section and playback controls have uneven heights`);
      }
      if(profile==='poli'){
        if(!await page.locator('#choose-cover').evaluate(element=>element.open))await page.locator('#choose-cover>summary').click();
        await capture('#choose-cover','poli-covers');
      }
    }
    const cardBounds=()=>page.locator('#covers .card:visible').evaluateAll(cards=>cards.map(card=>{
      const box=card.getBoundingClientRect(),copy=card.querySelector('.card-copy'),picker=card.closest('#choose-cover').getBoundingClientRect();
      const range=document.createRange();range.selectNodeContents(copy);
      const outside=[...range.getClientRects()].filter(r=>r.width&&r.height&&(r.left<box.left+5||r.right>box.right-5||r.top<box.top+3||r.bottom>box.bottom-3));
      return{id:card.dataset.value,width:box.width,scrollWidth:card.scrollWidth,clientWidth:card.clientWidth,fitsPicker:box.left>=picker.left-1&&box.right<=picker.right+1,outside:outside.map(r=>({x:r.x,y:r.y,width:r.width,height:r.height})),text:copy.textContent};
    }));
    if(before){
      report.coverCards=await cardBounds();
    }else{
      const unseen=new Set(catalogue.covers.map(c=>c.id));
      while(unseen.size){
        const profile=[...catalogue.profiles].sort((a,b)=>b.covers.filter(id=>unseen.has(id)).length-a.covers.filter(id=>unseen.has(id)).length)[0];
        const wanted=profile.covers.filter(id=>unseen.has(id));
        assert.ok(wanted.length,'Every listed cover must have a compatible profile');
        await set({profile:profile.id,cover:wanted[0],strip:'slim',finish:profile.finishes[0],lightStudy:false});
        if(!await page.locator('#choose-cover').evaluate(element=>element.open))await page.locator('#choose-cover>summary').click();
        const cards=await cardBounds();
        for(const card of cards){
          if(!unseen.has(card.id))continue;
          report.coverCards.push(card);unseen.delete(card.id);
          check(card.fitsPicker&&card.scrollWidth<=card.clientWidth+1&&!card.outside.length,`${card.id}: cover card or text leaves the picker boundary`);
        }
      }
      check(report.coverCards.length===42,`Expected all42covers, got ${report.coverCards.length}`);
      const p=catalogue.profiles.find(p=>p.id==='micro');
      await page.locator('#choose-cover>summary').click();
      for(const finish of ['silver','black','white','raw'].filter(id=>p.finishes.includes(id))){
        for(const lightStudy of [false,true]){
          await set({profile:'micro',cover:'hs11-opal',strip:'threeinone',finish,lightStudy,light:true,dimmer:65});
          await capture('#viewport',`micro-${finish}-${lightStudy?'night':'day'}`);
          check(await page.locator('#live-section').getAttribute('data-finish')===finish,`Section finish does not follow ${finish}`);
        }
      }
      await set({lightStudy:false,dimmer:0});
      check(await page.locator('#live-section').evaluate(el=>el.style.getPropertyValue('--section-level'))==='0','Section still glows with light at0%');
    }
    for(const card of report.coverCards)check(card.fitsPicker&&card.scrollWidth<=card.clientWidth+1&&!card.outside.length,`${card.id}: measured cover/picker overflow`);
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page has horizontal overflow');
    check(errors.length===0,'Browser errors: '+errors.join('; '));
    report.status=report.issues.length?'fail':'pass';
    if(!before)assert.deepEqual(report.issues,[]);
    console.log(tag,report.status,`${report.coverCards.length} covers`,report.issues.join('; '));
  }catch(error){
    report.status='fail';report.error=error.stack;report.browserErrors=errors;
    console.error(tag,error.message);if(!before)process.exitCode=1;
  }finally{
    reports.push(report);await fs.writeFile(`${out}/report.json`,JSON.stringify({base:base.href,mode:before?'before':'regression',reports},null,2)+'\n');
    await browser.close();
  }
}
console.log(`Report: ${out}/report.json`);
