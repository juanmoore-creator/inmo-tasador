import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
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
      const generateCloudPdf = httpsCallable(functions, 'generateCloudPdf');

      const response = await generateCloudPdf({
        valuationId: valuation.id,
        tenantId: valuation.tenantId,
        printToken: printToken
      });

      const data = response.data as { success: boolean; storagePath: string };

      if (data.success && data.storagePath) {
        const pdfRef = ref(storage, data.storagePath);
        const downloadUrl = await getDownloadURL(pdfRef);

        // Descargar el archivo a la memoria local vía fetch para evitar que el navegador
        // intente previsualizarlo ahora que quitamos el "attachment" en el servidor.
        const responseBlob = await fetch(downloadUrl);
        const blob = await responseBlob.blob();
        const localUrl = URL.createObjectURL(blob);
        
        // Ejecutar descarga silenciosa
        const a = document.createElement('a');
        a.href = localUrl;
        a.download = `Tasacion_${valuation.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(localUrl);

        // Devolvemos el path para que el componente que llame al hook pueda generar el Link Público
        return data.storagePath;
      } else {
        throw new Error('La función no devolvió un archivo válido');
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
