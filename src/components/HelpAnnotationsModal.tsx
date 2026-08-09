import { useState, useEffect } from 'react';
import { getAnnotations } from '../services/annotationService';
import type { Annotation } from '../types';
import { X, BookOpen, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';

interface HelpAnnotationsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function HelpAnnotationsModal({ isOpen, onClose }: HelpAnnotationsModalProps) {
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setError('');
        getAnnotations()
            .then(data => {
                setAnnotations(data);
                // Auto-expandir la primera si hay solo una
                if (data.length === 1) setExpandedId(data[0].id);
            })
            .catch(() => setError('No se pudieron cargar las anotaciones.'))
            .finally(() => setLoading(false));
    }, [isOpen]);

    // Cerrar con Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center gap-3 p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-600/20 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Notas de Ayuda</h2>
                        <p className="text-xs text-slate-400">Anotaciones del administrador</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {loading && (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {!loading && !error && annotations.length === 0 && (
                        <div className="text-center py-10">
                            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No hay anotaciones de ayuda disponibles aún.</p>
                        </div>
                    )}

                    {!loading && annotations.map((ann) => {
                        const isExpanded = expandedId === ann.id;
                        return (
                            <div
                                key={ann.id}
                                className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-all"
                            >
                                {/* Accordion Header */}
                                <button
                                    type="button"
                                    onClick={() => setExpandedId(isExpanded ? null : ann.id)}
                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        {ann.title}
                                    </span>
                                    {isExpanded
                                        ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                                        : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                    }
                                </button>

                                {/* Accordion Content */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150">
                                        <div className="h-px bg-slate-100 dark:bg-slate-800 mb-3" />
                                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                                            {ann.content}
                                        </p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-3">
                                            Actualizado: {new Date(ann.updatedAt).toLocaleDateString('es-AR', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
