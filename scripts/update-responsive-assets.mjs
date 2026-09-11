import fs from 'node:fs/promises';
import path from 'node:path';
const root = new URL('../', import.meta.url).pathname;
const seriesRevisionPages = new Set(['produkty/index.html','produkty.html','oferta/index.html','oferta.html','oferta-prescot-led/index.html','oferta-prescot-led.html','sterowniki-led/index.html','zasilacze-led/index.html']);
let count = 0;
async function walk(dir) {
  for (const item of await fs.readdir(dir, {withFileTypes:true})) {
    if (item.name.startsWith('.') || ['node_modules','output'].includes(item.name)) continue;
    const file = path.join(dir,item.name);
    if (item.isDirectory()) { await walk(file); continue; }
    if (!item.name.endsWith('.html')) continue;
    const before = await fs.readFile(file,'utf8');
    let after = before.replace(/(prescot-global\.css)\?v=[^"\s]+/g,'$1?v=20260911-mobile1')
      .replace(/(local-navigation\.js|prescot-mobile\.css)\?v=[^"\s]+/g,'$1?v=20260911-series4');
    // Give the preload scanner the deployment base before it scans assets.
    // document.write(base) caused speculative requests to /page/wp-content/.
    if (after.includes("document.write('<base href=\"' + b + '\">');")) {
      after = after.replace('<head>','<head>\n<base href="/prescotpl/">')
        .replace("document.write('<base href=\"' + b + '\">');", "document.querySelector('base').href = b;")
        .replace('<noscript><base href="/prescotpl/"></noscript>', '');
    }
    if (after.includes('prescot-global.css') && !after.includes('prescot-mobile.css')) {
      after = after.replace(/(<link[^>]+href="prescot-global\.css[^>]+>)/, '$1\n  <link rel="stylesheet" href="prescot-mobile.css?v=20260911-series4">');
    }
    if (!seriesRevisionPages.has(path.relative(root, file))) after = after.replaceAll('20260911-series4', '20260911-brand3');
    // Keep the shared footer/brand module current when rerunning this older asset updater.
    after = after.replace(/local-navigation\.js\?v=[^"\s]+/g,'local-navigation.js?v=20260911-refine9');
    if (after !== before) { await fs.writeFile(file,after); count++; }
  }
}
await walk(root); console.log(`Updated responsive asset references in ${count} HTML files`);
