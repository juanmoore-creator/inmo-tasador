import { useState, useEffect } from 'react';
import PDFGenerator from './components/PDFGenerator';
import ValuationForm from './components/ValuationForm';
import ValuationHistory from './components/ValuationHistory';
import AdminPanel from './pages/AdminPanel';
import TenantSettings from './pages/TenantSettings';
import type { SavedValuation } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import PrintView from './pages/PrintView';
import { saveValuation, subscribeUserValuations } from './services/valuationService';
import { ThemeProvider } from './contexts/ThemeContext';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import ThemeToggle from './components/ThemeToggle';
import { Shield, Settings, Plus } from 'lucide-react';
import MobileBottomNav from './components/MobileBottomNav';

function MainApp() {
  const { user, logout, isAdmin } = useAuth();
  const { tenant, isTenantOwner, loading: tenantLoading } = useTenant();
  const [saving, setSaving] = useState(false);

  // ── Multi-tab state ──
  const [activeTabId, setActiveTabId] = useState<string>('history');
  const [openTabs, setOpenTabs] = useState<SavedValuation[]>([]);
  const [tabFormStates, setTabFormStates] = useState<Record<string, SavedValuation>>({});
  const [tabSavedStates, setTabSavedStates] = useState<Record<string, SavedValuation>>({});
  const [closingTabs, setClosingTabs] = useState<string[]>([]);

  // Estado del historial
  const [valuations, setValuations] = useState<SavedValuation[]>([]);
  const [valuationsLoading, setValuationsLoading] = useState(true);
  const [valuationsError] = useState('');

  useEffect(() => {
    if (!user) {
      window.localStorage.removeItem('tasadorSession');
      window.postMessage({ type: 'TASADOR_SESSION_SYNC', payload: null }, '*');
      return;
    }
    
    // No iniciar suscripción si el tenant está cargando o no se ha determinado
    if (tenantLoading || !tenant?.id) {
      return;
    }

    setValuationsLoading(true);
    
    const unsubscribe = subscribeUserValuations(user.uid, tenant.id, (data) => {
      setValuations(data);
      setValuationsLoading(false);
      
      const payload = {
        userId: user.uid,
        valuations: data.map(v => ({
          id: v.id,
          address: v.target?.address || 'Sin dirección',
          clientName: v.clientName || 'Sin cliente'
        }))
      };

      window.localStorage.setItem('tasadorSession', JSON.stringify(payload));

      // Enviar la sesión a SrapIA
      window.postMessage({
        type: 'TASADOR_SESSION_SYNC',
        payload
      }, '*');
    });

    return () => unsubscribe();
  }, [user, isAdmin, tenant?.id, tenantLoading]);

  const isHistoryView = activeTabId === 'history';
  const isAdminView = activeTabId === 'admin';
  const isSettingsView = activeTabId === 'settings';
  const isFormView = !isHistoryView && !isAdminView && !isSettingsView;
  const currentFormData = tabFormStates[activeTabId] || null;
  const valuationData = tabSavedStates[activeTabId] || null;

  // ── Save handler ──
  const handleGenerate = async (data: SavedValuation) => {
    if (!user || !tenant?.id) return;
    setSaving(true);
    try {
      const valuationToSave: SavedValuation = { ...data };
      const savedId = await saveValuation(user.uid, tenant.id, valuationToSave);
      const savedValuation = { ...valuationToSave, id: savedId };
      setTabFormStates(prev => ({ ...prev, [activeTabId]: savedValuation }));
      setTabSavedStates(prev => ({ ...prev, [activeTabId]: savedValuation }));
    } catch (error) {
      console.error("Failed to save valuation", error);
      alert("Error al guardar la tasación.");
    } finally {
      setSaving(false);
    }
  };

  const silentSaveTab = async (tabId: string) => {
    if (!user || !tenant?.id) return;
    const formData = tabFormStates[tabId];
    if (!formData) return;
    try {
      const savedId = await saveValuation(user.uid, tenant.id, { ...formData });
      const savedValuation = { ...formData, id: savedId };
      setTabFormStates(prev => ({ ...prev, [tabId]: savedValuation }));
      setTabSavedStates(prev => ({ ...prev, [tabId]: savedValuation }));
    } catch {
      // Silent
    }
  };

  const handleSave = async () => {
    if (!currentFormData) return;
    await handleGenerate(currentFormData);
  };

  const handleFormChange = (data: SavedValuation) => {
    setTabFormStates(prev => ({ ...prev, [activeTabId]: data }));
  };

  // ── Open a history tasación as a tab ──
  const handleSelectHistory = async (data: SavedValuation) => {
    const tabId = data.id;
    if (openTabs.some(t => t.id === tabId)) {
      setActiveTabId(tabId);
      return;
    }
    if (openTabs.length >= 3) {
      const oldest = openTabs[0];
      await silentSaveTab(oldest.id);
      setOpenTabs(prev => prev.filter(t => t.id !== oldest.id));
      setTabFormStates(prev => { const n = { ...prev }; delete n[oldest.id]; return n; });
      setTabSavedStates(prev => { const n = { ...prev }; delete n[oldest.id]; return n; });
    }
    setOpenTabs(prev => [...prev, data]);
    setTabFormStates(prev => ({ ...prev, [tabId]: data }));
    setTabSavedStates(prev => ({ ...prev, [tabId]: data }));
    setActiveTabId(tabId);
  };

  const handleCloseTab = (tabId: string) => {
    silentSaveTab(tabId).catch(console.error);
    setClosingTabs(prev => [...prev, tabId]);
    if (activeTabId === tabId) setActiveTabId('history');
    setTimeout(() => {
      setOpenTabs(prev => prev.filter(t => t.id !== tabId));
      setTabFormStates(prev => { const n = { ...prev }; delete n[tabId]; return n; });
      setTabSavedStates(prev => { const n = { ...prev }; delete n[tabId]; return n; });
      setClosingTabs(prev => prev.filter(id => id !== tabId));
    }, 300);
  };

  const switchToTab = (tabId: string) => setActiveTabId(tabId);

  const getInitialDataForActiveTab = (): SavedValuation | null => {
    if (activeTabId === 'history' || activeTabId === 'admin' || activeTabId === 'settings') return null;
    return tabFormStates[activeTabId] || null;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">InmoTasador</h1>
            {isAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" />Admin
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Botón de Nueva Tasación Destacado */}
            <button
              onClick={() => switchToTab('new')}
              className={`hidden md:flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTabId === 'new'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 scale-[1.02]'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
              }`}
            >
              <Plus className="w-4 h-4" />
              Nueva Tasación
            </button>

            <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              {/* Historial */}
              <button
                onClick={() => switchToTab('history')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTabId === 'history'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
              >
                Tasaciones Guardadas
              </button>

              {/* Admin tab — solo visible para admins */}
              {isAdmin && (
                <button
                  onClick={() => switchToTab('admin')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTabId === 'admin'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </button>
              )}

              {/* Settings tab — solo visible para owners */}
              {isTenantOwner && (
                <button
                  onClick={() => switchToTab('settings')}
                  title="Configuración"
                  className={`flex items-center justify-center w-9 h-9 rounded-md transition-all ${activeTabId === 'settings'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                >
                  <Settings className="w-4.5 h-4.5" />
                </button>
              )}

              {/* Open history tabs */}
              {openTabs.map(tab => {
                const isClosing = closingTabs.includes(tab.id);
                const isActive = activeTabId === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => !isClosing && switchToTab(tab.id)}
                    className={`text-sm font-medium rounded-md transition-all duration-300 ease-in-out flex items-center gap-1.5 overflow-hidden origin-left ${isClosing
                      ? 'max-w-0 opacity-0 px-0 py-2 mx-0 -ml-1 border-none'
                      : `max-w-[180px] px-3 py-2 ${isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-600/10'
                      }`
                      }`}
                  >
                    <span className="truncate text-xs whitespace-nowrap min-w-0">
                      {tab.clientName || tab.target?.address || 'Tasación'}
                    </span>
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isClosing) handleCloseTab(tab.id);
                      }}
                      className={`shrink-0 w-4 h-4 flex items-center justify-center rounded-full text-[10px] leading-none transition-colors ${isActive
                        ? 'hover:bg-white/20 text-white/70 hover:text-white'
                        : 'hover:bg-indigo-100 dark:hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-600'
                        }`}
                    >
                      ✕
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={logout}
                className="text-sm text-slate-400 hover:text-red-500 transition-colors font-medium"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 md:py-10 pb-24 md:pb-10 flex flex-col gap-8">
        <div className="w-full">
          {isHistoryView && (
            <ValuationHistory
              onSelectValuation={handleSelectHistory}
              valuations={valuations}
              setValuations={setValuations}
              loading={valuationsLoading}
              error={valuationsError}
              showOwner={false}
            />
          )}

          {isAdminView && isAdmin && (
            <AdminPanel onSelectValuation={handleSelectHistory} />
          )}

          {isSettingsView && isTenantOwner && (
            <TenantSettings />
          )}

          {isFormView && (
            <>
              {saving && (
                <div className="fixed inset-0 z-[100] bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-200 dark:border-slate-700">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="font-semibold text-slate-800 dark:text-white">Guardando...</span>
                  </div>
                </div>
              )}
              <ValuationForm
                key={activeTabId}
                onGenerate={handleGenerate}
                initialData={getInitialDataForActiveTab()}
                onChange={handleFormChange}
              />
            </>
          )}
        </div>

        {/* Sticky footer */}
        {currentFormData && isFormView && (
          <div className="fixed bottom-[72px] md:bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-lg p-4 z-50">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${valuationData ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                  {valuationData ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm dark:text-slate-200">{valuationData ? 'Tasación guardada' : 'Tasación en progreso'}</p>
                  <p className="text-xs text-slate-400">{currentFormData.target?.address || 'Sin dirección'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50"
                  title="Guardar tasación"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Guardar
                </button>
                <PDFGenerator
                  tipo="tasacion"
                  data={valuationData || currentFormData}
                  onBeforePreview={handleSave}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                />
              </div>
            </div>
          </div>
        )}

        {currentFormData && isFormView && <div className="h-36 md:h-20"></div>}
      </main>
      <MobileBottomNav
        activeTabId={activeTabId}
        isAdmin={isAdmin}
        isTenantOwner={isTenantOwner}
        openTabs={openTabs}
        onSwitchTab={switchToTab}
        onCloseTab={handleCloseTab}
      />
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return user ? <MainApp /> : <Login />;
}

export default function App() {
  const isPrintMode = new URLSearchParams(window.location.search).has('print');
  
  if (isPrintMode) {
    return <PrintView />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <TenantProvider>
          <AppContent />
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
