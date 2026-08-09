import type { PriceSuggestionPageProps } from '../../types';


// ─── helpers compartidas ────────────────────────────────────────────────────

/** Precio por m² homogenizado de un comparable */
function pricePerM2(p: any): number {
    const hSurface =
        (p.coveredSurface || 0) +
        (p.uncoveredSurface || 0) * (p.homogenizationFactor ?? 0.5);
    if (hSurface <= 0) return 0;
    return (p.price || p.publicationPrice || 0) / hSurface;
}

/** Superficie homogenizada de la propiedad objetivo */
function calcTargetHS(target: any): number {
    return (
        (target?.coveredSurface || 0) +
        (target?.uncoveredSurface || 0) * (target?.homogenizationFactor ?? 0.5)
    );
}

// ─── Colores de zona ─────────────────────────────────────────────────────────
const ZONE_COLOR = {
    venta:   { bar: '#3a8a3a', bg: '#e6f4e6', text: '#2a6a2a', label: 'ZONA DE VENTA' },
    prueba:  { bar: '#b8b800', bg: '#fafae0', text: '#7a7a00', label: 'ZONA DE PRUEBA' },
    noVenta: { bar: '#cc3333', bg: '#fae6e6', text: '#aa1111', label: 'ZONA DE NO VENTA' },
} as const;
type Zone = keyof typeof ZONE_COLOR;

// ─── Subcomponente: gráfico de barras SVG ────────────────────────────────────

interface ChartProps {
    properties: any[];
    target: any;
    limit1: number;
    limit2: number;
}

const MarketBarChart = ({ properties, target, limit1, limit2 }: ChartProps) => {
    const prices = properties.map(pricePerM2).filter(v => v > 0);
    if (prices.length === 0) return null;

    const tHS = calcTargetHS(target);

    const minP = Math.floor(Math.min(...prices) / 100) * 100;
    const maxP = Math.ceil (Math.max(...prices) / 100) * 100;
    const BIN_W = 200;
    const start = Math.floor(minP / BIN_W) * BIN_W;
    const end   = Math.ceil (maxP / BIN_W) * BIN_W;

    type Bin = { from: number; to: number; count: number; zone: Zone };

    // Generar puntos de corte: grid regular + límites de zona
    const gridPoints = new Set<number>();
    for (let f = start; f <= end; f += BIN_W) gridPoints.add(f);
    if (limit1 > start && limit1 < end) gridPoints.add(limit1);
    if (limit2 > start && limit2 < end) gridPoints.add(limit2);
    const breakpoints = Array.from(gridPoints).sort((a, b) => a - b);

    const bins: Bin[] = [];
    for (let i = 0; i < breakpoints.length - 1; i++) {
        const from = breakpoints[i];
        const to   = breakpoints[i + 1];
        const zone: Zone =
            from < limit1 ? 'venta' :
            from <= limit2 ? 'prueba' : 'noVenta';
        const count = prices.filter(v => v >= from && v < to).length;
        bins.push({ from, to, count, zone });
    }

    const maxCount = Math.max(...bins.map(b => b.count), 1);

    // ── dimensiones SVG ──────────────────────────────────────────────────────
    const SVG_W  = 600;
    const SVG_H  = 270;
    const PAD_L  = 50;
    const PAD_B  = 42;
    const PAD_T  = 20;
    const PAD_R  = tHS > 0 ? 130 : 16; // espacio para la nota de superficie
    const chartW = SVG_W - PAD_L - PAD_R;
    const chartH = SVG_H - PAD_T - PAD_B;
    const nBins  = bins.length || 1;
    const barW   = Math.max(10, Math.floor(chartW / nBins) - 6);
    const xCenter = (i: number) => PAD_L + (i + 0.5) * (chartW / nBins);
    const yScale  = (count: number) => chartH - (count / maxCount) * chartH * 0.88;
    const yTicks  = Array.from({ length: maxCount + 1 }, (_, i) => i);

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Nota de superficie del inmueble */}
            {tHS > 0 && (
                <div style={{
                    position: 'absolute',
                    top: PAD_T,
                    right: 4,
                    width: PAD_R - 10,
                    background: 'white',
                    border: '1.5px solid #bbb',
                    borderRadius: 6,
                    padding: '5px 8px',
                    fontSize: 10,
                    lineHeight: 1.4,
                    color: '#444',
                    textAlign: 'center',
                }}>
                    <span style={{ fontWeight: 700, display: 'block' }}>Superficie</span>
                    <span style={{ fontWeight: 700, display: 'block' }}>Homogenizada</span>
                    <span style={{ display: 'block' }}>del Inmueble</span>
                    <span style={{ fontWeight: 700, display: 'block' }}>{Math.round(tHS)} m²</span>
                </div>
            )}

            <svg
                width={SVG_W}
                height={SVG_H}
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                xmlns="http://www.w3.org/2000/svg"
                style={{ display: 'block', fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
                {/* Fondo área gráfico */}
                <rect x={PAD_L} y={PAD_T} width={chartW} height={chartH} fill="#f0f0f0" />

                {/* Grid Y */}
                {yTicks.map(tick => {
                    const y = PAD_T + yScale(tick);
                    return (
                        <g key={tick}>
                            <line x1={PAD_L} y1={y} x2={PAD_L + chartW} y2={y} stroke="white" strokeWidth={1} />
                            <text x={PAD_L - 5} y={y} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#666">{tick}</text>
                        </g>
                    );
                })}

                {/* Barras */}
                {bins.map((bin, i) => {
                    const cx = xCenter(i);
                    const bx = cx - barW / 2;
                    const by = PAD_T + yScale(bin.count);
                    const bh = chartH - yScale(bin.count);
                    const col = ZONE_COLOR[bin.zone];
                    return (
                        <g key={i}>
                            <rect x={bx} y={by} width={barW} height={Math.max(bh, 0)} fill={col.bar} />
                            {bin.count > 0 && (
                                <text x={cx} y={by - 4} textAnchor="middle" fontSize={10} fontWeight="bold" fill={col.bar}>
                                    {bin.count}
                                </text>
                            )}
                            <text x={cx - barW / 2} y={PAD_T + chartH + 14} textAnchor="middle" fontSize={9} fill="#555">
                                {bin.from}
                            </text>
                        </g>
                    );
                })}

                {/* Ejes */}
                <line x1={PAD_L} y1={PAD_T + chartH} x2={PAD_L + chartW} y2={PAD_T + chartH} stroke="#999" strokeWidth={1} />
                <line x1={PAD_L} y1={PAD_T}           x2={PAD_L}         y2={PAD_T + chartH} stroke="#999" strokeWidth={1} />

                {/* Etiqueta eje Y */}
                <text
                    x={14} y={PAD_T + chartH / 2}
                    textAnchor="middle" fontSize={10} fill="#555"
                    transform={`rotate(-90, 14, ${PAD_T + chartH / 2})`}
                >
                    Cantidad de Propiedades
                </text>

                {/* Etiqueta eje X */}
                <text x={PAD_L + chartW / 2} y={SVG_H - 2} textAnchor="middle" fontSize={10} fill="#555">
                    Precio por m² homogenizado (USD)
                </text>
            </svg>
        </div>
    );
};

// ─── Subcomponente: tabla de resumen de zonas ────────────────────────────────

interface ZoneTableProps {
    prices: number[];
    limit1: number;
    limit2: number;
    tHS: number;
}

const ZoneSummaryTable = ({ prices, limit1, limit2, tHS }: ZoneTableProps) => {
    const avgFor = (zone: Zone): number | null => {
        const vals = prices.filter(v =>
            zone === 'venta'   ? v <= limit1 :
            zone === 'prueba'  ? v > limit1 && v <= limit2 :
                                  v > limit2
        );
        if (vals.length === 0) return null;
        return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    };

    const avgVenta   = avgFor('venta');
    const avgPrueba  = avgFor('prueba');
    const avgNoVenta = avgFor('noVenta');
    const refAvg     = avgPrueba || avgVenta || avgNoVenta || 1;

    const formatPct = (v: number | null) => {
        if (v === null) return '—';
        const pct = Math.round(((v - refAvg) / refAvg) * 100);
        return pct === 0 ? '0%' : `${pct > 0 ? '+' : ''}${pct}%`;
    };

    const totalFor = (avg: number | null) =>
        avg !== null && tHS > 0 ? Math.round(avg * tHS) : null;

    const cols: { zone: Zone; avg: number | null }[] = [
        { zone: 'venta',   avg: avgVenta   },
        { zone: 'prueba',  avg: avgPrueba  },
        { zone: 'noVenta', avg: avgNoVenta },
    ];

    const flexes = [1, 1, 2];

    return (
        <div style={{ marginTop: 8 }}>
            {/* Fila de datos */}
            <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '6px 6px 0 0', overflow: 'hidden', fontSize: 12 }}>
                {cols.map(({ zone, avg }, idx) => {
                    const col = ZONE_COLOR[zone];
                    return (
                        <div key={zone} style={{
                            flex: flexes[idx],
                            background: col.bg,
                            padding: '8px 12px',
                            textAlign: 'center',
                            borderRight: idx < 2 ? '1px solid #ddd' : undefined,
                        }}>
                            {avg !== null ? (
                                <>
                                    <div style={{ fontWeight: 700, color: col.text }}>USD {avg.toLocaleString()}/m²</div>
                                    {totalFor(avg) && (
                                        <div style={{ color: col.text, fontSize: 10, marginTop: 2 }}>
                                            USD {totalFor(avg)!.toLocaleString()}
                                        </div>
                                    )}
                                    <div style={{ color: col.text, fontSize: 10, marginTop: 2 }}>{formatPct(avg)}</div>
                                </>
                            ) : (
                                <span style={{ color: '#aaa', fontSize: 10 }}>Sin datos</span>
                            )}
                        </div>
                    );
                })}
            </div>
            {/* Fila de etiquetas de zona */}
            <div style={{ display: 'flex', border: '1px solid #ddd', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden', fontSize: 12 }}>
                {cols.map(({ zone }, idx) => {
                    const col = ZONE_COLOR[zone];
                    return (
                        <div key={zone} style={{
                            flex: flexes[idx],
                            background: col.bar,
                            color: 'white',
                            padding: '7px 12px',
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: 11,
                            borderRight: idx < 2 ? '1px solid rgba(255,255,255,.3)' : undefined,
                        }}>
                            {col.label}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Componente principal ────────────────────────────────────────────────────

const PriceSuggestionPage = ({
    data,
    stats,
    properties,
    target,
    theme,
    pageNumber,
    valuationDate
}: PriceSuggestionPageProps) => {
    const brandBlue  = theme?.primary   || '#3F11B2';
    const goldAccent = theme?.accent || '#C5A059';

    const zoneGreen = '#1B8A5A';
    const zoneAmber = '#C48A1A';
    const zoneRed   = '#B83232';

    // Calcular avg precio/m² para el subtítulo
    const calculateAvgPricePerM2 = () => {
        if (stats?.avg) return stats.avg;
        if (!properties || properties.length === 0) return 0;
        const { price, hSurface } = properties.reduce((acc, p) => {
            const hs = (p.coveredSurface || 0) + ((p.uncoveredSurface || 0) * (p.homogenizationFactor ?? 0.5));
            acc.price    += Number(p.price || p.publicationPrice) || 0;
            acc.hSurface += hs;
            return acc;
        }, { price: 0, hSurface: 0 });
        const n = properties.length;
        return hSurface > 0 ? (price / n) / (hSurface / n) : 0;
    };
    const avgPricePerM2 = calculateAvgPricePerM2();

    // Límites de zona para el gráfico
    const tHS    = calcTargetHS(target);
    const limit1 = data?.zoneLimit1 ??
        (tHS > 0 && data?.low  ? Math.round(data.low  / tHS) :
            (() => {
                const pp = (properties || []).map(pricePerM2).filter(v => v > 0);
                if (pp.length === 0) return 800;
                return Math.round((Math.min(...pp) + Math.max(...pp)) / 2 * 0.9);
            })());
    const limit2 = data?.zoneLimit2 ??
        (tHS > 0 && data?.high ? Math.round(data.high / tHS) :
            (() => {
                const pp = (properties || []).map(pricePerM2).filter(v => v > 0);
                if (pp.length === 0) return 1100;
                return Math.round((Math.min(...pp) + Math.max(...pp)) / 2 * 1.1);
            })());

    const prices = (properties || []).map(pricePerM2).filter(v => v > 0);
    const hasChart = prices.length > 0;

    return (
        <div className="print-page h-[1123px] w-full bg-white p-12 pb-20 relative flex flex-col overflow-hidden font-sans">

            {/* Header */}
            <div className="w-full flex justify-between items-end mb-8 border-b-2 pb-4" style={{ borderColor: brandBlue }}>
                <h2 className="text-2xl font-bold text-slate-900">Valores Sugeridos</h2>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: goldAccent }}>{theme?.companyName || 'InmoTasador'}</span>
            </div>

            {/* ── Valores de zona ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-6 w-full max-w-2xl text-center self-center">
                {/* Market Value */}
                <div className="p-8 rounded-2xl shadow-sm relative flex flex-col items-center justify-center border-2" style={{ borderColor: zoneAmber }}>
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white rounded-full p-1 z-10 shadow-sm">
                        <svg width="160" height="30" viewBox="0 0 160 30" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                            <rect width="160" height="30" rx="15" fill={zoneAmber} />
                            <text x="50%" y="53%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" letterSpacing="0.1em" fontFamily="system-ui, -apple-system, sans-serif">
                                ZONA DE PRUEBA
                            </text>
                        </svg>
                    </div>
                    <div className="text-5xl font-extrabold tracking-tight" style={{ color: zoneAmber }}>
                        U$S {Math.round(data.market).toLocaleString()}
                    </div>
                    <p className="text-slate-400 mt-2 text-sm font-medium">
                        Basado en un promedio de ${Math.round(avgPricePerM2).toLocaleString()}/m²
                    </p>
                </div>

                {/* Low / High */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl relative flex flex-col items-center" style={{ backgroundColor: `${zoneGreen}08`, border: `1px solid ${zoneGreen}30` }}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white rounded-full p-[3px] z-10 shadow-sm">
                            <svg width="124" height="24" viewBox="0 0 124 24" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                                <rect width="124" height="24" rx="12" fill={zoneGreen} />
                                <text x="50%" y="53%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" letterSpacing="0.1em" fontFamily="system-ui, -apple-system, sans-serif">
                                    ZONA DE VENTA
                                </text>
                            </svg>
                        </div>
                        <div className="text-3xl font-bold" style={{ color: zoneGreen }}>
                            U$S {Math.round(data.low).toLocaleString()}
                        </div>
                    </div>
                    <div className="p-6 rounded-xl relative flex flex-col items-center" style={{ backgroundColor: `${zoneRed}08`, border: `1px solid ${zoneRed}30` }}>
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white rounded-full p-[3px] z-10 shadow-sm">
                            <svg width="140" height="24" viewBox="0 0 140 24" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                                <rect width="140" height="24" rx="12" fill={zoneRed} />
                                <text x="50%" y="53%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" letterSpacing="0.1em" fontFamily="system-ui, -apple-system, sans-serif">
                                    ZONA DE NO VENTA
                                </text>
                            </svg>
                        </div>
                        <div className="text-3xl font-bold" style={{ color: zoneRed }}>
                            U$S {Math.round(data.high).toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Análisis Comparativo de Mercado ────────────────────────── */}
            {hasChart && (
                <div className="mt-6 w-full">
                    <h3 className="text-base font-bold text-slate-700 mb-3 border-b pb-2" style={{ borderColor: brandBlue }}>
                        Análisis Comparativo de Mercado
                    </h3>

                    <div className="flex justify-center">
                        <MarketBarChart
                            properties={properties}
                            target={target}
                            limit1={limit1}
                            limit2={limit2}
                        />
                    </div>

                    <ZoneSummaryTable
                        prices={prices}
                        limit1={limit1}
                        limit2={limit2}
                        tHS={tHS}
                    />

                    <p className="text-[10px] text-slate-400 text-center mt-2">
                        Límites de zona: Venta ≤ {limit1} USD/m² · Prueba {limit1}–{limit2} USD/m² · No Venta &gt; {limit2} USD/m²
                    </p>
                </div>
            )}

            {/* Footer */}
            <div className="absolute bottom-10 left-12 right-12 pt-5 border-t border-slate-100 flex justify-between text-xs text-slate-400 bg-white z-10">
                <span>Reporte generado el {(valuationDate ? new Date(valuationDate) : new Date()).toLocaleDateString()}</span>
                <span>{pageNumber ? `Página ${pageNumber}` : 'Página de Valoración'}</span>
            </div>
        </div>
    );
};

export default PriceSuggestionPage;
