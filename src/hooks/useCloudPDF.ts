import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { SavedValuation } from '../types';

export function useCloudPDF(valuation: SavedValuation | null) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async () => {
    if (!valuation) {
      setError('No hay tasación para generar PDF');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      // Generar un token temporal pseudo-aleatorio para esta solicitud
      // En un entorno de producción, esto debería guardarse en Firestore 
      // asociado al usuario/tasación para que la Cloud Function lo valide.
      const printToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      const functions = getFunctions();
      const generatePdfReport = httpsCallable(functions, 'generatePdfReport');

      const response = await generatePdfReport({
        valuationId: valuation.id,
        tenantId: valuation.tenantId,
        printToken: printToken
      });

      const data = response.data as { success: boolean; storageUrl: string; storagePath: string };

      if (data.success && data.storageUrl) {
        // Descargar el archivo o abrirlo en una nueva pestaña
        window.open(data.storageUrl, '_blank');
      } else {
        throw new Error('La función no devolvió una URL válida');
      }

    } catch (err: any) {
      console.error('Error al generar PDF en la nube:', err);
      setError(err.message || 'Error al generar el PDF de alta calidad');
    } finally {
      setIsGenerating(false);
    }
  };

  return { generatePDF, isGenerating, error };
}
