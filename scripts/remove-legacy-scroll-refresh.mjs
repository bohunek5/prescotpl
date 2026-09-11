import fs from 'node:fs/promises';
import path from 'node:path';
const root = new URL('../',import.meta.url).pathname;
let count=0;
async function walk(dir) {
 for(const item of await fs.readdir(dir,{withFileTypes:true})) {
  if(item.name.startsWith('.') || ['node_modules','output'].includes(item.name)) continue;
  const file=path.join(dir,item.name);
  if(item.isDirectory()){await walk(file);continue;}
  if(!file.endsWith('.html')) continue;
  const before=await fs.readFile(file,'utf8');
  const after=before.replace(/  if \(typeof gsap !== "undefined"\) \{\s*gsap\.registerPlugin\(ScrollTrigger\);[\s\S]*?\n  \}\n(?=\}\);\s*<\/script>)/g,'  // Showcase visibility and transitions: site-experience.mjs (no scroll resets).\n');
  if(after===before && !before.includes('Showcase visibility and transitions: site-experience.mjs')) continue;
  // Only these self-contained showcase exports no longer need GSAP at all.
  const clean=after.replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap\/[^"\n]+"><\/script>/g,'').replace(/^[\t ]+$/gm,'');
  if(/\b(?:gsap\.|ScrollTrigger\.)/.test(clean)) throw new Error(`Other GSAP consumers in ${file}`);
  if(clean!==before){await fs.writeFile(file,clean);count++;}
 }
}
await walk(root);console.log(`Replaced legacy scroll refresh in ${count} HTML files`);
