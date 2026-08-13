import { useEffect, useState } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { getShareLinkData } from '../services/shareService';
import { Download } from 'lucide-react';

export default function SharedPdfViewer() {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUrl = async () => {
            try {
                const params = new URLSearchParams(window.location.search);
                const shareId = params.get('share');
                
                if (!shareId) {
                    throw new Error('Enlace inválido o incompleto.');
                }

                let storagePath = '';
                
                // Intentamos buscarlo en Firestore (link corto nuevo)
                if (shareId.length === 6) {
                    const dbPath = await getShareLinkData(shareId);
                    if (dbPath) {
                        storagePath = dbPath;
                    } else {
                        throw new Error('El enlace corto ha caducado o no existe.');
                    }
                } else {
                    // Fallback para enlaces largos en Base64 antiguos
                    try {
                        storagePath = atob(shareId);
                    } catch (e) {
                        throw new Error('Enlace inválido.');
                    }
                }

                const pdfRef = ref(storage, storagePath);
                const downloadUrl = await getDownloadURL(pdfRef);
                
                setPdfUrl(downloadUrl);
            } catch (err: any) {
                console.error(err);
                setError('El enlace es inválido, ha caducado o el archivo ya no existe.');
            } finally {
                setLoading(false);
            }
        };

        fetchUrl();
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-900 text-white">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin mb-4" />
                <p className="text-slate-400 text-sm font-medium animate-pulse">Abriendo documento seguro...</p>
            </div>
        );
    }

    if (error || !pdfUrl) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-900 p-4">
                <div className="rounded-2xl bg-slate-800 p-8 shadow-2xl border border-slate-700 text-center max-w-md w-full">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Acceso Denegado</h2>
                    <p className="text-slate-400 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen w-screen bg-slate-900 overflow-hidden">
            {/* Header / Toolbar */}
            <div className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 shrink-0 shadow-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <span className="text-white font-bold tracking-wide">Reporte de Tasación</span>
                </div>
                <a 
                    href={pdfUrl}
                    download
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Descargar Copia</span>
                </a>
            </div>

            {/* Document Viewer (Nativo vía iframe sin toolbar=0 para permitir que Chrome muestre sus controles) */}
            <div className="flex-1 w-full bg-slate-900 relative">
                {/* Fallback info for mobile devices where iframe PDF doesn't work */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center sm:hidden -z-10">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700 shadow-xl">
                        <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Tu informe está listo</h3>
                    <p className="text-slate-400 text-sm mb-6">Toca el botón superior para descargar y abrir el PDF en tu dispositivo.</p>
                </div>
                
                <iframe 
                    src={pdfUrl} 
                    className="w-full h-full border-none bg-white"
                    title="Visor de Tasación"
                />
            </div>
        </div>
    );
}
