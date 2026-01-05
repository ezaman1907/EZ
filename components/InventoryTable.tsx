
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Asset, DeviceType, DashboardFilterType } from '../types';
import { StatusBadge } from './StatusBadge';
import { 
  Search, Filter, Monitor, Laptop, Smartphone, Cpu, Tag, AlertCircle, PcCase, 
  Tablet, XCircle, Check, User, Package, AlertOctagon, Download, Building2, 
  Unlink, FileKey, CheckCircle2, Minus, Info, X, ExternalLink, Shield, Database, Globe,
  ShieldCheck, Fingerprint, Layers, Activity, Home, RotateCcw
} from 'lucide-react';

interface InventoryTableProps {
  data: Asset[];
  dashboardFilter: DashboardFilterType;
  onClearDashboardFilter: () => void;
  deviceFilter: string;
  onDeviceFilterChange: (type: string) => void;
  onHome: () => void; // New: Go back to dashboard
}

interface ColumnFilters {
  status?: string;
  brand?: string;
  model?: string;
  assignedUser?: string;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ 
  data, 
  dashboardFilter, 
  onClearDashboardFilter,
  deviceFilter,
  onDeviceFilterChange,
  onHome
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case DeviceType.Desktop: return <PcCase className="w-5 h-5" />;
      case DeviceType.Notebook: return <Laptop className="w-5 h-5" />;
      case DeviceType.MacBook: return <Laptop className="w-5 h-5" />;
      case DeviceType.iPhone: return <Smartphone className="w-5 h-5" />;
      case DeviceType.iPad: return <Tablet className="w-5 h-5" />;
      case DeviceType.Monitor: return <Monitor className="w-5 h-5" />;
      default: return <Cpu className="w-5 h-5" />;
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    onClearDashboardFilter();
    onDeviceFilterChange('All');
  };

  const filteredData = useMemo(() => {
    return data.filter(asset => {
        if (asset.isOrphan) {
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (
                   asset.hostname.toLowerCase().includes(term) ||
                   asset.serialNumber.toLowerCase().includes(term) ||
                   (asset.assignedUser && asset.assignedUser.toLowerCase().includes(term)) ||
                   asset.assetTag.toLowerCase().includes(term)
                );
            }
            return true;
        }

        const term = searchTerm.toLowerCase();
        const isMac = asset.type === DeviceType.MacBook;
        const isComputer = asset.type === DeviceType.MacBook || asset.type === DeviceType.Desktop || asset.type === DeviceType.Notebook;
        const isMobile = asset.type === DeviceType.iPhone || asset.type === DeviceType.iPad;
        
        if (dashboardFilter === 'COMPLIANT') {
          if (asset.isExempt) return true;
          if (asset.isStock) return false;
          if (isMac) {
            if (!asset.compliance?.inJamf || !asset.compliance?.inDefender) return false;
          } else if (isComputer) {
            if (!asset.compliance?.inIntune || !asset.compliance?.inDefender) return false;
          } else if (isMobile) {
            if (!asset.compliance?.inIntune) return false;
          }
        } else if (dashboardFilter === 'MISSING_INTUNE') {
          if (asset.isExempt || asset.isStock || isMac) return false;
          if (asset.compliance?.inIntune) return false;
        } else if (dashboardFilter === 'MISSING_JAMF') {
          if (asset.isExempt || asset.isStock || asset.type !== DeviceType.MacBook) return false; 
          if (asset.compliance?.inJamf) return false;
        } else if (dashboardFilter === 'MISSING_DEFENDER') {
          if (asset.isExempt || asset.isStock) return false;
          const allowedTypes = [DeviceType.MacBook, DeviceType.Desktop, DeviceType.Notebook];
          if (!allowedTypes.includes(asset.type)) return false;
          if (asset.compliance?.inDefender) return false;
        } else if (dashboardFilter === 'STOCK') {
          if (!asset.isStock || asset.isDepartment) return false; 
        }

        if (deviceFilter !== 'All') {
            if (deviceFilter === 'STOCK') {
                if (!asset.isStock) return false;
            } else if (deviceFilter === 'DEPARTMENT') {
                if (!asset.isDepartment) return false;
            } else if (deviceFilter === 'ALL_MISSING') {
                if (asset.isExempt || asset.isStock) return false;
                if (isMac) {
                    if (!asset.compliance?.inJamf || !asset.compliance?.inDefender) return true;
                } else if (isComputer) {
                    if (!asset.compliance?.inIntune || !asset.compliance?.inDefender) return true;
                } else if (isMobile) {
                    if (!asset.compliance?.inIntune) return true;
                }
                return false;
            } else if (deviceFilter === 'Windows') {
                 if (asset.type !== DeviceType.Desktop && asset.type !== DeviceType.Notebook) return false;
            } else if (deviceFilter === 'iPhone_iPad' || deviceFilter === DeviceType.iPhone) {
                 if (asset.type !== DeviceType.iPhone && asset.type !== DeviceType.iPad) return false;
            } else {
                 if (asset.type !== deviceFilter) return false;
            }
        }

        if (columnFilters.status && asset.statusDescription !== columnFilters.status) return false;
        if (columnFilters.brand && asset.brand !== columnFilters.brand) return false;
        if (columnFilters.model && asset.model !== columnFilters.model) return false;
        if (columnFilters.assignedUser) {
          const displayUser = asset.fullName || asset.userName || asset.assignedUser || 'Unassigned';
          if (displayUser !== columnFilters.assignedUser) return false;
        }

        if (term) {
          return (
            asset.hostname.toLowerCase().includes(term) ||
            asset.assetTag.toLowerCase().includes(term) ||
            asset.serialNumber.toLowerCase().includes(term) ||
            (asset.fullName && asset.fullName.toLowerCase().includes(term)) ||
            (asset.userName && asset.userName.toLowerCase().includes(term)) ||
            asset.assignedUser.toLowerCase().includes(term) ||
            (asset.brand && asset.brand.toLowerCase().includes(term))
          );
        }

        return true;
      });
  }, [data, searchTerm, columnFilters, dashboardFilter, deviceFilter]);

  // Specific Breakdown for ALL_MISSING Filter
  const missingSummary = useMemo(() => {
    if (deviceFilter !== 'ALL_MISSING') return null;
    
    let intuneCount = 0;
    let jamfCount = 0;
    let defenderCount = 0;

    filteredData.forEach(asset => {
        const isMac = asset.type === DeviceType.MacBook;
        const isComputer = asset.type === DeviceType.MacBook || asset.type === DeviceType.Desktop || asset.type === DeviceType.Notebook;
        const isMobile = asset.type === DeviceType.iPhone || asset.type === DeviceType.iPad;

        if (!isMac && (isComputer || isMobile) && !asset.compliance?.inIntune) intuneCount++;
        if (isMac && !asset.compliance?.inJamf) jamfCount++;
        if (isComputer && !asset.compliance?.inDefender) defenderCount++;
    });

    return { intuneCount, jamfCount, defenderCount };
  }, [filteredData, deviceFilter]);

  const handleExportFilteredData = () => {
    if (filteredData.length === 0) return;
    const headers = ['Referans No', 'Seri No', 'Hostname', 'Marka', 'Model', 'Kullanıcı', 'Durum', 'Intune', 'Jamf', 'Defender'];
    const rows = filteredData.map(asset => [
      asset.assetTag, asset.serialNumber, asset.hostname, asset.brand, asset.model, asset.assignedUser, asset.statusDescription,
      asset.compliance?.inIntune ? 'OK' : 'MISSING', asset.compliance?.inJamf ? 'OK' : 'MISSING', asset.compliance?.inDefender ? 'OK' : 'MISSING'
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'AssetGuard_Inventory.csv';
    link.click();
  };

  const renderCellStatus = (present: boolean, label: string, type: 'intune' | 'jamf' | 'defender', asset: Asset) => {
    if (present) {
      return (
        <StatusBadge 
          present={true} 
          label={label} 
          type={type} 
          complianceState={asset.compliance?.[`${type}ComplianceState` as keyof typeof asset.compliance] as string}
          lastCheckInDays={asset.compliance?.[`${type}LastCheckInDays` as keyof typeof asset.compliance] as number}
          matchMethod={asset.compliance?.[`${type}MatchMethod` as keyof typeof asset.compliance] as string}
        />
      );
    }
    if (asset.isStock) {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:scale-105" title={`${label} stokta ancak bulut kaydı bulunamadı.`}>
          <Package className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight">STOKTA</span>
          <XCircle className="w-3 h-3 text-rose-500 stroke-[3]" />
        </div>
      );
    }
    if (asset.isExempt) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shadow-sm transition-all hover:scale-105">
          <ShieldCheck className="w-3 h-3 stroke-[3]" />
          MUAF
        </span>
      );
    }
    return <StatusBadge present={false} label={label} type={type} />;
  };

  const RawDataView = ({ title, data, icon: Icon, color, matchMethod }: { title: string, data: any, icon: any, color: string, matchMethod?: string }) => {
    if (!data) return null;
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
        <div className={`px-5 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 ${color}`}>
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <h4 className="text-sm font-bold tracking-tight uppercase">{title} Kayıt Detayı</h4>
          </div>
          {matchMethod && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-current/20">
              <Fingerprint className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-wider">Eşleşme: {matchMethod}</span>
            </div>
          )}
        </div>
        <div className="p-5 max-h-[300px] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex flex-col border-b border-slate-200/40 dark:border-slate-800/40 pb-1.5 last:border-0">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{key}</span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 break-all">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden pb-4 transition-all">
      {/* Asset Details Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                  {getDeviceIcon(selectedAsset.type)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedAsset.assetTag}</h3>
                  <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> {selectedAsset.hostname} • {selectedAsset.serialNumber}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedAsset(null)} className="p-2.5 rounded-2xl bg-white dark:bg-slate-700 text-slate-400 hover:text-rose-500 border border-slate-100 dark:border-slate-600 transition-all shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Durum</span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200">{selectedAsset.statusDescription}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Marka / Model</span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200">{selectedAsset.brand} {selectedAsset.model}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Kullanıcı</span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-200">{selectedAsset.fullName || selectedAsset.userName}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Kategori</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">{selectedAsset.type}</span>
                    {selectedAsset.isExempt && <span className="bg-teal-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Muaf</span>}
                    {selectedAsset.isStock && <span className="bg-indigo-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Stok</span>}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <RawDataView title="Intune" data={selectedAsset.compliance?.rawIntuneData} icon={Laptop} color="bg-blue-500/10 text-blue-600 dark:text-blue-400" matchMethod={selectedAsset.compliance?.intuneMatchMethod} />
                <RawDataView title="Jamf" data={selectedAsset.compliance?.rawJamfData} icon={Layers} color="bg-slate-600/10 text-slate-700 dark:text-slate-300" matchMethod={selectedAsset.compliance?.jamfMatchMethod} />
                <RawDataView title="Defender" data={selectedAsset.compliance?.rawDefenderData} icon={Shield} color="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" matchMethod={selectedAsset.compliance?.defenderMatchMethod} />
                {!selectedAsset.compliance?.rawIntuneData && !selectedAsset.compliance?.rawJamfData && !selectedAsset.compliance?.rawDefenderData && (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-rose-50/50 dark:bg-rose-950/20 rounded-3xl border border-dashed border-rose-200 dark:border-rose-900/50">
                    <XCircle className="w-12 h-12 text-rose-300 mb-3" />
                    <h4 className="text-lg font-bold text-rose-900 dark:text-rose-200">Cloud Kaydı Bulunamadı</h4>
                    <p className="text-sm text-rose-600 dark:text-rose-400 max-w-xs mt-1">Bu cihaz için eşleşen bir bulut kaydı bulunamadı.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Header Section - Re-designed with Home & Reset */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
              <button 
                onClick={onHome}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                <Home className="w-4 h-4 text-blue-600" />
                Ana Sayfa
              </button>
              
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <DatabaseIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight uppercase tracking-tight">Varlık Yönetimi</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{filteredData.length} Kayıt</p>
                  </div>
              </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative group flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Hostname, Seri No, İsim Ara..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm font-medium" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>

            {/* Device Category Filter */}
            <div className="relative min-w-[180px]">
              <select 
                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer shadow-sm" 
                value={deviceFilter} 
                onChange={(e) => onDeviceFilterChange(e.target.value)}
              >
                <option value="All">Filtre: Hepsi</option>
                <option value="ALL_MISSING">🚨 Eksik Kayıtlar</option>
                <option value="Windows">Windows Sistemler</option>
                <option value="iPhone_iPad">iPhone & iPad</option>
                <option value="STOCK">Stok Envanteri</option>
                <option value="DEPARTMENT">Ortak Kullanım</option>
                <option value={DeviceType.MacBook}>MacBook Pro/Air</option>
              </select>
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                 <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {/* Reset & Export Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleResetFilters}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-all group"
                title="Tüm Filtreleri Sıfırla"
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
                Sıfırla
              </button>

              <button 
                onClick={handleExportFilteredData} 
                className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
                title="CSV Olarak İndir"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Breakdown Summary Section (Conditional) */}
        {missingSummary && (
          <div className="mt-6 flex flex-wrap items-center gap-4 py-3 px-4 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30 animate-fadeIn">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
               <Activity className="w-4 h-4" />
               <span className="text-xs font-black uppercase tracking-wider">Kritik Eksiklik Özeti:</span>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">Intune: {missingSummary.intuneCount}</span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">Jamf: {missingSummary.jamfCount}</span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight">Defender: {missingSummary.defenderCount}</span>
               </div>
            </div>
            <p className="text-[10px] text-slate-400 italic ml-auto hidden md:block">* Not: Bazı cihazlar birden fazla serviste eksik olabilir.</p>
          </div>
        )}
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto" ref={dropdownRef}>
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/30">
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cihaz Bilgileri</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kullanıcı & Model</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Intune</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Jamf</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Defender</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
            {filteredData.map((asset) => {
              const isMac = asset.type === DeviceType.MacBook;
              const isMonitor = asset.type === DeviceType.Monitor;
              let borderClass = "border-l-4 border-l-transparent";
              if (asset.isStock) borderClass = "border-l-4 border-l-amber-500 bg-amber-50/10";
              else if (asset.isExempt) borderClass = "border-l-4 border-l-teal-500 bg-teal-50/10";
              else if (asset.isDepartment) borderClass = "border-l-4 border-l-purple-500 bg-purple-50/10";

              return (
                <tr key={asset.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group/row ${borderClass}`} onClick={() => setSelectedAsset(asset)}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border transition-transform group-hover/row:scale-110 ${asset.isStock ? 'bg-amber-100/50 border-amber-200 text-amber-600' : asset.isExempt ? 'bg-teal-100/50 border-teal-200 text-teal-600' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500'}`}>
                        {getDeviceIcon(asset.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">{asset.assetTag}</span>
                           {asset.isExempt && <span className="text-[9px] font-black bg-teal-500 text-white px-1.5 py-0.5 rounded leading-none">MUAF</span>}
                        </div>
                        <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5"><Tag className="w-3 h-3 opacity-50" /> {asset.serialNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">{asset.fullName || asset.assignedUser}</div>
                    <div className="text-[11px] font-medium text-slate-500 uppercase tracking-tight">{asset.brand} {asset.model}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {!isMonitor && asset.type !== DeviceType.MacBook ? renderCellStatus(!!asset.compliance?.inIntune, "Intune", "intune", asset) : <Minus className="w-4 h-4 mx-auto text-slate-200 dark:text-slate-600" />}
                  </td>
                  <td className="px-6 py-5 text-center">
                    {!isMonitor && isMac ? renderCellStatus(!!asset.compliance?.inJamf, "Jamf", "jamf", asset) : <Minus className="w-4 h-4 mx-auto text-slate-200 dark:text-slate-600" />}
                  </td>
                  <td className="px-6 py-5 text-center">
                    {!isMonitor && asset.type !== DeviceType.iPhone && asset.type !== DeviceType.iPad ? renderCellStatus(!!asset.compliance?.inDefender, "Defender", "defender", asset) : <Minus className="w-4 h-4 mx-auto text-slate-200 dark:text-slate-600" />}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="opacity-0 group-hover/row:opacity-100 transition-opacity">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl"><Info className="w-4 h-4" /></div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-t-2 border-slate-100 dark:border-slate-700">
               <td colSpan={6} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2"><ListIcon className="w-4 h-4 text-slate-400" /><span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Liste Özeti</span></div>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex items-center gap-1.5"><span className="text-xs font-medium text-slate-500">Aktif Filtre:</span><span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-tight">{deviceFilter === 'All' ? (dashboardFilter === 'ALL' ? 'TÜMÜ' : dashboardFilter) : deviceFilter}</span></div>
                     </div>
                     <div className="flex items-center gap-2"><span className="text-xs font-bold text-slate-500">TOPLAM GÖSTERİLEN:</span><span className="px-3 py-1 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-black shadow-sm">{filteredData.length}</span></div>
                  </div>
               </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

const DatabaseIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
);

const ListIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
);
