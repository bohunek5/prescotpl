const asset = value => new URL(value.replace(/^\//, ''), import.meta.url).href;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = n => Math.max(0, Math.min(1, n));
const element = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text) node.textContent = text;
  return node;
};

function initializeCatalog() {
  const slider = document.querySelector('.as-slider');
  if (!slider || document.querySelector('.pm-catalog')) return;
  const titles = [...slider.querySelectorAll('.as-changing-widget h2')];
  const descriptions = [...slider.querySelectorAll('.as-changing-widget p')];
  const links = [...slider.querySelectorAll('.as-changing-widget a.elementor-button')];
  const images = [...slider.querySelectorAll('.as-side-slider .swiper-slide:not(.swiper-slide-duplicate) img')];
  if (!titles.length || titles.length !== links.length || titles.length !== images.length) return;
  const models = titles.map((title, i) => ({
    title: title.innerHTML.replace(/<br\s*\/?>(\s*)/gi, ' ').replace(/<[^>]+>/g, '').trim(),
    description: descriptions[i]?.textContent.trim() || '',
    href: links[i].href,
    image: asset(images[i].getAttribute('data-src') || images[i].getAttribute('src')),
    alt: images[i].alt
  }));
  const tapes = models.length > 10;
  const catalog = element('div', 'pm-catalog');
  const hero = element('section', 'pm-catalog-hero');
  hero.setAttribute('aria-label', tapes ? 'Serie taśm LED' : 'Oferta Prescot LED');
  const track = element('div', 'pm-feature-track');
  track.setAttribute('aria-roledescription', 'karuzela');
  const cards = models.map((model, i) => {
    const card = element('article', 'pm-feature');
    card.setAttribute('aria-label', `${i + 1} z ${models.length}: ${model.title}`);
    const image = element('img', 'pm-feature-photo');
    image.src = model.image; image.alt = model.alt; image.loading = i ? 'lazy' : 'eager';
    const copy = element('div', 'pm-feature-copy');
    copy.append(element('p', 'pm-kicker', tapes ? 'Taśmy LED · Prescot' : 'Oferta · Prescot LED'));
    copy.append(element('h2', '', model.title));
    // Full existing descriptions remain in the collection below.
    copy.append(element('p', 'pm-feature-summary', model.description.split(/(?<=[.!?])\s+/)[0]));
    const cta = element('a', 'pm-cta', tapes ? 'Poznaj serię' : 'Zobacz produkty');
    cta.href = model.href;
    copy.append(cta); card.append(image, copy); track.append(card);
    return card;
  });
  const controls = element('div', 'pm-feature-controls');
  const previous = element('button', '', '←'), next = element('button', '', '→');
  previous.type = next.type = 'button';
  previous.setAttribute('aria-label', 'Poprzedni model'); next.setAttribute('aria-label', 'Następny model');
  const counter = element('output', 'pm-feature-counter');
  counter.setAttribute('aria-live', 'polite');
  controls.append(previous, counter, next);
  hero.append(track, controls);
  const collection = element('section', 'pm-collection');
  collection.id = 'prescot-kolekcja';
  collection.append(element('p', 'pm-kicker', tapes ? `${models.length} serii` : `${models.length} kategorii`));
  collection.append(element('h2', '', tapes ? 'Wybierz swoją serię' : 'Znajdź to, czego potrzebujesz'));
  const list = element('div', 'pm-model-list');
  models.forEach(model => {
    const link = element('a', 'pm-model'); link.href = model.href;
    const image = element('img'); image.src = model.image; image.alt = ''; image.loading = 'lazy';
    const text = element('div', 'pm-model-copy');
    text.append(element('h3', '', model.title), element('p', '', model.description));
    const arrow = element('span', 'pm-model-arrow', '↗'); arrow.setAttribute('aria-hidden', 'true');
    link.append(image, text, arrow); list.append(link);
  });
  collection.append(list); catalog.append(hero, collection);
  const root = slider.closest('[data-elementor-type="wp-page"]');
  if (!root) return;
  root.prepend(catalog);
  document.body.classList.add('prescot-mobile-catalog');
  let active = 0, frame = 0;
  const update = () => {
    frame = 0;
    if (!track.clientWidth) return;
    active = Math.max(0, Math.min(models.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
    counter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(models.length).padStart(2, '0')}`;
    cards.forEach((card, i) => { card.inert = i !== active; });
  };
  const select = index => {
    const i = (index + models.length) % models.length;
    track.scrollTo({left: i * track.clientWidth, behavior: reduced() ? 'instant' : 'smooth'});
  };
  previous.onclick = () => select(active - 1); next.onclick = () => select(active + 1);
  track.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, {passive: true});
  hero.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); select(active + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  new ResizeObserver(() => { track.scrollTo({left: active * track.clientWidth, behavior: 'instant'}); update(); }).observe(track);
  update();
}

function initializeProduction() {
  const track = document.querySelector('.scroll-track');
  const stage = track?.querySelector('.scroll-div'), grid = track?.querySelector('.grid');
  if (!stage || !grid) return;
  document.body.classList.add('prescot-production');
  const section = track.closest('.e-parent');
  section.classList.add('prescot-production-motion');
  for (let sibling = section.nextElementSibling; sibling; sibling = sibling.nextElementSibling) {
    if (sibling.matches('.e-con')) {
      sibling.classList.add('prescot-process-step');
      if (sibling.querySelectorAll('h2').length > 1) {
        sibling.classList.add('prescot-process-story');
        [...sibling.children].filter(e=>e.matches('.e-con')).forEach(child => {
          child.classList.add(child.querySelector('h2,p') ? 'prescot-process-copy' : 'prescot-process-photo');
        });
      }
    }
  }
  let frame = 0;
  function update() {
    frame = 0;
    const rect = track.getBoundingClientRect();
    const progress = clamp(-rect.top / Math.max(1, track.offsetHeight - stage.offsetHeight * .25));
    // Fade only while the next block is entering the viewport. Fading at the
    // end of the sticky interval left a whole empty viewport before that block.
    const fade = clamp((stage.offsetHeight - rect.bottom) / (stage.offsetHeight * .7));
    grid.style.transform = reduced() ? 'none' : `rotate(${-24 + progress * 174}deg) scale(${.9 - fade * .4})`;
    grid.style.opacity = String(1 - fade);
    grid.style.visibility = fade >= 1 ? 'hidden' : 'visible';
    stage.setAttribute('aria-hidden', String(fade >= 1));
    track.dataset.progress = progress.toFixed(3);
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule, {passive: true});
  new ResizeObserver(schedule).observe(track);
  const visibility = new IntersectionObserver(entries => entries.forEach(({isIntersecting}) => {
    grid.querySelectorAll('video').forEach(video => {
      if (isIntersecting && !reduced()) video.play().catch(() => {});
      else video.pause();
    });
  }));
  visibility.observe(stage); update();
}

function initializeSeries() {
  if (!['powers', 'controllers'].includes(document.body.dataset.prescotPage)) return;
  document.body.classList.add('prescot-series-page');
  // The original absolute /assets URL broke the GitHub Pages subdirectory.
  const hero = document.querySelector('.elementor-element-19d3d39b');
  const folder = document.body.dataset.prescotPage === 'powers' ? 'assets/prmad/pr-mad-kitchen-hero.webp' : 'assets/controllers/controller-living-room-hero-v2.webp';
  if (hero) {
    hero.style.setProperty('background-image', `linear-gradient(0deg, #070b13cf, #070b1333), url("${asset(folder)}")`, 'important');
  }
}

function initializeMobileMenu() {
  const dock = document.querySelector('.prescot-dock');
  if (!dock || dock.querySelector('.pm-more')) return;
  const links = [...dock.querySelectorAll('a.dock-item')];
  const labels = ['Start', 'Oferta', 'Taśmy', 'Produkcja'];
  links.forEach((link, i) => {
    if (i < 4) link.append(element('span', 'pm-dock-label', labels[i]));
    else link.dataset.pmSecondary = 'true';
  });
  const more = element('button', 'pm-more'); more.type = 'button';
  more.append(element('span', '', '···'), element('span', 'pm-dock-label', 'Więcej'));
  more.setAttribute('aria-label', 'Więcej stron'); more.setAttribute('aria-haspopup', 'dialog');
  more.setAttribute('aria-expanded', 'false');
  const dialog = element('dialog', 'pm-menu'); dialog.setAttribute('aria-label', 'Menu Prescot');
  const header = element('header');
  const close = element('button', '', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Zamknij menu');
  header.append(element('h2', '', 'Prescot'), close);
  const nav = element('nav');
  links.slice(4).forEach(original => {
    const link = element('a'); link.href = original.href;
    const icon = original.querySelector('svg'); if (icon) link.append(icon.cloneNode(true));
    link.append(element('span', '', original.dataset.tooltip || original.getAttribute('aria-label')));
    link.onclick = event => { event.preventDefault(); dialog.close(); original.click(); };
    nav.append(link);
  });
  dialog.append(header, nav); document.body.append(dialog);
  more.onclick = () => { dialog.showModal(); more.setAttribute('aria-expanded', 'true'); };
  close.onclick = () => dialog.close();
  dialog.addEventListener('close', () => { more.setAttribute('aria-expanded', 'false'); more.focus(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }});
  dock.insertBefore(more, dock.querySelector('.dock-lang-item'));
}

export function initializeExperience() {
  initializeCatalog(); initializeProduction(); initializeSeries(); initializeMobileMenu();
  window.dispatchEvent(new Event('prescot-layout-updated'));
}
