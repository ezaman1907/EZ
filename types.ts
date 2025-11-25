
export enum DeviceType {
  Desktop = 'Desktop',
  Notebook = 'Notebook',
  MacBook = 'MacBook',
  iPhone = 'iPhone',
  iPad = 'iPad',
  Monitor = 'Display Monitor',
  Other = 'Other'
}

export type DashboardFilterType = 'ALL' | 'COMPLIANT' | 'MISSING_INTUNE' | 'MISSING_JAMF' | 'MISSING_DEFENDER' | 'STOCK';

export interface ComplianceStatus {
  inIntune: boolean;
  intuneComplianceState?: string; // 'Compliant', 'NonCompliant', 'ConfigManager', etc.
  intuneLastCheckInDays?: number; // Days since last contact
  
  inJamf: boolean;
  inDefender: boolean;
  
  lastSync?: string;
}

export interface Asset {
  id: string;
  assetTag: string; // Referans Numarası
  statusDescription?: string; // Durum Açıklam
  brand?: string; // Marka
  model?: string; // Model
  hostname: string;
  serialNumber: string; // Seri Numarası
  type: DeviceType;
  purchaseDate: string; // From 'Demirbaş Yaşı' (Date)
  assetAgeDays?: number; // Calculated age in days
  
  userName?: string; // Kullanıcı adı (starts with 0)
  fullName?: string; // Tam İsim
  assignedUser: string; // Computed display string (fallback)
  
  // New field for Stock logic
  isStock: boolean; 

  // The "Cloud" status comes from the comparison logic
  compliance?: ComplianceStatus;
}

export interface DashboardStats {
  totalAssets: number;
  
  // Raw counts from the uploaded cloud reports
  totalIntuneReportCount: number;
  totalJamfReportCount: number;
  totalDefenderReportCount: number;

  compliantCount: number;
  missingIntuneCount: number;
  missingJamfCount: number;
  missingDefenderCount: number;
  stockCount: number;
  riskyStockCount: number;
  deviceTypeDistribution: { name: string; value: number }[];
}

export interface InventorySnapshot {
  id: string;
  periodLabel: string; // e.g., "Kasım 2025"
  dateCreated: Date;
  assets: Asset[];
  cloudCounts: {
    intune: number;
    jamf: number;
    defender: number;
  };
  stats: DashboardStats;
}
