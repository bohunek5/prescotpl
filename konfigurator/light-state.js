// Keep the requested brightness separate from the limit switch's output.
// Closing a drawer must not erase the level to restore when it opens again.
export const hasDoorSwitch=zone=>['cabinet','drawer'].includes(zone);
export function previewLight(state,opening=state.zoneOpen?1:0){
  const automatic=state.view==='zone'&&hasDoorSwitch(state.zone)&&state.zoneTrigger==='door';
  const blocked=automatic&&opening<=.07;
  const brightness=state.light&&!blocked?Math.max(0,Math.min(100,state.dimmer)):0;
  return {on:brightness>0,brightness,automatic,blocked};
}
// The three wiring modes have separate manufacturer luminous-flux values.
// Use the same ratio for emitters, diffuser and silicone, not only the PCB.
export function stripOutputScale(strip,state){
  return strip.modes?.[state.powerMode]?.lumens/strip.lumens||1;
}
