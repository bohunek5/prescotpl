// Bake the existing hero renderer into HTML; do not wait for hydration to place icons.
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const root = new URL('../', import.meta.url);
const base = process.env.BASE_URL || 'http://127.0.0.1:4178/';
const pages = ['index.html', 'prescotled/index.html', '404.html', 'produkcja/index.html', 'produkcja.html', 'produkcja/r/index.html'];
const classes = ['elementor-element-216d8696', 'elementor-element-280b012', 'elementor-element-629d57a0'];
// Restrict replacements to balanced hero DIVs. Everything outside stays byte-for-byte intact.
function range(source, className) {
  const tags = /<\/?div\b[^>]*>/gi;
  let match, start = -1, depth = 0;
  while ((match = tags.exec(source))) {
    if (start < 0) {
      if (!match[0].startsWith('</') && match[0].includes(className)) {start = match.index; depth = 1;}
    } else {
      depth += match[0].startsWith('</') ? -1 : 1;
      if (!depth) return [start, tags.lastIndex];
    }
  }
  if (start >= 0) throw new Error('Unbalanced hero: '+className);
}
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(new URL('company-pages.css', base).href);
  for (const file of pages) {
    let source = await fs.readFile(new URL(file, root), 'utf8');
    const rendered = await page.evaluate(async ({source, classes, base}) => {
      const {initializeHeroLayout} = await import(new URL('site-experience.mjs?v=20260914-firstpaint1', base).href);
      const doc = new DOMParser().parseFromString(source, 'text/html');
      initializeHeroLayout(doc);
      return classes.map(cls => {
        const hero = doc.querySelector('.'+cls);
        if (!hero) return null;
        hero.querySelectorAll('.pm-capability-link').forEach(link => link.setAttribute('href', link.getAttribute('href').replace(base, '')));
        return hero.outerHTML.replace(/[\t ]+$/gm, '');
      });
    }, {source, classes, base});
    for (let i = 0; i < classes.length; i++) {
      const bounds = range(source, classes[i]);
      if (bounds) source = source.slice(0, bounds[0]) + rendered[i] + source.slice(bounds[1]);
    }
    source = source.replace(/local-navigation\.js\?v=[\w-]+/g, 'local-navigation.js?v=20260914-firstpaint1');
    await fs.writeFile(new URL(file, root), source);
    console.log('Prerendered', file);
  }
} finally { await browser.close(); }
