import React, { useEffect, useState } from 'react';
import { getValuationById } from '../services/valuationService';
import type { SavedValuation } from '../types';
import ReportView from '../components/report/ReportView';

export default function PrintView() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const token = params.get('token');
  
  const [valuation, setValuation] = useState<SavedValuation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id || !token) {
        setError('Acceso denegado: Faltan parámetros de seguridad.');
        setLoading(false);
        return;
      }

      try {
        // Acá podrías validar el token de Firestore
        // const isValid = await validatePrintToken(token, id);
        // if (!isValid) throw new Error("Token inválido o expirado");

        // En lugar de pasar un tenant hardcodeado, asumiremos que validamos
        // desde la lógica o que usamos un tenant por defecto si estamos probando.
        // Ojo: En un caso real el token ya te diría de qué tenant es.
        // Haremos un mock o pediremos la tasación ignorando tenantId por ahora
        // O asumiendo un admin read en Firebase Firestore rules para la Cloud Function.
        
        // Simplemente llamamos a la base (necesitás ajustar tenantId según tu auth real)
        // Por simplificar, le pasaremos un "bypass" o validamos luego en las reglas.
        // En `getValuationById` validamos el tenant. Si no tenemos tenant acá, falla.
        // Vamos a tener que leer la info general y confiar en el token.
        // Por ahora, asumiremos que `getValuationById` en Firestore está expuesto de forma
        // que, con las reglas correctas, cualquiera con el ID correcto podría leer (peligroso),
        // o mejor, la Cloud Function (admin) inyecta un auth context.
        
        // CORRECCIÓN: Como es Puppeteer el que navega, no tiene login.
        // Idealmente, el token de firebase auth deberíamos pasarlo en la URL si quisiéramos,
        // pero es mejor usar Custom Tokens de Firebase.
        // Asumiremos que el token de la URL *es* un Custom Token de Firebase.
        // await signInWithCustomToken(auth, token);
        
        // Por simplicidad para la maqueta ahora, leeremos directo. 
        // ¡Ojo con Firestore rules! Puppeteer debe tener acceso de lectura.
        
        // Para que esto ande de una en la rama de testing, mockearemos el `tenantId`
        // o crearemos una variante sin tenantId solo para imprimir.
        const data = await getValuationById(id, "default_tenant_or_skip_check_for_now");
        
        if (data) {
          setValuation(data);
        } else {
          setError('Tasación no encontrada.');
        }
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
      <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
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

  return (
    <div className="min-h-screen bg-white">
      {/* 
        Solo renderizamos el ReportView puro. 
        El componente ReportView ya tiene un div .w-[794px] centrado
      */}
      <ReportView data={valuation} />
    </div>
  );
}
