
export enum DeviceType {
  Desktop = 'Desktop',
  Notebook = 'Notebook',
  MacBook = 'MacBook',
  iPhone = 'iPhone',
  iPad = 'iPad',
  Monitor = 'Display Monitor',
  Other = 'Other'
}

export type DashboardFilterType = 'ALL' | 'COMPLIANT' | 'MISSING_INTUNE' | 'MISSING_JAMF' | 'MISSING_DEFENDER';

export interface ComplianceStatus {
  inIntune: boolean;
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
  
  // The "Cloud" status comes from the comparison logic
  compliance?: ComplianceStatus;
}

export interface DashboardStats {
  totalAssets: number;
  compliantCount: number;
  missingIntuneCount: number;
  missingJamfCount: number;
  missingDefenderCount: number;
  deviceTypeDistribution: { name: string; value: number }[];
}