import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const root=new URL('../',import.meta.url).pathname;
const base=process.env.BASE_URL||'http://127.0.0.1:4178/';
const browser=await chromium.launch();
try{
 const page=await browser.newPage();await page.goto(new URL('company-pages.css',base).href);
 async function walk(dir){for(const item of await fs.readdir(dir,{withFileTypes:true})){
  if(item.name.startsWith('.')||['node_modules','output'].includes(item.name))continue;
  const file=path.join(dir,item.name);if(item.isDirectory()){await walk(file);continue;}
  if(!item.name.endsWith('.html'))continue;
  let source=await fs.readFile(file,'utf8');
  if(!/class="[^"]*\bas-slider\b/.test(source))continue;
  if(source.includes('data-pm-catalog-prerendered'))continue;
  const catalog=await page.evaluate(async({source,base})=>{
   const {initializeCatalog}=await import(new URL('site-experience.mjs?v=20260914-firstpaint1',base).href);
   const {improveCatalogue}=await import(new URL('mobile-refinement.mjs?v=20260914-firstpaint1',base).href);
   const doc=new DOMParser().parseFromString(source,'text/html');doc.querySelector('base')?.setAttribute('href',base);
   initializeCatalog(doc,{interactive:false});improveCatalogue(doc);
   const catalog=doc.querySelector('.pm-catalog');if(!catalog)return null;
   catalog.dataset.pmCatalogPrerendered='true';
   catalog.querySelectorAll('[href],[src]').forEach(el=>{for(const key of ['href','src'])if(el.hasAttribute(key))el.setAttribute(key,el.getAttribute(key).replace(base,''));});
   return catalog.outerHTML;
  },{source,base});
  if(!catalog)continue;
  const opening=/<div\b[^>]*data-elementor-type=["']wp-page["'][^>]*>/;
  if(!opening.test(source))throw Error('No catalogue root '+file);
  source=source.replace(opening,match=>match+'\n'+catalog+'\n');
  source=source.replace(/(<body\b[^>]*class=["'])([^"']*)/, '$1$2 prescot-mobile-catalog pm-catalogue-refined');
  await fs.writeFile(file,source);console.log('Prerendered catalogue',path.relative(root,file));
 }}await walk(root);
}finally{await browser.close();}
