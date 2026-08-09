import React, { useState, useEffect } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { updateTenant, uploadTenantLogo } from '../services/tenantService';
import { Building2, Save, Upload, Loader2, AlertCircle, Palette, CheckCircle2 } from 'lucide-react';
import type { TenantConfig } from '../types/tenant';

// Paleta predefinida (basada en colores Tailwind comunes)
const PREDEFINED_COLORS = [
    { name: 'Índigo', value: '#4f46e5' },   // indigo-600
    { name: 'Azul', value: '#2563eb' },     // blue-600
    { name: 'Esmeralda', value: '#059669' },// emerald-600
    { name: 'Rojo', value: '#dc2626' },     // red-600
    { name: 'Naranja', value: '#ea580c' },  // orange-600
    { name: 'Violeta', value: '#7c3aed' },  // violet-600
    { name: 'Rosa', value: '#db2777' },     // pink-600
    { name: 'Gris Oscuro', value: '#334155' } // slate-700
];

const inputClass =
    'w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500';

export default function TenantSettings() {
    const { tenant, isTenantOwner } = useTenant();
    const [formData, setFormData] = useState<TenantConfig | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');

    useEffect(() => {
        if (tenant) {
            setFormData(tenant);
            setLogoPreview(tenant.branding.logoUrl || '');
        }
    }, [tenant]);

    if (!isTenantOwner) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-500">
                <AlertCircle className="w-12 h-12" />
                <p>No tenés permisos para editar la configuración de esta empresa.</p>
            </div>
        );
    }

    if (!formData) return null;

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (section: 'branding' | 'institutional', field: string, value: string) => {
        setFormData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: value
                }
            };
        });
    };

    const handleColorChange = (color: string) => {
        setFormData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                branding: {
                    ...prev.branding,
                    colors: {
                        ...prev.branding.colors,
                        primary: color
                    }
                }
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData) return;

        setSaving(true);
        setMessage(null);

        try {
            let finalLogoUrl = formData.branding.logoUrl;

            if (logoFile) {
                finalLogoUrl = await uploadTenantLogo(formData.id, logoFile);
            }

            const updates: Partial<TenantConfig> = {
                branding: {
                    ...formData.branding,
                    logoUrl: finalLogoUrl
                },
                institutional: formData.institutional
            };

            await updateTenant(formData.id, updates);
            
            setMessage({ type: 'success', text: '¡Configuración guardada correctamente! Recarga la página para ver todos los cambios aplicados en la marca.' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Ocurrió un error al guardar los cambios.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
            <div className="flex items-center space-x-3 mb-8">
                <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-xl">
                    <Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración de Empresa</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Personaliza la marca y los datos institucionales de tus PDFs</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl mb-6 flex items-center space-x-3 ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'}`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Branding Section */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Palette className="w-5 h-5 text-indigo-500" />
                            Marca y Apariencia
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre Comercial</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={formData.branding.companyName}
                                    onChange={e => handleChange('branding', 'companyName', e.target.value)}
                                    placeholder="Ej: Inmobiliaria Gómez"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Razón Social</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={formData.branding.companyLegalName}
                                    onChange={e => handleChange('branding', 'companyLegalName', e.target.value)}
                                    placeholder="Ej: Gómez S.A."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Logo de la Empresa</label>
                            <div className="flex items-center space-x-6">
                                <div className="flex-shrink-0 h-24 w-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain" />
                                    ) : (
                                        <Building2 className="w-8 h-8 text-slate-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                        <Upload className="w-4 h-4 mr-2" />
                                        Subir Nuevo Logo
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                        />
                                    </label>
                                    <p className="mt-2 text-xs text-slate-500">PNG, JPG o SVG. Se recomienda fondo transparente.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Color Principal (PDFs y App)</label>
                            <div className="flex flex-wrap gap-3">
                                {PREDEFINED_COLORS.map(color => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => handleColorChange(color.value)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${formData.branding.colors.primary === color.value ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-110'}`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    >
                                        {formData.branding.colors.primary === color.value && (
                                            <CheckCircle2 className="w-5 h-5 text-white" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Institutional Section */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/50">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-500" />
                            Datos Institucionales
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nombre del Titular</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={formData.institutional.holderName}
                                onChange={e => handleChange('institutional', 'holderName', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Título Profesional</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={formData.institutional.professionalTitle}
                                onChange={e => handleChange('institutional', 'professionalTitle', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Colegio / Organismo</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={formData.institutional.registrationBody}
                                onChange={e => handleChange('institutional', 'registrationBody', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">N° Matrícula</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={formData.institutional.registrationNumber}
                                onChange={e => handleChange('institutional', 'registrationNumber', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email de Contacto</label>
                            <input
                                type="email"
                                className={inputClass}
                                value={formData.institutional.email}
                                onChange={e => handleChange('institutional', 'email', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Teléfono</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={formData.institutional.phone}
                                onChange={e => handleChange('institutional', 'phone', e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Dirección</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={formData.institutional.address}
                                onChange={e => handleChange('institutional', 'address', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ciudad</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={formData.institutional.city}
                                onChange={e => handleChange('institutional', 'city', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sitio Web</label>
                            <input
                                type="url"
                                className={inputClass}
                                value={formData.institutional.website}
                                onChange={e => handleChange('institutional', 'website', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-xl transition-colors focus:ring-4 focus:ring-indigo-500/20"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                Guardar Configuración
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
