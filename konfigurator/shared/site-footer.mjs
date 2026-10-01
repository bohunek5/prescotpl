// The footer markup and stylesheet are rendered into every HTML page at build time.
// Native details handle mobile disclosure without JavaScript.
const observed = new WeakSet();
export function initializeSiteFooter() {
  const footer = document.querySelector('.pc-footer');
  if (!footer || observed.has(footer)) return;
  observed.add(footer);
  new IntersectionObserver(entries => {
    document.body.classList.toggle('pm-footer-visible', entries[0].isIntersecting);
  }, {threshold: .05}).observe(footer);
}
