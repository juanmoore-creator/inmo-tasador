import { useState, useEffect } from 'react';
import { Download, Trash2, Clock, X, Loader2 } from 'lucide-react';
import { getPDFVersions, downloadPDFVersion, deletePDFVersion } from '../services/pdfHistoryService';
import type { PDFVersion } from '../services/pdfHistoryService';
import { REPORT_TEMPLATES } from '../config/reportTemplates';

interface PDFHistoryProps {
    valuationId: string;
    onClose: () => void;
}

const PDFHistory = ({ valuationId, onClose }: PDFHistoryProps) => {
    const [versions, setVersions] = useState<PDFVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    useEffect(() => {
        loadVersions();
    }, [valuationId]);

    const loadVersions = async () => {
        setLoading(true);
        try {
            const data = await getPDFVersions(valuationId);
            setVersions(data);
        } catch (err) {
            console.error('Error loading PDF history:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (version: PDFVersion) => {
        setDownloading(version.id);
        try {
            await downloadPDFVersion(version);
        } catch (err) {
            console.error('Error downloading version:', err);
        } finally {
            setDownloading(null);
        }
    };

    const handleDelete = async (version: PDFVersion) => {
        setDeleting(version.id);
        try {
            await deletePDFVersion(version);
            setVersions(prev => prev.filter(v => v.id !== version.id));
        } catch (err) {
            console.error('Error deleting version:', err);
        } finally {
            setDeleting(null);
            setConfirmDelete(null);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getTemplateName = (id: string) =>
        REPORT_TEMPLATES[id as keyof typeof REPORT_TEMPLATES]?.name || id;

    const getEditSummary = (edits?: Record<string, any>) => {
        if (!edits || Object.keys(edits).length === 0) return null;
        const fields = Object.keys(edits);
        if (fields.length <= 3) return fields.join(', ');
        return `${fields.slice(0, 3).join(', ')} +${fields.length - 3} más`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-bold text-slate-800">Historial de Versiones</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">No hay versiones anteriores</p>
                            <p className="text-xs text-slate-400 mt-1">Las versiones se guardan automáticamente al generar un PDF</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {versions.map((version, index) => (
                                <div
                                    key={version.id}
                                    className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-slate-200 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                    v{versions.length - index}
                                                </span>
                                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                                    {getTemplateName(version.templateId)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 font-medium">
                                                {formatDate(version.generatedAt)}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {version.generatedByName} · {version.pageCount} pág. · {formatSize(version.fileSizeBytes)}
                                            </p>
                                            {getEditSummary(version.edits) && (
                                                <p className="text-xs text-amber-600 mt-1">
                                                    ✏️ Editado: {getEditSummary(version.edits)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => handleDownload(version)}
                                                disabled={downloading === version.id}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Descargar"
                                            >
                                                {downloading === version.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Download className="w-4 h-4" />
                                                )}
                                            </button>

                                            {confirmDelete === version.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleDelete(version)}
                                                        disabled={deleting === version.id}
                                                        className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        {deleting === version.id ? '...' : 'Sí'}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(null)}
                                                        className="px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDelete(version.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
                    <p className="text-xs text-slate-400 text-center">
                        Se guardan las últimas 5 versiones automáticamente
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PDFHistory;
