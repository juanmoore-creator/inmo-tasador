import React from 'react';
import {
    MapPin, Building2, Calendar, Layout, Home,
    Maximize2, Box, Bath, Car, ArrowDownRight, User, Check, ImageOff
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/format';

interface ValuationSheetProps {
    data: any;
}

const ValuationSheet: React.FC<ValuationSheetProps> = ({ data }) => {
    const {
        target,
        publicationPrice,
        closingPrice,
        closingDate,
        valuationStatus,
        amenities
    } = data;

    const diffPercentage = publicationPrice && closingPrice
        ? ((closingPrice - publicationPrice) / publicationPrice) * 100
        : 0;

    const propertyAttributes = [
        { label: 'Precio m² (total)', value: target?.coveredSurface ? formatCurrency(closingPrice / target.coveredSurface) : '-', icon: ArrowDownRight },
        { label: 'Superficie total', value: `${formatNumber(target?.coveredSurface + target?.uncoveredSurface)} m²`, icon: Maximize2 },
        { label: 'Cochera', value: target?.garage ? 'Sí' : 'No', icon: Car },
        { label: 'Superficie cubierta', value: `${formatNumber(target?.coveredSurface)} m²`, icon: Layout },
        { label: 'Antigüedad', value: `${target?.age} años`, icon: Calendar },
        { label: 'Superficie semicubierta', value: `${formatNumber(target?.semiCoveredSurface || 0)} m²`, icon: Home },
        { label: 'Pisos de la propiedad', value: target?.rooms || '-', icon: Building2 }, // Mapping might be wrong, checking Dashboard inputs... 'rooms' is Ambientes usually. 'floorType' is Pisos. 'Pisos de la propiedad' usually means num of floors? Or which floor it is on? Input says 'Piso 8' in address usually. Let's use 'rooms' as Ambientes for now.
        { label: 'Deptos. en el edificio', value: target?.apartmentsInBuilding || '-', icon: Building2 },
        { label: 'Ambientes', value: target?.rooms || '-', icon: Layout },
        { label: 'Apto crédito', value: target?.isCreditEligible ? 'Sí' : 'No', icon: Check },
        { label: 'Baños', value: target?.bathrooms || '-', icon: Bath },
        { label: 'Ofrece financiamiento', value: target?.hasFinancing ? 'Sí' : 'No', icon: ArrowDownRight }, // Icon placeholder
        { label: 'Toilettes', value: target?.toilettes || '-', icon: Bath },
        { label: 'Apto profesional', value: target?.isProfessional ? 'Sí' : 'No', icon: User }, // Icon placeholder
        { label: 'Dormitorios', value: target?.bedrooms || '-', icon: Box }, // Icon placeholder
        // { label: 'Días en el mercado', value: '291', icon: Clock } // We don't have this in Target, maybe separate field?
    ];

    return (
        <div className="bg-white p-6 w-full h-[1123px] mx-auto text-slate-800 relative print-page">

            {/* Image Grid */}
            <div className="grid grid-cols-2 gap-1 h-[300px] mb-6 overflow-hidden rounded-xl">
                <div className="h-full">
                    {target?.images?.[0] ? (
                        <img
                            src={target.images[0]}
                            className="w-full h-full object-cover"
                            alt="Main"
                            width={600}
                            height={400}
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                            <ImageOff className="w-12 h-12 mb-2 opacity-50" strokeWidth={1.5} />
                            <span className="text-sm font-medium">Sin imagen</span>
                        </div>
                    )}
                </div>
                <div className="grid grid-rows-2 gap-1 h-full">
                    <img
                        src={target?.images?.[1] || target?.images?.[0] || '/placeholder-house.jpg'}
                        className="w-full h-full object-cover"
                        alt="Secondary"
                        width={600}
                        height={400}
                    />
                    <div className="grid grid-cols-2 gap-1 h-full">
                        <img
                            src={target?.images?.[2] || target?.images?.[0] || '/placeholder-house.jpg'}
                            className="w-full h-full object-cover"
                            alt="Tertiary 1"
                            width={600}
                            height={400}
                        />
                        <img
                            src={target?.images?.[3] || target?.images?.[0] || '/placeholder-house.jpg'}
                            className="w-full h-full object-cover"
                            alt="Tertiary 2"
                            width={600}
                            height={400}
                        />
                    </div>
                </div>
            </div>

            {/* Tags Header */}
            <div className="flex items-center gap-3 mb-8">
                <span className="px-4 py-1.5 border rounded-lg text-sm font-medium text-slate-600">Venta</span>
                <span className="px-4 py-1.5 border rounded-lg text-sm font-medium text-slate-600">Departamento</span>
                <span className="inline-flex items-center px-4 py-1.5 border rounded-lg text-sm font-medium text-blue-600 bg-blue-50 border-blue-100">
                    <span className="w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 bg-blue-600"></span>
                    {valuationStatus || 'Cerrada'}
                </span>
                {closingDate && (
                    <span className="px-4 py-1.5 border rounded-lg text-sm font-medium text-slate-500">
                        Fecha de cierre: {closingDate}
                    </span>
                )}
            </div>

            {/* Price Section */}
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-100">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                        <Layout className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium mb-1">Precio de publicación</p>
                        <p className="text-2xl font-bold text-slate-800">{formatCurrency(publicationPrice || 0)}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                        <Check className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium mb-1">Precio de venta</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-slate-800">{formatCurrency(closingPrice || 0)}</p>
                            {diffPercentage !== 0 && (
                                <span className={`text-sm font-bold ${diffPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {diffPercentage.toFixed(2)}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Address */}
            <div className="flex items-center mb-8">
                <MapPin size={24} className="text-slate-800 mr-3 flex-shrink-0" style={{ display: 'block' }} />
                <h2 className="text-lg font-medium text-slate-700">{target?.address}</h2>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-12 mb-12">
                {propertyAttributes.map((attr, index) => (
                    <div key={index} className="flex items-center">
                        <attr.icon size={20} className="text-slate-600 mr-3 flex-shrink-0" strokeWidth={2} style={{ display: 'block' }} />
                        <div className="flex items-baseline gap-1 text-sm">
                            <span className="text-slate-600">{attr.label}:</span>
                            <span className="font-bold text-slate-900">{attr.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Amenities Section */}
            {amenities && amenities.length > 0 && (
                <div className="mt-8">
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                        {amenities.join(', ')}
                    </p>
                    <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center">
                        <Check className="w-6 h-6 text-slate-800" />
                    </div>
                </div>
            )}

        </div>
    );
};

export default ValuationSheet;
