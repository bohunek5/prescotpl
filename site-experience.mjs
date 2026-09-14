import {initializeMobileMenu} from './mobile-navigation.mjs?v=20260914-polish2';
import {initializeBrandFooter} from './brand-footer.mjs?v=20260913-studio4';
import {initializeProductionMotion, initializeProductionHero} from './production-motion.mjs?v=20260911-motion7';
import {initializeMobileRefinement} from './mobile-refinement.mjs?v=20260914-polish2';
const asset = value => new URL(value.replace(/^\//, ''), import.meta.url).href;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = n => Math.max(0, Math.min(1, n));
const element = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text) node.textContent = text;
  return node;
};

export function initializeCatalog(doc = document, {interactive = true} = {}) {
  const slider = doc.querySelector('.as-slider');
  if (!slider) return;
  // These two tiles previously reused a generic strip photograph.
  const categoryPhotos = {'Profile LED':'assets/offer/klus-profile.webp','Akcesoria LED':'wp-content/uploads/2026/03/nowe-zlaczki_27.webp'};
  doc.querySelectorAll('.as-side-slider img, .dm-card-slider img').forEach(image => {
    const replacement = categoryPhotos[image.alt];
    if (replacement) { image.src = asset(replacement); image.setAttribute('data-src',asset(replacement)); }
  });
  const existing = doc.querySelector('.pm-catalog');
  if (existing) { if (interactive) initializeCatalogControls(existing); return; }
  const titles = [...slider.querySelectorAll('.as-changing-widget h2')];
  const descriptions = [...slider.querySelectorAll('.as-changing-widget p')];
  const links = [...slider.querySelectorAll('.as-changing-widget a.elementor-button')];
  const images = [...slider.querySelectorAll('.as-side-slider .swiper-slide:not(.swiper-slide-duplicate) img')].filter(image => !image.closest('noscript'));
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
  doc.body.classList.add('prescot-mobile-catalog');
  counter.textContent = `01 / ${String(models.length).padStart(2, '0')}`;
  cards.forEach((card, i) => { card.inert = i !== 0; card.classList.toggle('pm-selected', i === 0); });
  if (interactive) initializeCatalogControls(catalog);
}

function initializeCatalogControls(catalog) {
  if (catalog.dataset.pmControlsReady) return;
  catalog.dataset.pmControlsReady = 'true';
  const hero = catalog.querySelector('.pm-catalog-hero'), track = catalog.querySelector('.pm-feature-track');
  const cards = [...catalog.querySelectorAll('.pm-feature')];
  const counter = catalog.querySelector('.pm-feature-counter');
  const [previous, next] = catalog.querySelectorAll('.pm-feature-controls button');
  let active = 0, frame = 0;
  const update = () => {
    frame = 0;
    if (!track.clientWidth) return;
    active = Math.max(0, Math.min(cards.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
    counter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
    cards.forEach((card, i) => { card.inert = i !== active; card.classList.toggle('pm-selected', i === active); });
  };
  const select = index => {
    const i = (index + cards.length) % cards.length;
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
  // Each of the five original SVG components owns a different film.
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
  initializeProductionMotion(track,stage,grid);
  initializeProductionHero();
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

export function initializeHeroLayout(root = document) {
  const hero = root.querySelector('.elementor-element-216d8696');
  const capabilities = hero?.querySelector('.elementor-element-a848c53');
  if (capabilities && capabilities.dataset.pmPrerendered !== 'true') {
    const badges = [...capabilities.querySelectorAll('.elementor-widget-icon-box')];
    capabilities.classList.add('pm-capabilities');
    capabilities.replaceChildren(...badges);
    const icons = [
      ['Linia produkcyjna SMT', '<path d="M3 17h18v4H3zM6 17v-4h12v4M9 3h6v7H9zM12 10v3M6 5h3M15 5h3"/><circle cx="7" cy="19" r=".5"/><circle cx="17" cy="19" r=".5"/>'],
      ['Laboratorium pomiarowe', '<path d="M8 3h8M10 3v7l-6 9a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-9V3M8 15h8M11 17h2"/>'],
    ];
    for (const [title, path] of icons) {
      const badge = element('div', 'elementor-widget-icon-box pm-capability');
      const wrapper = element('div', 'elementor-icon-box-wrapper');
      const icon = element('span', 'elementor-icon');
      icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
      wrapper.append(icon, element('h3', 'elementor-icon-box-title', title));
      badge.append(wrapper); capabilities.append(badge);
    }
    // Keep the compact mobile artwork; desktop gets one consistent outline family.
    const desktopIcons = [
      '<path d="M3 21V3h4v9l7-4v4l7-4v13H3ZM7 17h1m4 0h1m4 0h1"/>',
      '<rect x="9" y="3" width="6" height="5" rx="1"/><path d="M12 8v5M5 16v-3h14v3"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/>',
      '<path d="M9 18h6m-5 3h4M8.5 15.5a6 6 0 1 1 7 0c-.8.6-1.5 1.4-1.5 2.5h-4c0-1.1-.7-1.9-1.5-2.5Z"/><path d="m10 9 2 2 2-2m-2 2v4"/>',
      '<path d="m3 9 9-6 9 6v12H3V9Zm5 12v-9h8v9M8 16h8"/><path d="M11 7h2"/>',
      '<rect x="2" y="16" width="20" height="5" rx="2.5"/><path d="M5 16V4h14v12M5 7h14M10 7v5h4V7m-2 5v2M6 18.5h.01m4 0h.01m4 0h.01m4 0h.01"/>',
      '<path d="M8 3h8m-6 0v7l-6 9a1.3 1.3 0 0 0 1.1 2h13.8a1.3 1.3 0 0 0 1.1-2l-6-9V3M8 15h8m-6 3h.01m4-1h.01"/>',
      '<path d="M3 3h8l10 10-8 8L3 11V3Z"/><circle cx="7.5" cy="7.5" r="1.5"/>'
    ];
    [...capabilities.children].forEach((badge, index) => {
      const icon = badge.querySelector('.elementor-icon');
      if (!icon || !desktopIcons[index]) return;
      icon.insertAdjacentHTML('beforeend', `<svg class="pm-capability-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${desktopIcons[index]}</svg>`);
      const label=badge.querySelector('.elementor-icon-box-title').textContent.trim();
      const link=element('a','pm-capability-link');
      link.href=asset(['produkcja/','dystrybucja/','oferta/','wspolpraca-b2b/','produkcja/#kreci','laboratorium/'][index]);
      link.setAttribute('aria-label',label);
      // One real link per tile, with no nested legacy anchors or tap handlers.
      const mark=element('span','elementor-icon');mark.append(icon.querySelector('.pm-capability-outline').cloneNode(true));
      link.append(mark,element('span','elementor-icon-box-title',label));badge.replaceChildren(link);
    });
    const caption = hero.querySelector('.elementor-element-ea903c0');
    if (caption) { caption.classList.add('pm-entrance-caption'); hero.append(caption); }
    capabilities.dataset.pmPrerendered = 'true';
  }
  root.querySelectorAll('.elementor-element-280b012, .elementor-element-629d57a0').forEach(hero => {
    if (hero.querySelector('.pm-production-caption')) return;
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
  const folder = document.body.dataset.prescotPage === 'powers' ? 'assets/prmad/pr-mad-family.webp' : 'assets/controllers/mono-main.webp';
  if (hero) {
    hero.style.setProperty('background-image', `url("${asset(folder)}")`, 'important');
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


export function initializeExperience() {
  initializeCatalog(); initializeProduction(); initializeStartVideo(); initializeHeroLayout(); initializeShowcases(); initializeSeries(); initializeMobileMenu(); initializeBrandFooter();
  initializeMobileRefinement();
  window.dispatchEvent(new Event('prescot-layout-updated'));
}
