import type { TargetProperty, Comparable, ReportTheme, SavedValuation } from './index';
import type { ReportTemplateId } from './reportTemplate';

// ── Campos comunes a todas las páginas del reporte ──────────────────────────
export interface ReportPageCommon {
    theme?: ReportTheme | null;
    pageNumber?: number;
    valuationDate?: number;
}

// ── Datos editables del reporte (estado del modal preview) ──────────────────
export interface EditableReportData {
    target: TargetProperty;
    corredorName: string;
    matricula: string;
    clientName: string;
    market: number;
    low: number;
    high: number;
    zoneLimit1?: number;
    zoneLimit2?: number;
    conclusion?: string;
    valuationDate?: number;
    date?: number;
}

// ── Stats del análisis ──────────────────────────────────────────────────────
export interface ValuationStats {
    avg?: number;
    min?: number;
    max?: number;
    median?: number;
    count?: number;
}

// ── Props de cada página ────────────────────────────────────────────────────

export interface CoverPageProps extends ReportPageCommon {
    data: EditableReportData;
}

export interface MapPageProps extends ReportPageCommon {
    properties: Comparable[];
    target?: TargetProperty;
    mapImage?: string;
}

export interface SummaryPageProps extends ReportPageCommon {
    properties: Comparable[];
    startPageNumber?: number;
}

export interface PropertyDetailPageProps extends ReportPageCommon {
    property: Comparable;
    index: number;
}

export interface PriceSuggestionPageProps extends ReportPageCommon {
    data: EditableReportData;
    stats?: ValuationStats;
    properties: Comparable[];
    target?: TargetProperty;
}

export interface AveragesPageProps extends ReportPageCommon {
    properties: Comparable[];
    conclusion?: string;
}

export interface ContactPageProps extends ReportPageCommon {
    data: EditableReportData;
}

// ── Props del ReportView ────────────────────────────────────────────────────

export interface ReportViewProps {
    data: EditableReportData;
    properties: Comparable[];
    valuation: EditableReportData;
    stats?: ValuationStats;
    theme?: ReportTheme | null;
    showAnnotations?: boolean;
    onUpdateData?: (path: string, value: any) => void;
    onUpdateComparable?: (id: string, path: string, value: any) => void;
    valuationDate?: number;
    templateId?: ReportTemplateId;
}

// ── Props del PDFGenerator ──────────────────────────────────────────────────

export interface PDFGeneratorProps {
    tipo: 'tasacion';
    data: SavedValuation;
    corredorName?: string;
    matricula?: string;
    clientName?: string;
    theme?: ReportTheme | null;
    displayMode?: 'text' | 'icon';
    className?: string;
    stats?: ValuationStats;
    target?: TargetProperty;
    comparables?: Comparable[];
    valuation?: SavedValuation['valuation'];
    /** Called before opening the preview modal (e.g. to save the valuation first) */
    onBeforePreview?: () => Promise<void>;
}
