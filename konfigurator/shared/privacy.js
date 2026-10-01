/* PRESCOT privacy controls. No analytics IDs, tags or marketing SDKs are installed.
 * Load synchronously in <head>, before optional providers. */
(() => {
  'use strict';
  if (window.PrescotPrivacy) return;
  const root = new URL('./', document.currentScript.src);
  const key = 'prescot_privacy_v1', policy = '2026-09-21', lifetime = 180 * 86400000;
  const defaults = () => ({ maps: false, translation: false });
  function read() {
    try {
      const r = JSON.parse(localStorage.getItem(key));
      if (r?.version !== 1 || r.policy !== policy || !Number.isFinite(r.savedAt) || !Number.isFinite(r.expiresAt) || r.savedAt > Date.now() || r.expiresAt <= Date.now() || r.expiresAt - r.savedAt > lifetime + 1000 || typeof r.preferences?.maps !== 'boolean' || typeof r.preferences?.translation !== 'boolean') return null;
      return r;
    } catch { return null; }
  }
  let record = read(), preferences = record?.preferences || defaults();
  let banner, dialog, fields = {}, returnFocus, pending, started = false;
  const has = name => name === 'geoip' ? preferences.translation === true && record?.languageGeoip === 1 : (name === 'maps' || name === 'translation') && preferences[name] === true;
  // A local queue only. It does not download Google code or send consent pings.
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', personalization_storage: 'denied', functionality_storage: 'denied', security_storage: 'granted' });
  function clearTranslation() {
    const parts = location.hostname.split('.'), domains = [''];
    for (let i = 0; i < parts.length - 1; i++) domains.push(parts.slice(i).join('.'), '.' + parts.slice(i).join('.'));
    const paths = new Set(['/', root.pathname]);
    let path = '';
    location.pathname.split('/').filter(Boolean).forEach(part => { path += '/' + part; paths.add(path); paths.add(path + '/'); });
    for (const domain of domains) for (const path of paths) document.cookie = `googtrans=; Max-Age=0; Path=${path}; SameSite=Lax${domain ? '; Domain=' + domain : ''}${location.protocol === 'https:' ? '; Secure' : ''}`;
    try { localStorage.removeItem('gt_autoswitch'); } catch { /* storage can be disabled */ }
  }
  if (!has('translation')) clearTranslation();
  function updateMaps() {
    document.querySelectorAll('[data-pc-map]').forEach(slot => {
      const frame = slot.querySelector('iframe');
      const placeholder = slot.querySelector('[data-pc-map-placeholder]');
      if (has('maps') && !frame) {
        const template = slot.querySelector('template');
        const next = template.content.firstElementChild.cloneNode(true);
        next.src = next.dataset.consentSrc;
        next.removeAttribute('data-consent-src');
        slot.append(next);
      } else if (!has('maps') && frame) frame.remove();
      if (placeholder) placeholder.hidden = has('maps');
    });
  }
  function sync(previous = defaults()) {
    updateMaps();
    if (!has('translation')) clearTranslation();
    window.dispatchEvent(new CustomEvent('prescot-privacy-change', { detail: { ...preferences } }));
    // Removing a provider's script cannot stop its running timers or restore
    // translated DOM. Reload after withdrawal, with cleared language cookies.
    if (previous.translation && !has('translation') && window.gt_translate_script) location.reload();
  }
  function persist(next) {
    const savedAt = Date.now();
    const nextRecord = { version: 1, policy, languageGeoip: 1, savedAt, expiresAt: savedAt + lifetime, preferences: { maps: next.maps === true, translation: next.translation === true } };
    try {
      localStorage.setItem(key, JSON.stringify(nextRecord));
      if (!read()) throw new Error('Storage unavailable');
    } catch {
      document.querySelectorAll('[data-pc-privacy-error]').forEach(el => { el.hidden = false; });
      return false;
    }
    const previous = preferences;
    record = nextRecord; preferences = nextRecord.preferences;
    banner.hidden = true;
    if (dialog.open) dialog.close();
    sync(previous);
    const action = pending; pending = null;
    if (action && has(action.category)) action.callback?.();
    return true;
  }

  // First-party translations: the consent controls are readable before Google loads.
  const privacyLabels = {"PRESCOT LED · PRYWATNOŚĆ":["PRESCOT LED · PRIVACY","PRESCOT LED · DATENSCHUTZ"],"Prywatność na stronie PRESCOT":["Privacy on the PRESCOT website","Datenschutz bei PRESCOT"],"Twój wybór cookies":["Your cookie choices","Ihre Cookie-Auswahl"],"Niezbędne ustawienia zapewniają działanie strony. Mapę i tłumaczenie Google włączymy za Twoją zgodą. Analityka i reklamy są wyłączone.":["Essential settings keep the website working. Maps and automatic translation require your consent. Analytics and advertising are off.","Notwendige Einstellungen ermöglichen die Nutzung der Website. Karten und automatische Übersetzung aktivieren wir mit Ihrer Zustimmung. Analyse und Werbung sind ausgeschaltet."],"Jak korzystamy z cookies":["How we use cookies","So verwenden wir Cookies"],"Tylko niezbędne":["Essential only","Nur notwendige"],"Ustawienia":["Settings","Einstellungen"],"Akceptuję wszystkie":["Accept all","Alle akzeptieren"],"Zapisz wybór":["Save choices","Auswahl speichern"],"Ustawienia cookies":["Cookie settings","Cookie-Einstellungen"],"Zamknij ustawienia":["Close settings","Einstellungen schließen"],"Decydujesz, z których usług korzystasz. Wyłączenie opcjonalnych usług pozwala nadal przeglądać ofertę i katalog.":["You choose which services to enable. You can still browse our products and catalogue with optional services off.","Sie entscheiden, welche Dienste Sie aktivieren. Auch ohne optionale Dienste können Sie unser Angebot und den Katalog nutzen."],"Niezbędne ustawienia":["Essential settings","Notwendige Einstellungen"],"Zawsze aktywne":["Always active","Immer aktiv"],"Zapis wyboru prywatności, ustawienia wyglądu i projekt w konfiguratorze. Formularz B2B korzysta z sesji oraz CAPTCHA.":["Stores your privacy choices, display settings and configurator project. The B2B form uses a session and CAPTCHA.","Speichert Ihre Datenschutzauswahl, Anzeigeeinstellungen und das Konfigurator-Projekt. Das B2B-Formular verwendet eine Sitzung und CAPTCHA."],"Mapy Google":["Google Maps","Google Maps"],"Mapa dojazdu w Kontakcie. Po jej włączeniu Google otrzyma m.in. adres IP i dane przeglądarki; może odczytywać lub zapisywać cookies.":["Directions on the Contact page. When enabled, Google receives your IP address and browser data and may read or store cookies.","Anfahrtskarte auf der Kontaktseite. Nach der Aktivierung erhält Google Ihre IP-Adresse und Browserdaten und kann Cookies lesen oder speichern."],"Tłumaczenie Google":["Google translation","Google-Übersetzung"],"Język dobieramy z ustawień przeglądarki. Gdy nie jest obsługiwany, GeoJS otrzyma adres IP, aby rozpoznać kraj. Google otrzyma treść strony i dane techniczne do tłumaczenia. Cofnięcie zgody odświeży stronę.":["We use your browser language. If it is unsupported, GeoJS receives your IP address to identify your country. Google receives page content and technical data for translation. Withdrawing consent reloads the page.","Wir verwenden Ihre Browsersprache. Wird sie nicht unterstützt, erhält GeoJS Ihre IP-Adresse zur Ländererkennung. Google erhält Seiteninhalte und technische Daten zur Übersetzung. Ein Widerruf lädt die Seite neu."],"Analityka i reklamy: wyłączone.":["Analytics and advertising: off.","Analyse und Werbung: ausgeschaltet."],"Obecnie nie uruchamiamy Google Analytics, Meta Pixel ani nagrywania sesji. Ten wybór nie obejmuje przyszłych narzędzi.":["We do not currently run Google Analytics, Meta Pixel or session recording. This choice does not cover future tools.","Wir verwenden derzeit weder Google Analytics noch Meta Pixel oder Sitzungsaufzeichnungen. Diese Auswahl umfasst keine künftigen Dienste."],"Informacje o cookies":["Cookie information","Informationen zu Cookies"],"Polityka prywatności i RODO":["Privacy policy","Datenschutzerklärung"],"Nie udało się zapisać wyboru w przeglądarce. Nowe usługi nie zostały włączone.":["Your choice could not be saved. No additional services were enabled.","Ihre Auswahl konnte nicht gespeichert werden. Es wurden keine zusätzlichen Dienste aktiviert."],"Aby przetłumaczyć stronę, włącz poniżej tłumaczenie Google i zapisz wybór.":["To translate the website, enable Google translation below and save your choice.","Aktivieren Sie unten die Google-Übersetzung und speichern Sie Ihre Auswahl, um die Website zu übersetzen."],"Aby wyświetlić mapę, włącz poniżej Mapy Google i zapisz wybór.":["To show the map, enable Google Maps below and save your choice.","Aktivieren Sie unten Google Maps und speichern Sie Ihre Auswahl, um die Karte anzuzeigen."]};
  let privacyLocale;
  try { privacyLocale = localStorage.getItem('prescot_language_v1'); } catch {}
  privacyLocale = String(privacyLocale || navigator.languages?.[0] || navigator.language || 'pl').split('-')[0];
  privacyLocale = privacyLocale === 'pl' ? 'pl' : privacyLocale === 'de' ? 'de' : 'en';
  const label = value => privacyLocale === 'pl' ? value : privacyLabels[value]?.[privacyLocale === 'de' ? 1 : 0] || value;
  function localizePrivacy(surface) {
    surface.lang = privacyLocale;
    const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) { const n = walker.currentNode, text = n.textContent.trim(); if (privacyLabels[text]) n.textContent = n.textContent.replace(text, label(text)); }
    for (const el of [surface, ...surface.querySelectorAll('[aria-label]')]) if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', label(el.getAttribute('aria-label')));
  }
  const error = '<p class="pc-privacy-error" data-pc-privacy-error role="alert" hidden>Nie udało się zapisać wyboru w przeglądarce. Nowe usługi nie zostały włączone.</p>';
  function open(category) {
    if (!started) { document.addEventListener('DOMContentLoaded', () => open(category), { once: true }); return; }
    returnFocus = document.activeElement;
    fields.maps.checked = has('maps'); fields.translation.checked = has('translation');
    const notice = dialog.querySelector('[data-pc-privacy-notice]');
    notice.hidden = !category;
    notice.textContent = category === 'translation' ? 'Aby przetłumaczyć stronę, włącz poniżej tłumaczenie Google i zapisz wybór.' : category === 'maps' ? 'Aby wyświetlić mapę, włącz poniżej Mapy Google i zapisz wybór.' : '';
    notice.textContent = label(notice.textContent);
    dialog.querySelector('[data-pc-privacy-error]').hidden = true;
    banner.hidden = true;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('h2').focus();
  }
  function request(category, callback) {
    if (!['maps', 'translation'].includes(category)) return;
    if (has(category)) { callback?.(); return; }
    pending = { category, callback }; open(category);
  }
  window.PrescotPrivacy = Object.freeze({ open, request, has, getState: () => ({ necessary: true, ...preferences, analytics: false, marketing: false, policy }) });
  function start() {
    started = true;
    banner = document.createElement('section');
    banner.id = 'pc-privacy-banner'; banner.className = 'pc-privacy-surface notranslate';
    banner.lang = 'pl'; banner.setAttribute('aria-label', 'Prywatność na stronie PRESCOT');
    banner.innerHTML = `<span class="pc-privacy-brand"><svg class="pc-privacy-brand-icon" aria-hidden="true" focusable="false" viewBox="0 0 377.9 257.7" xmlns="http://www.w3.org/2000/svg"> <path fill="#e14e26" d="M0,0h106.7v50H0V0ZM0,100.9h97.7v48.2H0v-48.2ZM0,206.6h106.7v51.2H0v-51.2h0ZM149.3,100.7h82v48.4h-82v-48.4h0ZM149.3,0h87.4C317.7,0,377.9,42.6,377.9,128.9s-60.1,128.9-141.2,128.9h-87.4v-51.2h90.8c47.8,0,76.6-29.1,76.6-77.7s-27.6-78.8-76.6-78.8h-90.8V0h0Z"/> </svg><span class="pc-privacy-eyebrow">PRESCOT LED · PRYWATNOŚĆ</span></span><h2>Twój wybór cookies</h2><p>Niezbędne ustawienia zapewniają działanie strony. Mapę i tłumaczenie Google włączymy za Twoją zgodą. Analityka i reklamy są wyłączone.</p><a class="pc-privacy-link" href="${new URL('cookies/', root).href}">Jak korzystamy z cookies</a><div class="pc-privacy-actions"><button type="button" data-choice="none">Tylko niezbędne</button><button type="button" data-choice="settings">Ustawienia</button><button type="button" data-choice="all">Akceptuję wszystkie</button></div>${error}`;
    banner.hidden = !!record;
    dialog = document.createElement('dialog');
    dialog.id = 'pc-privacy-dialog'; dialog.className = 'pc-privacy-surface notranslate'; dialog.lang = 'pl';
    dialog.setAttribute('aria-labelledby', 'pc-privacy-title');
    dialog.innerHTML = `<div class="pc-privacy-heading"><div><span class="pc-privacy-eyebrow">PRESCOT LED · PRYWATNOŚĆ</span><h2 id="pc-privacy-title" tabindex="-1">Ustawienia cookies</h2></div><button type="button" class="pc-privacy-close" aria-label="Zamknij ustawienia">×</button></div><p>Decydujesz, z których usług korzystasz. Wyłączenie opcjonalnych usług pozwala nadal przeglądać ofertę i katalog.</p><p class="pc-privacy-notice" data-pc-privacy-notice hidden></p><div class="pc-privacy-required"><strong>Niezbędne ustawienia <small>Zawsze aktywne</small></strong><p>Zapis wyboru prywatności, ustawienia wyglądu i projekt w konfiguratorze. Formularz B2B korzysta z sesji oraz CAPTCHA.</p></div><label class="pc-privacy-category"><span><strong>Mapy Google</strong><small>Mapa dojazdu w Kontakcie. Po jej włączeniu Google otrzyma m.in. adres IP i dane przeglądarki; może odczytywać lub zapisywać cookies.</small></span><input type="checkbox" name="maps" aria-label="Mapy Google"></label><label class="pc-privacy-category"><span><strong>Tłumaczenie Google</strong><small>Język dobieramy z ustawień przeglądarki. Gdy nie jest obsługiwany, GeoJS otrzyma adres IP, aby rozpoznać kraj. Google otrzyma treść strony i dane techniczne do tłumaczenia. Cofnięcie zgody odświeży stronę.</small></span><input type="checkbox" name="translation" aria-label="Tłumaczenie Google"></label><p class="pc-privacy-inactive"><strong>Analityka i reklamy: wyłączone.</strong> Obecnie nie uruchamiamy Google Analytics, Meta Pixel ani nagrywania sesji. Ten wybór nie obejmuje przyszłych narzędzi.</p><p><a class="pc-privacy-link" href="${new URL('cookies/', root).href}">Informacje o cookies</a> · <a class="pc-privacy-link" href="${new URL('polityka-prywatnosci/', root).href}">Polityka prywatności i RODO</a></p><div class="pc-privacy-actions"><button type="button" data-choice="none">Tylko niezbędne</button><button type="button" data-choice="save">Zapisz wybór</button><button type="button" data-choice="all">Akceptuję wszystkie</button></div>${error}`;
    localizePrivacy(banner); localizePrivacy(dialog);
    document.body.append(banner, dialog);
    fields = { maps: dialog.querySelector('[name="maps"]'), translation: dialog.querySelector('[name="translation"]') };
    dialog.querySelector('.pc-privacy-close').addEventListener('click', () => { pending = null; dialog.close(); });
    dialog.addEventListener('close', () => { banner.hidden = !!record; if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true }); });
    dialog.addEventListener('cancel', () => { pending = null; });
    for (const surface of [banner, dialog]) surface.addEventListener('click', event => {
      const choice = event.target.closest('[data-choice]')?.dataset.choice;
      if (!choice) return;
      if (choice === 'settings') { pending = null; open(); return; }
      persist(choice === 'save' ? { maps: fields.maps.checked, translation: fields.translation.checked } : { maps: choice === 'all', translation: choice === 'all' });
    });
    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-privacy-settings],[data-pc-map-enable]');
      if (trigger) { event.preventDefault(); if (trigger.hasAttribute('data-pc-map-enable')) request('maps'); else { pending = null; open(); } }
      const language = event.target.closest('[data-gt-lang]');
      if (language && language.dataset.gtLang !== 'pl' && !has('translation')) {
        event.preventDefault(); event.stopImmediatePropagation();
        request('translation', () => language.click());
      }
    }, true);
    updateMaps();
    // Sit beside the dock when there is room, otherwise above its controls.
    let observedDock;
    const observer = window.ResizeObserver ? new ResizeObserver(() => clearDock()) : null;
    const clearDock = () => {
      const dock = document.querySelector('.prescot-dock,.pm-menu');
      if (dock && dock !== observedDock) { observer?.disconnect(); observer?.observe(dock); observedDock = dock; }
      const rect = dock?.getBoundingClientRect();
      const visibleDock = rect && rect.top < innerHeight && rect.bottom > 0;
      const style = getComputedStyle(banner);
      const bannerLeft = innerWidth - parseFloat(style.right) - parseFloat(style.width);
      const fitsBeside = innerWidth >= 768 && visibleDock && bannerLeft >= rect.right + 16;
      const gap = visibleDock
        ? fitsBeside ? Math.max(16, innerHeight - rect.bottom) : Math.max(20, innerHeight - rect.top + 16)
        : 20;
      banner.style.setProperty('--pc-privacy-bottom', `${Math.ceil(gap)}px`);
    };
    clearDock();
    window.addEventListener('resize', clearDock, { passive: true });
    [100, 600, 1500].forEach(delay => setTimeout(clearDock, delay));
  }
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    const previous = preferences; record = read(); preferences = record?.preferences || defaults();
    if (started) { banner.hidden = !!record; if (dialog.open) dialog.close(); sync(previous); }
  });
  function checkExpiry() {
    if (record && !read()) {
      const previous = preferences; record = null; preferences = defaults();
      if (started) { banner.hidden = false; sync(previous); }
    }
  }
  window.addEventListener('pageshow', checkExpiry);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkExpiry(); });
  setInterval(checkExpiry, 60000);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
