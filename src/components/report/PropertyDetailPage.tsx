import {
    MapPin, Calendar, Car, Clock,
    DollarSign, TrendingDown, Building2, Layers,
    Ruler, Move, Bath, BedDouble, LayoutGrid,
    Compass, PawPrint, CreditCard, Briefcase, Banknote,
    ArrowUpDown, ImageOff
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/format';
import { getSafeImageUrl } from '../../utils/image';
import type { PropertyDetailPageProps } from '../../types';

// Helper: show "-" for empty/undefined/null/0 values
const v = (val: any, suffix = ''): string => {
    if (val === undefined || val === null || val === '' || val === 0) return '-';
    return `${val}${suffix}`;
};

const boolVal = (val: any): string => {
    if (val === undefined || val === null) return '-';
    return val ? 'Sí' : 'No';
};

const PropertyDetailPage = ({ property, index, pageNumber, theme }: PropertyDetailPageProps) => {
    const brandBlue = theme?.primary || '#3F11B2';

    const images = property.images && property.images.length > 0
        ? property.images
        : (property.coverImage ? [property.coverImage] : []);

    // Calculate negotiation percent if not set
    const negPercent = property.negotiationPercent
        || (property.publicationPrice && property.closingPrice && property.publicationPrice > 0
            ? (((property.closingPrice - property.publicationPrice) / property.publicationPrice) * 100).toFixed(2)
            : null);

    // Calculate total surface
    const totalSurface = (property.coveredSurface || 0) + (property.semiCoveredSurface || 0);

    // Calculate price per sqm
    const effectivePrice = property.closingPrice || property.price || 0;
    const pricePerSqm = totalSurface > 0 ? (effectivePrice / totalSurface) : 0;

    // Garage display
    const garageDisplay = property.garageCount
        ? `Sí (${property.garageCount})`
        : (property.garage ? 'Sí' : 'No');

    // Section label-value renderer
    const DetailRow = ({ label, value, icon: Icon }: { label: string; value: string | number; icon?: any }) => (
        <div className="flex items-center gap-2 py-[3px]">
            {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" strokeWidth={1.8} />}
            <span className="text-[10px] text-slate-500">{label}:</span>
            <span className="text-[10px] font-bold text-slate-800 ml-auto text-right">{value}</span>
        </div>
    );

    // Boolean chip renderer for spaces/services with SVG for perfect html2canvas text centering
    const BoolChip = ({ label, value }: { label: string; value: any }) => {
        if (value === undefined || value === null) return null;
        const isTrue = Boolean(value);
        
        // Estimar el ancho basado en la longitud de caracteres para que el SVG tenga sentido
        // ~5.5px por letra para fuente small, más padding.
        const textWidth = label.length * 5.5;
        const svgWidth = 8 + 6 + 4 + textWidth + 8; // paddingLeft + circle + gap + text + paddingRight
        
        return (
            <div style={{ display: 'inline-block', width: `${svgWidth}px`, height: '18px' }}>
                <svg width="100%" height="100%" viewBox={`0 0 ${svgWidth} 18`} xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                    <rect 
                        width={svgWidth} height="18" 
                        rx="4" 
                        fill={isTrue ? '#f0fdf4' : '#f8fafc'} 
                        stroke={isTrue ? '#d1fae5' : '#e2e8f0'} 
                        strokeWidth="1" 
                    />
                    <circle 
                        cx="11" cy="9" 
                        r="2.5" 
                        fill={isTrue ? '#10b981' : '#cbd5e1'} 
                    />
                    <text 
                        x="18" y="53%" 
                        dominantBaseline="middle" 
                        textAnchor="start"
                        fill={isTrue ? '#065f46' : '#94a3b8'} 
                        fontSize="9" 
                        fontWeight="500" 
                        fontFamily="system-ui, -apple-system, sans-serif"
                    >
                        {label}
                    </text>
                </svg>
            </div>
        );
    };

    // Collect spaces that have values
    const spaces = [
        { label: 'Living', val: property.hasLiving },
        { label: 'Comedor', val: property.hasDining },
        { label: 'Cocina', val: property.hasKitchen },
        { label: 'Lavadero', val: property.hasLaundry },
        { label: 'Estudio', val: property.hasStudy },
        { label: 'Toilette', val: property.toilettes != null && property.toilettes > 0 ? true : property.toilettes === 0 ? false : undefined },
        { label: 'Hab. Servicio', val: property.hasServiceRoom },
        { label: 'Patio', val: property.hasPatio },
        { label: 'Jardín Inv.', val: property.hasWinterGarden },
        { label: 'Balcón', val: property.hasBalcony },
        { label: 'Baulera', val: property.hasBaulera },
        { label: 'Terraza', val: property.hasTerrace },
    ].filter(s => s.val !== undefined && s.val !== null);

    const services = [
        { label: 'Agua', val: property.hasWater },
        { label: 'Cloacas', val: property.hasSewer },
        { label: 'Gas', val: property.hasGas },
        { label: 'Electricidad', val: property.hasElectricity },
        { label: 'Pavimento', val: property.hasPavement },
        { label: 'WiFi', val: property.hasInternet },
        { label: 'Teléfono', val: property.hasPhone },
        { label: 'Cable', val: property.hasCableTV },
    ].filter(s => s.val !== undefined && s.val !== null);

    const equipment = [
        { label: 'Ascensor', val: property.hasElevator },
        { label: 'Calefacción', val: property.hasHeating },
        { label: 'Aire Acond.', val: property.hasAC },
        { label: 'Seguridad', val: property.hasSecurity },
        { label: 'Alarma', val: property.hasAlarm },
        { label: 'Parrilla', val: property.hasGrill },
    ].filter(s => s.val !== undefined && s.val !== null);

    return (
        <div className="print-page h-[1123px] w-full bg-white p-6 pb-20 relative flex flex-col overflow-hidden font-sans" style={{ fontSize: '11px' }}>

            {/* Hero Images */}
            <div className="mb-3 overflow-hidden rounded-xl flex-shrink-0" style={{ height: '220px' }}>
                <div className="flex gap-1" style={{ height: '220px' }}>
                    {/* Main image — takes 2/3 width */}
                    <div className="relative bg-slate-100 flex items-center justify-center" style={{ width: images.length > 1 ? '66%' : '100%', height: '220px', flexShrink: 0 }}>
                        <div className="absolute top-3 left-3 z-10">
                            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                                <circle cx="16" cy="16" r="16" fill={brandBlue} />
                                <text 
                                    x="50%" y="54%" 
                                    dominantBaseline="middle" textAnchor="middle" 
                                    fill="white" fontSize="14" fontWeight="bold" 
                                    fontFamily="system-ui, -apple-system, sans-serif"
                                >
                                    {index + 1}
                                </text>
                            </svg>
                        </div>
                        {images.length > 0 ? (
                            <img
                                src={getSafeImageUrl(images[0])}
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                                crossOrigin="anonymous"
                                alt="Main"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400">
                                <ImageOff className="w-12 h-12 mb-2 opacity-50" strokeWidth={1.5} />
                                <span className="text-xs font-medium">Sin imagen</span>
                            </div>
                        )}
                    </div>
                    {/* Side images — take 1/3 width, split vertically */}
                    {images.length > 1 && (
                        <div className="flex flex-col gap-1" style={{ flex: 1, height: '220px' }}>
                            <div className="relative bg-slate-100" style={{ flex: 1, overflow: 'hidden' }}>
                                <img
                                    src={getSafeImageUrl(images[1])}
                                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                                    crossOrigin="anonymous"
                                    alt="Detail 1"
                                />
                            </div>
                            {images.length > 2 && (
                                <div className="relative bg-slate-100" style={{ flex: 1, overflow: 'hidden' }}>
                                    <img
                                        src={getSafeImageUrl(images[2])}
                                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                                        crossOrigin="anonymous"
                                        alt="Detail 2"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Tags Row */}
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <span className="px-3 py-1 border border-slate-200 rounded-full text-[10px] font-medium text-slate-500">Venta</span>
                {property.propertyType && (
                    <span className="px-3 py-1 border border-slate-200 rounded-full text-[10px] font-medium text-slate-500">{property.propertyType}</span>
                )}
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium border ${property.captacionStatus === 'Cerrada' || property.status === 'Cerrada' || property.status === 'Vendido'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                    : property.captacionStatus === 'Reservada' || property.status === 'Reservado'
                        ? 'text-amber-700 bg-amber-50 border-amber-100'
                        : property.captacionStatus === 'Cancelada'
                            ? 'text-red-700 bg-red-50 border-red-100'
                            : 'text-blue-700 bg-blue-50 border-blue-100'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${property.captacionStatus === 'Cerrada' || property.status === 'Cerrada' || property.status === 'Vendido'
                        ? 'bg-emerald-500'
                        : property.captacionStatus === 'Reservada' || property.status === 'Reservado'
                            ? 'bg-amber-500'
                            : property.captacionStatus === 'Cancelada'
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                        }`}></span>
                    {property.captacionStatus || property.status || 'Activa'}
                </span>
                {property.closingDate && (
                    <span className="px-3 py-1 border border-slate-200 rounded-full text-[10px] font-medium text-slate-500">
                        Fecha de cierre: {property.closingDate}
                    </span>
                )}
            </div>

            {/* Price Section */}
            <div className="flex items-stretch gap-6 mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-1 h-full rounded-full" style={{ backgroundColor: brandBlue }}></div>
                    <DollarSign className="w-5 h-5 text-slate-400" />
                    <div>
                        <p className="text-[10px] text-slate-400 font-medium">Precio de publicación</p>
                        <p className="text-base font-bold text-slate-800">
                            {property.publicationPrice ? formatCurrency(property.publicationPrice) : (property.price ? formatCurrency(property.price) : '-')}
                        </p>
                    </div>
                </div>
                <div className="w-px bg-slate-200"></div>
                <div className="flex items-center gap-3 flex-1">
                    <TrendingDown className="w-5 h-5 text-slate-400" />
                    <div>
                        <p className="text-[10px] text-slate-400 font-medium">Precio de venta</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-base font-bold text-slate-800">
                                {property.closingPrice ? formatCurrency(property.closingPrice) : '-'}
                            </p>
                            {negPercent && negPercent !== '-' && (
                                <span className="text-xs font-bold text-red-500">{Number(negPercent) > 0 ? '+' : ''}{negPercent}%</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Address */}
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">{property.address}</span>
            </div>

            {/* Main Attributes Grid (2 columns) */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-0 mb-3 px-1 flex-shrink-0">
                <DetailRow label="Precio m² (total)" value={pricePerSqm > 0 ? formatCurrency(pricePerSqm) : '-'} icon={DollarSign} />
                <DetailRow label="Superficie total" value={totalSurface > 0 ? `${formatNumber(totalSurface)} m²` : '-'} icon={Ruler} />
                <DetailRow label="Cochera" value={garageDisplay} icon={Car} />
                <DetailRow label="Superficie cubierta" value={v(property.coveredSurface, ' m²')} icon={Layers} />
                <DetailRow label="Antigüedad" value={v(property.age, ' años')} icon={Calendar} />
                <DetailRow label="Superficie semicubierta" value={v(property.semiCoveredSurface, ' m²')} icon={Move} />
                <DetailRow label="Expensas" value={property.expensas ? `$${formatNumber(property.expensas)}` : '-'} icon={Building2} />
                <DetailRow label="Metros homogeneizados" value={property.hSurface ? `${formatNumber(property.hSurface)} m²` : '-'} icon={ArrowUpDown} />
            </div>

            {/* Separator */}
            <div className="h-px bg-slate-100 mb-3 flex-shrink-0"></div>

            {/* Características — full width, 4-column label/value grid */}
            <div className="flex-shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2">Características</p>
                <div className="grid grid-cols-4 gap-x-4 gap-y-0">
                    <DetailRow label="Ambientes" value={v(property.rooms)} icon={LayoutGrid} />
                    <DetailRow label="Dormitorios" value={v(property.bedrooms)} icon={BedDouble} />
                    <DetailRow label="Baños" value={v(property.bathrooms)} icon={Bath} />
                    <DetailRow label="Toilettes" value={v(property.toilettes)} icon={Bath} />
                    <DetailRow label="Cocheras" value={property.garageCount ? String(property.garageCount) : (property.garage ? '1' : '-')} icon={Car} />
                    <DetailRow label="Disposición" value={v(property.disposition)} icon={Compass} />
                    <DetailRow label="Orientación" value={v(property.orientation)} icon={Compass} />
                    <DetailRow label="Apto crédito" value={boolVal(property.isCreditEligible)} icon={CreditCard} />
                    <DetailRow label="Apto profesional" value={boolVal(property.isProfessional)} icon={Briefcase} />
                    <DetailRow label="Financiación" value={boolVal(property.hasFinancing)} icon={Banknote} />
                    <DetailRow label="Mascotas" value={boolVal(property.allowsPets)} icon={PawPrint} />
                    {property.daysOnMarket != null && property.daysOnMarket > 0 && (
                        <DetailRow label="Días en mercado" value={`${property.daysOnMarket} días`} icon={Clock} />
                    )}
                    {property.buildingFloors != null && property.buildingFloors > 0 && (
                        <DetailRow label="Pisos edificio" value={String(property.buildingFloors)} icon={Building2} />
                    )}
                    {property.apartmentsInBuilding != null && property.apartmentsInBuilding > 0 && (
                        <DetailRow label="Unidades" value={String(property.apartmentsInBuilding)} icon={Building2} />
                    )}
                </div>
            </div>

            {/* Chips block: Espacios | Equipamiento — immediately below Características */}
            {(services.length > 0 || equipment.length > 0 || spaces.length > 0) && (
                <div className="border-t border-slate-100 pt-2 mt-3 mb-3 flex flex-wrap items-start gap-x-6 gap-y-2 flex-shrink-0">
                    {services.length > 0 && (
                        <div>
                            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">Servicios</p>
                            <div className="flex flex-wrap gap-1">
                                {services.map(s => <BoolChip key={s.label} label={s.label} value={s.val} />)}
                            </div>
                        </div>
                    )}
                    {equipment.length > 0 && (
                        <div>
                            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">Equipamiento</p>
                            <div className="flex flex-wrap gap-1">
                                {equipment.map(s => <BoolChip key={s.label} label={s.label} value={s.val} />)}
                            </div>
                        </div>
                    )}
                    {spaces.length > 0 && (
                        <div>
                            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">Espacios</p>
                            <div className="flex flex-wrap gap-1">
                                {spaces.map(s => <BoolChip key={s.label} label={s.label} value={s.val} />)}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Footer: page number */}
            <div className="absolute bottom-12 left-12 right-12 flex-shrink-0 bg-white z-10">
                <div className="border-t border-slate-100 pt-2 flex justify-between text-[10px] text-slate-400 uppercase tracking-widest">
                    <span>Ficha de Comparable</span>
                    <span>Página {pageNumber}</span>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetailPage;

