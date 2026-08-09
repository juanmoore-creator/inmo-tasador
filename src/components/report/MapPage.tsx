import { MapPin } from 'lucide-react';
import { getSafeImageUrl } from '../../utils/image';
import type { MapPageProps } from '../../types';

const MapPage = ({ properties, target, mapImage, pageNumber = 2, theme }: MapPageProps) => {
    const brandBlue = theme?.primary || '#3F11B2';

    return (
        <div className="print-page h-[1123px] w-full bg-white p-12 pb-24 relative flex flex-col overflow-hidden font-sans">
            <div className="flex justify-between items-end mb-8 border-b-2 pb-4" style={{ borderColor: brandBlue }}>
                <h2 className="text-2xl font-bold text-slate-900">Ubicación de Comparables</h2>
            </div>

            <div className="flex-1 border border-slate-200 rounded-lg flex items-center justify-center bg-slate-50 mb-8 overflow-hidden relative">
                {mapImage ? (
                    <img
                        src={getSafeImageUrl(mapImage)}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                        crossOrigin="anonymous"
                        alt="Mapa de Comparables"
                    />
                ) : (
                    <div className="flex flex-col items-center text-slate-400 p-8 text-center">
                        <MapPin className="w-10 h-10 mb-4 opacity-30" />
                        <p className="font-medium">Mapa no disponible</p>
                        <p className="text-sm mt-2">Asegúrate de haber ingresado direcciones válidas y guardado la tasación para generar el mapa.</p>
                    </div>
                )}
            </div>

            <div>
                <h3 className="font-semibold text-lg mb-4 text-slate-700">Referencias</h3>
                <ul className="space-y-3">
                    {target && (
                        <li className="text-sm text-slate-700 flex items-start">
                            <div className="mr-3 flex-shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                                    <circle cx="12" cy="12" r="12" fill="#dc2626" />
                                    <text 
                                        x="50%" y="54%" 
                                        dominantBaseline="middle" textAnchor="middle" 
                                        fill="white" fontSize="12" fontWeight="bold" 
                                        fontFamily="system-ui, -apple-system, sans-serif"
                                    >
                                        T
                                    </text>
                                </svg>
                            </div>
                            <span className="font-semibold">{target.address} (Propiedad Objetivo)</span>
                        </li>
                    )}
                    {properties.map((p, i) => (
                        <li key={p.id || i} className="text-sm text-slate-700 flex items-start">
                            <div className="mr-3 flex-shrink-0">
                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                                    <circle cx="12" cy="12" r="12" fill={brandBlue} />
                                    <text 
                                        x="50%" y="54%" 
                                        dominantBaseline="middle" textAnchor="middle" 
                                        fill="white" fontSize="12" fontWeight="bold" 
                                        fontFamily="system-ui, -apple-system, sans-serif"
                                    >
                                        {i + 1}
                                    </text>
                                </svg>
                            </div>
                            <span>{p.address}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="absolute bottom-12 left-12 right-12 pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-400 bg-white z-10">
                <span>Reporte generado el {new Date().toLocaleDateString()}</span>
                <span>Página {pageNumber}</span>
            </div>
        </div>
    );
};

export default MapPage;
