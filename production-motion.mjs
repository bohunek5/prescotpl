const asset = path => new URL(path, import.meta.url).href;
const clamp = n => Math.max(0,Math.min(1,n));
const clips = [
  [21.8,19.5,226.7,106.4,'tasma-leci-sobie_compressed.webm'],
  [21.8,233.9,207.5,102.4,'maszyna1_compressed.webm'],
  [21.8,458.5,226.7,108.7,'lutowanie_compressed.webm'],
  [339,233.5,174.2,102.8,'nagrzewanie_compressed.webm'],
  [339,19.5,485.8,547.7,'rekamp4_compressed.webm']
];

export function initializeProductionMotion(track, stage, grid) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  grid.querySelectorAll('video').forEach(video=>{video.pause();video.removeAttribute('src');video.querySelectorAll('source').forEach(source=>source.remove());video.load();});
  grid.replaceChildren();
  grid.classList.add('pm-five-films','pm-brand-mask');
  const videos = clips.map(([x,y,w,h,file],index)=>{
    const piece=document.createElement('div');piece.className='pm-film-piece'+(index===4?' pm-film-curve':'');
    piece.style.cssText=`left:${x/841.9*100}%;top:${y/595.3*100}%;width:${w/841.9*100}%;height:${h/595.3*100}%;`;
    const plane=document.createElement('div');plane.className='pm-piece-plane';
    const video=document.createElement('video');
    video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='none';
    video.setAttribute('muted','');video.setAttribute('playsinline','');
    video.dataset.clip=asset(`wp-content/uploads/2026/02/${file}`);
    plane.append(video);piece.append(plane);grid.append(piece);return video;
  });
  let inView=false,frame=0;
  const playback=()=>videos.forEach(video=>{
    if(inView&&!document.hidden&&grid.style.visibility!=='hidden'){
      if(!video.currentSrc&&!video.getAttribute('src')) {video.preload='auto';video.src=video.dataset.clip;}
      if(reduced.matches)video.pause();
      else if(video.paused)video.play().catch(()=>{});
    } else video.pause();
  });
  const update=()=>{
    frame=0;
    const rect=track.getBoundingClientRect();
    const raw=clamp(-rect.top/Math.max(1,track.offsetHeight-stage.offsetHeight));
    const progress=raw>.995?1:raw;
    const angle=reduced.matches?0:720*clamp(progress/.84);
    const scale=reduced.matches?1:1+1.2*progress;
    const fade=reduced.matches?clamp((progress-.85)/.15):clamp((progress-.86)/.14);
    grid.style.setProperty('--pm-turn',`${angle}deg`);
    grid.style.setProperty('--pm-counter-turn',`${-angle}deg`);
    grid.style.setProperty('--pm-zoom',scale);
    grid.style.transform=`rotate(${angle}deg) scale(${scale})`;
    grid.style.opacity=String(1-fade);grid.style.visibility=fade===1?'hidden':'visible';
    stage.setAttribute('aria-hidden',String(fade===1));
    track.dataset.progress=progress.toFixed(4);track.dataset.turn=String(angle);track.dataset.zoom=String(scale);
    playback();
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  document.addEventListener('visibilitychange',playback);reduced.addEventListener('change',schedule);
  new ResizeObserver(schedule).observe(track);
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;playback();},{rootMargin:'120px'}).observe(stage);
  update();
}

export function initializeProductionHero() {
  const heroes=[...document.querySelectorAll('[data-pm-production-hero]')];
  if(!heroes.length)return;
  const mobile=matchMedia('(max-width:767px)');
  const visible=new Set();
  const update=()=>heroes.forEach(hero=>{
    const video=hero.querySelector('video');if(!video)return;
    const active=(hero.dataset.pmProductionHero==='mobile')===mobile.matches;
    if(active&&!document.hidden&&visible.has(hero)) {
      if(!video.currentSrc&&!video.getAttribute('src'))video.src=asset(`assets/production/hero-${mobile.matches?'mobile':'desktop'}.mp4`);
      video.muted=true;video.playsInline=true;video.loop=true;
      if(video.paused)video.play().catch(()=>{});
    } else video.pause();
  });
  const observer=new IntersectionObserver(entries=>{entries.forEach(e=>e.isIntersecting?visible.add(e.target):visible.delete(e.target));update();},{threshold:.01});
  heroes.forEach(hero=>observer.observe(hero));mobile.addEventListener('change',update);document.addEventListener('visibilitychange',update);
}
