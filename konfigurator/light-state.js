// Keep the requested brightness separate from the limit switch's output.
// Closing a drawer must not erase the level to restore when it opens again.
export const hasDoorSwitch=zone=>['cabinet','drawer'].includes(zone);
export function previewLight(state,opening=state.zoneOpen?1:0){
  const automatic=state.view==='zone'&&hasDoorSwitch(state.zone)&&state.zoneTrigger==='door';
  const blocked=automatic&&opening<=.07;
  const brightness=state.stripEnabled!==false&&state.light&&!blocked?Math.max(0,Math.min(100,state.dimmer)):0;
  return {on:brightness>0,brightness,automatic,blocked};
}
// The three wiring modes have separate manufacturer luminous-flux values.
// Use the same ratio for emitters, diffuser and silicone, not only the PCB.
export function stripOutputScale(strip,state){
  return strip.modes?.[state.powerMode]?.lumens/strip.lumens||1;
}
// One display reference across white strips, matching the zone lights' lm/m
// scaling. Otherwise Low Brightness 320 lm/m looked identical to 1000 lm/m.
// RGB channel flux is not provided by the white-channel catalogue value.
export function stripPreviewScale(strip,state){
  if(state.stripEnabled===false)return 0;
  if(strip.type==='RGBW'&&state.rgbMode!=='white')return stripOutputScale(strip,state);
  const flux=strip.type==='RGBW'&&state.rgbMode==='white'?(strip.whiteLumens??strip.lumens):(strip.modes?.[state.powerMode]?.lumens??strip.lumens);
  return Number.isFinite(flux)&&flux>=0?flux/1000:1;
}
