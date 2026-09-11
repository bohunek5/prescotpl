import fs from 'node:fs/promises';
import path from 'node:path';
const source=process.argv[2];
if(!source) throw new Error('Pass the existing _2026 product-assets directory.');
const destination=new URL('../assets/showcase/',import.meta.url);
await fs.mkdir(destination,{recursive:true});
const controllers='Nowe sterowniki 2026/Zestawy sterowniki 2026/';
const files=[];
for(const [name,remote,receiver] of [['mono','RC07RFB','C01RF'],['cct','RC08RFB','C02RF'],['rgb','RC09RFB','C03RF'],['rgbw','RC09RFB','C04RF'],['rgbcct','RC09RFB','C05RF']]) {
 files.push([`${controllers}Customize/High Quality Photos/Remote/${remote}/1.png`,`${name}-remote.png`]);
 files.push([`${controllers}Customize/High Quality Photos/Controller/${receiver}/${receiver}-01.png`,`${name}-receiver.png`]);
}
files.push([`${controllers}uchwyt pilot.png`,'magnetic-holder-source.png']);
files.push(['Zasilacze 1224/Zdjęcia/PR-MAD-XX-1224_6 2.png','pr-mad-terminals.png']);
for(const code of ['24DS002-050-4-XX','24DS004-050-4-XX','24D160-8-4080-810']) files.push([`TIM.PL/TIM - karty ce/Karty katalogowe/Taśmy LED/DELUX/${code}.pdf`,`${code.toLowerCase()}.pdf`]);
for(const power of [36,60,100,150,200,300]) {
 files.push([`Zasilacze 1224/karty katalogowe/PR-MAD${power}-1224.pdf`,`pr-mad-${power}w.pdf`]);
 files.push([`Zasilacze 1224/Zdjęcia/PR-MAD-${power}-1224_${power===150?2:1} 2.png`,`pr-mad-${power}w.png`]);
}
// macOS source names may be decomposed Unicode.
async function resolveSource(relative) {
 let directory=source;
 for(const part of relative.split('/')) {
  const names=await fs.readdir(directory);
  const match=names.find(name=>name.normalize('NFC')===part.normalize('NFC'));
  if(!match) throw new Error(`Missing source: ${relative}`);
  directory=path.join(directory,match);
 }
 return directory;
}
for(const [from,to] of files) {
 try { await fs.access(new URL(to.replace(/\.png$/,'.webp'),destination)); continue; } catch {}
 await fs.copyFile(await resolveSource(from),new URL(to,destination));
 console.log(`Imported original ${to}`);
}
