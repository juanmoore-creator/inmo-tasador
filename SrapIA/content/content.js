// ============================================================
// PropPick — Content Script
// Handles: auto-scroll, viewport capture coordination
// Runs in the context of the web page
// ============================================================

(() => {
  'use strict';

  // ── Session Sync Listener ────────────────────────────────
  // Attempt to read from localStorage immediately in case postMessage fired before injection
  try {
    const stored = window.localStorage.getItem('tasadorSession');
    if (stored) {
      chrome.storage.local.set({ tasadorSession: JSON.parse(stored) });
    }
  } catch (e) {
    // Ignore, might be cross-origin if injected somewhere else
  }

  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'TASADOR_SESSION_SYNC') {
      chrome.storage.local.set({ tasadorSession: event.data.payload }, () => {
        console.log('[PropPick] Sesión de Tasador sincronizada en la extensión');
      });
    }
  });

  // ── Message Listener ────────────────────────────────────
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handlers = {
      'PING': (_m, sendResponse) => sendResponse({ success: true }),
      'AUTO_SCROLL': handleAutoScroll,
      'GET_PAGE_DIMENSIONS': handleGetPageDimensions,
      'SCROLL_TO': handleScrollTo,
      'CLEANUP_SCROLL': handleCleanupScroll,
      'INSERT_PROPERTY': handleInsertProperty,
    };

    const handler = handlers[message.type];
    if (handler) {
      handler(message, sendResponse);
      return true;
    }
  });

  // ── Auto-Scroll ─────────────────────────────────────────
  // Scrolls to the bottom of the page gradually to trigger lazy-loaded content,
  // then scrolls back to the top.
  async function handleAutoScroll(message, sendResponse) {
    try {
      const scrollStep = window.innerHeight * 0.8; // 80% of viewport per step
      const scrollDelay = message.scrollDelay || 400; // ms between scrolls
      const maxScrolls = message.maxScrolls || 100; // safety limit

      let lastScrollY = -1;
      let scrollCount = 0;

      // Scroll down
      while (scrollCount < maxScrolls) {
        window.scrollBy({ top: scrollStep, behavior: 'instant' });
        await sleep(scrollDelay);

        const currentScrollY = window.scrollY;
        if (currentScrollY === lastScrollY) break; // reached bottom
        lastScrollY = currentScrollY;
        scrollCount++;
      }

      // Wait a bit for final lazy elements to load
      await sleep(800);

      // Scroll back to top
      window.scrollTo({ top: 0, behavior: 'instant' });
      await sleep(300);

      sendResponse({
        success: true,
        totalHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        scrollCount,
      });
    } catch (err) {
      console.error('[PropPick] Auto-scroll error:', err);
      sendResponse({ success: false, error: err.message });
    }
  }

  // ── Page Dimensions ─────────────────────────────────────
  function handleGetPageDimensions(_message, sendResponse) {
    sendResponse({
      success: true,
      totalHeight: document.documentElement.scrollHeight,
      totalWidth: document.documentElement.scrollWidth,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      devicePixelRatio: window.devicePixelRatio || 1,
    });
  }

  // ── Scroll To Position ──────────────────────────────────
  async function handleScrollTo(message, sendResponse) {
    window.scrollTo({ top: message.scrollY, behavior: 'instant' });
    await sleep(150); // small wait for rendering
    sendResponse({ success: true, actualScrollY: window.scrollY });
  }

  // ── Cleanup — restore scroll ───────────────────────────
  function handleCleanupScroll(_message, sendResponse) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    sendResponse({ success: true });
  }

  // ── Insert Property into Tasador Web App ────────────────
  // Relays extracted property data to the tasador page context
  // via window.postMessage (same format the ValuationForm expects)
  function handleInsertProperty(message, sendResponse) {
    try {
      // Convert PropPick flat data → ZonaProp-compatible PropertyData format
      const raw = message.data;
      const propertyData = {
        title: raw.direccion || '',
        typeSummary: raw.tipo_propiedad || '',
        price: {
          currency: extractCurrency(raw.precio),
          value: extractNumericPrice(raw.precio),
          raw: raw.precio || '',
        },
        expenses: {
          currency: 'ARS',
          value: extractNumericPrice(raw.expensas),
          raw: raw.expensas || '',
        },
        location: {
          full: raw.direccion || '',
          breadcrumb: [],
        },
        features: {
          superficieTotal: parseNumOrNull(raw.superficie_total),
          superficieCubierta: parseNumOrNull(raw.superficie_cubierta),
          ambientes: raw.ambientes ?? null,
          dormitorios: raw.dormitorios ?? null,
          banos: raw.banos ?? null,
          toilette: raw.toilettes ?? null,
          cocheras: raw.cocheras ?? null,
          antiguedad: parseNumOrNull(raw.antiguedad),
          disposicion: raw.disposicion || null,
          orientacion: raw.orientacion || null,
        },
        description: '',
        advertiser: '',
        url: raw._sourceUrl || '',
        scrapedAt: Date.now(),
      };

      window.postMessage({ type: 'ZONAPROP_DATA', data: propertyData }, '*');
      console.log('[PropPick] Relayed property data to page', propertyData);
      sendResponse({ success: true });
    } catch (err) {
      console.error('[PropPick] Insert error:', err);
      sendResponse({ success: false, error: err.message });
    }
  }

  // ── Data Conversion Helpers ────────────────────────────
  function extractCurrency(priceStr) {
    if (!priceStr) return '';
    if (/USD|U\$S/i.test(priceStr)) return 'USD';
    if (/\$|ARS/i.test(priceStr)) return 'ARS';
    return '';
  }

  function extractNumericPrice(priceStr) {
    if (!priceStr) return null;
    const match = String(priceStr).match(/([\d.,]+)/);
    if (!match) return null;
    const val = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
    return isNaN(val) ? null : val;
  }

  function parseNumOrNull(val) {
    if (val === null || val === undefined || val === '') return null;
    const num = parseFloat(String(val).replace(/[^\d.,]/g, '').replace(',', '.'));
    return isNaN(num) ? null : num;
  }

  // ── Utility ─────────────────────────────────────────────
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
})();
