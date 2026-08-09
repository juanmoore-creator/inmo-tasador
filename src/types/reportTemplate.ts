// ── Report Template Types ────────────────────────────────────────────────────

export type ReportTemplateId = 'classic' | 'minimalist' | 'executive' | 'complete';

export type PageType =
    | 'cover'
    | 'map'
    | 'summary'
    | 'property-detail'
    | 'price-suggestion'
    | 'averages'
    | 'contact'
    | 'valuation-sheet';

export interface PageSlot {
    type: PageType;
    enabled: boolean;
    /** If true, this page repeats for each comparable (e.g. PropertyDetailPage) */
    perComparable?: boolean;
}

export interface TemplateStyle {
    /** CSS class applied to the report container */
    cssClass: string;
    /** Layout density: normal spacing vs compact */
    density: 'normal' | 'compact';
    /** Visual decoration level */
    decoration: 'full' | 'minimal';
}

export interface ReportTemplate {
    id: ReportTemplateId;
    name: string;
    description: string;
    /** Lucide icon name for the selector UI */
    icon: string;
    pages: PageSlot[];
    style: TemplateStyle;
}
