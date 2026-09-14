import fs from 'node:fs/promises';
const root=new URL('../',import.meta.url),version='20260914-origin1';
for(const file of ['produkcja/index.html','produkcja.html']){
 let html=await fs.readFile(new URL(file,root),'utf8');
 if(!html.includes('pm-origin-flag')){
  const heading='<h2 class="elementor-heading-title elementor-size-default">Postaw na polskiego producenta</h2>';
  if(!html.includes(heading))throw Error('Missing production heading: '+file);
  html=html.replace(heading,'<div class="pm-origin-copy"><span class="pm-origin-flag" role="img" aria-label="Flaga Polski"></span><span class="pm-origin-label">MADE IN POLAND</span>'+heading+'</div>');
  html=html.replace('</head>',`<link rel="stylesheet" href="production-origin.css?v=${version}">\n</head>`);
 }
 html=html.replace(/local-navigation\.js\?v=[\w-]+/g,`local-navigation.js?v=${version}`);
 await fs.writeFile(new URL(file,root),html);
}
for(const file of ['baza-wiedzy/index.html','baza-wiedzy.html','wiedza/index.html','wiedza.html']){
 let html=await fs.readFile(new URL(file,root),'utf8');
 html=html.replace(/local-navigation\.js\?v=[\w-]+/g,`local-navigation.js?v=${version}`);
 html=html.replace('window.gtranslateSettings || {{}}','window.gtranslateSettings || {}').replace(/(window\.gtranslateSettings\['85632840'\] = )\{\{(.*?)\}\};/g,'$1{$2};');
 // The link opens a parameter search, not a verified Ultra Slim product listing.
 html=html.replace(/Zasilacz Prescot Ultra Slim 150W 24V/g,'Zasilacz 150 W / 24 V');
 html=html.replace(/var modelName = 'Zasilacz Prescot Ultra Slim ' \+ matchedPsu \+ 'W ' \+ state\.voltage \+ 'V(?: DC)?';/g,"var modelName = 'Zasilacz ' + matchedPsu + ' W / ' + state.voltage + ' V';");
 html=html.replace(/Kup zasilacz 150W w sklepie(?: fabrycznym)? &rarr;/g,'Sprawdź zasilacze 150 W / 24 V &rarr;');
 html=html.replace(/btnLink\.innerHTML = 'Kup zasilacz ' \+ matchedPsu \+ 'W w sklepie(?: fabrycznym)? &rarr;';/g,"btnLink.innerHTML = 'Sprawdź zasilacze ' + matchedPsu + ' W / ' + state.voltage + ' V &rarr;';");
 await fs.writeFile(new URL(file,root),html);
}
