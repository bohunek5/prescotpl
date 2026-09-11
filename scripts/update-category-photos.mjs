import fs from 'node:fs/promises';

// Only category exports: keep product detail photographs and V2 untouched.
const files = ['produkty/index.html', 'produkty.html', 'oferta/index.html', 'oferta.html', 'oferta-prescot-led/index.html', 'oferta-prescot-led.html'];
const replacements = [
  ['assets/controllers/rgbcct-main.webp', 'assets/controllers/controller-living-room-hero-v2.webp'],
  ['assets/prmad/pr-mad-family.webp', 'assets/prmad/pr-mad-kitchen-hero.webp']
];
for (const file of files) {
  let html = await fs.readFile(file, 'utf8');
  for (const [before, after] of replacements) {
    html = html.replaceAll(before, after).replaceAll(before.replaceAll('/', '\\/'), after.replaceAll('/', '\\/'));
  }
  await fs.writeFile(file, html);
  console.log(file);
}
