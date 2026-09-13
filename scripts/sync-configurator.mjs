import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

// A self-contained static subpage, with only runtime code and product sources.
const site=fileURLToPath(new URL('../',import.meta.url));
const source=path.resolve(site,'../prescot-led-studio');
const target=path.join(site,'konfigurator');
const three=path.join(source,'node_modules/three');
const modules=(await fs.readdir(source)).filter(name=>name.endsWith('.js')).sort();
const entry=await fs.readFile(path.join(source,'index.html'),'utf8');
const style=await fs.readFile(path.join(source,'studio.css'),'utf8');
const code=await Promise.all(modules.map(name=>fs.readFile(path.join(source,name),'utf8')));
const revision=createHash('sha256').update([entry,style,...code].join('\n')).digest('hex').slice(0,12);
const files=new Set();
async function write(relative,data){
  const file=path.join(target,relative);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,data);files.add(relative);
}
const versionImports=text=>text.replace(/(from\s*|import\s*\(\s*)(['"])(\.\/[^'"?]+\.js)\2/g,`$1$2$3?v=${revision}$2`);
for(let i=0;i<modules.length;i++)await write(modules[i],versionImports(code[i]));
await write('studio.css',style);
await write('index.html',entry.replaceAll('./node_modules/three/build/three.module.js','./vendor/three/build/three.module.min.js').replaceAll('./node_modules/three/examples/jsm/','./vendor/three/examples/jsm/').replace('href="studio.css"',`href="studio.css?v=${revision}"`).replace('src="app.js"',`src="app.js?v=${revision}"`));

const seen=new Set();
async function copyModule(file){
  file=path.resolve(file);if(seen.has(file))return;seen.add(file);
  if(!file.startsWith(three+path.sep))throw Error('Unexpected dependency: '+file);
  const text=await fs.readFile(file,'utf8');await write(path.join('vendor/three',path.relative(three,file)),text);
  for(const match of text.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)['"]([^'"]+)['"]/g)){
    const spec=match[1];
    if(spec==='three')await copyModule(path.join(three,'build/three.module.min.js'));
    else if(spec.startsWith('.'))await copyModule(path.resolve(path.dirname(file),spec));
    else if(spec.startsWith('three/addons/'))await copyModule(path.join(three,'examples/jsm',spec.slice(13)));
    else throw Error('Unmapped dependency: '+spec);
  }
}
await copyModule(path.join(three,'build/three.module.min.js'));
for(const text of code)for(const match of text.matchAll(/['"]three\/addons\/([^'"]+)['"]/g))await copyModule(path.join(three,'examples/jsm',match[1]));
await write('vendor/three/LICENSE',await fs.readFile(path.join(three,'LICENSE')));

const jsonSources=new Set(['strip-records.json','provenance.json','klus-universal-2026-09.json','klus-finish-variants-2026-09.json','studio-v9-sources.json']);
async function assets(dir){
  for(const item of await fs.readdir(dir,{withFileTypes:true})){
    if(item.name.startsWith('.'))continue;
    const file=path.join(dir,item.name);
    if(item.isDirectory()){await assets(file);continue;}
    if(!/\.(pdf|svg|png|jpe?g|webp|3ds)$/i.test(item.name)&&!jsonSources.has(item.name))continue;
    await write(path.relative(source,file),await fs.readFile(file));
  }
}
await assets(path.join(source,'assets'));
// Remove only files managed by our previous manifest; leave any added files alone.
let previous=[];try{previous=JSON.parse(await fs.readFile(path.join(target,'build.json'),'utf8')).files;}catch(e){if(e.code!=='ENOENT')throw e;}
for(const old of previous)if(!files.has(old)&&!old.includes('..')&&!path.isAbsolute(old))await fs.unlink(path.join(target,old)).catch(e=>{if(e.code!=='ENOENT')throw e;});
const manifest={version:'0.9.0',revision,three:'0.180.0',files:[...files].sort()};
await fs.writeFile(path.join(target,'build.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Konfigurator: ${files.size} files, ${seen.size} Three.js modules, revision ${revision}.`);
