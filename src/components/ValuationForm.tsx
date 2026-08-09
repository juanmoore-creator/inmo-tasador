import { useState, useEffect } from 'react';
import type { TargetProperty, Comparable, SavedValuation } from '../types';
import ImageUploader from './ImageUploader';
import AddressAutocomplete from './AddressAutocomplete';
import GoogleMapPreview from './GoogleMapPreview';
import HelpAnnotationsModal from './HelpAnnotationsModal';

interface ValuationFormProps {
    onGenerate: (data: SavedValuation) => void;
    initialData?: SavedValuation | null;
    onChange?: (data: SavedValuation) => void;
}

const emptyLocation = { lat: 0, lng: 0 };

const emptyTarget: TargetProperty = {
    address: '',
    location: emptyLocation,
    coveredSurface: 0,
    uncoveredSurface: 0,
    semiCoveredSurface: 0,
    surfaceType: 'Ninguno',
    homogenizationFactor: 0.5,
    age: 0,
    bathrooms: 1,
    bedrooms: 1,
    rooms: 1,
    garage: false,
    images: [],
    mapImage: '',
};

const emptyComparable: Comparable = {
    id: '',
    address: '',
    location: emptyLocation,
    price: 0,
    coveredSurface: 0,
    uncoveredSurface: 0,
    semiCoveredSurface: 0,
    surfaceType: 'Ninguno',
    homogenizationFactor: 0.5,
    daysOnMarket: 0,
    age: 0,
    bathrooms: 1,
    bedrooms: 1,
    rooms: 1,
    garage: false,
    publicationPrice: 0,
    closingPrice: 0,
    images: [],
    status: 'Disponible'
};

const inputClass = "w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500";
const labelClass = "text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block";
const sectionHeaderClass = "text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2 cursor-pointer select-none";
const toggleRowClass = "flex items-center gap-3 py-1";

// Reusable toggle component
const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className={toggleRowClass}>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
            <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-indigo-600 transition-colors"></div>
            <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
        </label>
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
    </div>
);

// Collapsible section component
const CollapsibleSection = ({ title, icon, children, defaultOpen = false }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
            <div className={sectionHeaderClass} onClick={() => setIsOpen(!isOpen)}>
                <span>{icon}</span>
                <span>{title}</span>
                <span className={`ml-auto text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
            </div>
            {isOpen && <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">{children}</div>}
        </div>
    );
};

export default function ValuationForm({ onGenerate, initialData, onChange }: ValuationFormProps) {
    const [helpOpen, setHelpOpen] = useState(false);
    const [expandedComparables, setExpandedComparables] = useState<Set<string>>(new Set());
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; address: string } | null>(null);
    const [formData, setFormData] = useState<SavedValuation>(initialData || {
        id: `val-${Date.now()}`,
        tenantId: 'default',
        name: 'Nueva Tasación',
        date: Date.now(),
        target: { ...emptyTarget },
        comparables: [],
        clientName: '',
        corredorName: '',
        matricula: '',
        valuation: {
            low: 0,
            market: 0,
            high: 0
        }
    });

    const handleTargetChange = (field: keyof TargetProperty, value: any) => {
        setFormData(prev => ({
            ...prev,
            target: { ...prev.target, [field]: value }
        }));
    };

    const handleGeneralChange = (field: keyof SavedValuation, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const addComparable = () => {
        const newId = `comp-${Date.now()}`;
        setFormData(prev => ({
            ...prev,
            comparables: [...prev.comparables, { ...emptyComparable, id: newId }]
        }));
        setExpandedComparables(prev => new Set([...prev, newId]));
    };

    const handleAddScrapedComparable = (data: Partial<Comparable>) => {
        const newId = `comp-${Date.now()}`;
        setFormData(prev => ({
            ...prev,
            comparables: [...prev.comparables, { ...emptyComparable, id: newId, ...data }]
        }));
        setExpandedComparables(prev => new Set([...prev, newId]));
    };

    const updateComparable = (id: string, field: keyof Comparable, value: any) => {
        setFormData(prev => ({
            ...prev,
            comparables: prev.comparables.map(comp =>
                comp.id === id ? { ...comp, [field]: value } : comp
            )
        }));
    };

    const removeComparable = (id: string) => {
        setFormData(prev => ({
            ...prev,
            comparables: prev.comparables.filter(comp => comp.id !== id)
        }));
        setExpandedComparables(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const toggleComparable = (id: string) => {
        setExpandedComparables(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    useEffect(() => {
        if (onChange) onChange(formData);
    }, [formData]);

    // Sincronizar el ID real de Firestore una vez que se guarda por primera vez.
    // Solo actualiza el ID (no reemplaza todo el formulario) para no perder cambios en curso.
    useEffect(() => {
        if (initialData?.id && initialData.id !== formData.id) {
            setFormData(prev => ({ ...prev, id: initialData.id! }));
        }
    }, [initialData?.id]);

    // ── Listen for ZONAPROP_DATA from Chrome extension content script ──
    const [extensionToast, setExtensionToast] = useState<string | null>(null);

    useEffect(() => {
        const handleExtensionMessage = (event: MessageEvent) => {
            // Security: only accept messages from same window with correct type
            if (event.source !== window) return;
            if (event.data?.type !== 'ZONAPROP_DATA') return;

            const zpData = event.data.data;
            if (!zpData) return;

            console.log('ValuationForm: Received ZonaProp data from extension', zpData);

            // Map ZonaProp PropertyData → Comparable
            const coveredSurface = zpData.features?.superficieCubierta ?? 0;
            const totalSurface = zpData.features?.superficieTotal ?? 0;
            const uncoveredSurface = Math.max(0, totalSurface - coveredSurface);
            const cocheras = zpData.features?.cocheras ?? 0;

            // Extract property type from typeSummary (e.g. "Departamento en Venta" → "Departamento")
            let propertyType = '';
            if (zpData.typeSummary) {
                const typeMatch = zpData.typeSummary.match(/^(Departamento|Casa|PH|Local|Oficina|Terreno)/i);
                propertyType = typeMatch ? typeMatch[1] : '';
            }

            const newComparable: Partial<Comparable> = {
                address: zpData.location?.full || zpData.location?.breadcrumb?.join(', ') || '',
                price: zpData.price?.value ?? 0,
                publicationPrice: zpData.price?.value ?? 0,
                coveredSurface,
                uncoveredSurface,
                surfaceType: 'Ninguno' as const,
                homogenizationFactor: 0.5,
                rooms: zpData.features?.ambientes ?? 1,
                bedrooms: zpData.features?.dormitorios ?? 1,
                bathrooms: zpData.features?.banos ?? 1,
                toilettes: zpData.features?.toilette ?? 0,
                garageCount: cocheras,
                garage: cocheras > 0,
                age: zpData.features?.antiguedad ?? 0,
                disposition: zpData.features?.disposicion || '',
                orientation: zpData.features?.orientacion || '',
                expensas: zpData.expenses?.value ?? 0,
                propertyType,
                status: 'Disponible' as const,
            };

            handleAddScrapedComparable(newComparable);

            // Show toast feedback
            const label = zpData.location?.full || zpData.title || 'Propiedad';
            setExtensionToast(`✅ Comparable agregado: ${label}`);
            setTimeout(() => setExtensionToast(null), 3500);
        };

        window.addEventListener('message', handleExtensionMessage);
        return () => window.removeEventListener('message', handleExtensionMessage);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(formData);
    };

    const handleAutoCalculate = () => {
        if (formData.comparables.length === 0) return;

        let totalHomogenizedPricePerM2 = 0;
        let validComparables = 0;

        formData.comparables.forEach(comp => {
            const hSurface = (comp.coveredSurface || 0) + ((comp.uncoveredSurface || 0) * (comp.homogenizationFactor ?? 0.5));
            if (hSurface > 0 && comp.price > 0) {
                totalHomogenizedPricePerM2 += comp.price / hSurface;
                validComparables++;
            }
        });

        if (validComparables === 0) return;

        const avgPricePerM2 = totalHomogenizedPricePerM2 / validComparables;
        const targetHSurface = (formData.target.coveredSurface || 0) + ((formData.target.uncoveredSurface || 0) * (formData.target.homogenizationFactor ?? 0.5));
        const estimatedMarketValue = Math.round(targetHSurface * avgPricePerM2);

        if (estimatedMarketValue > 0) {
            setFormData(prev => ({
                ...prev,
                valuation: {
                    low: Math.round(estimatedMarketValue * 0.95),
                    market: estimatedMarketValue,
                    high: Math.round(estimatedMarketValue * 1.05)
                }
            }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Help Annotations Modal */}
            <HelpAnnotationsModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

            {/* Información General */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Información General</h2>
                    {/* Help button */}
                    <button
                        type="button"
                        onClick={() => setHelpOpen(true)}
                        title="Notas de ayuda"
                        className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold hover:bg-indigo-200 dark:hover:bg-indigo-600/40 transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        ?
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className={labelClass}>Nombre del Cliente</label>
                        <input
                            type="text"
                            value={formData.clientName}
                            onChange={(e) => handleGeneralChange('clientName', e.target.value)}
                            className={inputClass}
                            placeholder="Nombre completo"
                            required
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Nombre del Corredor</label>
                        <input
                            type="text"
                            value={formData.corredorName}
                            onChange={(e) => handleGeneralChange('corredorName', e.target.value)}
                            className={inputClass}
                            placeholder="Responsable"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Matrícula</label>
                        <input
                            type="text"
                            value={formData.matricula}
                            onChange={(e) => handleGeneralChange('matricula', e.target.value)}
                            className={inputClass}
                            placeholder="Ej. CUCICBA 1234"
                        />
                    </div>
                </div>
            </div>

            {/* Propiedad Objetivo */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Propiedad a Tasar</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="col-span-full">
                        <label className={labelClass}>Dirección</label>
                        <AddressAutocomplete
                            value={formData.target.address}
                            onChange={(v) => handleTargetChange('address', v)}
                            onSelect={(address, lat, lng) => {
                                setFormData(prev => ({
                                    ...prev,
                                    target: { ...prev.target, address, location: { lat, lng } }
                                }));
                            }}
                            placeholder="Ubicación de la propiedad"
                            required
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Sup. Cubierta (m²)</label>
                        <input type="number" value={formData.target.coveredSurface || ''} onChange={(e) => handleTargetChange('coveredSurface', Number(e.target.value))} className={inputClass} required min="0" />
                    </div>
                    <div>
                        <label className={labelClass}>Sup. Semicubierta (m²)</label>
                        <input type="number" value={formData.target.semiCoveredSurface || ''} onChange={(e) => handleTargetChange('semiCoveredSurface', Number(e.target.value))} className={inputClass} min="0" />
                    </div>
                    <div>
                        <label className={labelClass}>Sup. Descubierta (m²)</label>
                        <input type="number" value={formData.target.uncoveredSurface || ''} onChange={(e) => handleTargetChange('uncoveredSurface', Number(e.target.value))} className={inputClass} min="0" />
                    </div>
                    <div>
                        <label className={labelClass}>Factor Homog.</label>
                        <input type="number" step="0.1" value={formData.target.homogenizationFactor ?? 0.5} onChange={(e) => handleTargetChange('homogenizationFactor', Number(e.target.value))} className={inputClass} min="0" max="1" />
                    </div>

                    <div>
                        <label className={labelClass}>Ambientes</label>
                        <input type="number" value={formData.target.rooms || ''} onChange={(e) => handleTargetChange('rooms', Number(e.target.value))} className={inputClass} min="1" />
                    </div>
                    <div>
                        <label className={labelClass}>Dormitorios</label>
                        <input type="number" value={formData.target.bedrooms || ''} onChange={(e) => handleTargetChange('bedrooms', Number(e.target.value))} className={inputClass} min="0" />
                    </div>
                    <div>
                        <label className={labelClass}>Baños</label>
                        <input type="number" value={formData.target.bathrooms || ''} onChange={(e) => handleTargetChange('bathrooms', Number(e.target.value))} className={inputClass} min="0" />
                    </div>
                    <div>
                        <label className={labelClass}>Antigüedad (años)</label>
                        <input type="number" value={formData.target.age || ''} onChange={(e) => handleTargetChange('age', Number(e.target.value))} className={inputClass} min="0" />
                    </div>

                    <div className="col-span-full flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={formData.target.garage || false} onChange={(e) => handleTargetChange('garage', e.target.checked)} className="sr-only peer" />
                            <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-indigo-600 transition-colors"></div>
                            <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                        </label>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Cochera</span>
                    </div>

                    <div className="col-span-full">
                        <label className={labelClass}>Fotos de la Propiedad</label>
                        <ImageUploader
                            images={formData.target.images || []}
                            onChange={(images) => handleTargetChange('images', images)}
                            label="Foto de la Propiedad"
                            maxImages={1}
                        />
                    </div>

                    <GoogleMapPreview
                        target={formData.target}
                        comparables={formData.comparables}
                        onMapImageReady={(url) => handleTargetChange('mapImage', url)}
                    />
                </div>
            </div>

            {/* Comparables */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Comparables</h2>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={addComparable}
                            className="bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-600/20 transition-colors"
                        >
                            + Agregar
                        </button>
                    </div>
                </div>

                {formData.comparables.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                        <p className="text-slate-400 dark:text-slate-500 text-sm">No hay comparables aún. Agregá una para empezar.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {formData.comparables.map((comp, index) => {
                            const isExpanded = expandedComparables.has(comp.id);
                            const displayAddress = comp.address || 'Sin dirección';
                            const displayPrice = comp.price ? `USD ${comp.price.toLocaleString('es-AR')}` : '—';
                            const statusColors: Record<string, string> = {
                                'Disponible': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
                                'Reservado': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
                                'Vendido': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
                                'Cerrada': 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
                            };
                            const statusClass = statusColors[comp.status ?? 'Disponible'] || statusColors['Disponible'];
                            return (
                            <div key={comp.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden group/item">
                                {/* Collapsible Header */}
                                <div
                                    className="flex items-center gap-3 px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none"
                                    onClick={() => toggleComparable(comp.id)}
                                >
                                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 shrink-0">#{index + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{displayAddress}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">{displayPrice}</p>
                                    </div>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusClass}`}>{comp.status}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: comp.id, address: comp.address || 'Sin dirección' }); }}
                                        className="w-7 h-7 bg-white dark:bg-slate-700 text-slate-300 hover:text-red-500 border border-slate-200 dark:border-slate-600 rounded-full flex items-center justify-center transition-all opacity-0 group-hover/item:opacity-100 text-xs shrink-0"
                                        title="Eliminar"
                                    >
                                        ✕
                                    </button>
                                    <svg
                                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>

                                {/* Collapsible Body */}
                                {isExpanded && (
                                <div className="p-5 bg-white dark:bg-slate-900/30">

                                {/* Main fields (always visible) */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="col-span-full md:col-span-2">
                                        <label className={labelClass}>Dirección</label>
                                        <AddressAutocomplete
                                            value={comp.address}
                                            onChange={(v) => updateComparable(comp.id, 'address', v)}
                                            onSelect={(address, lat, lng) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    comparables: prev.comparables.map(c =>
                                                        c.id === comp.id
                                                            ? { ...c, address, location: { lat, lng } }
                                                            : c
                                                    )
                                                }));
                                            }}
                                            placeholder="Dirección del comparable"
                                            required
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Precio (USD)</label>
                                        <input type="number" value={comp.price || ''} onChange={(e) => updateComparable(comp.id, 'price', Number(e.target.value))} className={inputClass} required min="0" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Estado</label>
                                        <select value={comp.status} onChange={(e) => updateComparable(comp.id, 'status', e.target.value)} className={inputClass}>
                                            <option value="Disponible">Disponible</option>
                                            <option value="Reservado">Reservado</option>
                                            <option value="Vendido">Vendido</option>
                                            <option value="Cerrada">Cerrada</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Sup. Cubierta</label>
                                        <input type="number" value={comp.coveredSurface || ''} onChange={(e) => updateComparable(comp.id, 'coveredSurface', Number(e.target.value))} className={inputClass} required min="0" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Sup. Semicub.</label>
                                        <input type="number" value={comp.semiCoveredSurface || ''} onChange={(e) => updateComparable(comp.id, 'semiCoveredSurface', Number(e.target.value))} className={inputClass} min="0" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Sup. Desc.</label>
                                        <input type="number" value={comp.uncoveredSurface || ''} onChange={(e) => updateComparable(comp.id, 'uncoveredSurface', Number(e.target.value))} className={inputClass} min="0" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Factor Homog.</label>
                                        <input type="number" step="0.1" value={comp.homogenizationFactor ?? 0.5} onChange={(e) => updateComparable(comp.id, 'homogenizationFactor', Number(e.target.value))} className={inputClass} min="0" max="1" />
                                    </div>
                                </div>

                                {/* === COLLAPSIBLE SECTIONS === */}

                                {/* Detalles Generales y de Mercado */}
                                <CollapsibleSection title="Detalles Generales y de Mercado" icon="📊">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className={labelClass}>Tipo de Propiedad</label>
                                            <select value={comp.propertyType || ''} onChange={(e) => updateComparable(comp.id, 'propertyType', e.target.value)} className={inputClass}>
                                                <option value="">Sin especificar</option>
                                                <option value="Departamento">Departamento</option>
                                                <option value="Casa">Casa</option>
                                                <option value="PH">PH</option>
                                                <option value="Local">Local</option>
                                                <option value="Oficina">Oficina</option>
                                                <option value="Terreno">Terreno</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Estado de Captación</label>
                                            <select value={comp.captacionStatus || ''} onChange={(e) => updateComparable(comp.id, 'captacionStatus', e.target.value)} className={inputClass}>
                                                <option value="">Sin especificar</option>
                                                <option value="Activa">Activa</option>
                                                <option value="Cerrada">Cerrada</option>
                                                <option value="Cancelada">Cancelada</option>
                                                <option value="Reservada">Reservada</option>
                                                <option value="Vendido">Vendido</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Precio Publicación (USD)</label>
                                            <input type="number" value={comp.publicationPrice || ''} onChange={(e) => updateComparable(comp.id, 'publicationPrice', Number(e.target.value))} className={inputClass} min="0" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Precio de Venta (USD)</label>
                                            <input type="number" value={comp.closingPrice || ''} onChange={(e) => updateComparable(comp.id, 'closingPrice', Number(e.target.value))} className={inputClass} min="0" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>% Negociación</label>
                                            <input type="number" step="0.01" value={comp.negotiationPercent || ''} onChange={(e) => updateComparable(comp.id, 'negotiationPercent', Number(e.target.value))} className={inputClass} placeholder="Se calcula automático" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Días en el Mercado</label>
                                            <input type="number" value={comp.daysOnMarket || ''} onChange={(e) => updateComparable(comp.id, 'daysOnMarket', Number(e.target.value))} className={inputClass} min="0" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Fecha de Cierre</label>
                                            <input type="text" value={comp.closingDate || ''} onChange={(e) => updateComparable(comp.id, 'closingDate', e.target.value)} className={inputClass} placeholder="MM/AAAA" />
                                        </div>
                                    </div>
                                </CollapsibleSection>

                                {/* Ubicación y Edificio */}
                                <CollapsibleSection title="Ubicación y Edificio" icon="🏢">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className={labelClass}>Antigüedad (años)</label>
                                            <input type="number" value={comp.age || ''} onChange={(e) => updateComparable(comp.id, 'age', Number(e.target.value))} className={inputClass} min="0" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Pisos del Edificio</label>
                                            <input type="number" value={comp.buildingFloors || ''} onChange={(e) => updateComparable(comp.id, 'buildingFloors', Number(e.target.value))} className={inputClass} min="0" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Deptos. en Edificio</label>
                                            <input type="number" value={comp.apartmentsInBuilding || ''} onChange={(e) => updateComparable(comp.id, 'apartmentsInBuilding', Number(e.target.value))} className={inputClass} min="0" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Expensas ($)</label>
                                            <input type="number" value={comp.expensas || ''} onChange={(e) => updateComparable(comp.id, 'expensas', Number(e.target.value))} className={inputClass} min="0" />
                                        </div>
                                    </div>
                                </CollapsibleSection>

                                {/* Distribución Interna */}
                                <CollapsibleSection title="Distribución Interna y Comodidades" icon="🏠">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                                        <div>
                                            <label className={labelClass}>Ambientes</label>
                                            <input type="number" value={comp.rooms || ''} onChange={(e) => updateComparable(comp.id, 'rooms', Number(e.target.value))} className={inputClass} min="0" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Dormitorios</label>
                                            <input type="number" value={comp.bedrooms || ''} onChange={(e) => updateComparable(comp.id, 'bedrooms', Number(e.target.value))} className={inputClass} min="0" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Baños</label>
                                            <input type="number" value={comp.bathrooms || ''} onChange={(e) => updateComparable(comp.id, 'bathrooms', Number(e.target.value))} className={inputClass} min="0" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Toilettes</label>
                                            <input type="number" value={comp.toilettes || ''} onChange={(e) => updateComparable(comp.id, 'toilettes', Number(e.target.value))} className={inputClass} min="0" />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Cocheras (cant.)</label>
                                            <input type="number" value={comp.garageCount || ''} onChange={(e) => updateComparable(comp.id, 'garageCount', Number(e.target.value))} className={inputClass} min="0" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Espacios</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
                                        <Toggle label="Living" checked={comp.hasLiving || false} onChange={(v) => updateComparable(comp.id, 'hasLiving', v)} />
                                        <Toggle label="Comedor" checked={comp.hasDining || false} onChange={(v) => updateComparable(comp.id, 'hasDining', v)} />
                                        <Toggle label="Cocina" checked={comp.hasKitchen || false} onChange={(v) => updateComparable(comp.id, 'hasKitchen', v)} />
                                        <Toggle label="Lavadero" checked={comp.hasLaundry || false} onChange={(v) => updateComparable(comp.id, 'hasLaundry', v)} />
                                        <Toggle label="Estudio" checked={comp.hasStudy || false} onChange={(v) => updateComparable(comp.id, 'hasStudy', v)} />
                                        <Toggle label="Hab. Servicio" checked={comp.hasServiceRoom || false} onChange={(v) => updateComparable(comp.id, 'hasServiceRoom', v)} />
                                        <Toggle label="Terraza" checked={comp.hasTerrace || false} onChange={(v) => updateComparable(comp.id, 'hasTerrace', v)} />
                                        <Toggle label="Patio" checked={comp.hasPatio || false} onChange={(v) => updateComparable(comp.id, 'hasPatio', v)} />
                                        <Toggle label="Jardín Invierno" checked={comp.hasWinterGarden || false} onChange={(v) => updateComparable(comp.id, 'hasWinterGarden', v)} />
                                        <Toggle label="Balcón" checked={comp.hasBalcony || false} onChange={(v) => updateComparable(comp.id, 'hasBalcony', v)} />
                                        <Toggle label="Baulera" checked={comp.hasBaulera || false} onChange={(v) => updateComparable(comp.id, 'hasBaulera', v)} />
                                    </div>
                                </CollapsibleSection>

                                {/* Servicios y Equipamiento */}
                                <CollapsibleSection title="Servicios y Equipamiento" icon="⚡">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Servicios</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 mb-3">
                                        <Toggle label="Agua corriente" checked={comp.hasWater || false} onChange={(v) => updateComparable(comp.id, 'hasWater', v)} />
                                        <Toggle label="Cloacas" checked={comp.hasSewer || false} onChange={(v) => updateComparable(comp.id, 'hasSewer', v)} />
                                        <Toggle label="Gas natural" checked={comp.hasGas || false} onChange={(v) => updateComparable(comp.id, 'hasGas', v)} />
                                        <Toggle label="Electricidad" checked={comp.hasElectricity || false} onChange={(v) => updateComparable(comp.id, 'hasElectricity', v)} />
                                        <Toggle label="Pavimento" checked={comp.hasPavement || false} onChange={(v) => updateComparable(comp.id, 'hasPavement', v)} />
                                        <Toggle label="Internet/WiFi" checked={comp.hasInternet || false} onChange={(v) => updateComparable(comp.id, 'hasInternet', v)} />
                                        <Toggle label="Teléfono" checked={comp.hasPhone || false} onChange={(v) => updateComparable(comp.id, 'hasPhone', v)} />
                                        <Toggle label="TV Cable" checked={comp.hasCableTV || false} onChange={(v) => updateComparable(comp.id, 'hasCableTV', v)} />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Equipamiento</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
                                        <Toggle label="Ascensor" checked={comp.hasElevator || false} onChange={(v) => updateComparable(comp.id, 'hasElevator', v)} />
                                        <Toggle label="Calefacción" checked={comp.hasHeating || false} onChange={(v) => updateComparable(comp.id, 'hasHeating', v)} />
                                        <Toggle label="Aire Acond." checked={comp.hasAC || false} onChange={(v) => updateComparable(comp.id, 'hasAC', v)} />
                                        <Toggle label="Seguridad" checked={comp.hasSecurity || false} onChange={(v) => updateComparable(comp.id, 'hasSecurity', v)} />
                                        <Toggle label="Alarma" checked={comp.hasAlarm || false} onChange={(v) => updateComparable(comp.id, 'hasAlarm', v)} />
                                        <Toggle label="Parrilla" checked={comp.hasGrill || false} onChange={(v) => updateComparable(comp.id, 'hasGrill', v)} />
                                    </div>
                                </CollapsibleSection>

                                {/* Aptitudes y Orientación */}
                                <CollapsibleSection title="Aptitudes, Orientación y Otros" icon="🧭">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                                        <div>
                                            <label className={labelClass}>Disposición</label>
                                            <select value={comp.disposition || ''} onChange={(e) => updateComparable(comp.id, 'disposition', e.target.value)} className={inputClass}>
                                                <option value="">Sin especificar</option>
                                                <option value="Frente">Frente</option>
                                                <option value="Contrafrente">Contrafrente</option>
                                                <option value="Interno">Interno</option>
                                                <option value="Lateral">Lateral</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Orientación</label>
                                            <select value={comp.orientation || ''} onChange={(e) => updateComparable(comp.id, 'orientation', e.target.value)} className={inputClass}>
                                                <option value="">Sin especificar</option>
                                                <option value="Norte">Norte</option>
                                                <option value="Sur">Sur</option>
                                                <option value="Este">Este</option>
                                                <option value="Oeste">Oeste</option>
                                                <option value="Noreste">Noreste</option>
                                                <option value="Noroeste">Noroeste</option>
                                                <option value="Sureste">Sureste</option>
                                                <option value="Suroeste">Suroeste</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
                                        <Toggle label="Apto Crédito" checked={comp.isCreditEligible || false} onChange={(v) => updateComparable(comp.id, 'isCreditEligible', v)} />
                                        <Toggle label="Apto Profesional" checked={comp.isProfessional || false} onChange={(v) => updateComparable(comp.id, 'isProfessional', v)} />
                                        <Toggle label="Financiamiento" checked={comp.hasFinancing || false} onChange={(v) => updateComparable(comp.id, 'hasFinancing', v)} />
                                        <Toggle label="Mascotas" checked={comp.allowsPets || false} onChange={(v) => updateComparable(comp.id, 'allowsPets', v)} />
                                    </div>
                                </CollapsibleSection>

                                {/* Images */}
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                                    <ImageUploader
                                        images={comp.images || []}
                                        onChange={(images) => updateComparable(comp.id, 'images', images)}
                                        label="Fotos del Comparable"
                                        maxImages={4}
                                    />
                                </div>
                                </div>
                                )}
                            </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Valoración */}
            <div className="bg-indigo-600 text-white rounded-2xl p-6 md:p-8 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Valoración Final</h2>
                    <button
                        type="button"
                        onClick={handleAutoCalculate}
                        disabled={formData.comparables.length === 0}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-30"
                    >
                        ✨ Auto-calcular
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="text-xs font-semibold text-indigo-200 mb-1 block">Límite Inferior (USD)</label>
                        <input type="number" value={formData.valuation?.low || ''} onChange={(e) => handleGeneralChange('valuation', { ...formData.valuation, low: Number(e.target.value) })} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-3 text-xl font-bold focus:ring-2 focus:ring-white/30 outline-none transition-all placeholder:text-white/30" min="0" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-amber-300 mb-1 block">Valor de Mercado (USD)</label>
                        <input type="number" value={formData.valuation?.market || ''} onChange={(e) => handleGeneralChange('valuation', { ...formData.valuation, market: Number(e.target.value) })} className="w-full bg-white/10 border-2 border-amber-400/40 rounded-lg px-3 py-3 text-2xl font-bold text-amber-300 focus:ring-2 focus:ring-amber-400/30 outline-none transition-all" min="0" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-indigo-200 mb-1 block">Límite Superior (USD)</label>
                        <input type="number" value={formData.valuation?.high || ''} onChange={(e) => handleGeneralChange('valuation', { ...formData.valuation, high: Number(e.target.value) })} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-3 text-xl font-bold focus:ring-2 focus:ring-white/30 outline-none transition-all placeholder:text-white/30" min="0" />
                    </div>
                </div>

                {/* Límites de zona para el gráfico de análisis comparativo */}
                <div className="mt-5 pt-5 border-t border-white/10">
                    <p className="text-xs font-semibold text-indigo-200 mb-3 uppercase tracking-wider">
                        Límites de zona para el gráfico (USD/m² homogenizado)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="text-xs font-semibold text-green-300 mb-1 block">
                                🟢 Límite Venta / Prueba (USD/m²)
                            </label>
                            <input
                                type="number"
                                value={formData.valuation?.zoneLimit1 || ''}
                                onChange={(e) => handleGeneralChange('valuation', { ...formData.valuation, zoneLimit1: Number(e.target.value) || undefined })}
                                className="w-full bg-white/10 border border-green-400/30 rounded-lg px-3 py-2.5 text-base font-bold text-green-200 focus:ring-2 focus:ring-green-400/30 outline-none transition-all placeholder:text-white/30"
                                placeholder="Auto desde inferior"
                                min="0"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-red-300 mb-1 block">
                                🔴 Límite Prueba / No Venta (USD/m²)
                            </label>
                            <input
                                type="number"
                                value={formData.valuation?.zoneLimit2 || ''}
                                onChange={(e) => handleGeneralChange('valuation', { ...formData.valuation, zoneLimit2: Number(e.target.value) || undefined })}
                                className="w-full bg-white/10 border border-red-400/30 rounded-lg px-3 py-2.5 text-base font-bold text-red-200 focus:ring-2 focus:ring-red-400/30 outline-none transition-all placeholder:text-white/30"
                                placeholder="Auto desde superior"
                                min="0"
                            />
                        </div>
                    </div>
                    <p className="text-[10px] text-white/40 mt-2">
                        Si se dejan en blanco, los límites se calculan automáticamente desde los valores Inferior y Superior divididos por la superficie homogenizada del inmueble.
                    </p>
                </div>
            </div>


            {/* Extension toast notification */}
            {extensionToast && (
                <div className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold animate-in slide-in-from-bottom-4 duration-300 z-50">
                    {extensionToast}
                </div>
            )}

            {/* Confirm delete modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setConfirmDelete(null)}
                    />
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 animate-in zoom-in-95 fade-in duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Eliminar comparable</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Esta acción no se puede deshacer.</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
                            ¿Querés eliminar el comparable{' '}
                            <span className="font-semibold text-slate-900 dark:text-white">"{confirmDelete.address}"</span>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => { removeComparable(confirmDelete.id); setConfirmDelete(null); }}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors shadow-sm"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </form>
    );
}
