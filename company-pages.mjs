const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const observer=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(isIntersecting){target.classList.add('pcs-visible');observer.unobserve(target);}}),{threshold:.08});
document.querySelectorAll('.pc-step').forEach(section=>{section.classList.add('pcs-reveal');observer.observe(section);});
const video=document.querySelector('.pc-hero video');
const playback=()=>{if(!video)return;if(reduced.matches||document.hidden)video.pause();else video.play().catch(()=>{});};
reduced.addEventListener('change',playback);document.addEventListener('visibilitychange',playback);playback();
