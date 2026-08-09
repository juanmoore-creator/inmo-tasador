import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReportView from './ReportView';
import { Download, X, FileText, Minus, Briefcase, BookOpen, Clock } from 'lucide-react';
import { usePDFGenerator } from '../hooks/usePDFGenerator';
import PDFHistory from './PDFHistory';
import { uploadPDFVersion } from '../services/pdfHistoryService';
import { useAuth } from '../contexts/AuthContext';

import type { Comparable, PDFGeneratorProps, EditableReportData, ReportTemplateId } from '../types';
import { REPORT_TEMPLATES, TEMPLATE_ORDER } from '../config/reportTemplates';


const PDFGenerator = ({ tipo, data, target, comparables, valuation, stats, corredorName, matricula, clientName, theme, displayMode = 'text', className, onBeforePreview }: PDFGeneratorProps) => {
    const [showPreview, setShowPreview] = useState(false);
    const [showNoComparablesWarning, setShowNoComparablesWarning] = useState(false);
    const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

    // State for overrides
    const [editableReportData, setEditableReportData] = useState<EditableReportData | null>(null);
    const [editableComparables, setEditableComparables] = useState<Comparable[]>([]);

    // Template selection
    const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplateId>(
        data?.reportTemplate || 'classic'
    );

    // History panel
    const [showHistory, setShowHistory] = useState(false);

    const { user } = useAuth();

    const TEMPLATE_ICONS: Record<string, React.ElementType> = {
        FileText, Minus, Briefcase, BookOpen
    };

    // PDF generation hook
    const { generatePDF, isGenerating, progress, error } = usePDFGenerator();

    useEffect(() => {
        setMountNode(document.body);
    }, []);

    // Resolve actual data based on type (simplified for 'tasacion' only)
    const resolveData = (): any => {
        // Support both old prop spread and new 'data' prop
        const valData = data || valuation || {};

        // Fixed valuation resolution:
        // Prefer the explicit valuation prop if it has data,
        // otherwise check if it's nested in the data object (new bundle format).
        const actualValuation = (valuation && valuation.market !== undefined) ? valuation :
            (data && data.valuation) ? data.valuation :
                valData;

        return {
            target: target || valData.target,
            comparables: comparables || valData.comparables || [],
            valuation: actualValuation,
            clientName: clientName || valData.clientName || 'Cliente Final',
            corredorName: corredorName || valData.corredorName || '',
            matricula: matricula || valData.matricula || ''
        };
    };

    const resolvedData = resolveData();

    useEffect(() => {
        if (showPreview && tipo === 'tasacion' && resolvedData) {
            setEditableReportData({
                target: structuredClone(resolvedData.target),
                corredorName: resolvedData.corredorName,
                matricula: resolvedData.matricula,
                clientName: resolvedData.clientName,
                ...structuredClone(resolvedData.valuation)
            });
            setEditableComparables(structuredClone(resolvedData.comparables));
        } else {
            setEditableReportData(null);
            setEditableComparables([]);
        }
    }, [showPreview, tipo, data, target, comparables, valuation, corredorName, matricula, clientName]);

    const handleUpdateData = (path: string, value: any) => {
        setEditableReportData((prev: EditableReportData | null) => {
            if (!prev) return prev;
            const newData: any = { ...prev };
            if (path.includes('.')) {
                const parts = path.split('.');
                let current = newData;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!current[parts[i]]) current[parts[i]] = {};
                    current = current[parts[i]];
                }
                current[parts[parts.length - 1]] = value;
            } else {
                newData[path] = value;
            }
            return newData;
        });
    };

    const handleUpdateComparable = (id: string, path: string, value: any) => {
        setEditableComparables((prev: Comparable[]) => prev.map(comp => {
            if (comp.id === id) {
                return { ...comp, [path]: value };
            }
            return comp;
        }));
    };

    const handleGeneratePDF = async () => {
        const sanitizedAddress = (resolvedData?.target?.address || 'propiedad')
            .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .slice(0, 60);

        const fileName = `tasacion-${sanitizedAddress}.pdf`;

        await generatePDF({
            containerId: 'pdf-render-target',
            fileName,
            metadata: {
                title: `Informe de Tasación - ${resolvedData?.target?.address || 'Propiedad'}`,
                author: resolvedData?.corredorName || theme?.holderName || 'Corredor Inmobiliario',
                subject: 'Tasación Inmobiliaria',
                creator: theme?.companyName || 'InmoTasador',
            },
            onBlobReady: (blob, pageCount) => {
                // Fire-and-forget upload to history
                if (data?.id && data?.tenantId && user) {
                    uploadPDFVersion({
                        blob,
                        valuationId: data.id,
                        tenantId: data.tenantId,
                        fileName,
                        templateId: selectedTemplate,
                        userId: user.uid,
                        userName: user.displayName || user.email || 'Usuario',
                        pageCount,
                    }).catch(err => console.warn('PDF history upload failed:', err));
                }
            },
        });
    };

    const activeReportData = editableReportData || (resolvedData ? {
        target: resolvedData.target,
        corredorName: resolvedData.corredorName,
        matricula: resolvedData.matricula,
        clientName: resolvedData.clientName,
        ...resolvedData.valuation
    } : null);

    const activeComparables = editableComparables.length > 0 ? editableComparables : (resolvedData?.comparables || []);

    const handleOpenPreview = () => {
        // Guard: if no comparables, show warning modal
        if (activeComparables.length === 0) {
            setShowNoComparablesWarning(true);
            return;
        }
        // Open preview immediately
        setShowPreview(true);
        // Save in the background (fire and forget)
        if (onBeforePreview) {
            onBeforePreview().catch((err) => console.error('Error guardando tasación en segundo plano:', err));
        }
    };

    // Progress label for the generation bar
    const getProgressLabel = () => {
        if (!progress) return '';
        switch (progress.phase) {
            case 'preparing': return 'Preparando...';
            case 'capturing': return 'Capturando páginas...';
            case 'processing': return `Procesando página ${progress.current} de ${progress.total}`;
            case 'saving': return 'Guardando PDF...';
            case 'uploading': return 'Subiendo al historial...';
        }
    };

    const progressPercent = progress
        ? progress.total > 0
            ? Math.round((progress.current / progress.total) * 100)
            : 0
        : 0;

    return (
        <>
            <button
                onClick={handleOpenPreview}
                className={className || `flex items-center gap-2 px-4 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 disabled:shadow-none active:scale-95 border border-indigo-500/20`}
                disabled={isGenerating}
                title="Guardar y previsualizar PDF"
            >
                {isGenerating ? (
                    displayMode === 'icon' ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : 'Generando...'
                ) : (
                    <>
                        <Download className="w-5 h-5" />
                        {displayMode === 'text' && <span>Previsualizar PDF</span>}
                    </>
                )}
            </button>

            {/* Preview Modal */}
            {showPreview && createPortal(
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex flex-col animate-in fade-in duration-200">
                    <div className="bg-white border-b border-slate-200 px-6 py-3 shadow-sm z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Vista Previa del Reporte</h3>
                                <p className="text-sm text-slate-500">Elegí una plantilla y revisá los datos</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="p-2 md:px-4 md:py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                                    disabled={isGenerating}
                                >
                                    <X className="w-4 h-4" />
                                    <span className="hidden md:inline">Cancelar</span>
                                </button>
                                {data?.id && (
                                    <button
                                        onClick={() => setShowHistory(true)}
                                        className="p-2 md:px-4 md:py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                                        disabled={isGenerating}
                                    >
                                        <Clock className="w-4 h-4" />
                                        <span className="hidden md:inline">Historial</span>
                                    </button>
                                )}
                                <button
                                    onClick={handleGeneratePDF}
                                    disabled={isGenerating}
                                    className="p-2 md:px-4 md:py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm hover:shadow-md transition-colors duration-200 active:scale-95 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span className="hidden md:inline">{getProgressLabel()}</span>
                                        </>
                                    ) : (
                                        <><Download className="w-4 h-4" /> <span className="hidden md:inline">Descargar PDF</span></>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Template Selector */}
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                            {TEMPLATE_ORDER.map((tid) => {
                                const tmpl = REPORT_TEMPLATES[tid];
                                const Icon = TEMPLATE_ICONS[tmpl.icon];
                                const isActive = selectedTemplate === tid;
                                return (
                                    <button
                                        key={tid}
                                        onClick={() => setSelectedTemplate(tid)}
                                        disabled={isGenerating}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-200 whitespace-nowrap ${
                                            isActive
                                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        {Icon && <Icon className="w-3.5 h-3.5" />}
                                        <span>{tmpl.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {isGenerating && progress && (
                        <div className="bg-white border-b border-slate-100 px-6 py-2">
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${Math.max(progressPercent, 5)}%` }}
                                    />
                                </div>
                                <span className="text-xs font-medium text-slate-500 min-w-[120px] text-right">
                                    {getProgressLabel()}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error Banner */}
                    {error && (
                        <div className="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            <span className="text-sm text-red-700">{error}</span>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto bg-slate-100 p-3 md:p-8">
                        <div className="max-w-7xl mx-auto">
                            <ReportView
                                data={activeReportData}
                                properties={activeComparables}
                                valuation={activeReportData}
                                stats={stats}
                                theme={theme}
                                showAnnotations={true}
                                onUpdateData={handleUpdateData}
                                onUpdateComparable={handleUpdateComparable}
                                valuationDate={activeReportData?.valuationDate ?? activeReportData?.date}
                                templateId={selectedTemplate}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Hidden Render Target for PDF Generation (Clean version without annotations) */}
            {mountNode && createPortal(
                <div id="pdf-render-target" style={{
                    position: 'absolute',
                    left: '-10000px',
                    top: 0,
                    width: '794px',
                    zIndex: -9999,
                    visibility: 'hidden',
                }}>
                    <div>
                        <ReportView
                            data={activeReportData}
                            properties={activeComparables}
                            valuation={activeReportData}
                            stats={stats}
                            theme={theme}
                            showAnnotations={false}
                            valuationDate={activeReportData?.valuationDate ?? activeReportData?.date}
                            templateId={selectedTemplate}
                        />
                    </div>
                </div>,
                mountNode
            )}
            {/* No-Comparables Warning Modal */}
            {showNoComparablesWarning && createPortal(
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
                    onClick={() => setShowNoComparablesWarning(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Warning icon */}
                        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                        </div>

                        <div className="text-center">
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Sin comparables</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Debés agregar al menos un comparable antes de poder previsualizar el PDF. Los comparables son necesarios para generar el informe de tasación.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowNoComparablesWarning(false)}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors active:scale-95"
                        >
                            Entendido
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* PDF Version History Modal */}
            {showHistory && data?.id && createPortal(
                <PDFHistory
                    valuationId={data.id}
                    onClose={() => setShowHistory(false)}
                />,
                document.body
            )}
        </>
    );
};

export default PDFGenerator;
