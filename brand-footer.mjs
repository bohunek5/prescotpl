const asset = path => new URL(path, import.meta.url).href;
const copy = {
  prescot: ['Oświetlenie produkowane w Polsce', 'Produkujemy oświetlenie LED w Polsce. Poznaj nasze taśmy, oprawy i komponenty do instalacji oświetleniowych.'],
  klus: ['Profile LED KLUŚ', 'Profile aluminiowe i akcesoria do linii światła w sufitach, ścianach i meblach. Dobierz system do swojego projektu.'],
  scharfer: ['Zasilacze LED Scharfer', 'Hermetyczne zasilacze do instalacji LED. Sprawdź dostępne modele i dobierz zasilanie do swojej instalacji.'],
  elba: ['Oprawy LED ELBA', 'Oświetlenie dróg, parków i obiektów przemysłowych. Poznaj oprawy ELBA dostępne w dystrybucji Prescot.'],
  miboxer: ['Sterowanie MiBoxer / Mi-Light', 'Sterowniki, piloty i panele do zarządzania światłem. Dobierz sposób regulacji jasności, koloru i temperatury barwowej.']
};

export function initializeBrandFooter() {
  document.querySelectorAll('.distSlide').forEach((slide, index, slides) => {
    slide.classList.add('pm-brand');
    const brand = Object.keys(copy).find(key => slide.classList.contains(`is-${key}`));
    if (brand) {
      const [title, description] = copy[brand];
      const heading = slide.querySelector('.distTitle');
      const paragraph = slide.querySelector('.distText');
      if (heading) heading.textContent = title;
      if (paragraph) paragraph.textContent = description;
      const kicker = slide.querySelector('.distKicker');
      if (kicker) kicker.textContent = brand === 'prescot' ? 'Prescot LED · Polski producent' : `Dystrybucja · ${brand === 'klus' ? 'KLUŚ' : brand === 'miboxer' ? 'MiBoxer' : brand.toUpperCase()}`;
    }
    // Native buttons remain reachable by keyboard; arrows follow the content flow.
    let down = slide.querySelector('.distArrow');
    if (!down) {
      down = document.createElement('button');
      down.className = 'distArrow'; down.type = 'button';
      down.setAttribute('aria-label', 'Przejdź do następnej sekcji');
      down.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
      slide.append(down);
    }
    for (const arrow of slide.querySelectorAll('.distArrow, .distArrowUp')) {
      arrow.setAttribute('role','button'); arrow.tabIndex = 0;
      arrow.addEventListener('click', event => {
        event.preventDefault(); event.stopPropagation();
        const previous = arrow.classList.contains('distArrowUp');
        const target = slides[index + (previous ? -1 : 1)] || (previous ? document.body : document.querySelector('.pm-footer'));
        target?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',block:'start'});
      });
      if (arrow.tagName !== 'BUTTON') arrow.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); arrow.click(); }
      });
    }
  });

  const footers = [...document.querySelectorAll('.footerSlide')].filter(node => node.querySelector('.footerGrid'));
  const footer = footers.at(-1);
  if (!footer) return;
  // A few exports include the same footer twice. Keep one live contact form.
  footers.slice(0,-1).forEach(duplicate => { duplicate.classList.add('pm-footer-duplicate'); duplicate.inert = true; duplicate.setAttribute('aria-hidden','true'); });
  document.querySelectorAll('[id="stopka"]').forEach(node => node.classList.add('pm-footer-shell'));
  const footerAnchor = footer.closest('[id="stopka"]') || footer;
  document.querySelectorAll('[id="stopka"]').forEach(node => {
    if (node !== footerAnchor) node.removeAttribute('id');
  });
  footerAnchor.id = 'stopka';
  footer.classList.add('pm-footer');
  const grid = footer.querySelector('.footerGrid');
  const info = footer.querySelector('.footerInfoCol');
  const bottom = footer.querySelector('.bottomStack');
  if (bottom) grid.append(bottom);
  if (info) {
    // Normalize malformed/nested info blocks without rebuilding their links.
    const blocks = [...info.querySelectorAll('.infoBlock')];
    blocks.forEach(block => info.append(block));
    let contact = info.querySelector('.p-full-kontakt-btn');
    if (!contact) { contact = document.createElement('a'); contact.className = 'p-full-kontakt-btn'; }
    else if (contact.parentElement !== info && contact.parentElement.children.length === 1) contact.parentElement.style.margin = '0';
    contact.href = asset('kontakt/');
    contact.textContent = 'Pełny kontakt';
    const arrow = document.createElement('span'); arrow.textContent = '↗'; arrow.setAttribute('aria-hidden','true'); contact.append(arrow);
    contact.classList.add('pm-full-contact'); contact.removeAttribute('style'); info.append(contact);
  }
  const logo = footer.querySelector('.footerLogo img');
  if (logo) { logo.src = asset('wp-content/uploads/2025/12/PRESCOT_logo-podstawowe.svg'); logo.setAttribute('data-src',logo.src); }
  const legal = footer.querySelector('.legalLinks');
  if (legal) {
    legal.setAttribute('aria-label','Dokumenty');
    legal.querySelectorAll('a').forEach(link => {
      if (/owg/i.test(link.getAttribute('href'))) { link.textContent = 'OWG'; link.setAttribute('aria-label','Ogólne warunki gwarancji Prescot LED'); }
    });
  }
  if (bottom) {
    const social = footer.querySelector('.socialRow');
    if (legal) bottom.append(legal);
    if (social) bottom.append(social);
  }
  new IntersectionObserver(entries => {
    document.body.classList.toggle('pm-footer-visible', entries[0].isIntersecting);
  }, {threshold:.05}).observe(footer);
}
