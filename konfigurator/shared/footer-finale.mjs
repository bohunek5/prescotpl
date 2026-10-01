// The final product links belong to the same complete footer screen.
const footer=document.querySelector('footer.pc-footer[data-footer-finale]');
const ending=footer?.previousElementSibling;
if(ending?.matches('.oc-presentation-end'))footer.prepend(ending);
// Keep the quiet light cycle local to the signature and stop it off screen.
const finale = document.querySelector('.pc-footer-finale');
if (finale && 'IntersectionObserver' in window) {
  let visible = false;
  const update = () => finale.classList.toggle('is-lit', visible && !document.hidden);
  finale.classList.add('is-ready');
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  }, {threshold: 0.35}).observe(finale);
  document.addEventListener('visibilitychange', update);
}
