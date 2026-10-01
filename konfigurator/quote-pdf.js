import {PDFDocument,rgb,PDFName,PDFString} from './vendor/pdf-lib-1.17.1/pdf-lib.esm.min.js?v=130bc2896fcd';
import './vendor/fontkit-1.1.1/fontkit.umd.min.js?v=130bc2896fcd';
import {quoteDetails,quoteNumber as n,quoteText,configurationUrl} from './quote-data.js?v=20260922-refine1';

import {detailLength} from './catalog.js?v=20260922-refine1';

let fonts;
const fontBytes=()=>fonts||(fonts=Promise.all(['Regular','Bold'].map(async weight=>{
 const response=await fetch(new URL(`./assets/pdf/NotoSans-${weight}.ttf`,import.meta.url));
 if(!response.ok)throw Error('Nie udało się wczytać czcionki PDF. Spróbuj ponownie.');return response.arrayBuffer();
})).catch(e=>{fonts=null;throw e;}));

export async function generateQuotePdf({title,notes,items,baseUrl,date=new Date()}){
 if(!items.length)throw Error('Dodaj przynajmniej jeden zestaw.');
 const doc=await PDFDocument.create();doc.registerFontkit(globalThis.fontkit);
 const bytes=await fontBytes(),regular=await doc.embedFont(bytes[0],{subset:true}),bold=await doc.embedFont(bytes[1],{subset:true});
 const fontsByWeight={regular,bold},ink=rgb(.16,.19,.20),muted=rgb(.40,.44,.46),orange=rgb(.94,.29,.13),line=rgb(.86,.88,.87),paper=rgb(.96,.97,.96);
 const W=595.28,H=841.89,M=42,CW=W-M*2;
 let page,y,continuation='ZESTAWIENIE / CIĄG DALSZY';
 const clean=value=>String(value??'').replace(/[\r\n\t]+/g,' ').replace(/[\u2010-\u2015\u2212]/g,'-').replace(/\s+/g,' ').trim();
 function lines(value,width,size=10,weight='regular'){
  const font=fontsByWeight[weight],words=clean(value).split(' '),result=[];let current='';
  for(const word of words){
   if(font.widthOfTextAtSize([current,word].filter(Boolean).join(' '),size)<=width){current=[current,word].filter(Boolean).join(' ');continue;}
   if(current){result.push(current);current='';}
   for(const char of word){if(font.widthOfTextAtSize(current+char,size)>width&&current){result.push(current);current='';}current+=char;}
  }
  if(current)result.push(current);return result.length?result:[''];
 }
 function text(value,x,top,{size=10,weight='regular',color=ink,width=CW}={}){
  const ls=lines(value,width,size,weight);ls.forEach((value,i)=>page.drawText(value,{x,y:H-top-size-i*size*1.42,size,font:fontsByWeight[weight],color}));return ls.length*size*1.42;
 }
 function rule(top){page.drawLine({start:{x:M,y:H-top},end:{x:W-M,y:H-top},thickness:.6,color:line});}
 function newPage(label){
  page=doc.addPage([W,H]);text('PRESCOT',M,30,{size:18,weight:'bold'});text('LED',138,30,{size:18,weight:'bold',color:orange});
  text('LIGHT STUDIO',W-148,33,{size:8,color:muted,width:110});rule(62);y=82;
  if(label)y+=text(label,M,y,{size:9,color:muted})+10;
 }
 const ensure=(height,label)=>{if(y+height>H-58)newPage(label||continuation);};
 function paragraph(value,{size=9,color=muted,weight='regular',gap=8}={}){
  const ls=lines(value,CW,size,weight);
  for(const value of ls){ensure(size*1.42);text(value,M,y,{size,color,weight});y+=size*1.42;}y+=gap;
 }
 const paragraphHeight=(value,size=9,gap=8,weight='regular')=>lines(value,CW,size,weight).length*size*1.42+gap;
 function link(label,url){
  ensure(27);const h=text(label,M,y,{size:10,color:orange});
  const annotation=doc.context.register(doc.context.obj({Type:'Annot',Subtype:'Link',Rect:[M,H-y-h,M+regular.widthOfTextAtSize(label,10),H-y],Border:[0,0,0],A:{Type:'Action',S:'URI',URI:PDFString.of(url)}}));
  let annotations=page.node.Annots();if(!annotations){annotations=doc.context.obj([]);page.node.set(PDFName.of('Annots'),annotations);}annotations.push(annotation);y+=h+12;
 }
 const day=date.toLocaleDateString('pl-PL'),project=quoteText(title,100)||'Zestawy LED do wyceny';
 doc.setTitle(project);doc.setAuthor('PRESCOT LED');doc.setSubject('Wybrane warianty zestawów LED do przygotowania wyceny');doc.setCreator('PRESCOT Light Studio');doc.setCreationDate(date);
 newPage('ZESTAWIENIE DO WYCENY');
 y+=text(project,M,y,{size:26,width:CW,weight:'bold'})+13;
 paragraph(`Data: ${day} · Zapisane zestawy: ${items.length}`);
 paragraph('Wybrane zestawy do porównania lub przygotowania wyceny. Każdy wariant ma osobną specyfikację i link do konfiguratora.');
 y+=12;
 for(let i=0;i<items.length;i++){
  const item=items[i],d=quoteDetails(item),name=`${String(i+1).padStart(2,'0')}  ${item.name}`,height=lines(name,CW-115,13,'bold').length*18.46+lines(d.title,CW-115,9).length*12.78+52;
  ensure(height);rule(y);y+=15;
  const top=y;y+=text(name,M,y,{size:13,weight:'bold',width:CW-115})+5;
  y+=text(d.title,M,y,{size:9,color:muted,width:CW-115})+7;
  text(`${d.count} ${d.count===1?'zestaw':'zest.'}`,W-M-90,top,{size:12,weight:'bold',width:90});
  paragraph(`Odcinek: ${n(d.state.length/1000)} m · Taśma: ${n(d.spec.stripLength/1000)} m · ${n(d.spec.power,2)} W / zestaw · ${d.spec.stripSelected?d.spec.strip.voltage+' V DC':'bez taśmy LED'}`,{size:9});
  paragraph(d.status,{size:8,color:d.spec.fitStatus==='compatible'?muted:orange,gap:14});
 }
 if(quoteText(notes,1000).trim()){ensure(65);y+=12;paragraph('Uwagi dla handlowca',{size:12,weight:'bold',color:ink});paragraph(quoteText(notes,1000),{size:10});}
 ensure(58);y+=12;paragraph('Dokument służy do przygotowania wyceny. Zasilacz, sterownik, przewody i sposób mocowania wymagają doboru. Długości oznaczają odcinki do przygotowania, nie liczbę opakowań handlowych.',{size:8});
 for(let i=0;i<items.length;i++){
  const item=items[i],d=quoteDetails(item),{state,spec}=d,label=`ZESTAW ${String(i+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`;
  continuation=label+' / CIĄG DALSZY';
  newPage(label);y+=text(item.name,M,y,{size:22,weight:'bold'})+8;paragraph(d.title,{size:10});
  paragraph(d.status,{size:10,weight:'bold',color:spec.fitStatus==='compatible'?muted:orange});
  const previewText=`Podgląd ${spec.assemblyBlocked?'elementów':'złożonego zestawu'} · próbka ${n(detailLength({...state,view:spec.isSleeve?'macro':'assembly'}))} mm. Długości zamawiane podano poniżej.`;
  const colourText=!spec.stripSelected?'Taśma LED nie została wybrana; moc i zasilanie nie zostały dobrane.':`Barwa produktu: ${d.colour} · Zasilanie: ${spec.strip.voltage} V DC · Moc: ${n(spec.wattsPerMeter,2)} W/m.${spec.strip.type==='3IN1'?` Wariant ${state.powerMode.toUpperCase()}, aktywne pola +24V / ${spec.selectedTerminal}.`:''}`;
  const finishText=`Wykończenie: ${spec.finish.name}. Przesłona: ${spec.cover.name}.`;
  const cutText=`${d.cut} ${!spec.stripSelected?'':spec.cutVerified?'Potwierdź miejsca cięcia na PCB.':spec.strip.cutNote||'Moduł cięcia wymaga potwierdzenia; obliczenia orientacyjne.'}`;
  const finalNote='Ilości mocowników i elementów oznaczonych „Do doboru” ustala handlowiec. Podgląd jest orientacyjny i nie potwierdza szczelności ani parametrów cieplnych całego zestawu.';
  const col=[M,M+215,M+370,M+442],widths=[205,145,64,69];
  const tableRows=d.rows.map(row=>{
   const qty=v=>v==null?'Do doboru':`${n(v)} ${row.unit}`,values=[`${row.label}: ${row.name}`,row.ref,qty(row.quantity),qty(row.total)];
   return{values,height:Math.max(...values.map((v,j)=>lines(v,widths[j],j===1?8:9).length*(j===1?11.36:12.78)))+18};
  });
  if(item.image){
   // A slightly shorter image keeps the final note and link with a compact
   // variant. Text size stays unchanged; long tables still span normal pages.
   const tailHeight=60+paragraphHeight(colourText)+(spec.isSleeve?0:paragraphHeight(finishText))+34+tableRows.reduce((sum,row)=>sum+row.height,0)+10+paragraphHeight(cutText,8)+(spec.issues.length?paragraphHeight('Do sprawdzenia przed wyceną',10,8,'bold')+spec.issues.reduce((sum,issue)=>sum+paragraphHeight(issue.message,9,5),0):0)+paragraphHeight(finalNote,8)+27;
   const room=H-58-y-7-paragraphHeight(previewText,8)-tailHeight-1;
   const image=await doc.embedJpg(item.image),boxHeight=room>=120?Math.min(150,room):150,scale=Math.min(CW/image.width,boxHeight/image.height);ensure(boxHeight+32,label);
   page.drawRectangle({x:M,y:H-y-boxHeight,width:CW,height:boxHeight,color:paper});page.drawImage(image,{x:M+(CW-image.width*scale)/2,y:H-y-boxHeight+(boxHeight-image.height*scale)/2,width:image.width*scale,height:image.height*scale});y+=boxHeight+7;
   paragraph(previewText,{size:8});
  }
  const metrics=[['Odcinek / zestaw',`${n(state.length/1000)} m`],['Taśma / zestaw',`${n(spec.stripLength/1000)} m`],['Moc / zestaw',`${n(spec.power,2)} W`],['Liczba zestawów',String(d.count)]];
  ensure(64,label);rule(y);y+=12;for(let j=0;j<metrics.length;j++){const x=M+j*CW/4;text(metrics[j][0],x,y,{size:8,color:muted,width:CW/4-7});text(metrics[j][1],x,y+16,{size:15,weight:'bold',width:CW/4-7});}y+=48;
  paragraph(colourText,{size:9});
  if(!spec.isSleeve)paragraph(finishText,{size:9});
  function tableHead(){ensure(48,label);rule(y);y+=10;['Element / wariant','Symbol','Na zestaw','Razem'].forEach((v,j)=>text(v,col[j],y,{size:8,weight:'bold',color:muted,width:widths[j]}));y+=24;}
  tableHead();
  for(const {values,height} of tableRows){
   if(y+height>H-60){newPage(label+' / ELEMENTY');tableHead();}
   values.forEach((v,j)=>text(v,col[j],y,{size:j===1?8:9,width:widths[j]}));y+=height;rule(y-7);
  }
  y+=10;paragraph(cutText,{size:8});
  if(spec.issues.length){ensure(42,label);paragraph('Do sprawdzenia przed wyceną',{size:10,weight:'bold',color:orange});for(const issue of spec.issues)paragraph(issue.message,{size:9,color:ink,gap:5});}
  ensure(lines(finalNote,CW,8).length*8*1.42+8+27,label+' / UWAGI');
  paragraph(finalNote,{size:8});
  link('Otwórz ten zestaw w konfiguratorze',configurationUrl(state,baseUrl));
 }
 const pages=doc.getPages();pages.forEach((p,i)=>{page=p;rule(H-39);text('PRESCOT LED · Zestawienie do wyceny',M,H-29,{size:8,color:muted});text(`${i+1} / ${pages.length}`,W-82,H-29,{size:8,color:muted,width:40});});
 return new Blob([await doc.save()],{type:'application/pdf'});
}
