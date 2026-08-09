// ── RBAC: Roles y usuarios ──────────────────────────────────────────────────
export type UserRole = 'admin' | 'user';

export interface AppUser {
    uid: string;
    email: string;
    displayName?: string;
    role: UserRole;
    tenantId: string;
    tenantRole: 'owner' | 'member';
    createdAt: string;
    disabled?: boolean;
}

export interface Annotation {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string; // UID del admin que la creó
}

// ── Tipos de propiedades ─────────────────────────────────────────────────────
export type SurfaceType = 'Jardín' | 'Patio' | 'Terraza' | 'Balcón' | 'Ninguno';

export interface Location {
    lat: number;
    lng: number;
}

export interface PropertyCharacteristics {
    // === DETALLES GENERALES Y DE MERCADO ===
    captacionStatus?: 'Activa' | 'Cerrada' | 'Cancelada' | 'Reservada' | 'Vendido';
    propertyType?: string;           // Tipo de propiedad (Departamento, Casa, PH, etc.)
    publicationPrice?: number;       // Precio de publicación
    closingPrice?: number;           // Precio de venta
    negotiationPercent?: number;     // Porcentaje de negociación (calculado)
    daysOnMarket?: number;           // Días en el mercado
    closingDate?: string;            // Fecha de cierre (MM/YYYY)

    // === UBICACIÓN Y EDIFICIO ===
    buildingFloors?: number;         // Pisos del edificio
    apartmentsInBuilding?: number;   // Deptos. en el edificio
    age?: number;                    // Antigüedad (años)
    expensas?: number;               // Expensas mensuales

    // === DIMENSIONES Y SUPERFICIES ===
    rooms?: number;                  // Ambientes
    bedrooms?: number;               // Dormitorios
    bathrooms?: number;              // Baños
    semiCoveredSurface?: number;     // Superficie semicubierta
    toilettes?: number;              // Toilettes

    // === DISTRIBUCIÓN INTERNA ===
    garageCount?: number;            // Cantidad de cocheras
    garage?: boolean;                // Tiene cochera
    hasLiving?: boolean;
    hasDining?: boolean;             // Comedor
    hasKitchen?: boolean;            // Cocina
    hasLaundry?: boolean;            // Lavadero
    hasStudy?: boolean;              // Estudio
    hasServiceRoom?: boolean;        // Habitación de servicio
    hasTerrace?: boolean;            // Terraza
    hasPatio?: boolean;              // Patio
    hasWinterGarden?: boolean;       // Jardín de invierno
    hasBalcony?: boolean;            // Balcón
    hasBaulera?: boolean;            // Baulera

    // === SERVICIOS ===
    hasElectricity?: boolean;        // Electricidad
    hasWater?: boolean;              // Agua corriente
    hasGas?: boolean;                // Gas natural
    hasSewer?: boolean;              // Cloacas
    hasInternet?: boolean;           // Internet/WiFi
    hasPhone?: boolean;              // Teléfono
    hasCableTV?: boolean;            // TV por cable
    hasPavement?: boolean;           // Pavimento

    // === EQUIPAMIENTO ===
    hasElevator?: boolean;           // Ascensor
    hasHeating?: boolean;            // Calefacción
    hasAC?: boolean;                 // Aire acondicionado
    hasSecurity?: boolean;           // Seguridad
    hasAlarm?: boolean;              // Alarma
    hasGrill?: boolean;              // Parrilla

    // === APTITUDES Y ORIENTACIÓN ===
    isCreditEligible?: boolean;      // Apto crédito
    isProfessional?: boolean;        // Apto profesional
    hasFinancing?: boolean;          // Ofrece financiamiento
    disposition?: string;            // Disposición (Frente/Contrafrente/Interno)
    orientation?: string;            // Orientación (Norte, Sur, etc.)
    allowsPets?: boolean;            // Mascotas permitidas

    // === MEDIA ===
    images?: string[];
    mapImage?: string;

    // Legacy fields
    floorType?: string;
    lotDimensions?: string;
    utilities?: string;
    condition?: string;
}

export interface TargetProperty extends PropertyCharacteristics {
    address: string;
    location?: { lat: number; lng: number };
    coveredSurface: number;
    uncoveredSurface: number;
    surfaceType: SurfaceType;
    homogenizationFactor: number;
}

export interface Comparable extends PropertyCharacteristics {
    id: string;
    address: string;
    location?: { lat: number; lng: number };
    price: number;
    coveredSurface: number;
    uncoveredSurface: number;
    surfaceType: SurfaceType;
    homogenizationFactor: number;
    hSurface?: number;
    hPrice?: number;
    status?: 'Disponible' | 'Reservado' | 'Vendido' | 'Alquilado' | 'Cerrada';
    amenities?: string[];
    coverImage?: string;
    zone?: string;
}

export interface SavedValuation {
    id: string;
    tenantId: string;
    inmuebleId?: string;
    name: string;
    date: number;
    target: TargetProperty;
    comparables: Comparable[];
    clientName?: string;
    corredorName?: string;
    matricula?: string;
    valuation?: {
        low: number;
        market: number;
        high: number;
        zoneLimit1?: number;  // USD/m² homogenizado — límite entre ZONA DE VENTA y ZONA DE PRUEBA
        zoneLimit2?: number;  // USD/m² homogenizado — límite entre ZONA DE PRUEBA y ZONA DE NO VENTA
    };
    publicationPrice?: number;
    closingPrice?: number;
    closingDate?: string;
    valuationStatus?: 'Abierta' | 'Cerrada';
    amenities?: string[];
    conclusion?: string;
    reportTemplate?: import('./reportTemplate').ReportTemplateId;
}

// Interfaz para la sección de Tasaciones
export interface Valuation {
    id: string;
    propertyId: string;
    date: number;
    amount: number;
    currency: 'USD' | 'ARS';
    notes?: string;
}

export * from './tenant';
export * from './report';
export * from './reportTemplate';