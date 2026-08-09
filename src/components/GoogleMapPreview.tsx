import { useEffect, useMemo } from 'react';
import { MapPin } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

interface Location {
    lat: number;
    lng: number;
}

interface GoogleMapPreviewProps {
    target: { address: string; location?: Location };
    comparables: Array<{ address: string; location?: Location }>;
    onMapImageReady: (url: string) => void;
}

/**
 * Builds a Google Static Maps URL with:
 *  - Red 'T' marker for the target property
 *  - Blue numbered markers for each comparable
 */
function buildStaticMapUrl(
    target: { address: string; location?: Location },
    comparables: Array<{ address: string; location?: Location }>
): string | null {
    const targetLoc = target.location;
    if (!targetLoc || (targetLoc.lat === 0 && targetLoc.lng === 0)) return null;

    const params = new URLSearchParams({
        size: '640x640',
        scale: '2',
        maptype: 'roadmap',
        key: GOOGLE_MAPS_API_KEY,
    });

    // Target marker (red, label T)
    params.append(
        'markers',
        `color:red|label:T|${targetLoc.lat},${targetLoc.lng}`
    );

    // Comparable markers (blue, numbered)
    comparables.forEach((comp, i) => {
        const loc = comp.location;
        if (loc && !(loc.lat === 0 && loc.lng === 0)) {
            params.append(
                'markers',
                `color:0x1e40af|label:${i + 1}|${loc.lat},${loc.lng}`
            );
        }
    });

    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

export default function GoogleMapPreview({
    target,
    comparables,
    onMapImageReady,
}: GoogleMapPreviewProps) {
    const mapUrl = useMemo(
        () => buildStaticMapUrl(target, comparables),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            target.location?.lat,
            target.location?.lng,
            // Serialize comparable locations to detect changes
            comparables.map((c) => `${c.location?.lat},${c.location?.lng}`).join('|'),
        ]
    );

    useEffect(() => {
        if (mapUrl) {
            onMapImageReady(mapUrl);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapUrl]);

    const hasTargetLocation =
        target.location && !(target.location.lat === 0 && target.location.lng === 0);

    return (
        <div className="col-span-full mt-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Vista previa del mapa
            </div>

            {mapUrl ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                    <img
                        src={mapUrl}
                        alt="Vista previa del mapa"
                        className="w-full object-cover max-h-64"
                        crossOrigin="anonymous"
                    />
                    <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold">T</span>
                        <span className="mr-2">Propiedad objetivo</span>
                        {comparables.filter(c => c.location && !(c.location.lat === 0 && c.location.lng === 0)).map((_, i) => (
                            <span key={i} className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] font-bold mr-1" style={{ backgroundColor: '#1e40af' }}>{i + 1}</span>
                        ))}
                        {comparables.filter(c => c.location && !(c.location.lat === 0 && c.location.lng === 0)).length > 0 && (
                            <span>Comparables</span>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 text-sm">
                    <MapPin className="w-5 h-5 flex-shrink-0 opacity-40" />
                    <span>
                        {hasTargetLocation
                            ? 'Actualizando mapa...'
                            : 'Seleccioná una dirección válida con el autocompletado para generar el mapa.'}
                    </span>
                </div>
            )}
        </div>
    );
}
