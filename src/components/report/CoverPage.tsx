import { useState, useEffect } from 'react';
import type { CoverPageProps } from '../../types';
import { getSafeImageUrl, getWhiteTintedImageUrl } from '../../utils/image';

const CoverPage = ({ data, theme, valuationDate, templateId }: CoverPageProps) => {
    const reportDate = valuationDate ? new Date(valuationDate) : new Date();
    const brandBlue = theme?.primary || '#3F11B2';
    const goldAccent = theme?.accent || '#C5A059';

    const [whiteLogoUrl, setWhiteLogoUrl] = useState<string>('');

    useEffect(() => {
        if (theme?.logoUrl) {
            getWhiteTintedImageUrl(getSafeImageUrl(theme.logoUrl))
                .then(setWhiteLogoUrl)
                .catch(() => setWhiteLogoUrl(getSafeImageUrl(theme.logoUrl)));
        } else {
            setWhiteLogoUrl('');
        }
    }, [theme?.logoUrl]);

    const renderClassic = () => (
        <div className="print-page cover-page h-[1123px] w-full bg-white relative flex overflow-hidden font-sans">
            {/* Left Sidebar */}
            <div className="w-1/4 h-full relative flex flex-col items-center pt-24" style={{ backgroundColor: brandBlue }}>
                {/* Logo */}
                <div className="mb-12 px-2 w-full">
                    {theme?.logoUrl ? (
                        <img
                            src={whiteLogoUrl || getSafeImageUrl(theme.logoUrl)}
                            alt={`Logo ${theme?.companyName || ''}`}
                            className="w-full max-w-[220px] object-contain mx-auto"
                            crossOrigin="anonymous"
                        />
                    ) : (
                        <div className="w-full max-w-[220px] mx-auto text-white text-center font-bold text-2xl">
                            {theme?.companyName || 'InmoTasador'}
                        </div>
                    )}
                </div>

                {/* Date */}
                <div className="absolute bottom-12 left-0 right-0 text-center px-4">
                    <div className="w-8 h-px mx-auto mb-4" style={{ backgroundColor: goldAccent }}></div>
                    <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold">
                        {reportDate.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col p-16 pb-40 relative">
                {/* Title */}
                <div className="mb-16">
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: goldAccent }}>
                        Informe de Tasación
                    </p>
                    <h1 className="text-6xl font-heading font-medium tracking-tight leading-tight" style={{ color: brandBlue }}>
                        {data.target?.address || 'Dirección de la Propiedad'}
                    </h1>
                    <div className="w-20 h-1 mt-6" style={{ backgroundColor: goldAccent }}></div>
                </div>

                {/* Property Image */}
                {data.target?.images && data.target.images.length > 0 && (
                    <div className="flex-1 max-h-[380px] rounded-lg overflow-hidden shadow-lg mb-16">
                        <img
                            src={getSafeImageUrl(data.target.images[0])}
                            alt="Propiedad"
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                        />
                    </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-16">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Preparado para</p>
                        <p className="text-xl font-semibold text-slate-800">{data.clientName || 'Cliente'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Fecha</p>
                        <p className="text-xl font-semibold text-slate-800">
                            {reportDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-16 left-16 right-16 pt-8 border-t border-slate-200 flex justify-between items-end bg-white z-10">
                    <div>
                        <p className="text-lg font-bold text-slate-800">{data.corredorName || theme?.holderName || 'Corredor Responsable'}</p>
                        <p className="text-xs text-slate-400 font-medium">
                            {data.matricula ? `Matrícula ${data.matricula}` : 'Corredor Inmobiliario'}
                        </p>
                    </div>
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{theme?.companyName || 'InmoTasador'}</p>
                </div>
            </div>
        </div>
    );

    const renderMinimalist = () => (
        <div className="print-page cover-page h-[1123px] w-full bg-white relative flex flex-col font-sans overflow-hidden">
            {/* Header: Logo & Title */}
            <div className="w-full flex justify-between items-center mb-16">
                <div>
                    {theme?.logoUrl ? (
                        <img
                            src={getSafeImageUrl(theme.logoUrl)}
                            alt={`Logo ${theme?.companyName || ''}`}
                            className="max-h-[60px] object-contain"
                            crossOrigin="anonymous"
                        />
                    ) : (
                        <div className="font-bold text-2xl" style={{ color: brandBlue }}>
                            {theme?.companyName || 'InmoTasador'}
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {reportDate.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: '2-digit' })}
                    </p>
                </div>
            </div>

            {/* Title Section */}
            <div className="mb-12">
                <p className="text-xs font-bold uppercase tracking-widest mb-3 text-slate-400">
                    Informe de Tasación Inmobiliaria
                </p>
                <h1 className="text-[3.75rem] leading-[1.1] font-light tracking-tight text-slate-900">
                    {data.target?.address || 'Dirección de la Propiedad'}
                </h1>
                <div className="w-full h-px mt-12 bg-slate-200"></div>
            </div>

            {/* Property Image (Clean, aspect ratio maintained) */}
            {data.target?.images && data.target.images.length > 0 && (
                <div className="w-full h-[450px] overflow-hidden mb-12 rounded-lg shadow-sm">
                    <img
                        src={getSafeImageUrl(data.target.images[0])}
                        alt="Propiedad"
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                    />
                </div>
            )}

            <div className="flex-1"></div>

            {/* Footer Section */}
            <div className="w-full pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 pb-4">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Preparado para</p>
                    <p className="text-lg font-medium text-slate-800">{data.clientName || 'Cliente'}</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Corredor Responsable</p>
                    <p className="text-lg font-medium text-slate-800">{data.corredorName || theme?.holderName || 'Corredor'}</p>
                    <p className="text-xs text-slate-500">
                        {data.matricula ? `Matrícula ${data.matricula}` : 'Corredor Inmobiliario'}
                    </p>
                </div>
            </div>
        </div>
    );

    const renderExecutive = () => (
        <div className="print-page cover-page h-[1123px] w-full bg-white relative flex flex-col items-center justify-center font-sans overflow-hidden p-16">
            {/* Elegant Outer Border */}
            <div 
                className="absolute inset-6 border-[8px] opacity-10 pointer-events-none"
                style={{ borderColor: brandBlue }}
            ></div>
            <div 
                className="absolute inset-8 border border-slate-200 pointer-events-none"
            ></div>

            {/* Centered Content */}
            <div className="flex flex-col items-center text-center max-w-[80%] z-10 w-full mt-[-100px]">
                {/* Logo */}
                <div className="mb-24 h-[120px] flex items-center justify-center">
                    {theme?.logoUrl ? (
                        <img
                            src={getSafeImageUrl(theme.logoUrl)}
                            alt={`Logo ${theme?.companyName || ''}`}
                            className="max-h-full max-w-[280px] object-contain"
                            crossOrigin="anonymous"
                        />
                    ) : (
                        <div className="font-bold text-4xl" style={{ color: brandBlue }}>
                            {theme?.companyName || 'InmoTasador'}
                        </div>
                    )}
                </div>

                {/* Titles */}
                <p className="text-sm font-bold uppercase tracking-[0.3em] mb-8" style={{ color: goldAccent }}>
                    Informe Ejecutivo de Tasación
                </p>
                
                <h1 className="text-5xl font-serif font-medium tracking-tight leading-tight text-slate-900 mb-12 px-4">
                    {data.target?.address || 'Dirección de la Propiedad'}
                </h1>

                <div className="w-16 h-[2px] mx-auto mb-12" style={{ backgroundColor: brandBlue }}></div>

                <p className="text-lg text-slate-500 font-serif italic mb-24">
                    {reportDate.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                {/* Signatures / Details */}
                <div className="w-full flex justify-between px-12 mt-16 pt-16 border-t border-slate-100">
                    <div className="text-left">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Preparado para</p>
                        <p className="text-lg font-medium text-slate-800">{data.clientName || 'Cliente'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Profesional Actuante</p>
                        <p className="text-lg font-medium text-slate-800">{data.corredorName || theme?.holderName || 'Corredor Responsable'}</p>
                        <p className="text-xs text-slate-500">
                            {data.matricula ? `Matrícula ${data.matricula}` : 'Corredor Inmobiliario'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    switch (templateId) {
        case 'minimalist':
            return renderMinimalist();
        case 'executive':
            return renderExecutive();
        case 'classic':
        case 'complete':
        default:
            return renderClassic();
    }
};

export default CoverPage;
