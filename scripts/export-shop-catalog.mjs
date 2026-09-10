import fs from 'node:fs/promises';
import path from 'node:path';

// Export only public product information; never execute catalog storage helpers.
const source = process.argv[2] || '../sklepSC/js/products-data.js';
const text = await fs.readFile(source, 'utf8');
const match = text.match(/^const defaultProducts = (\[[\s\S]*?\n\]);/);
if (!match) throw new Error('Unrecognized catalog format');
const products = JSON.parse(match[1]);
const normalize = text => String(text || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/ł/g, 'l').toLowerCase();
const number = value => Number(String(value || '').replace(',', '.').match(/\d+(?:\.\d+)?/)?.[0]) || null;
const colorOf = text => {
  const s = normalize(text).replace(/\s/g, '');
  if (/rgb\+?cct|rgbcc/.test(s)) return 'rgbcct';
  if (/rgbw|rgb\+?(?:ww|nw|cw|\d{4}k)/.test(s)) return 'rgbw';
  if (/rgb/.test(s)) return 'rgb';
  if (/cct/.test(s)) return 'cct';
  return 'mono';
};
const records = [];
for (const p of products) {
  const title = p.title.replace(/\s+/g, ' ').trim();
  const sku = p.kod_katalogowy || '';
  const a = p.attributes || {};
  let kind;
  if (/^tasma led|^tasma /i.test(normalize(title))) kind = 'tape';
  else if (/^SCH-\d+-\d+$/.test(sku)) kind = 'power';
  else if (/^PR-(MONO|CCT|RGB|RGBW|RGBCCT)-12A$/.test(sku)) kind = 'control';
  else continue;
  const voltage = kind === 'power' ? number(sku.split('-')[2]) : number(title.match(/\b(12|24|48)\s*V/i)?.[1] || a['Napięcie wejściowe']);
  const record = {
    id: p.id, sku, title, kind,
    image: p.images?.[0] || '',
    // The configurator displays no stock counts or stale prices from the export.
    url: `https://prescot.com.pl/pl/p/produkt/${p.id}`,
    voltage: kind === 'control' ? null : voltage,
    color: kind === 'power' ? null : colorOf(a['Barwa światła'] || sku + ' ' + title),
    technology: /\bcob\b/i.test(title) ? 'cob' : 'smd',
    digital: /cyfrow|digital|IC\d|SPI/i.test(title),
    watts: number(a['Moc'] || title.match(/\b(\d+(?:[.,]\d+)?)\s*W(?:\/m)?/i)?.[1]),
    packLength: kind === 'tape' ? number(a['Rolka'] || title.match(/(?:rolka\s*)?(\d+)\s*m\b/i)?.[1]) : null,
    byMeter: normalize(a['Taśma na metry']) === 'tak' || /tasma na metry/.test(normalize(title)),
    kelvin: number((a['Barwa światła'] || title).match(/\b(\d{4})\s*k/i)?.[1]),
    ip: number(a['Klasa szczelności'] || title.match(/IP\d+/i)?.[0]),
    ...(kind === 'control' ? {voltageMin: 5, voltageMax: 24, maxAmps: number(a['Prąd maksymalny']), channelAmps: number(a['Prąd na 1 kanał'])} : {}),
  };
  if (p.id === 13118) Object.assign(record, {
    color: 'rgbcct', voltage: 24, watts: 20, packLength: 5, ip: 20,
    maxFeedLength: 5,
    specification: 'https://www.prescot.com.pl/pl/p/file/608a82159d78ba147a76a7a690930f01/24EC840-036-12-RGB-CCT.pdf',
    specificationNote: '20 W/m przy RGB+CCT; 10 W/m przy samej bieli CCT. Obliczenia obejmują pełne RGB+CCT.',
  });
  records.push(record);
}
const destination = new URL('../shop-assistant/catalog.json', import.meta.url);
await fs.mkdir(path.dirname(destination.pathname), {recursive: true});
await fs.writeFile(destination, JSON.stringify({version: 1, exportedAt: new Date().toISOString().slice(0, 10), source: 'sklepSC/js/products-data.js', products: records}, null, 2) + '\n');
console.log(`Exported ${records.length} products, without prices or stock claims.`);
