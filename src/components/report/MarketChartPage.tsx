import type { ReportTheme } from '../../types';

interface MarketChartPageProps {
    properties: any[];
    target: any;
    valuation: any;
    theme?: ReportTheme | null;
}

// ─── helpers ────────────────────────────────────────────────────────────────

/** Precio por m² homogenizado de un comparable */
function pricePerM2(p: any): number {
    const hSurface =
        (p.coveredSurface || 0) +
        (p.uncoveredSurface || 0) * (p.homogenizationFactor ?? 0.5);
    if (hSurface <= 0) return 0;
    return (p.price || p.publicationPrice || 0) / hSurface;
}

/** Superficie homogenizada de la propiedad objetivo */
function targetHSurface(target: any): number {
    return (
        (target?.coveredSurface || 0) +
        (target?.uncoveredSurface || 0) * (target?.homogenizationFactor ?? 0.5)
    );
}

// ─── main component ─────────────────────────────────────────────────────────

const MarketChartPage = ({ properties, target, valuation, theme }: MarketChartPageProps) => {
    const brandBlue  = theme?.primary   || '#3F11B2';
    const goldAccent = theme?.accent || '#C5A059';

    if (!properties || properties.length === 0) return null;

    // Calcular precio/m² de cada comparable (filtrar los que no tienen precio)
    const prices = properties
        .map(pricePerM2)
        .filter(v => v > 0);

    if (prices.length === 0) return null;

    const tHS = targetHSurface(target);

    // ── Límites de zona (en USD/m²) ──────────────────────────────────────────
    // Si existen valores explícitos los usamos; si no, los derivamos de
    // valuation.low / market / high dividido por la superficie homogenizada
    const limit1 = valuation?.zoneLimit1 ??
        (tHS > 0 && valuation?.low   ? Math.round(valuation.low   / tHS) : Math.round((Math.min(...prices) + Math.max(...prices)) / 2 * 0.9));
    const limit2 = valuation?.zoneLimit2 ??
        (tHS > 0 && valuation?.high  ? Math.round(valuation.high  / tHS) : Math.round((Math.min(...prices) + Math.max(...prices)) / 2 * 1.1));

    // ── Bins dinámicos (respetando límites de zona) ─────────────────────────
    // Creamos bins que se cortan en los límites de zona para que cada bin
    // pertenezca completamente a una sola zona (venta, prueba, noVenta).
    const minP = Math.floor(Math.min(...prices) / 100) * 100;
    const maxP = Math.ceil (Math.max(...prices) / 100) * 100;
    const BIN_W = 200; // ancho base de cada bin (USD/m²)

    const start = Math.floor(minP / BIN_W) * BIN_W;
    const end   = Math.ceil (maxP / BIN_W) * BIN_W;

    type Bin = { from: number; to: number; count: number; zone: 'venta' | 'prueba' | 'noVenta' };

    // Generar puntos de corte: combinamos los puntos del grid regular
    // con los límites de zona (limit1, limit2) para partir bins en los bordes.
    const gridPoints = new Set<number>();
    for (let f = start; f <= end; f += BIN_W) gridPoints.add(f);
    // Agregar límites de zona como puntos de corte (solo si caen dentro del rango)
    if (limit1 > start && limit1 < end) gridPoints.add(limit1);
    if (limit2 > start && limit2 < end) gridPoints.add(limit2);
    const breakpoints = Array.from(gridPoints).sort((a, b) => a - b);

    const bins: Bin[] = [];
    for (let i = 0; i < breakpoints.length - 1; i++) {
        const from = breakpoints[i];
        const to   = breakpoints[i + 1];
        // Usamos from como representante: al estar cortado por límites, todo
        // el rango [from, to) pertenece a UNA sola zona.
        const zone: Bin['zone'] =
            from < limit1 ? 'venta' :
            from <= limit2 ? 'prueba' : 'noVenta';
        const count = prices.filter(v => v >= from && v < to).length;
        // No agregar bins vacíos que serían solo ruido visual
        bins.push({ from, to, count, zone });
    }

    const maxCount = Math.max(...bins.map(b => b.count), 1);

    // ── Colores de zona ───────────────────────────────────────────────────────
    const zoneColor = {
        venta:    { bar: '#3a8a3a', bg: '#e6f4e6', text: '#2a6a2a', label: 'ZONA DE VENTA' },
        prueba:   { bar: '#c8c820', bg: '#fafae6', text: '#8a8a00', label: 'ZONA DE PRUEBA' },
        noVenta:  { bar: '#cc3333', bg: '#fae6e6', text: '#aa1111', label: 'ZONA DE NO VENTA' },
    };

    // ── Estadísticas por zona ─────────────────────────────────────────────────
    const avgByZone = (zone: Bin['zone']) => {
        const vals = prices.filter(v =>
            zone === 'venta'   ? v <= limit1 :
            zone === 'prueba'  ? (v > limit1 && v <= limit2) :
                                  v > limit2
        );
        if (vals.length === 0) return null;
        return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    };
    const avgVenta  = avgByZone('venta');
    const avgPrueba = avgByZone('prueba');
    const avgNoVenta = avgByZone('noVenta');
    const refAvg = avgPrueba || avgVenta || avgNoVenta || 1;

    const formatPct = (v: number | null) => {
        if (v === null) return '—';
        const pct = Math.round(((v - refAvg) / refAvg) * 100);
        return pct === 0 ? '0%' : `${pct > 0 ? '+' : ''}${pct}%`;
    };

    // Precio total estimado (avg/m² × sup. homogenizada objetivo)
    const totalFor = (avg: number | null) => {
        if (avg === null || tHS <= 0) return null;
        return Math.round(avg * tHS);
    };

    // ── Dimensiones SVG del gráfico ───────────────────────────────────────────
    const SVG_W   = 660;
    const SVG_H   = 380;
    const PAD_L   = 60;   // margen izquierdo (eje Y)
    const PAD_B   = 50;   // margen inferior (eje X)
    const PAD_T   = 30;
    const PAD_R   = 20;
    const chartW  = SVG_W - PAD_L - PAD_R;
    const chartH  = SVG_H - PAD_T - PAD_B;

    const nBins = bins.length;
    const barW  = Math.floor(chartW / nBins) - 4;

    // Y: 0 stays at bottom, goes up
    const yScale = (count: number) => chartH - (count / maxCount) * chartH * 0.85;

    // X position of bin center
    const xCenter = (i: number) => PAD_L + (i + 0.5) * (chartW / nBins);

    // Y-axis tick marks
    const yTicks = Array.from({ length: maxCount + 1 }, (_, i) => i);

    // Marker for target property homogenized surface
    const targetSurfaceLabel = tHS > 0 ? `${Math.round(tHS)} m²` : null;

    return (
        <div className="print-page h-[1123px] w-full bg-white p-12 pb-24 relative flex flex-col overflow-hidden font-sans text-slate-800">

            {/* Header */}
            <div className="flex justify-between items-end mb-8 border-b-2 pb-4" style={{ borderColor: brandBlue }}>
                <h2 className="text-2xl font-bold text-slate-900">Análisis Comparativo de Mercado</h2>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: goldAccent }}>
                    {theme?.companyName || 'InmoTasador'}
                </span>
            </div>

            {/* Gráfico SVG */}
            <div className="flex justify-center mb-6">
                <div style={{ position: 'relative' }}>
                    {/* Nota de la propiedad objetivo */}
                    {targetSurfaceLabel && (
                        <div style={{
                            position: 'absolute',
                            top: PAD_T,
                            right: PAD_R,
                            background: 'white',
                            border: '1.5px solid #ccc',
                            borderRadius: 6,
                            padding: '6px 10px',
                            fontSize: 11,
                            lineHeight: 1.4,
                            color: '#333',
                            maxWidth: 120,
                            textAlign: 'center',
                            zIndex: 10,
                        }}>
                            <span style={{ fontWeight: 700 }}>Superficie Homogenizada</span><br />
                            del Inmueble {targetSurfaceLabel}
                        </div>
                    )}

                    <svg
                        width={SVG_W}
                        height={SVG_H}
                        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ display: 'block', fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    >
                        {/* Fondo del área del gráfico */}
                        <rect
                            x={PAD_L} y={PAD_T}
                            width={chartW} height={chartH}
                            fill="#f0f0f0"
                        />

                        {/* Líneas horizontales de guía (Y grid) */}
                        {yTicks.map(tick => {
                            const y = PAD_T + yScale(tick);
                            return (
                                <g key={tick}>
                                    <line
                                        x1={PAD_L} y1={y}
                                        x2={PAD_L + chartW} y2={y}
                                        stroke="white" strokeWidth={1}
                                    />
                                    <text
                                        x={PAD_L - 6} y={y}
                                        textAnchor="end"
                                        dominantBaseline="middle"
                                        fontSize={10} fill="#666"
                                    >
                                        {tick}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Barras */}
                        {bins.map((bin, i) => {
                            const cx   = xCenter(i);
                            const bx   = cx - barW / 2;
                            const by   = PAD_T + yScale(bin.count);
                            const bh   = chartH - yScale(bin.count);
                            const col  = zoneColor[bin.zone];

                            return (
                                <g key={i}>
                                    <rect
                                        x={bx} y={by}
                                        width={barW} height={Math.max(bh, 0)}
                                        fill={col.bar}
                                    />
                                    {/* Etiqueta encima de la barra */}
                                    {bin.count > 0 && (
                                        <text
                                            x={cx} y={by - 5}
                                            textAnchor="middle"
                                            fontSize={11}
                                            fontWeight="bold"
                                            fill={col.bar}
                                        >
                                            {bin.count}
                                        </text>
                                    )}
                                    {/* Etiqueta X (inicio del bin) */}
                                    <text
                                        x={cx - barW / 2} y={PAD_T + chartH + 16}
                                        textAnchor="middle"
                                        fontSize={10}
                                        fill="#555"
                                    >
                                        {bin.from}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Eje X — línea base */}
                        <line
                            x1={PAD_L} y1={PAD_T + chartH}
                            x2={PAD_L + chartW} y2={PAD_T + chartH}
                            stroke="#999" strokeWidth={1}
                        />
                        {/* Eje Y — línea izquierda */}
                        <line
                            x1={PAD_L} y1={PAD_T}
                            x2={PAD_L} y2={PAD_T + chartH}
                            stroke="#999" strokeWidth={1}
                        />

                        {/* Etiqueta eje Y */}
                        <text
                            x={16}
                            y={PAD_T + chartH / 2}
                            textAnchor="middle"
                            fontSize={11}
                            fill="#555"
                            transform={`rotate(-90, 16, ${PAD_T + chartH / 2})`}
                        >
                            Cantidad de Propiedades
                        </text>

                        {/* Etiqueta eje X */}
                        <text
                            x={PAD_L + chartW / 2}
                            y={SVG_H - 4}
                            textAnchor="middle"
                            fontSize={11}
                            fill="#555"
                        >
                            Precio por m² homogenizado (USD)
                        </text>
                    </svg>
                </div>
            </div>

            {/* Tabla de resumen de zonas */}
            <div style={{ display: 'flex', gap: 0, border: '1px solid #ddd', borderRadius: 6, overflow: 'hidden', fontSize: 13 }}>
                {/* Zona de Venta */}
                <div style={{ flex: 1, background: zoneColor.venta.bg, padding: '10px 14px', textAlign: 'center', borderRight: '1px solid #ddd' }}>
                    {avgVenta !== null ? (
                        <>
                            <div style={{ fontWeight: 700, color: zoneColor.venta.text }}>
                                USD {avgVenta.toLocaleString()}/m²
                            </div>
                            {totalFor(avgVenta) && (
                                <div style={{ color: zoneColor.venta.text, fontSize: 11, marginTop: 2 }}>
                                    USD {totalFor(avgVenta)!.toLocaleString()}
                                </div>
                            )}
                            <div style={{ color: zoneColor.venta.text, fontSize: 11, marginTop: 2 }}>
                                {formatPct(avgVenta)}
                            </div>
                        </>
                    ) : <span style={{ color: '#aaa', fontSize: 11 }}>Sin datos</span>}
                </div>

                {/* Zona de Prueba */}
                <div style={{ flex: 1, background: zoneColor.prueba.bg, padding: '10px 14px', textAlign: 'center', borderRight: '1px solid #ddd' }}>
                    {avgPrueba !== null ? (
                        <>
                            <div style={{ fontWeight: 700, color: zoneColor.prueba.text }}>
                                USD {avgPrueba.toLocaleString()}/m²
                            </div>
                            {totalFor(avgPrueba) && (
                                <div style={{ color: zoneColor.prueba.text, fontSize: 11, marginTop: 2 }}>
                                    USD {totalFor(avgPrueba)!.toLocaleString()}
                                </div>
                            )}
                            <div style={{ color: zoneColor.prueba.text, fontSize: 11, marginTop: 2 }}>
                                {formatPct(avgPrueba)}
                            </div>
                        </>
                    ) : <span style={{ color: '#aaa', fontSize: 11 }}>Sin datos</span>}
                </div>

                {/* Zona de No Venta */}
                <div style={{ flex: 2, background: zoneColor.noVenta.bg, padding: '10px 14px', textAlign: 'center' }}>
                    {avgNoVenta !== null ? (
                        <>
                            <div style={{ fontWeight: 700, color: zoneColor.noVenta.text }}>
                                USD {avgNoVenta.toLocaleString()}/m²
                            </div>
                            {totalFor(avgNoVenta) && (
                                <div style={{ color: zoneColor.noVenta.text, fontSize: 11, marginTop: 2 }}>
                                    USD {totalFor(avgNoVenta)!.toLocaleString()}
                                </div>
                            )}
                            <div style={{ color: zoneColor.noVenta.text, fontSize: 11, marginTop: 2 }}>
                                {formatPct(avgNoVenta)}
                            </div>
                        </>
                    ) : <span style={{ color: '#aaa', fontSize: 11 }}>Sin datos</span>}
                </div>
            </div>

            {/* Etiquetas de zonas */}
            <div style={{ display: 'flex', gap: 0, marginTop: 0, border: '1px solid #ddd', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden', fontSize: 13 }}>
                <div style={{ flex: 1, background: zoneColor.venta.bar, color: 'white', padding: '8px 14px', textAlign: 'center', fontWeight: 700, borderRight: '1px solid rgba(255,255,255,.3)' }}>
                    ZONA DE VENTA
                </div>
                <div style={{ flex: 1, background: zoneColor.prueba.bar, color: 'white', padding: '8px 14px', textAlign: 'center', fontWeight: 700, borderRight: '1px solid rgba(255,255,255,.3)' }}>
                    ZONA DE PRUEBA
                </div>
                <div style={{ flex: 2, background: zoneColor.noVenta.bar, color: 'white', padding: '8px 14px', textAlign: 'center', fontWeight: 700 }}>
                    ZONA DE NO VENTA
                </div>
            </div>

            {/* Nota de límites */}
            <div className="mt-4 text-xs text-slate-400 text-center">
                Límites de zona: Venta ≤ {limit1} USD/m² · Prueba {limit1}–{limit2} USD/m² · No Venta &gt; {limit2} USD/m²
            </div>

            {/* Pie de página */}
            <div className="absolute bottom-12 left-12 right-12 pt-6 border-t border-slate-100 flex justify-between text-xs text-slate-400 bg-white z-10">
                <span>Reporte generado el {new Date().toLocaleDateString()}</span>
                <span>Análisis Comparativo</span>
            </div>
        </div>
    );
};

export default MarketChartPage;
