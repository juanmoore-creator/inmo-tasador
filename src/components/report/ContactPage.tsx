import type { ContactPageProps } from '../../types';

const ContactPage = ({ data, theme, pageNumber }: ContactPageProps) => {
    const brandBlue = theme?.primary || '#3F11B2';

    return (
        <div className="print-page h-[1123px] w-full bg-white p-12 pb-32 relative flex flex-col justify-center items-center text-center font-sans">
            <h2 className="text-4xl font-bold mb-12" style={{ color: brandBlue }}>{theme?.companyLegalName || theme?.companyName || 'InmoTasador'}</h2>

            <div className="space-y-4 text-lg text-slate-700">
                <p><strong>{theme?.professionalTitle || 'Corredor Responsable'}:</strong> {data.corredorName || theme?.holderName || 'Nombre del Agente'}</p>
                <p><strong>{theme?.registrationLabel ? theme.registrationLabel.split(' Nro')[0] : 'Matrícula'}:</strong> {data.matricula || theme?.registrationLabel?.split('Nro ')[1] || 'XXXX'}</p>
                <p><strong>Dirección:</strong> {theme?.address || 'Sin dirección registrada'}{theme?.city ? `, ${theme.city}` : ''}</p>
                <p><strong>Teléfono:</strong> {theme?.phone || '-'}</p>
                <p><strong>Email:</strong> {theme?.email || '-'}</p>
                <p><strong>Web:</strong> {theme?.website || '-'}</p>
            </div>

            <div className="absolute bottom-32 left-12 right-12 pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-400 bg-white z-10">
                <span>Reporte generado el {new Date().toLocaleDateString()}</span>
                {pageNumber && <span>Página {pageNumber}</span>}
            </div>

            <div className="absolute bottom-12 left-12 right-12 text-sm text-slate-400 max-w-lg mx-auto leading-relaxed bg-white z-10">
                <p>
                    <strong>Aviso Legal:</strong> La presente tasación es una estimación de valor de mercado basada en comparables
                    y análisis profesional. No constituye una tasación bancaria oficial ni garantiza el precio final de venta.
                    Los valores pueden variar según las condiciones del mercado.
                </p>
            </div>
        </div>
    );
};

export default ContactPage;
