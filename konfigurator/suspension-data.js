import {salesRegistry} from './profile-library.js?v=130bc2896fcd';

// Dimensions from the FI-8-LIN-MR / FI-8-LIN-ZM product drawings.
// Other hangers need their own reviewed geometry before joining this view.
export function suspensionFor(profile,finish='silver'){
 const suffix=finish==='black'?'L07':finish==='white'?'L10':'N00';
 const options=salesRegistry[profile.ref]?.accessories||[];
 const item=options.find(a=>/^C281(72|70)/.test(a.ref)&&a.ref.endsWith(suffix))||options.find(a=>/^C281(72|70)N00$/.test(a.ref));
 if(!item)return null;
 return {...item,diameter:8,baseDiameter:item.ref.startsWith('C28172')?10:8,height:item.ref.startsWith('C28172')?16.2:16.6,wireDiameter:1,wireRef:'C24522N00'};
}
