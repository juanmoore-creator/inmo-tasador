
import type { CoverPageProps } from '../../types';
import { getSafeImageUrl } from '../../utils/image';


const CoverPage = ({ data, theme, valuationDate }: CoverPageProps) => {
    const reportDate = valuationDate ? new Date(valuationDate) : new Date();
    const brandBlue = theme?.primary || '#3F11B2';
    const goldAccent = theme?.accent || '#C5A059';

    return (
        <div className="print-page cover-page h-[1123px] w-full bg-white relative flex overflow-hidden font-sans">
            {/* Left Sidebar */}
            <div className="w-1/4 h-full relative flex flex-col items-center pt-24" style={{ backgroundColor: brandBlue }}>
                {/* Logo */}
                <div className="mb-12 px-2 w-full">
                    {theme?.logoUrl ? (
                        <img
                            src={getSafeImageUrl(theme.logoUrl)}
                            alt={`Logo ${theme?.companyName || ''}`}
                            className="w-full max-w-[220px] object-contain mx-auto brightness-0 invert"
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
};

export default CoverPage;
