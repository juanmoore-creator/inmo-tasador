import { useEffect, useState } from 'react';
import type { SavedValuation, TenantConfig, ReportTheme } from '../types';
import ReportView from '../components/ReportView';
import { TenantContext } from '../contexts/TenantContext';

export default function PrintView() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const token = params.get('token');
  
  const [valuation, setValuation] = useState<SavedValuation | null>(null);
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Fijarse si Puppeteer nos inyectó los datos desde el Backend!
        // @ts-ignore
        if (window.__INJECTED_VALUATION_DATA__) {
          // @ts-ignore
          setValuation(window.__INJECTED_VALUATION_DATA__);
          
          // @ts-ignore
          if (window.__INJECTED_TENANT_DATA__) {
            // @ts-ignore
            setTenant(window.__INJECTED_TENANT_DATA__);
          }
          
          setLoading(false);
          return;
        }

        // Si no tenemos datos inyectados (por ejemplo, desarrollo local)
        // requerimos los params
        if (!id || !token) {
          setError('Acceso denegado: Faltan parámetros de seguridad o datos inyectados.');
          setLoading(false);
          return;
        }

        setError('Acceso denegado: Datos no inyectados en ventana de impresión.');
        
      } catch (err: any) {
        setError('Error al cargar la tasación: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, token]);

  if (error) {
    return (
      <div id="print-error" className="flex h-screen items-center justify-center bg-gray-100 p-4">
        <div className="rounded-lg bg-red-50 p-6 shadow-md border border-red-200 text-red-700">
          <h2 className="text-xl font-bold mb-2">Error de Acceso</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !valuation) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl text-gray-500 animate-pulse">
          Preparando documento para impresión...
        </div>
      </div>
    );
  }

  const reportTheme: ReportTheme | null = tenant ? {
      primary: tenant.branding.colors.primary,
      primaryDark: tenant.branding.colors.primaryDark,
      primaryLight: tenant.branding.colors.primaryLight,
      accent: tenant.branding.colors.accent,
      logoUrl: tenant.branding.logoUrl,
      companyName: tenant.branding.companyName,
      companyLegalName: tenant.branding.companyLegalName,
      holderName: tenant.institutional.holderName,
      professionalTitle: tenant.institutional.professionalTitle,
      registrationLabel: tenant.institutional.registrationNumber ? 
          `Matrícula ${tenant.institutional.registrationBody} Nro ${tenant.institutional.registrationNumber}` : 
          tenant.institutional.professionalTitle,
      phone: tenant.institutional.phone,
      email: tenant.institutional.email,
      address: tenant.institutional.address,
      city: tenant.institutional.city,
      website: tenant.institutional.website,
  } : null;

  return (
    <div id="print-ready" className="min-h-screen bg-white">
      {/* 
        Solo renderizamos el ReportView puro. 
        El componente ReportView ya tiene un div .w-[794px] centrado
      */}
      <TenantContext.Provider value={{ tenant, reportTheme, isTenantOwner: false, loading: false, error: null }}>
        <ReportView 
          data={valuation as any} 
          properties={valuation.comparables || []}
          valuation={valuation as any}
        />
      </TenantContext.Provider>
    </div>
  );
}
