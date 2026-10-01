import {normalize,specification} from './catalog.js?v=20260922-refine1';
import {accessoryKit} from './accessory-data.js?v=130bc2896fcd';
import {sleeveAccessoryKit} from './sleeve-accessory-data.js?v=130bc2896fcd';

export const QUOTE_LIMIT=12,QUOTE_STORAGE='prescot-quote-v1';
export const quoteText=(value,max=100)=>typeof value==='string'?value.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g,'').slice(0,max):'';
export const quoteCount=value=>Number.isFinite(Number(value))?Math.max(1,Math.min(999,Math.floor(Number(value)))):1;
export const quoteNumber=(value,digits=3)=>value.toLocaleString('pl-PL',{maximumFractionDigits:digits});
export const quoteSegments=count=>`${quoteNumber(count,0)} ${count===1?'segment':count%10>=2&&count%10<=4&&!(count%100>=12&&count%100<=14)?'segmenty':'segmentów'}`;
export function quoteItem(configuration,{name='',count=1,image='',id=globalThis.crypto?.randomUUID?.()||String(Date.now())}={}){
 const state=normalize(configuration),spec=specification(state);
 return{id:quoteText(id,80),name:quoteText(name,80)||`${spec.isSleeve?(spec.sleeve?.name||spec.strip.name):spec.profile.name}`,count:quoteCount(count),state,image};
}
export function restoreQuote(raw){
 const value=raw&&typeof raw==='object'?raw:{};
 return{title:quoteText(value.title,100),notes:quoteText(value.notes,1000),items:(Array.isArray(value.items)?value.items:[]).slice(0,QUOTE_LIMIT).filter(x=>x&&typeof x.state==='object'&&x.state).map((x,i)=>quoteItem(x.state,{...x,id:`restored-${i}`,image:typeof x.image==='string'&&x.image.length<800000&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(x.image)?x.image:''}))};
}
export function quoteDetails(item){
 const state=normalize(item.state),spec=specification(state),{profile,strip,cover}=spec,count=quoteCount(item.count),rows=[];
 const add=(label,name,ref,quantity,unit='m')=>rows.push({label,name,ref:ref||'Do potwierdzenia',quantity,unit,total:quantity==null?null:quantity*count});
 if(!spec.isSleeve)add('Profil',`${profile.name} · ${spec.finish.name}`,spec.finish.ref,state.length/1000);
 if(spec.stripSelected)add('Taśma',strip.name,strip.ref,spec.stripLength/1000);
 if(!spec.isSleeve)add('Przesłona',cover.name,cover.ref,state.length/1000);
 if(spec.sleeve)add('Koszulka',spec.sleeve.name,spec.sleeve.ref,(spec.stripSelected?spec.stripLength:state.length)/1000);
 const accessories=spec.isSleeve?sleeveAccessoryKit(spec.sleeve,state,strip):[...accessoryKit(profile,state),...(spec.stripSelected&&strip.technology==='WCOB'?sleeveAccessoryKit(null,state,strip):[])];
 for(const a of accessories.filter(a=>a.selected))add('Akcesoria',a.name,a.ref,a.quantity??null,a.unit||'szt.');
 const colour=!spec.stripSelected?'Nie wybrano taśmy':strip.type==='RGBW'?`RGB + biel ${strip.cct} K`:strip.type==='CCT'?`CCT ${strip.cctMin}-${strip.cctMax} K`:`${strip.cct} K`;
 const status=spec.fitStatus==='blocked'?'Zestaw niezgodny - wymaga zmiany':spec.fitStatus==='pending'?'Do potwierdzenia przez handlowca':'Gabaryt pasuje';
 const cut=!spec.stripSelected?'Bez taśmy LED.':`${quoteSegments(spec.segments)} po ${quoteNumber(strip.cut)} mm${!spec.isSleeve&&spec.offcut>.01?`; ${quoteNumber(spec.offcut)} mm wolnego profilu`:''}.`;
 return{state,spec,count,rows,colour,status,cut,title:!spec.stripSelected?`${spec.isSleeve?spec.sleeve?.name:profile.name} · bez taśmy`:spec.isSleeve?`${spec.sleeve?.name||strip.ip} + ${strip.name}`:`${profile.name} + ${strip.name}`};
}
export function configurationUrl(state,base){
 const url=new URL(base);if(!['http:','https:'].includes(url.protocol))throw Error('Nieprawidłowy adres konfiguratora.');
 url.search='';url.hash='config='+encodeURIComponent(JSON.stringify(normalize(state)));return url.href;
}
