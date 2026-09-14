import * as T from 'three';
import {sleeveSections} from './sleeve-sections.js?v=a9d8f23925dd';

export function sleeveDrawing(spec){return sleeveSections[spec?.id]||null;}
export function sectionShapes(regions){
  const path=(ring,hole=false)=>{const s=hole?new T.Path():new T.Shape();ring.forEach(([x,y],i)=>s[i?'lineTo':'moveTo'](x/1000,y/1000));s.closePath();return s;};
  return regions.map(p=>{const s=path(p.outline);s.holes=p.holes.map(h=>path(h,true));return s;});
}
export function sleeveIcon(spec){
  const drawing=sleeveDrawing(spec);if(!drawing)return '';
  const path=regions=>regions.map(p=>[p.outline,...p.holes].map(r=>r.map(([x,y],i)=>(i?'L':'M')+x+','+(-y)).join(' ')+'Z').join(' ')).join(' ');
  return `<svg class="sleeve-section-icon" viewBox="${-spec.width/2-1} ${-spec.height-1} ${spec.width+2} ${spec.height+2}" aria-hidden="true"><path class="sleeve-opaque" fill-rule="evenodd" d="${path(drawing.opaque)}"/><path class="sleeve-optical${spec.clear?' clear':''}" fill-rule="evenodd" d="${path(drawing.optical)}"/></svg>`;
}

// Shared contour keeps the WCOB end fittings flush with its 8 × 5 mm dome.
// Inputs may be millimetres or metres; the contour is scale independent.
export function coatingSection(w,h){
 const s=new T.Shape(),lower=h*.11;s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,lower);s.bezierCurveTo(w/2,h*.72,w*.28,h,0,h);s.bezierCurveTo(-w*.28,h,-w/2,h*.72,-w/2,lower);s.closePath();return s;
}
