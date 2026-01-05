
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DashboardStats, DashboardFilterType, Asset, DeviceType } from '../types';
import { 
  CheckCircle, 
  Server, 
  ShieldAlert, 
  Shield, 
  Laptop, 
  Smartphone, 
  Monitor, 
  Package, 
  AlertOctagon, 
  FileSpreadsheet, 
  Link, 
  Unlink, 
  ExternalLink, 
  ChevronRight, 
  Activity,
  ArrowUpRight
} from 'lucide-react';

const ChevronIcon = ChevronRight;

// Modern, high-contrast and sophisticated color palette
const COLORS = [
  '#6366F1', // Indigo (Notebooks)
  '#F43F5E', // Rose (Mobile)
  '#10B981', // Emerald (Macs)
  '#F59E0B', // Amber (Desktop/Stock)
  '#06B6D4', // Cyan (Monitors)
  '#8B5CF6'  // Violet (Other)
];

const BAR_COLORS = ['#10b981', '#f97316', '#ef4444', '#6366f1'];

interface DashboardProps {
  stats: DashboardStats;
  inventory: Asset[];
  onFilterSelect: (filter: DashboardFilterType) => void;
  onDeviceSelect: (deviceType: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, inventory, onFilterSelect, onDeviceSelect }) => {
  
  const complianceData = [
    { name: 'Uyumlu', value: stats.compliantCount },
    { name: 'Intune Eksik', value: stats.missingIntuneCount },
    { name: 'Jamf Eksik', value: stats.missingJamfCount },
    { name: 'Defender Eksik', value: stats.missingDefenderCount },
  ];

  const intuneMatchedCount = inventory.filter(a => a.compliance?.inIntune).length;
  const jamfMatchedCount = inventory.filter(a => a.compliance?.inJamf).length;

  const intuneGap = Math.max(0, stats.totalIntuneReportCount - intuneMatchedCount);
  const jamfGap = Math.max(0, stats.totalJamfReportCount - jamfMatchedCount);

  const platformStats = useMemo(() => {
    const activeInventory = inventory.filter(a => {
        if (a.isStock) return false;
        if (a.isExempt) return false; 
        if (a.isDepartment && a.type === DeviceType.MacBook) return false;
        if (a.isDepartment && a.userName && a.userName.startsWith('031')) return false;
        return true;
    });

    const windowsAssets = activeInventory.filter(a => a.type === DeviceType.Desktop || a.type === DeviceType.Notebook);
    const winTotal = windowsAssets.length;
    const winIntune = windowsAssets.filter(a => a.compliance?.inIntune).length;
    const winRatio = winTotal > 0 ? Math.round((winIntune / winTotal) * 100) : 0;

    const iosAssets = activeInventory.filter(a => a.type === DeviceType.iPhone || a.type === DeviceType.iPad);
    const iosTotal = iosAssets.length;
    const iosInIntune = iosAssets.filter(a => a.compliance?.inIntune).length;
    const iosRatio = iosTotal > 0 ? Math.round((iosInIntune / iosTotal) * 100) : 0;

    const macAssets = activeInventory.filter(a => a.type === DeviceType.MacBook);
    const macTotal = macAssets.length;
    const macJamf = macAssets.filter(a => a.compliance?.inJamf).length;
    const macRatio = macTotal > 0 ? Math.round((macJamf / macTotal) * 100) : 0;

    return [
      { 
        label: 'Windows', 
        subLabel: 'Intune Uyumluluğu',
        ratio: winRatio, 
        current: winIntune, 
        total: winTotal,
        icon: <Laptop className="w-5 h-5" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        filterType: 'Windows'
      },
      { 
        label: 'iPhone & iPad',
        subLabel: 'Intune Uyumluluğu',
        ratio: iosRatio, 
        current: iosInIntune, 
        total: iosTotal,
        icon: <Smartphone className="w-5 h-5" />,
        color: 'text-rose-500',
        bgColor: 'bg-rose-50',
        filterType: 'iPhone_iPad'
      },
      { 
        label: 'macOS', 
        subLabel: 'Jamf Uyumluluğu',
        ratio: macRatio, 
        current: macJamf, 
        total: macTotal,
        icon: <Monitor className="w-5 h-5" />,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        filterType: DeviceType.MacBook
      }
    ];
  }, [inventory]);

  const handleBarClick = (data: any) => {
    if (!data || !data.name) return;
    switch (data.name) {
      case 'Uyumlu': onFilterSelect('COMPLIANT'); break;
      case 'Intune Eksik': onFilterSelect('MISSING_INTUNE'); break;
      case 'Jamf Eksik': onFilterSelect('MISSING_JAMF'); break;
      case 'Defender Eksik': onFilterSelect('MISSING_DEFENDER'); break;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. TOP SECTION: KPI Cards (Redesigned to match screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {[
          { label: 'Toplam Varlık', val: stats.totalAssets, icon: Server, color: 'blue', filter: 'ALL', sub: 'Aktif Envanter', borderColor: 'border-t-blue-500', iconColor: 'text-blue-600', iconBg: 'bg-blue-50' },
          { label: 'Tam Uyumlu', val: stats.compliantCount, icon: CheckCircle, color: 'emerald', filter: 'COMPLIANT', sub: 'Güvenli Üretim', borderColor: 'border-t-emerald-500', iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50' },
          { label: 'Intune Eksik', val: stats.missingIntuneCount, icon: Laptop, color: 'orange', filter: 'MISSING_INTUNE', sub: 'Win & iOS', borderColor: 'border-t-orange-500', iconColor: 'text-orange-600', iconBg: 'bg-orange-50' },
          { label: 'Jamf Eksik', val: stats.missingJamfCount, icon: ShieldAlert, color: 'red', filter: 'MISSING_JAMF', sub: 'macOS', borderColor: 'border-t-red-500', iconColor: 'text-red-600', iconBg: 'bg-red-50' },
          { label: 'Defender Eksik', val: stats.missingDefenderCount, icon: Shield, color: 'indigo', filter: 'MISSING_DEFENDER', sub: 'Kritik Açık', borderColor: 'border-t-indigo-500', iconColor: 'text-indigo-600', iconBg: 'bg-indigo-50' },
          { label: 'Stok Envanteri', val: stats.stockCount, icon: Package, color: 'amber', filter: 'STOCK', sub: `${stats.riskyStockCount} Riskli`, borderColor: 'border-t-amber-500', iconColor: 'text-amber-600', iconBg: 'bg-amber-50' },
        ].map((kpi) => (
          <div 
            key={kpi.label} 
            onClick={() => onFilterSelect(kpi.filter as DashboardFilterType)}
            className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 group border-t-4 ${kpi.borderColor}`}
          >
            <div className="flex justify-between items-start mb-6">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${kpi.iconBg} dark:bg-slate-900/50 ${kpi.iconColor}`}>
                  <kpi.icon className="w-6 h-6" />
               </div>
               <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            
            <div className="space-y-1.5">
               <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                 {kpi.label}
               </p>
               <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                 {kpi.val.toLocaleString('tr-TR')}
               </h3>
               <p className="text-[12px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                 {kpi.sub}
               </p>
            </div>
          </div>
        ))}
      </div>

      {/* 2. MIDDLE SECTION: Platform Level Details */}
      <div className="bg-slate-950 text-white p-10 rounded-3xl shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500 rounded-full filter blur-[100px] opacity-20"></div>
         <div className="relative z-10">
            <h3 className="text-xl font-black tracking-tight mb-2 uppercase">Platform Uyumluluk Metrikleri</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-10 opacity-70">SAP Envanteri vs Bulut Ajanları</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               {platformStats.map((platform) => (
                 <div key={platform.label} className="group cursor-pointer" onClick={() => onDeviceSelect(platform.filterType)}>
                    <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-2xl ${platform.bgColor} ${platform.color} group-hover:scale-110 transition-transform`}>
                            {platform.icon}
                          </div>
                          <span className="text-sm font-black uppercase tracking-tight">{platform.label}</span>
                       </div>
                       <span className={`text-2xl font-black ${platform.ratio >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>%{platform.ratio}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                       <div 
                          className={`h-full rounded-full transition-all duration-1000 ${platform.ratio >= 90 ? 'bg-emerald-400' : 'bg-amber-400'}`} 
                          style={{ width: `${platform.ratio}%` }}
                       ></div>
                    </div>
                    <div className="flex justify-between mt-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                       <span>{platform.current} / {platform.total} Cihaz</span>
                       <span className="group-hover:text-white transition-colors">İncele &rarr;</span>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* 3. MIDDLE SECTION: Reconciliation Details */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700">
         <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Kaynak Mutabakat Analizi
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { label: 'Intune Raporu', total: stats.totalIntuneReportCount, matched: intuneMatchedCount, gap: intuneGap, filter: 'ORPHAN_INTUNE' },
              { label: 'Jamf Pro Raporu', total: stats.totalJamfReportCount, matched: jamfMatchedCount, gap: jamfGap, filter: 'ORPHAN_JAMF' },
            ].map(source => (
               <div key={source.label} className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                  <div className="flex justify-between items-center mb-6">
                     <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase">{source.label}</span>
                     <span className="text-[10px] font-black bg-white dark:bg-slate-800 px-3 py-1 rounded-full border shadow-sm">TOPLAM: {source.total}</span>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between text-xs font-bold text-emerald-600">
                        <span className="flex items-center gap-2"><Link className="w-3.5 h-3.5" /> Envanterle Eşleşen</span>
                        <span>{source.matched}</span>
                     </div>
                     <div 
                        onClick={() => onFilterSelect(source.filter as DashboardFilterType)}
                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-transparent hover:border-red-200 hover:bg-red-50/50 dark:hover:bg-red-950/10 cursor-pointer transition-all group"
                     >
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-2 group-hover:text-red-600 transition-colors">
                          <Unlink className="w-3.5 h-3.5" /> Envanterde Yok
                        </span>
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-black text-red-600">{source.gap}</span>
                           <ExternalLink className="w-3.5 h-3.5 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* 4. BOTTOM SECTION: Main Charts Row (Smaller Versions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-4">
        {/* Bar Chart: Compliance - Updated Tooltip and Cursor for Dark Mode */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                 <Activity className="w-4 h-4 text-indigo-500" /> GENEL UYUMLULUK DURUMU
              </h3>
           </div>
           <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#e2e8f0" />
                   <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                   <YAxis dataKey="name" type="category" width={110} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} fontWeight={700} />
                   <Tooltip 
                     cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 8 }} // Subtle cursor that works in dark mode
                     contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '12px', 
                        padding: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                     }} 
                     itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}
                     labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}
                   />
                   <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24} onClick={handleBarClick} cursor="pointer">
                      {complianceData.map((entry, index) => <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />)}
                   </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Donut Chart: Distribution - Updated Tooltip */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col relative overflow-hidden">
           <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-6">CIHAZ TIPI DAĞILIMI</h3>
           <div className="flex-1 relative min-h-[240px]">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalAssets.toLocaleString('tr-TR')}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TOPLAM</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={stats.deviceTypeDistribution} 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={65} 
                    outerRadius={90} 
                    paddingAngle={5} 
                    dataKey="value" 
                    onClick={(data) => onDeviceSelect(data.name)} 
                    cursor="pointer" 
                    stroke="none"
                  >
                    {stats.deviceTypeDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '12px', 
                        padding: '10px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                    }} 
                    itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ display: 'none' }} // Pie charts usually don't need the label line
                  />
                </PieChart>
              </ResponsiveContainer>
           </div>
           {/* Custom Legend - More compact */}
           <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-4 px-2">
              {stats.deviceTypeDistribution.map((item, index) => (
                <div 
                  key={item.name} 
                  className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 p-1 rounded-lg transition-colors group"
                  onClick={() => onDeviceSelect(item.name)}
                >
                   <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                   <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 truncate">{item.name}</span>
                   <span className="text-[10px] font-black text-slate-400 ml-auto">{item.value.toLocaleString('tr-TR')}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
