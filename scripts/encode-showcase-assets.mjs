import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const encoder=process.argv[2];
if(!encoder)throw new Error('Pass the path to a local sharp module.');
const {default:sharp}=await import(pathToFileURL(encoder));
const originals=new URL('../output/mobile-details/source-png/',import.meta.url);
const folder=new URL('../assets/showcase/',import.meta.url);
await fs.mkdir(originals,{recursive:true});
for(const file of await fs.readdir(folder)){
 if(!file.endsWith('.png'))continue;
 const source=new URL(file,folder), destination=new URL(file.replace('.png','.webp'),folder);
 // Mechanical web export only: preserve alpha and the original product geometry.
 await sharp(source.pathname).resize({width:1200,withoutEnlargement:true}).webp({quality:88}).toFile(destination.pathname);
 await fs.rename(source,new URL(file,originals));
 console.log(file,'→',destination.pathname.split('/').at(-1));
}
