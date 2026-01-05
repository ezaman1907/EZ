
export enum DeviceType {
  Desktop = 'Desktop',
  Notebook = 'Notebook',
  MacBook = 'MacBook',
  iPhone = 'iPhone',
  iPad = 'iPad',
  Monitor = 'Display Monitor',
  Other = 'Other'
}

export type DashboardFilterType = 
  | 'ALL' 
  | 'COMPLIANT' 
  | 'MISSING_INTUNE' 
  | 'MISSING_JAMF' 
  | 'MISSING_DEFENDER' 
  | 'STOCK'
  | 'ORPHAN_INTUNE'    // New: Intune devices not in SAP
  | 'ORPHAN_JAMF'      // New: Jamf devices not in SAP
  | 'ORPHAN_DEFENDER'; // New: Defender devices not in SAP

export interface ComplianceStatus {
  inIntune: boolean;
  intuneComplianceState?: string; // 'Compliant', 'NonCompliant', 'ConfigManager', etc.
  intuneLastCheckInDays?: number; // Days since last contact
  intuneMatchMethod?: 'Serial' | 'Hostname' | 'AssetTag'; // New: How did we match it?
  
  inJamf: boolean;
  jamfMatchMethod?: 'Serial' | 'Hostname' | 'AssetTag'; // New: How did we match it?

  inDefender: boolean;
  defenderMatchMethod?: 'Serial' | 'Hostname' | 'AssetTag' | 'User'; // New: How did we match it?
  
  lastSync?: string;

  // Raw data from cloud reports for detailed view
  rawIntuneData?: any;
  rawJamfData?: any;
  rawDefenderData?: any;
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
  
  // New field for Department logic (Exempt from stats)
  isDepartment: boolean;

  // New field for Special Manual Exemptions (e.g. VIP, Test devices)
  isExempt?: boolean;

  // New field for Orphan logic (Not in SAP)
  isOrphan?: boolean;
  orphanSource?: 'Intune' | 'Jamf' | 'Defender';

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
  
  // New field for requested calculation (hidden from UI)
  missingDefenderRatio: number;
}

export interface InventorySnapshot {
  id: string;
  periodLabel: string; // e.g., "Kasım 2025"
  dateCreated: Date;
  assets: Asset[];
  orphans: Asset[]; // New: List of devices found in cloud but not in SAP
  cloudCounts: {
    intune: number;
    jamf: number;
    defender: number;
  };
  stats: DashboardStats;
}

export interface ApiConfig {
  jamfUrl?: string;
  jamfToken?: string;
}
