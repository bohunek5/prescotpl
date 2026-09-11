import {initializeBrandFooter} from './brand-footer.mjs?v=20260911-glass5';
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
  // These two tiles previously reused a generic strip photograph.
  const categoryPhotos = {'Profile LED':'assets/offer/klus-profile.webp','Akcesoria LED':'wp-content/uploads/2026/03/nowe-zlaczki_27.webp'};
  document.querySelectorAll('.as-side-slider img, .dm-card-slider img').forEach(image => {
    const replacement = categoryPhotos[image.alt];
    if (replacement) { image.src = asset(replacement); image.setAttribute('data-src',asset(replacement)); }
  });
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
    cards.forEach((card, i) => { card.inert = i !== active; card.classList.toggle('pm-selected', i === active); });
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
  // Rotate the brand-shaped aperture, not the footage. Counter-rotation keeps
  // the film plane level and stationary behind the original SVG silhouette.
  const filmPlane = element('div', 'pm-film-plane');
  filmPlane.append(...grid.children);
  grid.append(filmPlane);
  grid.classList.add('pm-brand-mask');
  grid.setAttribute('aria-hidden', 'true');
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
    // Clear the brand silhouette before the following introduction reaches it.
    // Measure the real next section, not the bottom of the taller sticky track.
    const nextTop = section.nextElementSibling?.getBoundingClientRect().top ?? rect.bottom;
    const fade = clamp((innerHeight * 1.18 - nextTop) / (innerHeight * .33));
    const angle = reduced() ? 0 : progress * 150;
    grid.style.transform = `rotate(${angle}deg)`;
    filmPlane.style.transform = `rotate(${-angle}deg)`;
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

function initializeStartVideo() {
  const hero = document.querySelector('.elementor-element-216d8696');
  const video = hero?.querySelector('video');
  if (!video) return;
  // The referenced PrescotLED page supplies one landscape START.mov, not a
  // separate phone film. Use our existing MP4 copy with a centred cover crop.
  const source = asset('wp-content/uploads/2026/01/START.mp4');
  const settings = JSON.parse(hero.dataset.settings || '{}');
  settings.background_video_link = source;
  hero.dataset.settings = JSON.stringify(settings);
  if (window.jQuery) window.jQuery(hero).data('settings', settings);
  video.poster = asset('wp-content/uploads/2026/01/FirmaPRESCOTLED.webp');
  video.muted = true;
  video.playsInline = true;
  if (video.currentSrc !== source) video.src = source;
  if (!reduced()) video.play().catch(() => {});
  video.addEventListener('playing', () => hero.classList.add('pm-video-playing'));
}

function initializeHeroLayout() {
  const hero = document.querySelector('.elementor-element-216d8696');
  const capabilities = hero?.querySelector('.elementor-element-a848c53');
  if (capabilities) {
    const badges = [...capabilities.querySelectorAll('.elementor-widget-icon-box')];
    capabilities.classList.add('pm-capabilities');
    capabilities.replaceChildren(...badges);
    const icons = [
      ['Linia produkcyjna SMT', '<path d="M3 17h18v4H3zM6 17v-4h12v4M9 3h6v7H9zM12 10v3M6 5h3M15 5h3"/><circle cx="7" cy="19" r=".5"/><circle cx="17" cy="19" r=".5"/>'],
      ['Laboratorium pomiarowe', '<path d="M8 3h8M10 3v7l-6 9a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-9V3M8 15h8M11 17h2"/>']
    ];
    for (const [title, path] of icons) {
      const badge = element('div', 'elementor-widget-icon-box pm-capability');
      const wrapper = element('div', 'elementor-icon-box-wrapper');
      const icon = element('span', 'elementor-icon');
      icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
      wrapper.append(icon, element('h3', 'elementor-icon-box-title', title));
      badge.append(wrapper); capabilities.append(badge);
    }
    const caption = hero.querySelector('.elementor-element-ea903c0');
    if (caption) { caption.classList.add('pm-entrance-caption'); hero.append(caption); }
  }
  document.querySelectorAll('.elementor-element-280b012, .elementor-element-629d57a0').forEach(hero => {
    hero.classList.add('pm-production-hero');
    const heading = hero.querySelector('h2');
    if (!heading) return;
    const caption = element('div', 'pm-entrance-caption pm-production-caption');
    heading.replaceChildren(document.createTextNode('Polska produkcja'), element('br','pm-mobile-break'), document.createTextNode(' to sprawdzona '), element('span','pm-brand-accent','jakość'));
    caption.append(heading, element('p','pm-production-invite','Zobacz, jak to się kręci'));
    hero.append(caption);
  });
}

function initializeShowcases() {
  const slides = document.querySelectorAll('.distSlide');
  if (!slides.length) return;
  // Native observation never resets scroll position when phone browser chrome resizes.
  const observer = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => {
    target.classList.toggle('is-active',isIntersecting);
    if (isIntersecting) {
      target.classList.add('pm-revealed');
      const wrap = target.closest('.distWrap');
      if (wrap && target.dataset.bg) wrap.style.background = target.dataset.bg;
    }
  }), {rootMargin:'0px 0px -8% 0px', threshold:.08});
  slides.forEach(slide => { slide.classList.add('pm-reveal-ready'); observer.observe(slide); });
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
  const cards = [...document.querySelectorAll('.mdw-card-portfolio')];
  cards.forEach(card => {
    const stage = card.querySelector(':scope > .e-con-inner');
    if (!stage || stage.querySelector('.pm-series-copy')) return;
    const copy = element('div', 'pm-series-copy');
    const visuals = element('div', 'pm-series-visuals');
    [...stage.children].forEach(child => {
      if (child.matches('.mdw-card-portfolio-image-left, .mdw-card-portfolio-image-right')) visuals.append(child);
      else copy.append(child);
    });
    stage.append(visuals, copy);
    card.classList.add('pm-series-showcase');
  });
  let frame = 0;
  const update = () => {
    frame = 0;
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const progress = reduced() ? 1 : clamp((innerHeight * .8 - rect.top) / (innerHeight * .8));
      card.style.setProperty('--pm-series-progress', progress.toFixed(4));
    });
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule, {passive:true});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', schedule);
  update();
}

function initializeMobileMenu() {
  const dock = document.querySelector('.prescot-dock');
  if (!dock || dock.querySelector('.pm-more')) return;
  const links = [...dock.querySelectorAll('a.dock-item')];
  const labels = ['Start', 'Oferta', 'Taśmy', 'Produkcja', 'Dystrybucja'];
  links.forEach((link, i) => {
    if (i < 5) link.append(element('span', 'pm-dock-label', labels[i]));
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
  [links[7], links[5], links[6]].filter(Boolean).forEach(original => {
    const link = element('a'); link.href = original.href;
    const icon = original.querySelector('svg'); if (icon) link.append(icon.cloneNode(true));
    link.append(element('span', '', original.dataset.tooltip || original.getAttribute('aria-label')));
    link.onclick = event => { event.preventDefault(); dialog.close(); original.click(); };
    nav.append(link);
  });
  const b2b = element('a'); b2b.href = 'https://prescot.abstore.pl/';
  const shopIcon = links[6]?.querySelector('svg');
  if (shopIcon) b2b.append(shopIcon.cloneNode(true));
  b2b.append(element('span', '', 'Sklep B2B · WAPRO'));
  nav.append(b2b);
  dialog.append(header, nav); document.body.append(dialog);
  more.onclick = () => { dialog.showModal(); more.setAttribute('aria-expanded', 'true'); };
  close.onclick = () => dialog.close();
  dialog.addEventListener('close', () => { more.setAttribute('aria-expanded', 'false'); more.focus({preventScroll:true}); });
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }});
  dock.insertBefore(more, dock.querySelector('.dock-lang-item'));
  const language = dock.querySelector('.dock-lang-item');
  const mobile = matchMedia('(max-width:767px)');
  const positionLanguage = () => {
    if (!language) return;
    if (mobile.matches) header.insertBefore(language, close);
    else dock.append(language);
  };
  mobile.addEventListener('change',positionLanguage); positionLanguage();
}

export function initializeExperience() {
  initializeCatalog(); initializeProduction(); initializeStartVideo(); initializeHeroLayout(); initializeShowcases(); initializeSeries(); initializeMobileMenu(); initializeBrandFooter();
  window.dispatchEvent(new Event('prescot-layout-updated'));
}
