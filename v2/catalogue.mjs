const nav=document.querySelector('.v-model-nav');
if(nav){
 const tabs=[...nav.querySelectorAll('[data-model-select]')];
 const panels=[...document.querySelectorAll('[data-model]')];
 nav.setAttribute('role','tablist');
 function select(key,focus=false){
  tabs.forEach(tab=>{const active=tab.dataset.modelSelect===key;tab.classList.toggle('is-active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus){tab.focus({preventScroll:true});const x=tab.offsetLeft-nav.offsetLeft-(nav.clientWidth-tab.offsetWidth)/2;nav.scrollTo({left:x,behavior:'instant'});}});
  panels.forEach(panel=>{panel.hidden=panel.dataset.model!==key;});
 }
 tabs.forEach((tab,index)=>{
  tab.setAttribute('role','tab');tab.setAttribute('aria-controls',`model-${tab.dataset.modelSelect}`);
  tab.addEventListener('click',e=>{e.preventDefault();select(tab.dataset.modelSelect);});
  tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(index+1)%tabs.length;if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();select(tabs[next].dataset.modelSelect,true);}});
 });
 panels.forEach(panel=>{panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',`tab-${panel.dataset.model}`);});
 const initial=location.hash.replace('#model-','');
 select(tabs.some(t=>t.dataset.modelSelect===initial)?initial:tabs[0].dataset.modelSelect);
}
document.querySelectorAll('.v-gallery-toggle').forEach(button=>button.addEventListener('click',()=>{
 const image=button.closest('.v-model-visual').querySelector('img');
 const detail=button.getAttribute('aria-pressed')!=='true';
 image.src=detail?button.dataset.detail:button.dataset.primary;
 button.setAttribute('aria-pressed',String(detail));
 button.firstChild.textContent=detail?'Główne zdjęcie ':'Drugie zdjęcie ';
}));
const dialog=document.querySelector('.v-video-dialog');
if(dialog){
 const video=dialog.querySelector('video');let opener;
 document.querySelectorAll('[data-video]').forEach(button=>button.addEventListener('click',()=>{
  opener=button;dialog.querySelector('h2').textContent=button.dataset.videoTitle;video.src=button.dataset.video;dialog.showModal();video.play().catch(()=>{});
 }));
 dialog.querySelector('.v-close-video').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{video.pause();video.removeAttribute('src');video.load();opener?.focus({preventScroll:true});});
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
}
