// Prescot LED — Global Navigation, Active Indicator, Dock, Hero Logo & Scroll-To-Top Controller
document.addEventListener("DOMContentLoaded", () => {
  // 0. Ensure Unified Luxury Dock exists on every page
  let dock = document.querySelector(".prescot-dock");
  if (!dock) {
    const dockContainer = document.createElement("nav");
    dockContainer.className = "prescot-dock";
    dockContainer.setAttribute("aria-label", "Nawigacja główna");
    dockContainer.innerHTML = `
      <a href="./" class="dock-item" data-tooltip="Strona główna" aria-label="Strona główna">
        <svg class="dock-logo-icon" viewBox="0 0 377.9 257.7" xmlns="http://www.w3.org/2000/svg">
          <path fill="#e14e26" d="M0,0h106.7v50H0V0ZM0,100.9h97.7v48.2H0v-48.2ZM0,206.6h106.7v51.2H0v-51.2h0ZM149.3,100.7h82v48.4h-82v-48.4h0ZM149.3,0h87.4C317.7,0,377.9,42.6,377.9,128.9s-60.1,128.9-141.2,128.9h-87.4v-51.2h90.8c47.8,0,76.6-29.1,76.6-77.7s-27.6-78.8-76.6-78.8h-90.8V0h0Z"/>
        </svg>
      </a>
      <a href="produkty/" class="dock-item" data-tooltip="Oferta" aria-label="Oferta">
        <svg viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M542.22 32.05c-54.8 3.11-163.72 14.43-230.96 55.59-4.64 2.84-7.27 7.89-7.27 13.17v363.87c0 11.55 12.63 18.85 23.28 13.49 69.18-34.82 169.23-44.32 218.7-46.92 16.89-.89 30.02-14.43 30.02-30.66V62.75c.01-17.71-15.35-31.74-33.77-30.7zM264.73 87.64C197.5 46.48 88.58 35.17 33.78 32.05 15.36 31.01 0 45.04 0 62.75V400.6c0 16.24 13.13 29.78 30.02 30.66 49.49 2.6 149.59 12.11 218.77 46.95 10.62 5.35 23.21-1.94 23.21-13.46V100.63c0-5.29-2.62-10.14-7.27-12.99z"/></svg>
      </a>
      <a href="tasmy-led/" class="dock-item" data-tooltip="Taśmy LED" aria-label="Taśmy LED">
        <svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M224 192c-35.3 0-64 28.7-64 64s28.7 64 64 64 64-28.7 64-64-28.7-64-64-64zm400 224H380.6c41.5-40.7 67.4-97.3 67.4-160 0-123.7-100.3-224-224-224S0 132.3 0 256s100.3 224 224 224h400c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm-400-64c-53 0-96-43-96-96s43-96 96-96 96 43 96 96-43 96-96 96z"/></svg>
      </a>
      <a href="produkcja/" class="dock-item" data-tooltip="Produkcja" aria-label="Produkcja">
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M475.115 163.781L336 252.309v-68.28c0-18.916-20.931-30.399-36.885-20.248L160 252.309V56c0-13.255-10.745-24-24-24H24C10.745 32 0 42.745 0 56v400c0 13.255 10.745 24 24 24h464c13.255 0 24-10.745 24-24V184.029c0-18.917-20.931-30.399-36.885-20.248z"/></svg>
      </a>
      <a href="dystrybucja/" class="dock-item" data-tooltip="Dystrybucja & B2B" aria-label="Dystrybucja & B2B">
        <svg viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M128 352H32c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h96c17.67 0 32-14.33 32-32v-96c0-17.67-14.33-32-32-32zm-24-80h192v48h48v-48h192v48h48v-57.59c0-21.17-17.23-38.41-38.41-38.41H344v-64h40c17.67 0 32-14.33 32-32V32c0-17.67-14.33-32-32-32H256c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h40v64H94.41C73.23 224 56 241.23 56 262.41V320h48v-48zm264 80h-96c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h96c17.67 0 32-14.33 32-32v-96c0-17.67-14.33-32-32-32zm240 0h-96c-17.67 0-32 14.33-32 32v96c0 17.67 14.33 32 32 32h96c17.67 0 32-14.33 32-32v-96c0-17.67-14.33-32-32-32z"/></svg>
      </a>
      <a href="baza-wiedzy/" class="dock-item" data-tooltip="Baza Wiedzy" aria-label="Baza Wiedzy & FAQ">
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M256 32C132.3 32 32 132.3 32 256s100.3 224 224 224 224-100.3 224-224S379.7 32 256 32zm0 376c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm42.7-142.1c-13.8 11.2-26.7 21.6-26.7 46.1v10c0 8.8-7.2 16-16 16h-32c-8.8 0-16-7.2-16-16v-14c0-38.4 22.8-56.9 44.4-74.4 14.1-11.4 27.6-22.3 27.6-39.6 0-21.2-18.7-36-44-36-24.6 0-41.9 14.2-46.7 32.5-2.2 8.5-10.4 13.9-19.1 12.3l-30.8-5.6c-9.1-1.7-14.8-10.7-12.4-19.7C180.7 132.2 214.2 104 256 104c53 0 96 34.3 96 82 0 35.8-21.7 61.2-53.3 83.9z"/></svg>
      </a>
      <a href="https://prescot.com.pl/" class="dock-item" data-tooltip="Sklep B2C" aria-label="Sklep B2C" target="_blank" rel="noopener">
        <svg viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M576 216v16c0 13.255-10.745 24-24 24h-8l-26.113 182.788C514.509 462.435 494.257 480 470.37 480H105.63c-23.887 0-44.139-17.565-47.518-41.212L32 256h-8c-13.255 0-24-10.745-24-24v-16c0-13.255 10.745-24 24-24h67.341l106.78-146.821c10.395-14.292 30.407-17.453 44.701-7.058 14.293 10.395 17.453 30.408 7.058 44.701L170.477 192h235.046L326.12 82.821c-10.395-14.292-7.234-34.306 7.059-44.701 14.291-10.395 34.306-7.235 44.701 7.058L484.659 192H552c13.255 0 24 10.745 24 24zM312 392V280c0-13.255-10.745-24-24-24s-24 10.745-24 24v112c0 13.255 10.745 24 24 24s24-10.745 24-24zm112 0V280c0-13.255-10.745-24-24-24s-24 10.745-24 24v112c0 13.255 10.745 24 24 24s24-10.745 24-24zm-224 0V280c0-13.255-10.745-24-24-24s-24 10.745-24 24v112c0 13.255 10.745 24 24 24s24-10.745 24-24z"/></svg>
      </a>
      <a href="kontakt/" class="dock-item" data-tooltip="Kontakt" aria-label="Kontakt">
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M493.4 24.6l-104-24c-11.3-2.6-22.9 3.3-27.5 14l-48 112c-4.2 9.8-1.4 21.3 6.9 28l60.6 49.6c-36 76.7-98.9 140.5-177.2 177.2l-49.6-60.6c-6.8-8.3-18.2-11.1-28-6.9l-112 48C4.1 366.5-1.8 378.1.8 389.4l24 104C27.3 504.2 36.7 512 48 512c256.1 0 464-207.5 464-464 0-11.2-7.7-21-18.6-23.4z"/></svg>
      </a>
      <div class="dock-lang-item">
        <div class="gtranslate_wrapper" id="gt-wrapper-prescot-global"></div>
      </div>
    `;
    document.body.appendChild(dockContainer);
    dock = dockContainer;
  }

  // 1. Podświetlanie aktywnej pozycji w menu dock
  const path = window.location.pathname.replace(/^\/prescotpl\/?/i, "").replace(/^\/+|\/+$/g, "").toLowerCase();

  document.querySelectorAll(".prescot-dock .dock-item").forEach((item) => {
    const href = (item.getAttribute("href") || "").replace(/^\/+|\/+$/g, "").replace(/^\.\/?/, "").toLowerCase();

    // Exact or semantic match
    if (href === path ||
      (href === "" && (path === "" || path === "prescotled")) ||
      (href === "produkty" && (path === "produkty" || path === "produkt" || path === "oprawy" || path === "silpro" || path === "akcesoria")) ||
      (href === "tasmy-led" && (path === "tasmy-led" || path === "dlow" || path === "dpro" || path === "dslim4" || path === "onecut" || path === "p70140210" || path === "p60120" || path === "truecolor" || path === "special" || path === "prgbw" || path === "ybrand" || path === "dhigh" || path === "d160s")) ||
      (href === "dystrybucja" && (path === "dystrybucja" || path === "wspolpraca-b2b" || path === "b2b")) ||
      (href === "baza-wiedzy" && (path === "baza-wiedzy" || path === "kalkulator")) ||
      (href === "kontakt" && path === "kontakt") ||
      (href === "produkcja" && path === "produkcja")) {
      item.classList.add("url-active");
    }
  });

  // 2. Utworzenie przycisku Scroll-To-Top (Do góry)
  let sttBtn = document.getElementById("prescotScrollToTop");
  if (!sttBtn) {
    sttBtn = document.createElement("button");
    sttBtn.type = "button";
    sttBtn.id = "prescotScrollToTop";
    sttBtn.className = "prescot-scroll-to-top";
    sttBtn.setAttribute("aria-label", "Przewiń na samą górę");
    sttBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
    document.body.appendChild(sttBtn);
    sttBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // 2b. Utworzenie inteligentnej strzałki w dół (Scroll-Down) nad dockiem
  let scrollDownBtn = document.getElementById("prescotScrollDown");
  const heroOnlyScrollDown = Boolean(document.querySelector('.distSlide'));

  function checkScrollDown() {
    if (document.getElementById("prescotScrollDown")) return;

    // Strzałka w dół dla podstron produktowych z kartami showcase (.mdw-card-portfolio) oraz dla strony głównej.
    const isHomePage = window.location.pathname === '/' || window.location.pathname === '/prescotpl/' || window.location.pathname === '';
    if (!document.querySelector(".mdw-card-portfolio") && !isHomePage && !heroOnlyScrollDown) return;

    // Sprawdź czy strona ma więcej treści
    const docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    const winH = window.innerHeight || 700;
    const hasMoreContent = docH > (winH + 30);
    if (!hasMoreContent) return;

    scrollDownBtn = document.createElement("a");
    scrollDownBtn.id = "prescotScrollDown";
    scrollDownBtn.className = "prescot-scroll-down";
    scrollDownBtn.setAttribute("aria-label", "Przewiń do kolejnego bloku");
    scrollDownBtn.setAttribute("href", "#");
    if (heroOnlyScrollDown) scrollDownBtn.dataset.heroOnly = 'true';
    scrollDownBtn.innerHTML = `
      <svg class="p-pure-arrow-down" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
        <path d="M413.1 222.5l22.2 22.2c9.4 9.4 9.4 24.6 0 33.9L241 473c-9.4 9.4-24.6 9.4-33.9 0L12.7 278.6c-9.4-9.4-9.4-24.6 0-33.9l22.2-22.2c9.5-9.5 25-9.3 34.3.4L184 343.4V56c0-13.3 10.7-24 24-24h32c13.3 0 24 10.7 24 24v287.4l114.8-120.5c9.3-9.8 24.8-10 34.3-.4z"></path>
      </svg>
    `;
    document.body.appendChild(scrollDownBtn);

    scrollDownBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const currentWinH = window.innerHeight || 700;
      if (heroOnlyScrollDown && heroEl) {
        const nextSection = heroEl.nextElementSibling;
        const target = nextSection?.offsetHeight > 50 ? nextSection : document.querySelector('.distSlide');
        target?.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
        return;
      }

      // Priorytet: Karty produktowe / showcase (.mdw-card-portfolio)
      const cardCandidates = Array.from(
        new Set(document.querySelectorAll(".mdw-card-portfolio, #stopka, footer.elementor-location-footer, footer"))
      );
      const below = cardCandidates
        .filter(el => {
          if (el.offsetHeight < 50) return false;
          const rect = el.getBoundingClientRect();
          return rect.top > 60;
        })
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

      if (below.length > 0) {
        below[0].scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      // Fallback: stopka lub dół
      const stopka = document.getElementById("stopka") || document.querySelector("footer");
      if (stopka && stopka.getBoundingClientRect().top > 60) {
        stopka.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollBy({ top: Math.round(currentWinH * 0.85), behavior: "smooth" });
      }
    });
  }
  checkScrollDown();
  const refreshScrollDown = () => {checkScrollDown(); measureDimensions(); updateNavVisibility();};
  window.addEventListener("load", refreshScrollDown);
  setTimeout(refreshScrollDown, 400);
  setTimeout(refreshScrollDown, 1200);

  // 3. Smart Scroll Controller (Ultra-smooth 60/120 FPS via requestAnimationFrame & zero layout thrashing)
  let lastScrollY = window.scrollY;
  const scrollThreshold = 8;
  const smartLogo = document.querySelector(".prescot-smart-logo");
  const heroEl = document.querySelector(".distribution-intro, .elementor-element-216d8696, .p-full-hero, .hero-section, .hero, .catalog-hero, .elementor-top-section, [data-element_type='container']:first-child");
  const currentDock = document.querySelector(".prescot-dock");
  const stopkaEl = document.getElementById("stopka") || document.querySelector("footer.elementor-location-footer, footer, .site-footer");

  let heroThreshold = 180;
  let cachedDocH = 2000;
  let cachedWinH = window.innerHeight || 700;

  function measureDimensions() {
    cachedWinH = window.innerHeight || 700;
    cachedDocH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    const heroH = heroEl ? heroEl.offsetHeight : cachedWinH;
    heroThreshold = Math.max(120, Math.min(260, heroH * 0.45));
  }
  measureDimensions();
  window.addEventListener("resize", measureDimensions, { passive: true });
  window.addEventListener("load", measureDimensions, { passive: true });

  function updateNavVisibility() {
    const currentScrollY = window.scrollY;

    if (smartLogo) {
      if (currentScrollY <= heroThreshold) {
        smartLogo.classList.remove("logo-hidden");
      } else {
        smartLogo.classList.add("logo-hidden");
      }
    }

    if (sttBtn) {
      if (currentScrollY > heroThreshold) {
        sttBtn.classList.add("stt-visible");
      } else {
        sttBtn.classList.remove("stt-visible");
      }
    }

    if (scrollDownBtn) {
      let isAtEnd = false;
      if (heroOnlyScrollDown && heroEl && heroEl.getBoundingClientRect().bottom < cachedWinH - 110) {
        isAtEnd = true;
      }
      if (cachedDocH - (currentScrollY + cachedWinH) < 80) {
        isAtEnd = true;
      } else if (stopkaEl) {
        const stopkaRect = stopkaEl.getBoundingClientRect();
        if (stopkaRect.top <= (cachedWinH * 0.55)) {
          isAtEnd = true;
        }
      }

      if (isAtEnd) {
        scrollDownBtn.classList.add("psd-hidden");
      } else {
        scrollDownBtn.classList.remove("psd-hidden");
      }
      scrollDownBtn.setAttribute('aria-hidden', String(isAtEnd));
      scrollDownBtn.tabIndex = isAtEnd ? -1 : 0;
    }

    if (currentDock) {
      if (currentScrollY < 30) {
        currentDock.classList.remove("dock-hidden");
      } else if (Math.abs(currentScrollY - lastScrollY) > scrollThreshold) {
        if (currentScrollY > lastScrollY && currentScrollY > 80) {
          currentDock.classList.add("dock-hidden");
        } else if (currentScrollY < lastScrollY) {
          currentDock.classList.remove("dock-hidden");
        }
      }
    }
    lastScrollY = currentScrollY;
  }

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateNavVisibility();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Drive the actual carousel instance. Triggering hidden pagination bullets is
  // unreliable on mobile and counted non-dot siblings as slide numbers.
  const sliderControl = (event) => {
    const control = event.target.closest('.as-bar .dot, .as-slider-left, .as-slider-right, .card-prev, .card-next');
    if (!control) return;
    const container = control.closest('.as-slider, .dm-card-slider');
    const swiperElement = container?.querySelector('.as-side-slider .swiper, .as-side-slider .swiper-container, .elementor-main-swiper');
    const swiper = swiperElement?.swiper;
    if (!swiper || swiper.destroyed) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (control.matches('.dot')) {
      const index = Array.from(container.querySelectorAll('.as-bar .dot')).indexOf(control);
      if (swiper.params.loop) swiper.slideToLoop(index); else swiper.slideTo(index);
    } else if (control.matches('.as-slider-left, .card-prev')) swiper.slidePrev();
    else swiper.slideNext();
  };
  document.addEventListener('click', sliderControl, true);
  document.querySelectorAll('.as-slider-left a, .card-prev a').forEach(el => el.setAttribute('aria-label', 'Poprzedni model'));
  document.querySelectorAll('.as-slider-right a, .card-next a').forEach(el => el.setAttribute('aria-label', 'Następny model'));
  const labelSliderDots = () => document.querySelectorAll('.as-slider').forEach(slider => {
    const titles = slider.querySelectorAll('.as-changing-widget h2');
    slider.querySelectorAll('.as-bar .dot').forEach((dot, index) => {
      dot.setAttribute('role', 'button'); dot.tabIndex = 0;
      dot.setAttribute('aria-label', `Pokaż model ${index + 1}: ${titles[index]?.textContent.trim() || ''}`);
      if (!dot.dataset.keyboardReady) {
        dot.dataset.keyboardReady = 'true';
        dot.addEventListener('keydown', event => {if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); dot.click();}});
      }
    });
  });
  labelSliderDots();
  window.addEventListener('load', labelSliderDots);
  [400, 1200].forEach(delay => setTimeout(labelSliderDots, delay));

  // 4. Automatic image hydration
  function hydrateImages() {
    document.querySelectorAll('img[data-src]').forEach((img) => {
      const realSrc = img.getAttribute('data-src');
      if (realSrc && (!img.src || img.src.startsWith('data:image'))) {
        img.src = realSrc;
      }
      const realSrcset = img.getAttribute('data-srcset');
      if (realSrcset && (!img.srcset || img.srcset.startsWith('data:image'))) {
        img.srcset = realSrcset;
      }
    });
  }
  hydrateImages();
  window.addEventListener('load', hydrateImages);

  // 4b. Showcase: Karta serii zamiast technicznych numerów / wielkich bukw
  function updateShowcaseCardButtons() {
    const emailBoxes = document.querySelectorAll(".mdw-email-box, .mdw-card-portfolio .mdw-email-box");
    emailBoxes.forEach(box => {
      const link = box.querySelector("a");
      const heading = box.querySelector("h2, .elementor-heading-title");
      if (link) {
        link.textContent = "Karta serii";
        link.setAttribute("title", "Karta serii - pobierz kartę katalogową");
        link.setAttribute("target", "_blank");
        link.setAttribute("rel", "noopener noreferrer");
      } else if (heading && !box.innerText.toLowerCase().includes("katalog") && !box.innerText.toLowerCase().includes("instrukcja")) {
        heading.textContent = "Karta serii";
      }
      const container = box.querySelector(".elementor-widget-container");
      if (container && link && !container.dataset.hasCardClick) {
        container.dataset.hasCardClick = "true";
        container.addEventListener("click", (e) => {
          if (e.target !== link) {
            link.click();
          }
        });
      }
    });
  }
  updateShowcaseCardButtons();
  window.addEventListener('load', updateShowcaseCardButtons);

  updateNavVisibility();

  // 5. Automatic GTranslate Dock Sync & Mounting
  function syncGTranslateToDock() {
    const dockLang = document.querySelector(".prescot-dock .dock-lang-item");
    if (!dockLang) return;

    // If dock already has the active switcher, we are good
    if (dockLang.querySelector("#gt_float_wrapper")) return;

    // Check if WordPress generated a wrapper elsewhere on the page
    const origWrapper = document.querySelector('[id^="gt-wrapper-"]:not(#gt-wrapper-prescot-global)');
    if (origWrapper) {
      dockLang.innerHTML = "";
      dockLang.appendChild(origWrapper);
      return;
    }

    // If no existing wrapper, check if loose switcher exists
    const looseSwitcher = document.getElementById("gt_float_wrapper");
    if (looseSwitcher && !dockLang.contains(looseSwitcher)) {
      dockLang.innerHTML = "";
      dockLang.appendChild(looseSwitcher);
      return;
    }

    // Fallback: If not initialized at all, dynamically initialize GTranslate
    if (!document.getElementById("gt-wrapper-prescot-global-script")) {
      const isGH = window.location.hostname.indexOf('github.io') !== -1 || window.location.pathname.startsWith("/prescotpl");
      const prefix = isGH ? "/prescotpl/" : "/";
      const widgetId = "prescot-global-widget";
      window.gtranslateSettings = window.gtranslateSettings || {};
      window.gtranslateSettings[widgetId] = {
        default_language: "pl",
        languages: ["ar", "zh-CN", "cs", "da", "en", "et", "fi", "fr", "de", "it", "lt", "pl", "es", "sv"],
        url_structure: "none",
        flag_style: "3d",
        wrapper_selector: ".prescot-dock .gtranslate_wrapper",
        alt_flags: [],
        float_switcher_open_direction: "top",
        switcher_horizontal_position: "inline",
        flags_location: prefix + "wp-content/plugins/gtranslate/flags/"
      };
      const gtScript = document.createElement("script");
      gtScript.id = "gt-wrapper-prescot-global-script";
      gtScript.src = prefix + "wp-content/plugins/gtranslate/js/float.js?ver=3.1.2";
      gtScript.setAttribute("data-gt-widget-id", widgetId);
      gtScript.setAttribute("data-no-optimize", "1");
      gtScript.setAttribute("data-no-minify", "1");
      gtScript.defer = true;
      document.body.appendChild(gtScript);
    }
  }

  // 6. Fix Slider Background Images (ensure proper prefix on GitHub Pages & subdirectories)
  function fixSliderBackgrounds() {
    const isGH = window.location.hostname.indexOf('github.io') !== -1 || window.location.pathname.startsWith("/prescotpl");
    if (!isGH) return;
    document.querySelectorAll(".as-slider-background img").forEach(img => {
      const src = img.getAttribute("src");
      if (src && (src.startsWith("/wp-content/") || src.startsWith("/assets/"))) {
        img.src = "/prescotpl" + src;
      }
    });
  }

  syncGTranslateToDock();
  fixSliderBackgrounds();

  window.addEventListener("load", () => {
    syncGTranslateToDock();
    fixSliderBackgrounds();
  });

  // Polling checks for async scripts
  [150, 400, 900, 1800, 3000].forEach(delay => {
    setTimeout(() => {
      syncGTranslateToDock();
      fixSliderBackgrounds();
    }, delay);
  });

  // MutationObserver to catch dynamically injected GTranslate float switcher (isolated to dock)
  try {
    const dockLang = document.querySelector(".prescot-dock .dock-lang-item");
    if (dockLang) {
      const gtObserver = new MutationObserver(() => {
        if (!dockLang.querySelector("#gt_float_wrapper")) {
          syncGTranslateToDock();
        } else {
          gtObserver.disconnect();
        }
      });
      gtObserver.observe(dockLang, { childList: true, subtree: true });
      setTimeout(() => gtObserver.disconnect(), 6000);
    }
  } catch(e) {}
});


  // 0b. Native Modern B2C Interstitial Modal (Modern Web Guidance <dialog>)
  function setupB2CModal() {
    let dialog = document.getElementById("prescotB2CDialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "prescotB2CDialog";
      dialog.className = "prescot-b2c-dialog";
      
      const isGH = window.location.hostname.indexOf('github.io') !== -1 || window.location.pathname.startsWith("/prescotpl");
      const bgImgUrl = isGH 
        ? "/prescotpl/wp-content/uploads/2026/03/prescot-shop-bg.webp" 
        : "/wp-content/uploads/2026/03/prescot-shop-bg.webp";

      dialog.innerHTML = `
        <div class="b2c-dialog-box">
          <button type="button" class="b2c-dialog-close" id="b2cCloseCross" aria-label="Zamknij">&times;</button>
          
          <div class="b2c-dialog-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            Sklep Internetowy B2C
          </div>
          
          <h3 class="b2c-dialog-title">Przechodzisz do sklepu<br><span class="b2c-brand-domain">prescot.com.pl</span></h3>
          
          <p class="b2c-main-desc">Oficjalny sklep dla klientów detalicznych i szybkich zakupów online.</p>

          <div class="b2c-dialog-actions">
            <a href="https://prescot.com.pl/" id="b2cConfirmBtn" target="_blank" rel="noopener" class="b2c-btn-confirm">
              <span>Przejdź do sklepu prescot.com.pl</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
            <button type="button" class="b2c-btn-cancel" id="b2cCancelBtn">
              Zostań na tej stronie
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(dialog);

      // Event listeners for closing
      dialog.querySelector("#b2cCloseCross").addEventListener("click", () => dialog.close());
      dialog.querySelector("#b2cCancelBtn").addEventListener("click", () => dialog.close());
      dialog.querySelector("#b2cConfirmBtn").addEventListener("click", () => dialog.close());
      
      // Close on backdrop click
      dialog.addEventListener("click", (e) => {
        const rect = dialog.getBoundingClientRect();
        const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height
          && rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
        if (!isInDialog) {
          dialog.close();
        }
      });
    }

    // Bind to all B2C Cart links in dock and page
    document.querySelectorAll('a[href*="prescot.com.pl"], .dock-b2c-btn, [data-tooltip="Sklep B2C"]').forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        dialog.showModal();
      });
    });
  }
  setupB2CModal();
  setTimeout(setupB2CModal, 600);

  // Hero background video autoplay guarantee
  function initHeroVideo() {
    const video = document.querySelector(".elementor-element-216d8696 video, video.elementor-background-video-hosted");
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("autoplay", "");
    
    const playVideo = () => {
      const p = video.play();
      if (p !== undefined) {
        p.catch(() => {
          const resume = () => {
            video.play().catch(() => {});
            ['click', 'touchstart'].forEach(ev => window.removeEventListener(ev, resume));
          };
          ['click', 'touchstart'].forEach(ev => window.addEventListener(ev, resume, { once: true, passive: true }));
        });
      }
    };
    playVideo();
  }
  initHeroVideo();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHeroVideo);
  }
