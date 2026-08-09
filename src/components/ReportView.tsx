import { useState, useEffect, useRef } from 'react';
import { useTenant } from '../contexts/TenantContext';
import CoverPage from './report/CoverPage';
import MapPage from './report/MapPage';

function useContainerWidth() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setWidth(entry.contentRect.width);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return { containerRef, width };
}
// import AgentManagerSidebar from './report/AgentManagerSidebar'; // Remove this import

import SummaryPage from './report/SummaryPage';
import PropertyDetailPage from './report/PropertyDetailPage';
import PriceSuggestionPage from './report/PriceSuggestionPage';
import AveragesPage from './report/AveragesPage';
import ContactPage from './report/ContactPage';
import ValuationSheet from './report/ValuationSheet';
import { getReportTemplate, getChunkSize } from '../config/reportTemplates';

interface AnnotatedPageProps {
    children: React.ReactNode;
    visible?: boolean;
    inputs?: {
        label: string;
        value: any;
        onChange: (val: any) => void;
        type?: 'text' | 'number' | 'textarea';
    }[];
    customSidebar?: React.ReactNode;
    totalPages?: number;
}

const AnnotatedPage = ({ children, inputs, visible, customSidebar, totalPages = 1 }: AnnotatedPageProps) => {
    const { containerRef, width: containerWidth } = useContainerWidth();
    const A4_WIDTH = 794;
    const needsScale = containerWidth > 0 && containerWidth < A4_WIDTH;
    const scale = needsScale ? containerWidth / A4_WIDTH : 1;
    const totalPagesHeight = totalPages * 1123;

    if (!visible) return <>{children}</>;
    return (
        <div className="flex flex-col md:flex-row gap-8 mb-12 justify-center items-start">
            <div ref={containerRef} className="w-full overflow-hidden">
                <div
                    style={needsScale ? {
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        width: `${A4_WIDTH}px`,
                        height: '0px',
                    } : undefined}
                >
                    <div className={`relative shadow-xl ${visible ? 'w-[794px] min-w-[794px]' : ''}`}>
                        {children}
                    </div>
                </div>
                {needsScale && (
                    <div style={{ height: `${totalPagesHeight * scale}px` }} />
                )}
            </div>
            {/* Annotation Side Panel */}
            {customSidebar ? customSidebar : (
                <div className="w-full md:w-72 pt-8 md:sticky md:top-8">
                    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-indigo-200 shadow-lg">
                        <h4 className="font-bold text-indigo-900 mb-4 uppercase text-xs tracking-wider flex items-center gap-2 border-b border-indigo-100 pb-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            Editar Datos del Reporte
                        </h4>
                        <div className="space-y-4">
                            {inputs?.map((input, i) => (
                                <div key={i} className="flex flex-col gap-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider ml-1">{input.label}</label>
                                    {input.type === 'number' ? (
                                        <input
                                            type="number"
                                            value={input.value}
                                            onChange={(e) => input.onChange(parseFloat(e.target.value) || 0)}
                                            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus-visible:outline-none font-medium"
                                        />
                                    ) : input.type === 'textarea' ? (
                                        <textarea
                                            value={input.value || ''}
                                            onChange={(e) => input.onChange(e.target.value)}
                                            rows={6}
                                            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus-visible:outline-none font-medium resize-none shadow-inner"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={input.value || ''}
                                            onChange={(e) => input.onChange(e.target.value)}
                                            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus-visible:outline-none font-medium"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        {!inputs?.length && (
                            <p className="text-xs text-slate-400 italic text-center py-2">
                                Sin campos editables en esta página
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

import type { ReportViewProps, ReportTheme } from '../types';


const ReportView = ({ data, properties, valuation, stats, theme: incomingTheme, showAnnotations = false, onUpdateData, onUpdateComparable, valuationDate, templateId }: ReportViewProps) => {
    const { reportTheme } = useTenant();
    const theme = (reportTheme || incomingTheme || null) as ReportTheme | null;
    
    // Helper to safely call update
    const update = (path: string, val: any) => {
        if (onUpdateData) onUpdateData(path, val);
    };

    const updateComp = (id: string, path: string, val: any) => {
        if (onUpdateComparable) onUpdateComparable(id, path, val);
    };

    // Resolve report template
    const template = getReportTemplate(templateId);
    const enabledPages = template.pages.filter(p => p.enabled);
    const isPageEnabled = (type: string) => enabledPages.some(p => p.type === type);

    // Dynamic pagination based on template
    const summaryChunkSize = getChunkSize(template.style.density);
    const summaryPagesCount = isPageEnabled('summary') ? Math.max(1, Math.ceil(properties.length / summaryChunkSize)) : 0;
    const propertyDetailPagesCount = isPageEnabled('property-detail') ? properties.length : 0;

    let pageCounter = 1; // Cover is always page 1
    const mapPageNum = isPageEnabled('map') ? ++pageCounter : -1;
    const summaryStartPageNum = isPageEnabled('summary') ? pageCounter + 1 : -1;
    if (summaryPagesCount > 0) pageCounter += summaryPagesCount;
    const propertiesStartPageNum = isPageEnabled('property-detail') ? pageCounter + 1 : -1;
    if (propertyDetailPagesCount > 0) pageCounter += propertyDetailPagesCount;
    const priceSuggestionPageNum = isPageEnabled('price-suggestion') ? ++pageCounter : -1;
    const averagesPageNum = isPageEnabled('averages') ? ++pageCounter : -1;
    const contactPageNum = isPageEnabled('contact') ? ++pageCounter : -1;

    return (
        <div id="report-view" className={`${showAnnotations ? "flex flex-col items-center bg-slate-200/50 py-12 min-h-screen" : ""} ${template.style.cssClass}`}>
            {isPageEnabled('cover') && (
                <AnnotatedPage visible={showAnnotations} inputs={[
                    { label: "Dirección", value: data.target?.address, onChange: (v) => update('target.address', v) },
                    { label: "Nombre del Cliente", value: data.clientName, onChange: (v) => update('clientName', v) },
                    { label: "Nombre del Corredor", value: data.corredorName, onChange: (v) => update('corredorName', v) },
                    { label: "Matrícula", value: data.matricula, onChange: (v) => update('matricula', v) },
                    { label: "Fecha del Reporte", value: data.valuationDate ? new Date(data.valuationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0], onChange: (v) => update('valuationDate', new Date(v).getTime()) },
                ]}>
                    <CoverPage data={data} theme={theme} valuationDate={valuationDate} />
                </AnnotatedPage>
            )}

            {isPageEnabled('map') && (
                <AnnotatedPage visible={showAnnotations} inputs={[
                    { label: "Dirección Referencia", value: data.target?.address, onChange: (v) => update('target.address', v) }
                ]}>
                    <MapPage properties={properties} target={data?.target} theme={theme} mapImage={data?.target?.mapImage} pageNumber={mapPageNum} />
                </AnnotatedPage>
            )}

            {isPageEnabled('summary') && (
                <AnnotatedPage visible={showAnnotations} totalPages={summaryPagesCount}>
                    <SummaryPage properties={properties} theme={theme} startPageNumber={summaryStartPageNum} valuationDate={valuationDate} />
                </AnnotatedPage>
            )}

            {isPageEnabled('property-detail') && properties.map((prop, index) => (
                <AnnotatedPage key={prop.id || index} visible={showAnnotations} inputs={[
                    { label: "Dirección", value: prop.address, onChange: (v) => updateComp(prop.id, 'address', v) },
                    { label: "Precio (USD)", value: prop.price, type: 'number', onChange: (v) => updateComp(prop.id, 'price', v) },
                    { label: "Días en Mercado", value: prop.daysOnMarket, type: 'number', onChange: (v) => updateComp(prop.id, 'daysOnMarket', v) },
                    { label: "Sup. Cubierta (m²)", value: prop.coveredSurface, type: 'number', onChange: (v) => updateComp(prop.id, 'coveredSurface', v) },
                    { label: "Sup. Descubierta (m²)", value: prop.uncoveredSurface, type: 'number', onChange: (v) => updateComp(prop.id, 'uncoveredSurface', v) },
                ]}>
                    <PropertyDetailPage property={prop} index={index} theme={theme} pageNumber={propertiesStartPageNum + index} />
                </AnnotatedPage>
            ))}

            {isPageEnabled('price-suggestion') && (
                <AnnotatedPage visible={showAnnotations} inputs={[
                    { label: "Valor Mercado (USD)", value: valuation.market, type: 'number', onChange: (v) => update('market', v) },
                    { label: "Valor Rápido (USD)", value: valuation.low, type: 'number', onChange: (v) => update('low', v) },
                    { label: "Valor Alto (USD)", value: valuation.high, type: 'number', onChange: (v) => update('high', v) },
                    { label: "Límite Venta/Prueba (USD/m²)", value: valuation.zoneLimit1 ?? '', type: 'number', onChange: (v) => update('zoneLimit1', v) },
                    { label: "Límite Prueba/No Venta (USD/m²)", value: valuation.zoneLimit2 ?? '', type: 'number', onChange: (v) => update('zoneLimit2', v) },
                ]}>
                    <PriceSuggestionPage data={valuation} stats={stats} theme={theme} properties={properties} target={data?.target} pageNumber={priceSuggestionPageNum} valuationDate={valuationDate} />
                </AnnotatedPage>
            )}

            {isPageEnabled('averages') && (
                <AnnotatedPage visible={showAnnotations} inputs={[
                    {
                        label: "Conclusión del Informe",
                        value: data.conclusion || `El análisis de mercado basado en las ${properties.length} propiedades seleccionadas indica una tendencia clara.\nLos valores obtenidos reflejan el estado actual de la oferta en la zona y sirven como base sólida\npara determinar el valor de mercado de la propiedad tasada.`,
                        type: 'textarea',
                        onChange: (v) => update('conclusion', v)
                    },
                ]}>
                    <AveragesPage properties={properties} theme={theme} conclusion={data.conclusion} pageNumber={averagesPageNum} valuationDate={valuationDate} />
                </AnnotatedPage>
            )}

            {isPageEnabled('contact') && (
                <AnnotatedPage visible={showAnnotations} inputs={[
                    { label: "Nombre del Corredor", value: data.corredorName, onChange: (v) => update('corredorName', v) },
                    { label: "Matrícula", value: data.matricula, onChange: (v) => update('matricula', v) },
                ]}>
                    <ContactPage data={data} theme={theme} pageNumber={contactPageNum} />
                </AnnotatedPage>
            )}

            {/* Annexes: ValuationSheet for 'complete' template */}
            {isPageEnabled('valuation-sheet') && properties.map((prop, index) => (
                <AnnotatedPage key={`vs-${prop.id || index}`} visible={showAnnotations}>
                    <ValuationSheet data={prop} />
                </AnnotatedPage>
            ))}
        </div>
    );
};

export default ReportView;
