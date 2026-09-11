const asset = path => new URL(path, import.meta.url).href;
const clamp = n => Math.max(0, Math.min(1, n));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const node = (tag, cls, text) => {
  const e = document.createElement(tag); e.className = cls;
  if (text) e.textContent = text;
  return e;
};
const picture = (src, alt, cls = '') => {
  const image = node('img', cls); image.src = asset(src); image.alt = alt;
  image.loading = 'lazy'; image.decoding = 'async'; return image;
};
const downloadIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6"/></svg>';

function improveProductArtwork(cards) {
  const type = document.body.dataset.prescotPage;
  if (!['controllers', 'powers'].includes(type)) return;
  const modes = ['mono', 'cct', 'rgb', 'rgbw', 'rgbcct'];
  cards.forEach((card, index) => {
    const left = card.querySelector('.mdw-card-portfolio-image-left .elementor-widget-container');
    const right = card.querySelector('.mdw-card-portfolio-image-right .elementor-widget-container');
    if (!left || !right) return;
    card.classList.add('pm-product-artwork');
    left.classList.add('pm-product-scene', 'pm-remote-scene');
    right.classList.add('pm-product-scene', 'pm-kit-scene');
    const mode = modes[index], watts = [36, 60, 100, 150, 200, 300][index];
    if (type === 'controllers') {
      card.dataset.mode = mode;
      left.replaceChildren(picture(`assets/showcase/${mode}-remote.webp`, `Pilot ${mode.toUpperCase()} — widok z przodu`, 'pm-remote'));
      const room = picture('assets/controllers/controller-living-room-hero-v2.webp', '', 'pm-room');
      room.setAttribute('aria-hidden', 'true'); left.prepend(room);
      right.replaceChildren(picture(`assets/showcase/${mode}-receiver.webp`, `Odbiornik ${mode.toUpperCase()} — widok złączy`, 'pm-receiver'));
      // A viewport onto the original transparent PNG: no invented product geometry.
      const holder = node('div', 'pm-magnet');
      holder.innerHTML = `<svg viewBox="375 438 193 450" role="img" aria-label="Uchwyt magnetyczny pilota"><defs><clipPath id="pm-holder-${mode}"><path d="M430 443 Q504 442 525 459 Q543 492 563 503 L563 834 Q559 882 507 883 L423 883 Q379 878 379 833 L379 492 Q380 444 430 443Z"/></clipPath></defs><image href="${asset('assets/showcase/magnetic-holder-source.webp')}" width="1024" height="1024" clip-path="url(#pm-holder-${mode})"/></svg>`;
      right.append(holder);
      const label = node('span', `pm-mode pm-mode-${mode}`, mode === 'rgbcct' ? 'RGB + CCT' : mode.toUpperCase());
      left.append(label, node('span', 'pm-photo-caption', 'Pilot RF'));
      right.append(node('span', 'pm-photo-caption', 'Odbiornik + uchwyt magnetyczny'));
    } else {
      card.dataset.mode = 'power';
      left.replaceChildren(picture(`assets/showcase/pr-mad-${watts}w.webp`, `Zasilacz PR-MAD ${watts} W`, 'pm-power'));
      right.replaceChildren(picture('assets/showcase/pr-mad-terminals.webp', 'PR-MAD — zaciski przyłączeniowe', 'pm-power-detail'));
      left.append(node('span', 'pm-mode', `${watts} W`), node('span', 'pm-photo-caption', `PR-MAD${watts}-1224`));
      right.append(node('span', 'pm-photo-caption', 'Zaciski przyłączeniowe'));
      const copy = card.querySelector('.pm-series-copy');
      const paragraph = copy?.querySelector('.elementor-widget-text-editor p');
      if (paragraph) {
        const links = [...paragraph.querySelectorAll('a')];
        const use = paragraph.textContent.split(/(?<=[.!?])\s/)[0];
        const length = [145,145,176,199,218,240][index];
        paragraph.replaceChildren(document.createTextNode(`${use} Autodetekcja 12 / 24 V DC. Moc ${watts} W, IP20, obudowa półzalewana. Wymiary ${length} × 50 × 29 mm. Gwarancja 36 miesięcy.`));
        for (const link of links) paragraph.append(document.createElement('br'),link);
      }
      const link = node('a', 'pm-download', 'Pobierz kartę katalogową');
      link.href = asset(`assets/showcase/pr-mad-${watts}w.pdf`); link.target = '_blank'; link.rel = 'noopener';
      link.insertAdjacentHTML('afterbegin', downloadIcon); copy?.append(link);
    }
  });
}

function improveShowcases() {
  const cards = [...document.querySelectorAll('.mdw-card-portfolio')];
  improveProductArtwork(cards);
  cards.forEach(card => {
    const stage = card.querySelector(':scope > .e-con-inner');
    const left = card.querySelector('.mdw-card-portfolio-image-left');
    const right = card.querySelector('.mdw-card-portfolio-image-right');
    if (!stage || !left || !right) return;
    card.classList.add('pm-mobile-showcase');
    stage.classList.add('pm-reveal-stage');
    let copy = stage.querySelector('.pm-series-copy');
    if (!copy) {
      copy = node('div', 'pm-original-copy');
      [...stage.children].filter(child => child !== left && child !== right).forEach(child => copy.append(child));
      stage.append(copy);
    }
    copy.classList.add('pm-reveal-copy');
    // Text stays intact on desktop and in the expandable mobile details.
    copy.querySelectorAll('.elementor-widget-text-editor').forEach(widget => {
      const container = widget.querySelector('.elementor-widget-container');
      if (!container || container.textContent.trim().length < 180) return;
      const original = node('div', 'pm-original-description');
      original.append(...container.childNodes);
      const textCopy = original.cloneNode(true); textCopy.querySelectorAll('a').forEach(a => a.remove());
      const text = textCopy.textContent.replace(/\s+/g, ' ').trim();
      const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [text];
      let brief = sentences.slice(0, 2).join(' ').replace(/\s+/g, ' ').trim();
      if (brief.length > 320) brief = sentences[0].trim();
      if (brief.length > 380) brief = brief.slice(0, 300).replace(/\s+\S*$/, '') + '…';
      const mobile = node('div', 'pm-mobile-description');
      mobile.append(node('p', 'pm-brief', brief));
      const details = node('details', 'pm-full-description');
      details.append(node('summary', '', 'Pełny opis i parametry'), original.cloneNode(true));
      mobile.append(details); container.append(original, mobile);
      details.addEventListener('toggle', () => {
        card.classList.toggle('pm-description-open', details.open);
        window.dispatchEvent(new Event('prescot-layout-updated'));
      });
    });
    // Keep original card URLs, promote the existing download to a clear action.
    const links = [...copy.querySelectorAll('a[href]')].filter(a => !a.closest('.pm-mobile-description'));
    for (const link of links.filter(a => /\.pdf(?:[?#]|$)/i.test(a.href))) {
      link.classList.add('pm-download');
      if (!/instrukcj/i.test(link.textContent)) link.textContent = 'Pobierz kartę katalogową';
      if (!link.querySelector('svg')) link.insertAdjacentHTML('afterbegin', downloadIcon);
      const widget = link.closest('.mdw-email-box');
      widget?.classList.add('pm-download-widget');
      if (widget) widget.classList.remove('mdw-email-box');
      // The old widget copied its caption to the clipboard on every click.
      if (window.jQuery) window.jQuery(link.parentElement).off('click mouseenter mouseleave');
    }
    if (document.body.dataset.prescotPage === 'controllers') {
      const download = links.find(a => a.classList.contains('pm-download'));
      if (download) {
        const separator=download.nextSibling;
        if(separator?.nodeType===Node.TEXT_NODE && /^[\s·|]+$/.test(separator.textContent)) separator.remove();
        copy.append(download);
      }
    }
    copy.querySelectorAll('a[href="#"]').forEach(a => { a.removeAttribute('href'); a.removeAttribute('role'); a.removeAttribute('tabindex'); });
    for (const image of card.querySelectorAll('img')) {
      image.loading = 'lazy';
      if (image.dataset.src && !image.currentSrc) image.src = image.dataset.src;
    }
  });
  const route = location.pathname.replace(/\/r\/?$/, '/').replace(/\.html$/, '/');
  const documents = /\/dslim4\/?$/.test(route)
    ? [['24ds002-050-4-xx','Karta Delux Slim · 24DS002'],['24ds004-050-4-xx','Karta Delux Slim · 24DS004']]
    : /\/(d160s|160s)\/?$/.test(route) ? [['24d160-8-4080-810','Karta Delux 160 · 8,5 W/m']] : [];
  const lastCopy = cards.at(-1)?.querySelector('.pm-reveal-copy');
  if (lastCopy) for (const [file,label] of documents) {
    const link=node('a','pm-download',label); link.href=asset(`assets/showcase/${file}.pdf`);link.target='_blank';link.rel='noopener';
    link.insertAdjacentHTML('afterbegin',downloadIcon); lastCopy.append(link);
  }
  let frame = 0;
  const update = () => {
    frame = 0;
    for (const card of cards) {
      const r = card.getBoundingClientRect();
      if (r.bottom < -100 || r.top > innerHeight * 1.5) continue;
      const travel = Math.max(180, r.height - innerHeight);
      // Large photos meet in the centre, then reveal the original copy symmetrically.
      const progress = reduced() || card.classList.contains('pm-description-open') ? 1 : clamp(-r.top / travel);
      card.style.setProperty('--pm-reveal', progress.toFixed(4));
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  addEventListener('scroll', schedule, {passive: true}); addEventListener('resize', schedule, {passive: true});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', schedule);
  update();
}

function improveCatalogue() {
  const cards = [...document.querySelectorAll('.pm-feature')];
  if (!cards.length) return;
  document.body.classList.add('pm-catalogue-refined');
  document.querySelector('.pm-collection')?.remove();
  cards.forEach(card => {
    const title = card.querySelector('h2').textContent;
    const image = card.querySelector('img');
    if (/True Color/i.test(title)) {
      image.src = asset('wp-content/uploads/2026/01/schodycri97_optimized-1024x574.webp');
      card.style.setProperty('--pm-image-position', '50% 30%');
    } else if (/S-shape|60\/120|COB Digital/i.test(title)) {
      card.style.setProperty('--pm-image-position', '50% 68%');
      if (/COB Digital/.test(title)) card.classList.add('pm-catalogue-contain');
    } else if (/własny brand/i.test(title)) card.style.setProperty('--pm-image-position', '50% 28%');
    else if (/high brightness/i.test(title)) {
      image.src = asset('wp-content/uploads/2026/01/DHIGH.webp');
      card.style.setProperty('--pm-image-position', '50% 50%');
    }
  });
}

function initializeScrollGuides() {
  document.body.classList.add('pm-guides-managed');
  const catalogue = Boolean(document.querySelector('.pm-catalog'));
  const floating = [...document.querySelectorAll('.distSlide')];
  const group = node('nav', 'pm-scroll-guides'); group.setAttribute('aria-label', 'Przewijanie strony');
  const button = (direction, label) => {
    const e = node('button', `pm-guide-${direction}`); e.type = 'button'; e.setAttribute('aria-label', label);
    e.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="${direction === 'up' ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'}"/></svg>`;
    return e;
  };
  const up = button('up', 'Przejdź do poprzedniej sekcji'), down = button('down', 'Przejdź do następnej sekcji');
  group.append(up, down); document.body.append(group);
  const intro = button('down', 'Zobacz więcej poniżej'); intro.classList.add('pm-intro-guide'); document.body.append(intro);
  let timer, touching = false, busy = false, frame = 0;
  const targets = () => [...new Set(document.querySelectorAll('.mdw-card-portfolio, .distSlide, .prescot-process-step, .pm-footer, [data-elementor-type="wp-page"] > .e-con'))]
    .filter(e => e.getBoundingClientRect().height > 60 && getComputedStyle(e).display !== 'none' && !e.closest('.pm-footer-duplicate'));
  const go = direction => {
    const currentCard = [...document.querySelectorAll('.pm-mobile-showcase')].find(e => {const r=e.getBoundingClientRect();return r.top < 20 && r.bottom > innerHeight*.7;});
    if (direction > 0 && currentCard && innerWidth < 768 && parseFloat(currentCard.style.getPropertyValue('--pm-reveal')) < .95) {
      scrollTo({top:scrollY+currentCard.getBoundingClientRect().bottom-innerHeight,behavior:reduced()?'instant':'smooth'}); return;
    }
    const sections = targets().map(e => ({e, top:e.getBoundingClientRect().top}));
    const target = direction > 0 ? sections.filter(s=>s.top>60).sort((a,b)=>a.top-b.top)[0] : sections.filter(s=>s.top < -60).sort((a,b)=>b.top-a.top)[0];
    if (target) target.e.scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});
    else scrollTo({top:direction>0?document.documentElement.scrollHeight:0,behavior:reduced()?'instant':'smooth'});
  };
  up.onclick = () => go(-1); down.onclick = intro.onclick = () => go(1);
  const update = () => {
    frame = 0;
    const inFloating = floating.some(e=>{const r=e.getBoundingClientRect();return r.top < innerHeight*.6 && r.bottom > innerHeight*.4;});
    const footer = document.querySelector('.pm-footer')?.getBoundingClientRect();
    const atStart = scrollY < 70;
    intro.hidden = catalogue || !atStart || inFloating;
    const atEnd = document.documentElement.scrollHeight-scrollY-innerHeight < 50 || (footer && footer.top < innerHeight*.5);
    up.hidden = scrollY < innerHeight*.45;
    down.hidden = catalogue || atEnd;
    group.hidden = atStart || inFloating || busy || (up.hidden && down.hidden);
  };
  const active = () => {
    busy = true; group.hidden = true; intro.classList.add('pm-hint-seen'); clearTimeout(timer);
    timer = setTimeout(() => {if(!touching){busy=false;update();}}, 1300);
  };
  addEventListener('scroll', () => {active(); if(!frame) frame=requestAnimationFrame(update);}, {passive:true});
  addEventListener('wheel', active, {passive:true});
  addEventListener('touchstart', () => {touching=true;active();}, {passive:true});
  addEventListener('touchend', () => {touching=false;active();}, {passive:true});
  addEventListener('touchcancel', () => {touching=false;active();}, {passive:true});
  addEventListener('resize', update, {passive:true});
  document.addEventListener('keydown', e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp',' '].includes(e.key))active();});
  update();
}

export function initializeMobileRefinement() {
  improveShowcases(); improveCatalogue(); initializeScrollGuides();
}
