const paint=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
export function createStudioFeedback(viewport){
 viewport.setAttribute('aria-busy','true');
 const overlay=document.getElementById('loading');overlay.className='studio-loading';overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');
 overlay.innerHTML='<div class="loading-content"><div class="loading-pattern" aria-hidden="true"><i></i><i></i><i></i></div><span>Przygotowuję studio światła…</span></div>';
 let count=0;
 const show=label=>{overlay.querySelector('span').textContent=label;overlay.hidden=false;viewport.setAttribute('aria-busy','true');};
 const hide=()=>{overlay.hidden=true;viewport.setAttribute('aria-busy','false');};
 return{show,hide,async run(task,label='Przygotowuję model…'){
  count++;show(label);await paint();
  try{return await task();}finally{if(!--count){await paint();if(!count)hide();}}
 },error(text){overlay.querySelector('.loading-pattern').hidden=true;overlay.querySelector('span').textContent=text;viewport.setAttribute('aria-busy','false');overlay.hidden=false;}};
}
