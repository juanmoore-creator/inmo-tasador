import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { deleteValuation } from '../services/valuationService';
import type { SavedValuation } from '../types';
import { FileText, MapPin, Loader2, Trash2, AlertTriangle, X } from 'lucide-react';

interface ValuationHistoryProps {
    onSelectValuation: (valuation: SavedValuation) => void;
    valuations: SavedValuation[];
    setValuations: Dispatch<SetStateAction<SavedValuation[]>>;
    loading: boolean;
    error: string;
    showOwner?: boolean; // admin: muestra el userId/email del propietario
}

export default function ValuationHistory({ onSelectValuation, valuations, setValuations, loading, error, showOwner = false }: ValuationHistoryProps) {
    const [pendingDelete, setPendingDelete] = useState<SavedValuation | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleDeleteConfirm = async () => {
        if (!pendingDelete?.id) return;
        setDeleting(true);
        try {
            await deleteValuation(pendingDelete.id);
            setValuations(prev => prev.filter(v => v.id !== pendingDelete.id));
            setPendingDelete(null);
        } catch {
            alert('Error al eliminar la tasación. Intenta de nuevo.');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">{error}</div>;
    }

    if (valuations.length === 0) {
        return (
            <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No hay tasaciones previas</h3>
                <p className="text-slate-400 mt-2 text-sm">Crea tu primera tasación para verla aquí.</p>
            </div>
        );
    }

    return (
        <>
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Tasaciones Realizadas</h2>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {valuations.map((valuation) => (
                        <div
                            key={valuation.id}
                            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group"
                        >
                            {/* Delete button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPendingDelete(valuation);
                                }}
                                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 transition-all z-10"
                                title="Eliminar tasación"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Card content — clickable area */}
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => onSelectValuation(valuation)}
                                className="cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-4 pr-6">
                                    <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                                        {valuation.clientName || 'Sin Cliente'}
                                    </h3>
                                    <span className="text-xs text-slate-400 font-medium shrink-0 ml-2">
                                        {new Date(valuation.date || (valuation as any).createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>

                                {showOwner && (valuation as any).userId && (
                                    <div className="mb-2">
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 rounded-full px-2 py-0.5">
                                            👤 {(valuation as any).userId}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="line-clamp-1">{valuation.target.address}</span>
                                </div>

                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-slate-400 mb-0.5">Valor de Mercado</p>
                                        <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                            U$S {valuation.valuation?.market?.toLocaleString() || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-600/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all">
                                        →
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Delete confirmation modal */}
            {pendingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => !deleting && setPendingDelete(null)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                        {/* Close button */}
                        <button
                            onClick={() => setPendingDelete(null)}
                            disabled={deleting}
                            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-all disabled:opacity-50"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Icon */}
                        <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-500 dark:text-red-400" />
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-1">
                            Eliminar tasación
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-1">
                            ¿Estás seguro que deseas eliminar la tasación de
                        </p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 text-center mb-6 line-clamp-1">
                            {pendingDelete.clientName || 'Sin Cliente'}
                        </p>
                        <p className="text-xs text-slate-400 text-center mb-6 -mt-4">
                            Esta acción no se puede deshacer.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setPendingDelete(null)}
                                disabled={deleting}
                                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                {deleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
