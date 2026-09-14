// Ordered across the printed face of the PCB, from its first outer pad.
// Product markings override family defaults; insulation colours are illustrative.
export function tapeTerminals(strip,state={}){
  const fallback={
    '3IN1':['+'+strip.voltage+'V','−L','−M','−H'],
    CCT:['+'+strip.voltage+'V','CW','WW'],
    RGBW:['W','R','G','B','+'+strip.voltage+'V'],
    RGBCCT:['+'+strip.voltage+'V','R','G','B','CW','WW'],
    'RGB+CCT':['+'+strip.voltage+'V','R','G','B','CW','WW']
  };
  const labels=strip.markings||fallback[strip.type]||['+'+strip.voltage+'V','−'];
  const selected=strip.modes?.[state.powerMode]?.terminal||({low:'−L',medium:'−M',high:'−H'}[state.powerMode||'high']);
  const span=strip.shape==='s'?1.55/strip.width:strip.type==='CCT'?.34:.36;
  return labels.map((label,index)=>{
    const plus=label.includes('+'),channel=plus?'V_plus':label.replace(/[−\-]/g,'').trim()||'V_minus';
    const color=plus?(['RGBW','RGBCCT','RGB+CCT'].includes(strip.type)?'#33383d':'#d52f27'):({R:'#bc3025',G:'#288b51',B:'#356dae',W:'#e1bd55',CW:'#d8dfe4',WW:'#b59444'}[channel]||'#292d31');
    // Every terminal retains its physical lead. Selecting L/M/H changes the
    // energized pair, never the number or position of wires in the model.
    return{index,label,channel,polarity:plus?'+':'−',color,z:(index/(labels.length-1)*2-1)*span*strip.width/1000,connected:true,active:strip.type!=='3IN1'||plus||label===selected};
  });
}
