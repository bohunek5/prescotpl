import fs from 'node:fs/promises';
import path from 'node:path';
const root = new URL('../',import.meta.url).pathname;
const changed = [];
async function walk(dir) {
  for (const item of await fs.readdir(dir,{withFileTypes:true})) {
    if (item.name.startsWith('.') || ['node_modules','output','v2'].includes(item.name)) continue;
    const file = path.join(dir,item.name);
    if (item.isDirectory()) { await walk(file); continue; }
    if (!item.name.endsWith('.html')) continue;
    const before = await fs.readFile(file,'utf8');
    if (!before.includes('local-navigation.js')) continue;
    let after = before.replace(/local-navigation\.js\?v=[^"\s]+/g,'local-navigation.js?v=20260911-motion7')
      .replace(/brand-footer\.css\?v=[^"\s]+/g,'brand-footer.css?v=20260911-motion7');
    if (!after.includes('brand-footer.css')) after = after.replace('</head>','<link rel="stylesheet" href="brand-footer.css?v=20260911-motion7">\n</head>');
    if (before !== after) { await fs.writeFile(file,after); changed.push(path.relative(root,file)); }
  }
}
await walk(root);
await fs.mkdir(new URL('../output/brand-footer-review/',import.meta.url),{recursive:true});
await fs.writeFile(new URL('../output/brand-footer-review/changed-pages.json',import.meta.url),JSON.stringify(changed,null,2));
console.log(`Updated shared footer assets in ${changed.length} pages; page content unchanged.`);
