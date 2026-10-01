import {QUOTE_LIMIT,QUOTE_STORAGE,quoteItem,restoreQuote,quoteDetails,quoteCount,quoteText,quoteNumber} from './quote-data.js?v=20260922-refine1';

async function previewImage(blob){
 const image=new Image(),url=URL.createObjectURL(blob);
 try{
  image.src=url;await image.decode();const probe=document.createElement('canvas'),scale=Math.min(1,1000/image.width);probe.width=Math.round(image.width*scale);probe.height=Math.round(image.height*scale);
  const context=probe.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,probe.width,probe.height);
  const pixels=context.getImageData(0,0,probe.width,probe.height).data;let left=probe.width,right=0,top=probe.height,bottom=0;
  for(let y=0;y<probe.height;y+=2)for(let x=0;x<probe.width;x+=2)if(pixels[(y*probe.width+x)*4+3]>80){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right<=left||bottom<=top){left=0;right=probe.width;top=0;bottom=probe.height;}
  left=Math.max(0,left-8);top=Math.max(0,top-8);right=Math.min(probe.width,right+8);bottom=Math.min(probe.height,bottom+8);
  const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=400;const ctx=canvas.getContext('2d');ctx.fillStyle='#f5f7f5';ctx.fillRect(0,0,1000,400);
  const width=right-left,height=bottom-top,factor=Math.min(900/width,340/height);ctx.drawImage(probe,left,top,width,height,(1000-width*factor)/2,(400-height*factor)/2,width*factor,height*factor);
  return canvas.toDataURL('image/jpeg',.88);
 }finally{URL.revokeObjectURL(url);}
}

export function createQuoteBuilder({host,capture,restore,notify}){
 if(!host){const bom=document.querySelector('.bom');if(!bom)return null;host=document.createElement('div');host.id='quote-actions';host.className='quote-actions';bom.append(host);}
 let data=restoreQuote({}),busy=false,storageFailed=false;
 try{data=restoreQuote(JSON.parse(localStorage.getItem(QUOTE_STORAGE)||'{}'));}catch{}
 const dialog=document.createElement('dialog');dialog.id='quote-dialog';dialog.setAttribute('aria-labelledby','quote-title');dialog.setAttribute('closedby','any');
 dialog.innerHTML=`<button type="button" class="close" aria-label="Zamknij">×</button><div class="eyebrow">DLA CIEBIE I HANDLOWCA</div><h2 id="quote-title">Zestawy do wyceny.</h2><p>Zapisz kilka wariantów w jednym PDF. Plik możesz pobrać i przesłać handlowcowi.</p><label class="quote-field">Nazwa projektu <span>(opcjonalnie)</span><input id="quote-project" type="text" maxlength="100" placeholder="np. Oświetlenie kuchni" autocomplete="off"></label><div class="quote-list" id="quote-list"></div><p id="quote-empty" hidden>Lista jest pusta. Dodaj wybrany zestaw w konfiguratorze.</p><label class="quote-field">Uwagi dla handlowca <span>(opcjonalnie)</span><textarea id="quote-notes" maxlength="1000" rows="3" placeholder="np. miejsce montażu lub pytanie o zasilacz"></textarea></label><p class="quote-status" id="quote-status" role="status"></p><div class="quote-dialog-actions"><button type="button" class="quote-secondary" id="quote-continue">Dodaj kolejny zestaw</button><button type="button" class="quote-primary" id="quote-download">Pobierz PDF</button></div>`;
 document.body.append(dialog);
 host.innerHTML=`<button type="button" class="quote-primary" id="quote-open">Generuj PDF</button><button type="button" class="quote-secondary" id="quote-save">＋ Dodaj zestaw do PDF</button><button type="button" class="quote-review" id="quote-review" hidden></button><p id="quote-hint"></p>`;
 const $=id=>document.getElementById(id),list=$('quote-list'),status=$('quote-status');
 $('quote-project').value=data.title;$('quote-notes').value=data.notes;
 function persist(){try{localStorage.setItem(QUOTE_STORAGE,JSON.stringify(data));storageFailed=false;}catch{storageFailed=true;}}
 function summary(){
  $('quote-review').hidden=!data.items.length;$('quote-review').textContent=`Zapisane zestawy: ${data.items.length} · Przejrzyj`;
  $('quote-hint').textContent=data.items.length>=QUOTE_LIMIT?`Zapisano ${QUOTE_LIMIT} zestawów. Pobierz PDF lub usuń wybrany wariant, aby dodać kolejny.`:data.items.length?`PDF obejmie zapisane zestawy (${data.items.length}). Dodaj bieżący, jeśli też ma się znaleźć w pliku.`:'Pobierz bieżący zestaw lub dodaj kilka wariantów do jednego PDF.';
  $('quote-download').disabled=busy||!data.items.length;$('quote-save').disabled=busy||data.items.length>=QUOTE_LIMIT;$('quote-open').disabled=busy;$('quote-review').disabled=busy;
  $('quote-empty').hidden=!!data.items.length;
 }
 function render(){
  list.replaceChildren(...data.items.map((item,index)=>{
   const d=quoteDetails(item),row=document.createElement('article');row.className='quote-item';
   const top=document.createElement('div');top.className='quote-item-top';
   if(item.image){const image=document.createElement('img');image.src=item.image;image.alt=d.title;image.width=120;image.height=70;top.append(image);}
   const info=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('p');title.textContent=d.title;detail.textContent=`${quoteNumber(d.state.length/1000)} m · ${d.colour}${d.spec.isSleeve?'':' · '+d.spec.finish.name}`;info.append(title,detail);top.append(info);
   const controls=document.createElement('div');controls.className='quote-item-fields';
   const label=document.createElement('label');label.className='quote-field';label.textContent=`Nazwa zestawu ${index+1}`;const name=document.createElement('input');name.type='text';name.maxLength=80;name.value=item.name;name.oninput=()=>{item.name=quoteText(name.value,80);persist();};name.onblur=()=>{if(!item.name.trim()){item.name=`Zestaw ${index+1}`;name.value=item.name;persist();}};label.append(name);
   const quantity=document.createElement('label');quantity.className='quote-field';quantity.textContent='Liczba zestawów';const count=document.createElement('input');count.type='number';count.min='1';count.max='999';count.step='1';count.inputMode='numeric';count.value=item.count;count.onchange=()=>{item.count=quoteCount(count.value);count.value=item.count;persist();};quantity.append(count);controls.append(label,quantity);
   const foot=document.createElement('div');foot.className='quote-item-foot';const fit=document.createElement('span');fit.textContent=d.status;fit.dataset.status=d.spec.fitStatus;
   const actions=document.createElement('div'),use=document.createElement('button'),remove=document.createElement('button');use.type=remove.type='button';use.textContent='Użyj jako bazę';use.setAttribute('aria-label',`Użyj zestawu ${index+1} jako bazę`);use.onclick=()=>{dialog.close();restore(item.state);notify('Wczytano zestaw. Po zmianach dodaj go jako kolejny wariant.');};remove.textContent='Usuń';remove.setAttribute('aria-label',`Usuń zestaw ${index+1}`);remove.onclick=()=>{data.items=data.items.filter(x=>x!==item);persist();render();$('quote-continue').focus();};actions.append(use,remove);foot.append(fit,actions);row.append(top,controls,foot);return row;
  }));summary();
 }
 function setBusy(value,message=''){
  busy=value;status.textContent=message;dialog.setAttribute('aria-busy',String(value));
  dialog.querySelectorAll('button,input,textarea').forEach(el=>el.disabled=value);summary();
 }
 async function add(){
  if(data.items.length>=QUOTE_LIMIT)throw Error(`W jednym PDF zmieści się do ${QUOTE_LIMIT} zestawów. Usuń zbędny wariant, aby dodać kolejny.`);
  const snapshot=await capture(),image=await previewImage(snapshot.image),item=quoteItem(snapshot.state,{image});data.items.push(item);persist();render();return item;
 }
 async function save(){if(busy)return;setBusy(true);try{await add();notify(storageFailed?'Zapisano w tej karcie. Pamięć przeglądarki jest pełna; pobierz PDF przed jej zamknięciem.':`Dodano zestaw ${data.items.length}. Możesz zmienić konfigurację i dodać następny.`);}catch(e){notify(e.message);}finally{setBusy(false);}}
 async function open(){if(busy)return;setBusy(true);try{if(!data.items.length)await add();render();dialog.showModal();}catch(e){notify(e.message);}finally{setBusy(false,storageFailed?'Zestawy są dostępne w tej karcie. Pobierz PDF przed jej zamknięciem.':'');}}
 $('quote-save').onclick=save;$('quote-open').onclick=open;$('quote-review').onclick=()=>{render();dialog.showModal();};
 dialog.querySelector('.close').onclick=()=>dialog.close();dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
 $('quote-continue').onclick=()=>{dialog.close();host.scrollIntoView({block:'center',behavior:'instant'});notify('Zmień konfigurację i wybierz „Dodaj zestaw do PDF”.');};
 $('quote-project').oninput=e=>{data.title=quoteText(e.target.value,100);persist();};$('quote-notes').oninput=e=>{data.notes=quoteText(e.target.value,1000);persist();};
 $('quote-download').onclick=async()=>{
  if(busy||!data.items.length)return;setBusy(true,'Przygotowuję PDF…');
  try{
   const {generateQuotePdf}=await import('./quote-pdf.js?v=20260922-refine1'),snapshot=structuredClone(data),blob=await generateQuotePdf({...snapshot,baseUrl:new URL('.',location.href).href});
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='PRESCOT-zestawy-'+new Date().toISOString().slice(0,10)+'.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
   setBusy(false,'PDF jest gotowy. Możesz dołączyć go do wiadomości do handlowca.');
  }catch(e){setBusy(false,'Nie udało się pobrać PDF. Zapisane zestawy pozostały na liście. Spróbuj ponownie.');notify(e.message);}
 };
 render();return{open};
}
