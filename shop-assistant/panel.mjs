import {SAMPLE_REQUEST, LIGHT_LABELS, parseRequest, buildSet, makeHandoff} from './engine.mjs';

const icons = {
  arrow: '<path d="m7 17 10-10M7 7h10v10"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  mic: '<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',
  sparkle: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
  chevron: '<path d="m6 14 6-6 6 6"/>',
};
const svg = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const read = key => {try {return JSON.parse(sessionStorage.getItem(key));} catch {return null;}};
const save = (key, value) => {try {sessionStorage.setItem(key, JSON.stringify(value));} catch { /* Private mode still supports the current session in memory. */ }};
const quantityLabel = (product, quantity) => {
  if (product.kind === 'control') return `${quantity} komplet`;
  if (product.kind === 'power') return `${quantity} szt.`;
  if (product.byMeter) return `${quantity} m`;
  const ending = quantity === 1 ? 'rolka' : quantity % 10 >= 2 && quantity % 10 <= 4 && !(quantity % 100 >= 12 && quantity % 100 <= 14) ? 'rolki' : 'rolek';
  return `${quantity} ${ending}`;
};

export function initializeAssistant(options = {}) {
  if (document.getElementById('prescot-set-assistant')) return;
  const storeBase = options.storeBase || 'https://bohunek5.github.io/sklepSC/';
  const host = document.createElement('div');
  host.id = 'prescot-set-assistant';
  const root = host.attachShadow({mode: 'open'});
  root.innerHTML = `<link rel="stylesheet" href="${new URL('./panel.css?v=20260911-mobile1', import.meta.url)}">
    <aside class="teaser" hidden aria-label="Dobór zestawu LED">
      <button class="teaser-main" type="button"><span class="mark">${svg('sparkle')}</span><span><strong>Światło zaczyna się od zestawu.</strong><small>Taśma, zasilacz i sterowanie. Dobierzmy je razem.</small></span><span class="teaser-action">Dobierz zestaw ${svg('chevron')}</span></button>
      <button class="teaser-close icon-button" type="button" aria-label="Ukryj podpowiedź">${svg('close')}</button>
    </aside>
    <dialog aria-labelledby="set-title" aria-describedby="set-description">
      <div class="sheet">
        <header class="sheet-header"><div class="identity"><span class="mark">${svg('sparkle')}</span><span>PRESCOT <b>LED</b><small>ASYSTENT DOBORU</small></span></div><div class="header-actions"><a href="${escape(storeBase)}shop.html" class="store-link">Cały sklep ${svg('arrow')}</a><button class="close icon-button" type="button" aria-label="Zamknij dobór zestawu">${svg('close')}</button></div></header>
        <div class="sheet-body">
          <section class="conversation"><span class="eyebrow">TWÓJ POMYSŁ. NASZE PRODUKTY.</span><h2 id="set-title">Powiedz, czego<br>potrzebujesz<span>.</span></h2><p id="set-description">Dobierz taśmę, zasilacz Scharfer i sterowanie PR Touch w jednym miejscu.</p>
            <form><label for="set-request">Opisz zestaw lub doprecyzuj wybór</label><div class="input-box"><textarea id="set-request" maxlength="600" rows="3" placeholder="Np. 4 m COB RGB+CCT, Scharfer 100 W i PR Touch"></textarea><div class="input-actions"><button class="mic icon-button" type="button" aria-label="Podyktuj opis zestawu" title="Dyktowanie obsługuje przeglądarka; może przesyłać dźwięk do swojego dostawcy.">${svg('mic')}</button><button class="submit" type="submit">Dobierz zestaw ${svg('arrow')}</button></div></div></form>
            <p class="voice-note" aria-live="polite"></p>
            <div class="quick-prompts" aria-label="Przykładowe zestawy"><button type="button" data-prompt="${escape(SAMPLE_REQUEST)}" data-reset>RGB+CCT + PR Touch</button><button type="button" data-prompt="4 m COB 3000K 24 V, dobierz zasilacz i PR Touch" data-reset>Ciepłe światło · 4 m</button><button type="button" data-prompt="4 m COB CCT 24 V, dobierz zasilacz i PR Touch" data-reset>Regulowana biel · 4 m</button></div>
            <div class="status" role="status" aria-live="polite"><p>Ładuję katalog produktów…</p></div>
          </section>
          <section class="selection" aria-label="Wybrane elementy zestawu"><div class="selection-heading"><div><span class="eyebrow selection-kicker">PUNKT WYJŚCIA</span><h3>Twój zestaw LED</h3></div><button class="reset" type="button">Od nowa</button></div><div class="specs"></div><div class="cards"></div><div class="details"></div><footer class="selection-footer"><p>Aktualne ceny i dostępność sprawdzisz w sklepie.</p><button class="handoff" type="button" disabled>Przygotuj w sklepie ${svg('arrow')}</button></footer></section>
        </div>
      </div>
    </dialog>`;
  document.body.append(host);
  const dialog = root.querySelector('dialog');
  const teaser = root.querySelector('.teaser');
  const input = root.querySelector('textarea');
  const status = root.querySelector('.status');
  const handoff = root.querySelector('.handoff');
  let catalogPromise;
  let catalog;
  let result;
  let intent = {};
  let previousFocus;
  let recognition;
  let voiceTimer;
  let isListening = false;
  let requestNumber = 0;
  const storeProduct = id => new URL(`product.html?id=${id}`, storeBase).href;

  function render(next, preview = false) {
    result = next;
    root.querySelector('.selection-kicker').textContent = preview ? 'PRZYKŁADOWY ZESTAW' : next.ready ? 'PARAMETRY SPRAWDZONE' : 'DOBIERAMY ELEMENTY';
    root.querySelector('.specs').innerHTML = [next.color && LIGHT_LABELS[next.color], next.technology?.toUpperCase(), next.voltage && `${next.voltage} V`, next.intent.length && `${next.intent.length} m`].filter(Boolean).map(value => `<span>${escape(value)}</span>`).join('');
    root.querySelector('.cards').innerHTML = next.items.map(({product: p, role, detail, quantity}, index) => `<article class="product-card"><div class="card-top"><span>${String(index + 1).padStart(2, '0')}</span><span>${escape(role)}</span></div><a class="product-image" href="${escape(storeProduct(p.id))}" target="_blank" rel="noopener"><img src="${escape(p.image)}" alt="${escape(p.title)}" loading="lazy" referrerpolicy="no-referrer"></a><div class="product-copy"><small>${escape(p.sku)}</small><h4>${escape(p.kind === 'tape' ? `Taśma ${p.technology.toUpperCase()} ${LIGHT_LABELS[p.color]}` : p.kind === 'power' ? `Scharfer ${p.watts} W` : `PR Touch ${LIGHT_LABELS[p.color]}`)}</h4><p>${escape(detail)}</p><span class="quantity">${escape(quantityLabel(p, quantity))}</span><a class="product-link" href="${escape(storeProduct(p.id))}" target="_blank" rel="noopener">Zobacz produkt ${svg('arrow')}</a></div></article>`).join('');
    root.querySelectorAll('img').forEach(img => img.addEventListener('error', () => {img.hidden = true; img.parentElement.classList.add('image-unavailable'); img.parentElement.textContent = 'PRESCOT LED';}, {once: true}));
    if (!next.items.length) root.querySelector('.cards').innerHTML = '<div class="empty">Doprecyzuj parametry — tutaj pojawią się pasujące produkty.</div>';
    status.dataset.state = next.ready ? 'ready' : 'question';
    status.innerHTML = next.ready ? `<strong>Zestaw pasuje do podanych parametrów.</strong><p>${next.load} W obciążenia · wymagane min. ${next.minimumPower} W z przyjętym zapasem 20%.</p>` : next.issues.map(issue => `<p>${escape(issue)}</p>`).join('');
    if (!next.intent.length && next.items.length) status.innerHTML += '<div class="length-options"><button type="button" data-prompt="3 m">3 m</button><button type="button" data-prompt="4 m">4 m</button><button type="button" data-prompt="5 m">5 m</button></div>';
    if (next.minimumPower && next.intent.power && next.intent.power < next.minimumPower) status.innerHTML += '<button class="resolve" type="button" data-prompt="Dobierz moc do metrażu">Dobierz moc do tego metrażu →</button>';
    root.querySelector('.details').innerHTML = next.notes.map(note => `<p>${escape(note)}</p>`).join('') + (next.items.find(x => x.product.specification) ? `<a href="${escape(next.items.find(x => x.product.specification).product.specification)}" target="_blank" rel="noopener">Karta techniczna taśmy ↗</a>` : '');
    handoff.disabled = !next.ready;
  }

  async function loadCatalog() {
    if (!catalogPromise) catalogPromise = fetch(new URL('./catalog.json?v=20260910-1', import.meta.url), {signal: AbortSignal.timeout(10000)}).then(response => {if (!response.ok) throw new Error('Catalog unavailable'); return response.json();}).then(data => {if (!Array.isArray(data.products) || !data.products.length) throw new Error('Empty catalog'); catalog = data.products; return catalog;}).catch(error => {catalogPromise = null; throw error;});
    return catalogPromise;
  }

  async function request(text, {reset = false, preview = false} = {}) {
    if (!text.trim()) {input.focus(); return;}
    const thisRequest = ++requestNumber;
    root.querySelector('.submit').disabled = true;
    handoff.disabled = true;
    try {
      await loadCatalog();
      if (thisRequest !== requestNumber) return;
      const parsed = parseRequest(text, reset ? {} : intent);
      intent = parsed.intent;
      render(buildSet(catalog, intent, parsed.issues), preview);
      if (!parsed.issues.length) save('prescot-set-intent-v1', intent);
      input.value = '';
      input.placeholder = 'Np. zmień na 5 m albo dobierz moc do metrażu';
    } catch {
      status.dataset.state = 'question';
      status.innerHTML = '<p>Nie udało się pobrać katalogu. Spróbuj ponownie lub otwórz cały sklep.</p><button class="retry" type="button">Spróbuj ponownie</button>';
      result = null;
    } finally {if (thisRequest === requestNumber) root.querySelector('.submit').disabled = false;}
  }

  async function open() {
    if (dialog.open) return;
    previousFocus = document.activeElement;
    teaser.hidden = true;
    dialog.showModal();
    root.querySelector('.close').focus({preventScroll: true});
    // Existing input and selection stay intact when the sheet is reopened.
    if (result) return;
    const saved = read('prescot-set-intent-v1');
    if (saved && typeof saved === 'object') {
      intent = saved;
      try {await loadCatalog(); render(buildSet(catalog, intent));} catch {await request(SAMPLE_REQUEST, {reset: true, preview: true});}
    } else await request(SAMPLE_REQUEST, {reset: true, preview: true});
  }

  function stopVoice() {
    clearTimeout(voiceTimer);
    try {recognition?.abort();} catch { /* Already stopped. */ }
    isListening = false;
    root.querySelector('.mic').setAttribute('aria-pressed', 'false');
  }
  function close() {stopVoice(); dialog.close();}
  dialog.addEventListener('close', () => {
    stopVoice(); save('prescot-set-teaser-dismissed', true);
    previousFocus?.focus({preventScroll: true});
  });
  dialog.addEventListener('cancel', stopVoice);
  dialog.addEventListener('click', event => {if (event.target === dialog) {const r = dialog.getBoundingClientRect(); if (event.clientY < r.top || event.clientX < r.left || event.clientX > r.right) close();}});
  root.querySelector('.close').addEventListener('click', close);
  root.querySelector('.teaser-main').addEventListener('click', open);
  root.querySelector('.teaser-close').addEventListener('click', () => {teaser.hidden = true; save('prescot-set-teaser-dismissed', true);});
  root.querySelector('form').addEventListener('submit', event => {event.preventDefault(); stopVoice(); request(input.value);});
  input.addEventListener('keydown', event => {if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {event.preventDefault(); root.querySelector('form').requestSubmit();}});
  root.querySelector('.reset').addEventListener('click', () => {stopVoice(); request(SAMPLE_REQUEST, {reset: true, preview: true});});
  root.addEventListener('click', event => {
    const prompt = event.target.closest('[data-prompt]');
    if (prompt) {stopVoice(); request(prompt.dataset.prompt, {reset: prompt.hasAttribute('data-reset')});}
    if (event.target.closest('.retry')) request(input.value || SAMPLE_REQUEST);
  });
  handoff.addEventListener('click', () => {
    if (!result?.ready) return;
    const target = new URL('zestaw.html', storeBase);
    target.hash = new URLSearchParams({set: JSON.stringify(makeHandoff(result))}).toString();
    location.assign(target.href);
  });

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const mic = root.querySelector('.mic');
  const voiceNote = root.querySelector('.voice-note');
  mic.hidden = !Recognition;
  mic.setAttribute('aria-pressed', 'false');
  mic.addEventListener('click', () => {
    if (isListening) {stopVoice(); return;}
    try {
      recognition = new Recognition();
      recognition.lang = 'pl-PL'; recognition.continuous = false; recognition.interimResults = true;
      recognition.onstart = () => {isListening = true; mic.setAttribute('aria-pressed', 'true'); voiceNote.textContent = 'Słucham. Dyktowanie obsługuje dostawca Twojej przeglądarki.';};
      recognition.onresult = event => {input.value = Array.from(event.results).map(item => item[0].transcript).join(' ').slice(0, 600);};
      recognition.onerror = event => {voiceNote.textContent = event.error === 'not-allowed' ? 'Brak dostępu do mikrofonu. Możesz wpisać opis.' : 'Dyktowanie przerwane. Spróbuj ponownie lub wpisz opis.';};
      recognition.onend = () => {clearTimeout(voiceTimer); isListening = false; mic.setAttribute('aria-pressed', 'false'); if (input.value.trim()) voiceNote.textContent = 'Sprawdź zapis i kliknij „Dobierz zestaw”.';};
      isListening = true;
      recognition.start();
      voiceTimer = setTimeout(() => recognition?.stop(), 20000);
    } catch {stopVoice(); voiceNote.textContent = 'Dyktowanie jest niedostępne. Wpisz opis zestawu.';}
  });
  document.addEventListener('visibilitychange', () => {if (document.hidden) stopVoice();});
  window.addEventListener('pagehide', stopVoice);

  document.addEventListener('click', event => {
    if (event.target.closest('[data-open-prescot-set], .prescot-dock a[data-tooltip="Sklep B2C"], .dock-b2c-btn')) {
      event.preventDefault(); event.stopImmediatePropagation(); open();
    }
  }, true);
  const productPage = document.querySelector('.mdw-card-portfolio') || /\/(produkty|produkt)\/?$/.test(location.pathname);
  if (productPage && !read('prescot-set-teaser-dismissed')) {
    const show = () => {if (!dialog.open && !read('prescot-set-teaser-dismissed')) teaser.hidden = false;};
    setTimeout(show, 1800);
  }
  if (new URLSearchParams(location.search).get('dobierz') === '1') open();
  return {open};
}
