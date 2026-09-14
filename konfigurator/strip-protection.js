// Factory protection is part of the strip, not an additional PRO sleeve.
export function factorySilicone(t){
 if(t.encapsulation==='coating')return{id:'wcob-8x5',technology:'WCOB',width:t.envelopeWidth??t.width,height:t.envelopeHeight??5,clear:false,shape:'coating',pcbLift:0,wireHeight:2};
 if(t.encapsulation==='tube')return{width:t.width+2,height:4,clear:true,shape:'basic',pcbLift:.8};
 return null;
}
export function hasAdhesiveBacking(t,sleeve=null){return !sleeve&&(!t.encapsulation||t.technology==='WCOB');}
