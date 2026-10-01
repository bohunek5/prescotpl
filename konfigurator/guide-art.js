import {createStudio} from './scene.js?v=20260922-refine1';

export function guideArt() {
  return '<div class="guide-art"><div class="guide-model" aria-hidden="true"></div><div class="guide-art-legend"><span data-guide-model-name>Twój zestaw</span><span>Model 3D</span></div></div>';
}

// The tutorial renders the exact same geometry and materials as the main studio.
// A private state copy keeps the visitor's project and PDF list unchanged.
export function createGuideArt(getState,getSpec){
  let studio=null,studioHost=null,frame=0,generation=0,pending=Promise.resolve();
  function destroy(created,host){
    const canvas=host?.querySelector('canvas');
    created?.dispose();
    // dispose() releases Three resources; explicitly release this auxiliary
    // context as well, so rapid visits cannot evict the customer's main view.
    canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
  }
  function dispose(){generation++;cancelAnimationFrame(frame);frame=0;if(studio)destroy(studio,studioHost);studio=null;studioHost=null;}
  async function show(container,kind){
    dispose();const version=generation,host=container.querySelector('.guide-model');if(!host)return;
    const state={...getState()},spec=getSpec(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const assembled=['light','quote'].includes(kind),macro=state.housing==='sleeve';
    const amount=spec.assemblyBlocked?100:assembled?0:kind==='cover'?42:kind==='strip'?68:100;
    const preview={...state,view:macro?'macro':'assembly',detail:macro?'sleeve':state.detail,assemblyAngle:'perspective',productScale:'detail',exploded:amount,light:assembled&&state.light,lightStudy:false};
    container.querySelector('[data-guide-model-name]').textContent=macro?spec.sleeve.name:spec.profile.name+' · '+spec.strip.name;
    // Only the latest requested step may allocate a context. An in-flight
    // build finishes and is disposed before a newer build starts.
    const render=async()=>{
    if(version!==generation||!host.isConnected)return;
    try{
      const created=await createStudio(host,preview);
      if(version!==generation||!host.isConnected){destroy(created,host);return;}
      studio=created;studioHost=host;host.dataset.ready='true';
      if(!reduced&&!spec.assemblyBlocked&&!macro&&['intro','assembly','cover','strip','accessories'].includes(kind)){
        const start=performance.now();
        const tick=time=>{if(version!==generation||!host.isConnected||document.hidden)return;const t=Math.min(1,(time-start)/4500),ease=t*t*(3-2*t);studio.setAssembly(amount*(1-ease));if(t<1)frame=requestAnimationFrame(tick);else frame=0;};
        frame=requestAnimationFrame(tick);
      }
    }catch{if(version===generation){host.hidden=true;container.querySelector('.guide-art-legend span:last-child').textContent='Podgląd w oknie konfiguratora';}}
    };
    pending=pending.then(render,render);
    return pending;
  }
  return {show,dispose};
}
