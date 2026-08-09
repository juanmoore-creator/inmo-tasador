import type { AveragesPageProps } from '../../types';

const AveragesPage = ({ properties, conclusion, theme, pageNumber, valuationDate }: AveragesPageProps) => {
    const brandBlue = theme?.primary || '#3F11B2';
    const goldAccent = theme?.accent || '#C5A059';

    const count = properties.length;
    if (count === 0) return null;

    const defaultConclusion = `El análisis de mercado basado en las ${count} propiedades seleccionadas indica una tendencia clara.\nLos valores obtenidos reflejan el estado actual de la oferta en la zona y sirven como base sólida\npara determinar el valor de mercado de la propiedad tasada.`;

    const total = properties.reduce((acc, p) => {
        const hSurface = (p.coveredSurface || 0) + ((p.uncoveredSurface || 0) * (p.homogenizationFactor ?? 0.5));
        acc.price += Number(p.price || p.publicationPrice) || 0;
        acc.coveredSurface += Number(p.coveredSurface) || 0;
        acc.hSurface += hSurface;
        acc.daysOnMarket += Number(p.daysOnMarket) || 0;
        return acc;
    }, { price: 0, coveredSurface: 0, hSurface: 0, daysOnMarket: 0 });

    const avgPrice = total.price / count;
    const avgCovered = total.coveredSurface / count;
    const avgHomogenized = total.hSurface / count;
    const avgDays = total.daysOnMarket / count;
    const avgPricePerM2 = avgHomogenized > 0 ? avgPrice / avgHomogenized : 0;

    return (
        <div className="print-page h-[1123px] w-full bg-white p-12 pb-24 relative flex flex-col overflow-hidden font-sans text-slate-800">
            <div className="flex justify-between items-end mb-10 border-b-2 pb-4" style={{ borderColor: brandBlue }}>
                <h2 className="text-2xl font-bold text-slate-900">Análisis de Mercado</h2>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: goldAccent }}>{theme?.companyName || 'InmoTasador'}</span>
            </div>

            <div className="flex gap-8 mb-12">
                <div className="flex-1 bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <h3 className="text-slate-500 text-sm mb-2">Propiedades Analizadas</h3>
                    <span className="text-4xl font-bold text-slate-800">{count}</span>
                </div>
                <div className="flex-1 p-6 rounded-lg border-2" style={{ borderColor: brandBlue }}>
                    <h3 className="text-sm mb-2 opacity-70" style={{ color: brandBlue }}>Precio Promedio</h3>
                    <span className="text-4xl font-bold" style={{ color: brandBlue }}>U$S {Math.round(avgPrice).toLocaleString()}</span>
                </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-6 border-b pb-2 inline-block" style={{ borderColor: brandBlue }}>
                Detalle de Promedios
            </h3>
            <table className="w-full text-sm mb-12">
                <tbody className="divide-y divide-slate-100">
                    <tr>
                        <td className="py-3 text-slate-600">Precio de Venta</td>
                        <td className="py-3 text-right font-bold" style={{ color: brandBlue }}>U$S {Math.round(avgPrice).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td className="py-3 text-slate-600">Precio por m² (Homogenizado)</td>
                        <td className="py-3 text-right font-bold" style={{ color: goldAccent }}>U$S {Math.round(avgPricePerM2).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td className="py-3 text-slate-600">Superficie Cubierta Promedio</td>
                        <td className="py-3 text-right font-medium text-slate-800">{Math.round(avgCovered)} m²</td>
                    </tr>
                    <tr>
                        <td className="py-3 text-slate-600">Superficie Homogenizada Promedio</td>
                        <td className="py-3 text-right font-medium text-slate-800">{Math.round(avgHomogenized)} m²</td>
                    </tr>
                    <tr>
                        <td className="py-3 text-slate-600">Días en el Mercado</td>
                        <td className="py-3 text-right font-medium text-slate-800">{Math.round(avgDays)} días</td>
                    </tr>
                </tbody>
            </table>

            <div className="p-6 bg-slate-50 border-l-4 text-slate-600 text-sm leading-relaxed rounded-r-lg" style={{ borderColor: brandBlue }}>
                <h4 className="font-bold mb-2" style={{ color: brandBlue }}>Conclusión del Análisis</h4>
                <div className="whitespace-pre-wrap">
                    {conclusion || defaultConclusion}
                </div>
            </div>

            <div className="absolute bottom-12 left-12 right-12 pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-400 bg-white z-10">
                <span>Reporte generado el {(valuationDate ? new Date(valuationDate) : new Date()).toLocaleDateString()}</span>
                <span>Página {pageNumber}</span>
            </div>
        </div>
    );
};

export default AveragesPage;
