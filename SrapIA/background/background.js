// ============================================================
// PropPick — Background Service Worker (Manifest V3)
// ALL orchestration happens here (scroll, capture, analyze)
// ============================================================

import { buildGeminiMultiImagePrompt, GEMINI_MODEL, GEMINI_API_URL } from './gemini-config.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, arrayUnion } from 'firebase/firestore';

// ── Firebase Configuration ──────────────────────────────────
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Message Router ──────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handlers = {
    'START_EXTRACTION': handleStartExtraction,
    'SAVE_API_KEY': handleSaveApiKey,
    'GET_API_KEY': handleGetApiKey,
    'SAVE_COMPARABLE_TO_FIRESTORE': handleSaveComparableToFirestore,
  };

  const handler = handlers[message.type];
  if (handler) {
    handler(message, sender, sendResponse);
    return true; // keep channel open for async response
  }
});

// ── Helpers ─────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** 
 * Automatically inject content script if not ready 
 */
async function ensureContentScript(tabId) {
  try {
    // Try pinging the script first
    const response = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { type: 'PING' }, (response) => {
        if (chrome.runtime.lastError) resolve(null);
        else resolve(response);
      });
    });

    // If no response (or error), inject manually
    if (!response || !response.success) {
      console.log(`[PropPick] Injecting content script into tab ${tabId}...`);
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content/content.js']
      });
      // Small wait for script to initialize
      await sleep(250);
    }
  } catch (err) {
    console.error('[PropPick] Failed to inject content script:', err);
  }
}

async function sendToContentScript(tabId, message) {
  // 1. Ensure script is there
  await ensureContentScript(tabId);

  // 2. Try sending message
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[PropPick] sendMessage failed again:', chrome.runtime.lastError.message);
        resolve({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve(response);
      }
    });
  });
}

/** Notify the popup with progress updates */
function notifyPopup(data) {
  chrome.runtime.sendMessage({ type: 'EXTRACTION_PROGRESS', ...data }).catch(() => {
    // popup might be closed, ignore
  });
}

/** Capture with retry logic */
async function captureWithRetry(windowId, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(windowId, {
        format: 'jpeg',
        quality: 80,
      });
      return dataUrl;
    } catch (err) {
      console.warn(`[PropPick] Capture attempt ${attempt}/${maxRetries} failed:`, err.message);
      if (attempt === maxRetries) throw err;
      await sleep(300 * attempt); // exponential backoff
    }
  }
}

// ── Full Extraction Flow ────────────────────────────────────
async function handleStartExtraction(message, sender, sendResponse) {
  try {
    const { tabId, windowId } = message;

    // 0. Check API key
    const { geminiApiKey } = await chrome.storage.local.get('geminiApiKey');
    if (!geminiApiKey) {
      sendResponse({ success: false, error: 'No hay API Key configurada. Ve a ⚙ Configuración para ingresarla.' });
      return;
    }

    // 1. Auto-scroll to load lazy content
    notifyPopup({ pct: 5, label: 'Auto-scroll en progreso...', status: 'Cargando contenido dinámico...' });

    const scrollResult = await sendToContentScript(tabId, {
      type: 'AUTO_SCROLL',
      scrollDelay: 350,
      maxScrolls: 80,
    });

    if (!scrollResult?.success) {
      sendResponse({ success: false, error: 'Error en auto-scroll: ' + (scrollResult?.error || 'desconocido') });
      return;
    }

    notifyPopup({ pct: 20, label: `Scroll completado (${scrollResult.scrollCount} pasos)`, status: 'Scroll completado.' });

    // 2. Get page dimensions
    const dims = await sendToContentScript(tabId, { type: 'GET_PAGE_DIMENSIONS' });
    if (!dims?.success) {
      sendResponse({ success: false, error: 'No se pudieron obtener las dimensiones de la página.' });
      return;
    }

    const { totalHeight, viewportHeight } = dims;

    // 3. Calculate strategic capture positions (max 5 captures)
    const totalSegments = Math.ceil(totalHeight / viewportHeight);
    const MAX_CAPTURES = 5;
    const numCaptures = Math.min(totalSegments, MAX_CAPTURES);

    // Distribute captures evenly across the page
    const capturePositions = [];
    if (numCaptures === 1) {
      capturePositions.push(0);
    } else {
      const maxScrollable = Math.max(0, totalHeight - viewportHeight);
      for (let i = 0; i < numCaptures; i++) {
        const scrollY = Math.round((i / (numCaptures - 1)) * maxScrollable);
        capturePositions.push(scrollY);
      }
    }

    notifyPopup({ pct: 25, label: `Capturando ${numCaptures} vistas...`, status: `Capturando pantalla (${numCaptures} segmentos)...` });

    // 4. Capture viewports with retry
    const capturedImages = []; // base64 strings (without prefix)

    for (let i = 0; i < capturePositions.length; i++) {
      const scrollY = capturePositions[i];

      // Scroll to position
      await sendToContentScript(tabId, { type: 'SCROLL_TO', scrollY });
      await sleep(350); // wait for rendering

      // Capture with retry
      try {
        const dataUrl = await captureWithRetry(windowId, 3);
        // Strip data URI prefix → pure base64
        const base64 = dataUrl.split(',')[1];
        capturedImages.push(base64);
      } catch (err) {
        console.error(`[PropPick] Failed to capture segment ${i + 1} after retries:`, err);
        // Skip failed segment, continue with others
        notifyPopup({ pct: 25, label: `Segmento ${i + 1} omitido, continuando...` });
      }

      const pct = 25 + Math.round(((i + 1) / capturePositions.length) * 35);
      notifyPopup({ pct, label: `Captura ${i + 1} de ${numCaptures}` });
    }

    // Restore scroll
    await sendToContentScript(tabId, { type: 'CLEANUP_SCROLL' });

    if (capturedImages.length === 0) {
      sendResponse({ success: false, error: 'No se pudo capturar ningún segmento de la página.' });
      return;
    }

    // 5. Send ALL images to Gemini (multi-image support)
    notifyPopup({ pct: 70, label: 'Analizando con Gemini Vision...', status: 'Enviando imágenes a Gemini Vision AI...' });

    const url = `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;
    const body = buildGeminiMultiImagePrompt(capturedImages);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[PropPick] Gemini API error:', response.status, errBody);
      sendResponse({ success: false, error: `Error de Gemini (${response.status}): ${errBody}` });
      return;
    }

    const data = await response.json();
    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      sendResponse({ success: false, error: 'Respuesta vacía de Gemini.' });
      return;
    }

    // Parse JSON (strip markdown fences if present)
    const cleanJson = textContent.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error('[PropPick] JSON parse error. Raw text:', textContent);
      sendResponse({ success: false, error: `Error al parsear respuesta de Gemini: ${cleanJson.substring(0, 200)}` });
      return;
    }

    notifyPopup({ pct: 100, label: '¡Extracción completada!' });
    sendResponse({ success: true, data: parsed });

  } catch (err) {
    console.error('[PropPick] Extraction error:', err);
    sendResponse({ success: false, error: err.message });
  }
}

// ── API Key Storage ─────────────────────────────────────────
async function handleSaveApiKey(message, _sender, sendResponse) {
  try {
    await chrome.storage.local.set({ geminiApiKey: message.apiKey });
    sendResponse({ success: true });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

async function handleGetApiKey(_message, _sender, sendResponse) {
  try {
    const { geminiApiKey } = await chrome.storage.local.get('geminiApiKey');
    sendResponse({ success: true, apiKey: geminiApiKey || '' });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

// ── Firestore Integration ───────────────────────────────────
async function handleSaveComparableToFirestore(message, sender, sendResponse) {
  try {
    const { valuationId, propertyData } = message.payload;
    if (!valuationId || !propertyData) {
      throw new Error('Faltan datos de tasación o propiedad para guardar en Firestore.');
    }

    const docRef = doc(db, 'valuations', valuationId);
    
    // Adaptar PropPick flat data a formato Tasador si es necesario (el content.js lo hacía)
    // Pero en background recibimos la data plana de Gemini. Necesitamos adaptarla.
    const raw = propertyData;
    
    const extractNumericPrice = (priceStr) => {
      if (!priceStr) return null;
      const match = String(priceStr).match(/([\d.,]+)/);
      if (!match) return null;
      const val = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
      return isNaN(val) ? null : val;
    };

    const parseNumOrNull = (val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = parseFloat(String(val).replace(/[^\d.,]/g, '').replace(',', '.'));
      return isNaN(num) ? null : num;
    };

    const coveredSurface = parseNumOrNull(raw.superficie_cubierta) || 0;
    const totalSurface = parseNumOrNull(raw.superficie_total) || 0;
    const uncoveredSurface = Math.max(0, totalSurface - coveredSurface);
    const cocheras = parseNumOrNull(raw.cocheras) || 0;
    const priceVal = extractNumericPrice(raw.precio) || 0;

    let propertyType = '';
    if (raw.tipo_propiedad) {
        const typeMatch = String(raw.tipo_propiedad).match(/^(Departamento|Casa|PH|Local|Oficina|Terreno)/i);
        propertyType = typeMatch ? typeMatch[1] : '';
    }

    // Must match the exact `Comparable` interface expected by the Web App
    const newComparable = {
      id: 'ext-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9),
      address: raw.direccion || '',
      price: priceVal,
      publicationPrice: priceVal,
      coveredSurface: coveredSurface,
      uncoveredSurface: uncoveredSurface,
      surfaceType: 'Ninguno',
      homogenizationFactor: 0.5,
      rooms: parseNumOrNull(raw.ambientes) || 1,
      bedrooms: parseNumOrNull(raw.dormitorios) || 1,
      bathrooms: parseNumOrNull(raw.banos) || 1,
      toilettes: parseNumOrNull(raw.toilettes) || 0,
      garageCount: cocheras,
      garage: cocheras > 0,
      age: parseNumOrNull(raw.antiguedad) || 0,
      disposition: raw.disposicion || '',
      orientation: raw.orientacion || '',
      expensas: extractNumericPrice(raw.expensas) || 0,
      propertyType: propertyType,
      status: 'Disponible',
    };

    await updateDoc(docRef, {
      comparables: arrayUnion(newComparable),
      updatedAt: new Date().toISOString()
    });

    console.log('[PropPick] Comparable saved to Firestore successfully');
    sendResponse({ success: true });
  } catch (err) {
    console.error('[PropPick] Failed to save to Firestore:', err);
    sendResponse({ success: false, error: err.message });
  }
}
