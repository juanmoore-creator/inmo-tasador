export interface TenantBranding {
  companyName: string;
  companyLegalName: string;
  logoUrl: string;
  logoDarkUrl: string;
  logoLightUrl: string;
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    accent: string;
  };
}

export interface TenantInstitutional {
  holderName: string;
  professionalTitle: string;
  registrationBody: string;
  registrationNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  website: string;
  taxId?: string;
}

export interface TenantConfig {
  id: string;
  branding: TenantBranding;
  institutional: TenantInstitutional;
  settings: {
    defaultCurrency: string;
    locale: string;
    timezone: string;
  };
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'trial' | 'suspended';
}

export interface ReportTheme {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  logoUrl: string;
  companyName: string;
  companyLegalName: string;
  holderName: string;
  professionalTitle: string;
  registrationLabel: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  website: string;
}
