import type { SummaryPageProps } from '../../types';

const SummaryPage = ({ properties, theme, startPageNumber = 3, valuationDate }: SummaryPageProps) => {
    const brandBlue = theme?.primary || '#3F11B2';
    const goldAccent = theme?.accent || '#C5A059';

    // Chunk properties into groups of 12 for pagination
    // (14 rows at py-5 overflow the 979px available; 12 rows at py-3 fits comfortably)
    const chunkSize = 12;
    const chunks = [];
    for (let i = 0; i < properties.length; i += chunkSize) {
        chunks.push(properties.slice(i, i + chunkSize));
    }

    // If no properties, still show one empty page
    const displayChunks = chunks.length > 0 ? chunks : [[]];

    return (
        <>
            {displayChunks.map((chunk, pageIndex) => (
                <div key={pageIndex} className="print-page h-[1123px] w-full bg-white p-12 pb-24 relative flex flex-col overflow-hidden font-sans">
                    <div className="flex justify-between items-end mb-10 border-b-2 pb-4" style={{ borderColor: brandBlue }}>
                        <h2 className="text-2xl font-bold text-slate-900">Resumen de Comparables</h2>
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: goldAccent }}>{theme?.companyName || 'InmoTasador'}</span>
                    </div>

                    {pageIndex === 0 && (
                        <p className="text-sm text-slate-500 mb-8 max-w-lg">
                            Propiedades seleccionadas como referencia para el análisis comparativo de mercado.
                        </p>
                    )}

                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="border-b-2" style={{ borderColor: `${brandBlue}20` }}>
                                <th className="py-3 pr-4 text-xs font-bold uppercase tracking-wider text-slate-400 w-10">#</th>
                                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Dirección</th>
                                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Estado</th>
                                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Sup. m²</th>
                                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Factor</th>
                                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Precio USD</th>
                                <th className="py-3 pl-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">$/m²</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {chunk.map((p, i) => {
                                const globalIndex = (pageIndex * chunkSize) + i;
                                const hSurface = (p.coveredSurface || 0) + ((p.uncoveredSurface || 0) * (p.homogenizationFactor ?? 0.5));
                                const pricePerM2 = hSurface > 0 ? Math.round(p.price / hSurface) : 0;
                                return (
                                    <tr key={p.id || globalIndex}>
                                        <td className="py-3 pr-4 text-slate-300 font-bold">{globalIndex + 1}</td>
                                        <td className="py-3 px-4">
                                            <p className="font-semibold text-slate-800">{p.address}</p>
                                            <p className="text-xs text-slate-400">{p.zone || 'Zona Urbana'}</p>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {(() => {
                                                const text = p.status || 'Disponible';
                                                const w = Math.max(60, text.length * 6.5 + 24);
                                                return (
                                                    <div style={{ display: 'inline-block', width: `${w}px`, height: '22px' }}>
                                                        <svg width="100%" height="100%" viewBox={`0 0 ${w} 22`} xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                                                            <rect width={w} height="22" rx="11" fill="#eef2ff" />
                                                            <text 
                                                                x="50%" y="54%" 
                                                                dominantBaseline="middle" textAnchor="middle" 
                                                                fill="#4f46e5" fontSize="11" fontWeight="600" 
                                                                fontFamily="system-ui, -apple-system, sans-serif"
                                                            >
                                                                {text}
                                                            </text>
                                                        </svg>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="py-3 px-4 text-right text-slate-600 font-medium">{p.coveredSurface} m²</td>
                                        <td className="py-3 px-4 text-right text-slate-600 font-medium">{p.homogenizationFactor ?? 0.5}</td>
                                        <td className="py-3 px-4 text-right font-bold whitespace-nowrap" style={{ color: brandBlue }}>
                                            U$S {p.price?.toLocaleString()}
                                        </td>
                                        <td className="py-3 pl-4 text-right font-bold" style={{ color: goldAccent }}>
                                            {pricePerM2.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="absolute bottom-12 left-12 right-12 pt-6 border-t border-slate-100 flex justify-between text-xs text-slate-400 bg-white z-10">
                        <span>Reporte generado el {(valuationDate ? new Date(valuationDate) : new Date()).toLocaleDateString()}</span>
                        <span>Página {startPageNumber + pageIndex}</span>
                    </div>
                </div>
            ))}
        </>
    );
};

export default SummaryPage;
