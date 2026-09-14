import fs from 'node:fs/promises';
import path from 'node:path';
const root=new URL('../',import.meta.url);
async function walk(dir){for(const item of await fs.readdir(dir,{withFileTypes:true})){
 if(item.name.startsWith('.')||['node_modules','output'].includes(item.name))continue;
 const file=path.join(dir,item.name);if(item.isDirectory()){await walk(file);continue;}
 if(!item.name.endsWith('.html'))continue;
 const before=await fs.readFile(file,'utf8');const after=before.replace(/local-navigation\.js\?v=[\w-]+/g,'local-navigation.js?v=20260914-firstpaint1');
 if(before!==after)await fs.writeFile(file,after);
}}
await walk(root.pathname);
