// The loop renders only while moving. End-point pauses use a timer, so the
// renderer can settle; pause retains the exact opening for a smooth resume.
export function createZonePlayback({getOpening,onOpening,onEndpoint,onChange,reducedMotion,
  frame=callback=>requestAnimationFrame(callback),cancel=id=>cancelAnimationFrame(id),
  later=(callback,ms)=>setTimeout(callback,ms),clear=id=>clearTimeout(id),now=()=>performance.now()}){
  let playing=false,opening=null,target=0,raf=0,timer=0;
  const clearWork=()=>{cancel(raf);clear(timer);raf=timer=0;};
  function move(to){
    target=to;const from=opening??getOpening(),start=now(),duration=Math.max(1,1100*Math.abs(to-from));
    const tick=t=>{
      if(!playing)return;const f=Math.min(1,(t-start)/duration),ease=f*f*(3-2*f);
      opening=from+(to-from)*ease;onOpening(opening);
      if(f<1)raf=frame(tick);else{raf=0;onEndpoint(to);timer=later(()=>{timer=0;if(playing)move(1-to);},1400);}
    };
    raf=frame(tick);
  }
  function pause(){playing=false;clearWork();onChange();}
  return{
    get playing(){return playing;},get opening(){return opening;},
    play(){
      if(playing)return;
      if(reducedMotion()){opening=getOpening()>.5?0:1;onOpening(opening);onEndpoint(opening);onChange();return;}
      const resume=opening!==null&&opening>0&&opening<1;
      playing=true;onChange();move(resume?target:(opening??getOpening())>.5?0:1);
    },pause,
    reset(){playing=false;clearWork();opening=null;onChange();}
  };
}
