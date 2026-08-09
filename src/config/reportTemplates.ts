import type { ReportTemplate, ReportTemplateId } from '../types/reportTemplate';

// ── All pages available in the system ────────────────────────────────────────

const ALL_PAGES_CLASSIC = [
    { type: 'cover' as const, enabled: true },
    { type: 'map' as const, enabled: true },
    { type: 'summary' as const, enabled: true },
    { type: 'property-detail' as const, enabled: true, perComparable: true },
    { type: 'price-suggestion' as const, enabled: true },
    { type: 'averages' as const, enabled: true },
    { type: 'contact' as const, enabled: true },
];

// ── Template Definitions ─────────────────────────────────────────────────────

export const REPORT_TEMPLATES: Record<ReportTemplateId, ReportTemplate> = {
    classic: {
        id: 'classic',
        name: 'Clásico',
        description: 'Diseño profesional con todas las secciones. Ideal para presentaciones formales.',
        icon: 'FileText',
        pages: ALL_PAGES_CLASSIC,
        style: {
            cssClass: 'report-template-classic',
            density: 'normal',
            decoration: 'full',
        },
    },

    minimalist: {
        id: 'minimalist',
        name: 'Minimalista',
        description: 'Menos decoración, más datos por página. Enfocado en la información.',
        icon: 'Minus',
        pages: ALL_PAGES_CLASSIC,
        style: {
            cssClass: 'report-template-minimalist',
            density: 'compact',
            decoration: 'minimal',
        },
    },

    executive: {
        id: 'executive',
        name: 'Ejecutivo',
        description: 'Resumen conciso de 4 páginas. Sin fichas individuales ni mapa.',
        icon: 'Briefcase',
        pages: [
            { type: 'cover', enabled: true },
            { type: 'map', enabled: false },
            { type: 'summary', enabled: true },
            { type: 'property-detail', enabled: false, perComparable: true },
            { type: 'price-suggestion', enabled: true },
            { type: 'averages', enabled: false },
            { type: 'contact', enabled: true },
        ],
        style: {
            cssClass: 'report-template-executive',
            density: 'normal',
            decoration: 'full',
        },
    },

    complete: {
        id: 'complete',
        name: 'Completo',
        description: 'Todas las secciones del Clásico más fichas de tasación como anexo.',
        icon: 'BookOpen',
        pages: [
            ...ALL_PAGES_CLASSIC,
            { type: 'valuation-sheet', enabled: true, perComparable: true },
        ],
        style: {
            cssClass: 'report-template-complete',
            density: 'normal',
            decoration: 'full',
        },
    },
};

/** Ordered list of template IDs for the selector UI */
export const TEMPLATE_ORDER: ReportTemplateId[] = ['classic', 'minimalist', 'executive', 'complete'];

/** Get a template by ID, falling back to classic */
export function getReportTemplate(id?: ReportTemplateId): ReportTemplate {
    return REPORT_TEMPLATES[id || 'classic'] || REPORT_TEMPLATES.classic;
}

/** Get the summary chunk size based on template density */
export function getChunkSize(density: 'normal' | 'compact'): number {
    return density === 'compact' ? 16 : 12;
}
