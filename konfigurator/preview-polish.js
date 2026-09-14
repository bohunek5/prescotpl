import {profileIcon} from './profile-shapes.js?v=a9d8f23925dd';
import {previewLight} from './light-state.js?v=a9d8f23925dd';
import {uiIcon} from './ui-icons.js?v=a9d8f23925dd';

export function createPreviewPolish(){
 const viewport=document.getElementById('viewport'),actions=document.createElement('div');actions.className='viewport-actions';
 const section=document.createElement('div');section.id='live-section';section.setAttribute('role','img');
 const play=document.getElementById('mobile-assembly-play'),sleevePlay=document.createElement('button');
 sleevePlay.id='sleeve-play';sleevePlay.className='sleeve-play';sleevePlay.type='button';sleevePlay.hidden=true;
 actions.append(section,play,sleevePlay);viewport.append(actions);
 let key='';
 return{section,sleevePlay,update(state,spec){
  const show=state.housing==='profile'&&state.view==='assembly';section.hidden=!show;
  if(show){
   const next=spec.profile.id+'|'+spec.cover.id;
   if(key!==next){key=next;section.innerHTML=profileIcon(spec.profile,spec.cover,'live')+'<span><small>Przekrój</small><strong></strong></span>';section.querySelector('strong').textContent=spec.profile.name;section.setAttribute('aria-label','Przekrój '+spec.profile.name+' z osłoną '+spec.cover.name);}
   const light=previewLight(state),kelvin=spec.strip.type==='CCT'?state.cct:spec.strip.cct;
   section.style.setProperty('--profile-light',spec.strip.type==='RGBW'&&state.rgbMode!=='white'?state.rgbColor:kelvin>=5000?'#d9eaff':kelvin>=3900?'#fff2d8':'#ffd49d');
   section.style.setProperty('--section-level',light.on?String(light.brightness/100*spec.cover.transmission):'0');
   section.dataset.finish=state.finish;
  }
  sleevePlay.hidden=!(spec.sleeve&&state.view==='macro'&&state.detail==='sleeve');
  actions.hidden=!show&&sleevePlay.hidden;
  for(const button of document.querySelectorAll('button[data-light-study]')){
   button.classList.add('theme-switch');button.setAttribute('aria-label',state.lightStudy?'Włącz tryb dzienny':'Włącz tryb nocny');
   if(!button.querySelector('.theme-track'))button.innerHTML=`<span class="theme-track" aria-hidden="true">${uiIcon('sun')}${uiIcon('moon')}<i></i></span><span class="theme-label"></span>`;
   button.querySelector('.theme-label').textContent=state.lightStudy?'Noc':'Dzień';
  }
 }};
}
