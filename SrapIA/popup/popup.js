// ============================================================
// PropPick — Popup Controller
// Triggers extraction in background and displays results
// ============================================================

(() => {
  'use strict';

  // ── DOM References ────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);

  const dom = {
    // Screens
    screenExtract: $('#screen-extract'),
    screenSettings: $('#screen-settings'),
    // Buttons
    btnExtract: $('#btn-extract'),
    btnSettings: $('#btn-settings'),
    btnBack: $('#btn-back'),
    btnSaveKey: $('#btn-save-key'),
    // Status
    statusCard: $('#status-card'),
    statusIcon: $('#status-icon'),
    statusText: $('#status-text'),
    // Progress
    progress: $('#progress'),
    progressBar: $('#progress-bar'),
    progressLabel: $('#progress-label'),
    // Results
    results: $('#results'),
    resultsContent: $('#results-content'),
    // Export
    exportSection: $('#export-section'),
    btnExport: $('#btn-export'),
    btnExportText: $('#btn-export-text'),
    exportHint: $('#export-hint'),
    // Settings
    inputApiKey: $('#input-api-key'),
    settingsFeedback: $('#settings-feedback'),
  };

  // ── State ─────────────────────────────────────────────────
  let isProcessing = false;
  let lastExtractedData = null;
  let tasadorTabId = null;

  // ── Init ──────────────────────────────────────────────────
  init();

  function init() {
    dom.btnExtract.addEventListener('click', handleExtract);
    dom.btnSettings.addEventListener('click', () => switchScreen('settings'));
    dom.btnBack.addEventListener('click', () => switchScreen('extract'));
    dom.btnSaveKey.addEventListener('click', handleSaveApiKey);
    dom.btnExport.addEventListener('click', handleExport);

    // Listen for progress updates from background
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'EXTRACTION_PROGRESS') {
        if (message.pct !== undefined) updateProgress(message.pct, message.label);
        if (message.status) updateStatus('processing', message.status);
      }
    });

    // Load existing API key
    loadApiKey();

    // Restore last extracted data if it exists
    chrome.storage.local.get(['lastExtractedData'], (result) => {
      if (result.lastExtractedData) {
        lastExtractedData = result.lastExtractedData;
        updateStatus('success', 'Mostrando última propiedad extraída.');
        displayResults(lastExtractedData);
        detectTasadorSession();
      }
    });
  }

  // ── Screen Navigation ─────────────────────────────────────
  function switchScreen(screen) {
    dom.screenExtract.classList.toggle('screen--active', screen === 'extract');
    dom.screenSettings.classList.toggle('screen--active', screen === 'settings');
  }

  // ── API Key Management ────────────────────────────────────
  async function loadApiKey() {
    const response = await sendMessage({ type: 'GET_API_KEY' });
    if (response?.success && response.apiKey) {
      dom.inputApiKey.value = response.apiKey;
    }
  }

  async function handleSaveApiKey() {
    const apiKey = dom.inputApiKey.value.trim();
    if (!apiKey) {
      showFeedback('error', 'Ingresa una API Key válida.');
      return;
    }

    const response = await sendMessage({ type: 'SAVE_API_KEY', apiKey });
    if (response?.success) {
      showFeedback('success', '✓ API Key guardada correctamente.');
    } else {
      showFeedback('error', `Error: ${response?.error || 'desconocido'}`);
    }
  }

  function showFeedback(type, message) {
    dom.settingsFeedback.style.display = 'block';
    dom.settingsFeedback.className = `feedback feedback--${type}`;
    dom.settingsFeedback.textContent = message;
    setTimeout(() => { dom.settingsFeedback.style.display = 'none'; }, 4000);
  }

  // ── Main Extraction Flow ──────────────────────────────────
  async function handleExtract() {
    if (isProcessing) return;
    isProcessing = true;

    dom.btnExtract.disabled = true;
    dom.results.style.display = 'none';
    showProgress(true);
    updateStatus('processing', 'Iniciando extracción...');
    updateProgress(2, 'Preparando...');

    try {
      // Get active tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No se encontró la pestaña activa.');

      // Send everything to background — it handles the full flow
      const result = await sendMessage({
        type: 'START_EXTRACTION',
        tabId: tab.id,
        windowId: tab.windowId,
      });

      if (!result?.success) {
        throw new Error(result?.error || 'Error desconocido en la extracción.');
      }

      updateProgress(100, '¡Extracción completada!');
      updateStatus('success', '¡Datos extraídos exitosamente!');
      lastExtractedData = result.data;
      // Attach source URL for the tasador
      lastExtractedData._sourceUrl = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.url || '';
      
      // Save to storage so it persists if popup is closed
      chrome.storage.local.set({ lastExtractedData });

      displayResults(result.data);
      await detectTasadorSession();

    } catch (err) {
      console.error('[PropPick] Extraction error:', err);
      updateStatus('error', err.message);
      updateProgress(0);
      showProgress(false);
    } finally {
      isProcessing = false;
      dom.btnExtract.disabled = false;
    }
  }

  // ── Tasador Detection & Export ────────────────────────────
  async function detectTasadorSession() {
    dom.exportSection.style.display = 'block';

    const result = await chrome.storage.local.get(['tasadorSession']);
    const session = result.tasadorSession;
    
    const noSessionMsg = $('#no-session-msg');
    const activeSession = $('#active-session');
    const select = $('#valuation-select');
    
    select.innerHTML = '<option value="">Selecciona una tasación...</option>';

    if (session && session.userId) {
      noSessionMsg.style.display = 'none';
      activeSession.style.display = 'block';
      
      if (session.valuations && session.valuations.length > 0) {
        dom.btnExport.disabled = true; // Disabled until selection
        dom.btnExportText.textContent = 'Guardar en Firestore';
        dom.exportHint.textContent = 'Seleccioná la tasación y guardá.';
        dom.exportHint.className = 'export-hint export-hint--ready';
        
        session.valuations.forEach(val => {
          const option = document.createElement('option');
          option.value = val.id;
          option.textContent = `${val.address} (${val.clientName})`;
          select.appendChild(option);
        });
        
        select.addEventListener('change', (e) => {
          dom.btnExport.disabled = !e.target.value;
        });
      } else {
        dom.btnExport.disabled = true;
        dom.btnExportText.textContent = 'Sin tasaciones';
        dom.exportHint.textContent = 'No tenés tasaciones. Creá una en la web primero.';
        dom.exportHint.className = 'export-hint export-hint--warn';
      }
    } else {
      noSessionMsg.style.display = 'block';
      activeSession.style.display = 'none';
      dom.btnExport.disabled = true;
      dom.btnExportText.textContent = 'Sin sesión activa';
      dom.exportHint.textContent = 'Abrí la aplicación web de tasaciones, iniciá sesión y volvé a extraer.';
      dom.exportHint.className = 'export-hint export-hint--warn';
    }
  }

  async function handleExport() {
    const valuationId = $('#valuation-select').value;
    if (!valuationId || !lastExtractedData) return;

    dom.btnExport.disabled = true;
    dom.btnExportText.textContent = 'Guardando...';

    try {
      // Send data to background script to save directly to Firestore
      const response = await sendMessage({
        type: 'SAVE_COMPARABLE_TO_FIRESTORE',
        payload: {
          valuationId: valuationId,
          propertyData: lastExtractedData
        }
      });

      if (response?.success) {
        dom.btnExportText.textContent = '✓ ¡Guardado con éxito!';
        dom.btnExport.classList.add('btn--export-success');
        dom.exportHint.textContent = 'El comparable fue guardado directo en Firestore.';
        dom.exportHint.className = 'export-hint export-hint--success';
        setTimeout(() => {
          dom.btnExportText.textContent = 'Guardar en Firestore';
          dom.btnExport.classList.remove('btn--export-success');
          dom.btnExport.disabled = false;
        }, 3000);
      } else {
        throw new Error(response?.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('[PropPick] Export error:', err);
      dom.btnExportText.textContent = 'Error al exportar';
      dom.exportHint.textContent = err.message;
      dom.exportHint.className = 'export-hint export-hint--warn';
      setTimeout(() => {
        dom.btnExportText.textContent = 'Guardar en Firestore';
        dom.btnExport.disabled = false;
      }, 3000);
    }
  }

  // ── Display Results ───────────────────────────────────────
  function displayResults(data) {
    dom.resultsContent.innerHTML = '';
    dom.results.style.display = 'block';

    // Field labels map (for display)
    const labels = {
      direccion: 'Dirección',
      precio: 'Precio',
      estado: 'Estado',
      tipo_propiedad: 'Tipo de Propiedad',
      antiguedad: 'Antigüedad',
      expensas: 'Expensas',
      superficie_cubierta: 'Sup. Cubierta (m²)',
      superficie_total: 'Sup. Total (m²)',
      ambientes: 'Ambientes',
      dormitorios: 'Dormitorios',
      banos: 'Baños',
      toilettes: 'Toilettes',
      cocheras: 'Cocheras',
      disposicion: 'Disposición',
      orientacion: 'Orientación',
      coordenadas: 'Coordenadas (Lat, Long)',
      amenities: 'Amenities',
      equipamiento: 'Equipamiento',
      apto_credito: 'Apto Crédito',
      apto_profesional: 'Apto Profesional',
    };

    for (const [key, value] of Object.entries(data)) {
      const item = document.createElement('div');
      item.className = 'result-item';

      const label = document.createElement('span');
      label.className = 'result-item__label';
      label.textContent = labels[key] || key;

      const val = document.createElement('span');
      if (value === null || value === undefined) {
        val.className = 'result-item__value result-item__value--null';
        val.textContent = 'No disponible';
      } else {
        val.className = 'result-item__value';
        val.textContent = String(value);
      }

      item.appendChild(label);
      item.appendChild(val);
      dom.resultsContent.appendChild(item);
    }
  }

  // ── UI Helpers ────────────────────────────────────────────
  function updateStatus(state, text) {
    dom.statusCard.className = `status-card status-card--${state}`;
    dom.statusText.textContent = text;

    const icons = {
      processing: `<div class="spinner"></div>`,
      success: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18457 2.99721 7.13633 4.39828 5.49707C5.79935 3.85782 7.69279 2.71538 9.79619 2.24015C11.8996 1.76491 14.1003 1.98234 16.07 2.86" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      error: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    };
    dom.statusIcon.innerHTML = icons[state] || icons.processing;
  }

  function showProgress(visible) {
    dom.progress.style.display = visible ? 'block' : 'none';
    dom.progressLabel.style.display = visible ? 'block' : 'none';
  }

  function updateProgress(pct, label) {
    dom.progressBar.style.width = `${pct}%`;
    if (label) dom.progressLabel.textContent = label;
  }

  // ── Messaging ─────────────────────────────────────────────
  function sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
})();
