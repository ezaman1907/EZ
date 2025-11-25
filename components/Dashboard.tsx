
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DashboardStats, DashboardFilterType, Asset, DeviceType } from '../types';
import { CheckCircle, Server, ShieldAlert, MousePointerClick, Shield, Laptop, Smartphone, Monitor, Package, AlertOctagon } from 'lucide-react';

interface DashboardProps {
  stats: DashboardStats;
  inventory: Asset[];
  onFilterSelect: (filter: DashboardFilterType) => void;
  onDeviceSelect: (deviceType: string) => void;
}

// Updated palette: Emerald (Success), Rose (Error/Missing), Amber (Warning), Indigo (Secondary)
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1'];
const BAR_COLORS = ['#10b981', '#ef4444', '#f97316', '#6366f1']; // Compliant (Green), Intune (Red), Jamf (Orange), Defender (Indigo)

export const Dashboard: React.FC<DashboardProps> = ({ stats, inventory, onFilterSelect, onDeviceSelect }) => {
  
  const complianceData = [
    { name: 'Compliant', value: stats.compliantCount },
    { name: 'Missing Intune', value: stats.missingIntuneCount },
    { name: 'Missing Jamf', value: stats.missingJamfCount },
    { name: 'Missing Defender', value: stats.missingDefenderCount },
  ];

  // Calculate Platform Specific Ratios (EXCLUDING STOCK)
  const platformStats = useMemo(() => {
    // Filter out stock items first
    const activeInventory = inventory.filter(a => !a.isStock);

    // 1. Windows (Desktop + Notebook) -> Intune
    const windowsAssets = activeInventory.filter(a => a.type === DeviceType.Desktop || a.type === DeviceType.Notebook);
    const winTotal = windowsAssets.length;
    const winIntune = windowsAssets.filter(a => a.compliance?.inIntune).length;
    const winRatio = winTotal > 0 ? Math.round((winIntune / winTotal) * 100) : 0;

    // 2. iOS (iPhone + iPad) -> Intune
    const iosAssets = activeInventory.filter(a => a.type === DeviceType.iPhone || a.type === DeviceType.iPad);
    const iosTotal = iosAssets.length;
    const iosIntune = iosAssets.filter(a => a.compliance?.inIntune).length;
    const iosRatio = iosTotal > 0 ? Math.round((iosIntune / iosTotal) * 100) : 0;

    // 3. Mac (MacBook) -> Jamf
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
        icon: <Laptop className="w-5 h-5 text-blue-600" />,
        filterType: 'Windows' // Custom filter key for both Desktop/Notebook
      },
      { 
        label: 'iOS / iPadOS', 
        subLabel: 'Intune Uyumluluğu',
        ratio: iosRatio, 
        current: iosIntune, 
        total: iosTotal,
        icon: <Smartphone className="w-5 h-5 text-sky-500" />,
        filterType: DeviceType.iPhone
      },
      { 
        label: 'macOS', 
        subLabel: 'Jamf Uyumluluğu',
        ratio: macRatio, 
        current: macJamf, 
        total: macTotal,
        icon: <Monitor className="w-5 h-5 text-slate-700" />,
        filterType: DeviceType.MacBook
      }
    ];
  }, [inventory]);

  const handleBarClick = (data: any) => {
    if (!data || !data.name) return;
    
    switch (data.name) {
      case 'Compliant':
        onFilterSelect('COMPLIANT');
        break;
      case 'Missing Intune':
        onFilterSelect('MISSING_INTUNE');
        break;
      case 'Missing Jamf':
        onFilterSelect('MISSING_JAMF');
        break;
      case 'Missing Defender':
        onFilterSelect('MISSING_DEFENDER');
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* Total Assets */}
        <div 
          onClick={() => onFilterSelect('ALL')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 group-hover:text-blue-600 transition-colors">Total Assets</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalAssets}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors border border-slate-100 group-hover:border-blue-100">
              <Server className="w-6 h-6 text-slate-600 group-hover:text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
             Tracked in DB
             <MousePointerClick className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </div>

        {/* Compliant */}
        <div 
          onClick={() => onFilterSelect('COMPLIANT')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 group-hover:text-emerald-600 transition-colors">Fully Compliant</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.compliantCount}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 transition-colors">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
            Active Production
            <MousePointerClick className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </div>

        {/* Stock Inventory (NEW) */}
        <div 
          onClick={() => onFilterSelect('STOCK')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 group-hover:text-amber-600 transition-colors">Stock Inventory</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.stockCount}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 transition-colors">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className={`text-xs mt-4 flex items-center gap-1 font-medium ${stats.riskyStockCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
             {stats.riskyStockCount > 0 ? (
               <>
                 <AlertOctagon className="w-3 h-3" />
                 {stats.riskyStockCount} Active (Risky)
               </>
             ) : (
                'Stock but Active'
             )}
             <MousePointerClick className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
          </p>
        </div>

        {/* Missing Jamf */}
        <div 
          onClick={() => onFilterSelect('MISSING_JAMF')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-red-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 group-hover:text-red-600 transition-colors">Missing Jamf</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.missingJamfCount}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-100 transition-colors">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
            Mac Failed
            <MousePointerClick className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </div>

         {/* Missing Defender */}
        <div 
          onClick={() => onFilterSelect('MISSING_DEFENDER')}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 group-hover:text-indigo-600 transition-colors">Missing Defender</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.missingDefenderCount}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 transition-colors">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
            Security Risk
            <MousePointerClick className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </p>
        </div>
      </div>

      {/* Platform Compliance Ratios */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Platform Bazlı Uyumluluk Oranları</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {platformStats.map((platform) => (
            <div 
                key={platform.label} 
                className="relative group cursor-pointer p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                onClick={() => onDeviceSelect(platform.filterType)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                    {platform.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{platform.label}</p>
                    <p className="text-xs text-slate-500">{platform.subLabel}</p>
                  </div>
                </div>
                <span className={`text-xl font-bold ${platform.ratio === 100 ? 'text-emerald-600' : platform.ratio > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  %{platform.ratio}
                </span>
              </div>
              
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    platform.ratio === 100 ? 'bg-emerald-500' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${platform.ratio}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between mt-2 text-xs font-medium text-slate-400">
                <span>{platform.current} / {platform.total} Cihaz</span>
                <span className="flex items-center gap-1">
                    Hedef: %100 
                    <MousePointerClick className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
             Compliance Overview
             <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Click bar to filter</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={complianceData} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                 <XAxis type="number" />
                 <YAxis dataKey="name" type="category" width={120} style={{ fontSize: '12px', fill: '#64748b' }} />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                    cursor={{ fill: '#f1f5f9' }}
                 />
                 <Bar dataKey="value" radius={[0, 4, 4, 0]} onClick={handleBarClick} cursor="pointer">
                    {complianceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                    ))}
                 </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
             Device Distribution
             <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Click slice to filter</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.deviceTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  onClick={(data) => onDeviceSelect(data.name)}
                  cursor="pointer"
                >
                  {stats.deviceTypeDistribution.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        strokeWidth={0} 
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
           <div className="flex justify-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
              {stats.deviceTypeDistribution.map((item, index) => (
                <div 
                    key={item.name} 
                    className="flex items-center cursor-pointer hover:text-slate-800"
                    onClick={() => onDeviceSelect(item.name)}
                >
                   <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                   {item.name}
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
