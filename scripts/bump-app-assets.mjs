import fs from 'node:fs/promises';
import path from 'node:path';
const root=new URL('../',import.meta.url).pathname;
const modules=new Set(['local-navigation.js','site-experience.mjs','brand-footer.mjs','mobile-refinement.mjs','scripts/update-brand-footer-assets.mjs','scripts/update-responsive-assets.mjs']);
let count=0;
async function walk(dir){for(const item of await fs.readdir(dir,{withFileTypes:true})){
 if(item.name.startsWith('.')||['node_modules','output'].includes(item.name))continue;
 const file=path.join(dir,item.name);if(item.isDirectory()){await walk(file);continue;}
 if(!item.name.endsWith('.html')&&!modules.has(path.relative(root,file)))continue;
 const before=await fs.readFile(file,'utf8');
 const after=before.replace(/((?:local-navigation\.js|site-experience\.mjs|brand-footer\.mjs|mobile-refinement\.mjs|brand-footer\.css|mobile-refinement\.css)\?v=)[\w-]+/g,'$120260913-app11');
 if(before!==after){await fs.writeFile(file,after);count++;}
}}
await walk(root);console.log(`Updated ${count} shared asset references.`);
