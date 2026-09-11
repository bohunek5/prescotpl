import fs from 'node:fs/promises';
for(const file of ['produkcja/index.html','produkcja.html','produkcja/r/index.html']) {
  let html=await fs.readFile(file,'utf8');
  for(const [id,device] of [['280b012','mobile'],['629d57a0','desktop']]) {
    const pattern=new RegExp(`<div class="[^"]*elementor-element-${id}[^\n]+`);
    html=html.replace(pattern,tag=>tag.replace(/ data-pm-production-hero="[^"]+"/g,'').replace(/data-settings="[^"]+"/,`data-pm-production-hero="${device}" data-settings="{&quot;background_background&quot;:&quot;classic&quot;}"`));
  }
  // Let the native visibility controller choose exactly one intro video.
  html=html.replaceAll('class="elementor-background-video-hosted" role="presentation" autoplay muted playsinline loop','class="elementor-background-video-hosted" role="presentation" preload="none" muted playsinline loop');
  const gridStart=html.indexOf('<div class="grid">');
  if(gridStart>=0) {
    const innerStart=gridStart+'<div class="grid">'.length;
    const tags=/<div\b[^>]*>|<\/div>/g;tags.lastIndex=innerStart;
    let depth=1,match;
    while((match=tags.exec(html))) {
      depth+=match[0].startsWith('</')?-1:1;
      if(depth===0) {html=html.slice(0,innerStart)+'<!-- Five SVG film components are mounted by production-motion.mjs. -->'+html.slice(match.index);break;}
    }
    if(depth!==0)throw Error(`Unclosed production grid in ${file}`);
  }
  await fs.writeFile(file,html);
  console.log(file);
}
