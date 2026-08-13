import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import type { TenantConfig, ReportTheme } from '../types';

interface TenantContextType {
    tenant: TenantConfig | null;
    reportTheme: ReportTheme | null;
    isTenantOwner: boolean;
    loading: boolean;
    error: string | null;
}

export const TenantContext = createContext<TenantContextType>({
    tenant: null,
    reportTheme: null,
    isTenantOwner: false,
    loading: true,
    error: null,
});

export const useTenant = () => useContext(TenantContext);

// Default platform configuration for when no tenant is loaded
export const PLATFORM_DEFAULT_TENANT: TenantConfig = {
    id: 'default',
    branding: {
        companyName: 'InmoTasador',
        companyLegalName: 'InmoTasador Platform',
        logoUrl: '',
        logoDarkUrl: '',
        logoLightUrl: '',
        colors: {
            primary: '#3F11B2',
            primaryDark: '#2D0C80',
            primaryLight: '#5A2ED9',
            accent: '#C5A059'
        }
    },
    institutional: {
        holderName: 'InmoTasador',
        professionalTitle: 'Plataforma Inmobiliaria',
        registrationBody: '',
        registrationNumber: '',
        phone: '',
        email: 'info@inmotasador.com',
        address: '',
        city: '',
        website: 'https://inmotasador.com'
    },
    settings: {
        defaultCurrency: 'USD',
        locale: 'es-AR',
        timezone: 'America/Buenos_Aires'
    },
    plan: 'free',
    status: 'active'
};

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [tenant, setTenant] = useState<TenantConfig | null>(null);
    const [isTenantOwner, setIsTenantOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadTenant = async () => {
            if (!user) {
                if (isMounted) {
                    setTenant(null);
                    setIsTenantOwner(false);
                    setLoading(false);
                }
                return;
            }

            try {
                // First get user profile to find their tenantId
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const tenantId = userData.tenantId;
                    
                    if (isMounted) setIsTenantOwner(userData.tenantRole === 'owner');

                    if (tenantId) {
                        // Then fetch the tenant config
                        const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
                        
                        if (tenantDoc.exists()) {
                            if (isMounted) {
                                setTenant({ id: tenantDoc.id, ...tenantDoc.data() } as TenantConfig);
                                setError(null);
                            }
                        } else {
                            if (isMounted) setError(`Tenant configuration not found for ID: ${tenantId}`);
                            // Fallback to platform default if tenant not found but user exists
                            if (isMounted) setTenant(PLATFORM_DEFAULT_TENANT);
                        }
                    } else {
                        // User has no tenant assigned yet (e.g., just registered)
                        if (isMounted) setTenant(PLATFORM_DEFAULT_TENANT);
                    }
                } else {
                    // User doc doesn't exist yet in Firestore
                    if (isMounted) setTenant(PLATFORM_DEFAULT_TENANT);
                }
            } catch (err) {
                console.error("Error loading tenant:", err);
                if (isMounted) setError("Failed to load tenant configuration");
                if (isMounted) setTenant(PLATFORM_DEFAULT_TENANT);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        setLoading(true);
        loadTenant();

        return () => {
            isMounted = false;
        };
    }, [user]);

    // Apply CSS Variables when tenant changes
    useEffect(() => {
        const root = document.documentElement;
        const colors = tenant?.branding.colors || PLATFORM_DEFAULT_TENANT.branding.colors;

        root.style.setProperty('--color-brand-primary', colors.primary);
        root.style.setProperty('--color-brand-primary-dark', colors.primaryDark);
        root.style.setProperty('--color-brand-primary-light', colors.primaryLight);
        root.style.setProperty('--color-brand-accent', colors.accent);
        
        // Update document title (keeping InmoTasador per user request, but prepending tenant name if available)
        if (tenant?.branding.companyName && tenant.branding.companyName !== 'InmoTasador') {
            document.title = `InmoTasador - ${tenant.branding.companyName}`;
        } else {
            document.title = 'InmoTasador';
        }

    }, [tenant]);

    // Computed report theme
    const reportTheme: ReportTheme | null = tenant ? {
        primary: tenant.branding.colors.primary,
        primaryDark: tenant.branding.colors.primaryDark,
        primaryLight: tenant.branding.colors.primaryLight,
        accent: tenant.branding.colors.accent,
        logoUrl: tenant.branding.logoUrl,
        companyName: tenant.branding.companyName,
        companyLegalName: tenant.branding.companyLegalName,
        holderName: tenant.institutional.holderName,
        professionalTitle: tenant.institutional.professionalTitle,
        registrationLabel: tenant.institutional.registrationNumber ? 
            `Matrícula ${tenant.institutional.registrationBody} Nro ${tenant.institutional.registrationNumber}` : 
            tenant.institutional.professionalTitle,
        phone: tenant.institutional.phone,
        email: tenant.institutional.email,
        address: tenant.institutional.address,
        city: tenant.institutional.city,
        website: tenant.institutional.website,
    } : null;

    return (
        <TenantContext.Provider value={{ tenant, reportTheme, isTenantOwner, loading, error }}>
            {children}
        </TenantContext.Provider>
    );
};
