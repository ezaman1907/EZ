
import React, { useState, useMemo } from 'react';
import { Asset, DashboardStats, DashboardFilterType, DeviceType } from './types';
import { InventoryTable } from './components/InventoryTable';
import { Dashboard } from './components/Dashboard';
import { FileUploader } from './components/FileUploader';
import { processFiles } from './services/dataProcessor';
import { LayoutDashboard, List, RotateCcw, Database, Shield, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory'>('dashboard');
  const [inventory, setInventory] = useState<Asset[]>([]);
  const [appState, setAppState] = useState<'upload' | 'analyzing' | 'results'>('upload');
  const [dashboardFilter, setDashboardFilter] = useState<DashboardFilterType>('ALL');
  const [deviceFilter, setDeviceFilter] = useState<string>('All');
  
  // File States
  const [files, setFiles] = useState<{
    inventory: File | null;
    intune: File | null;
    jamf: File | null;
    defender: File | null;
  }>({
    inventory: null,
    intune: null,
    jamf: null,
    defender: null
  });

  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!files.inventory) {
      setError("Lütfen devam etmek için Envanter (SAP/DB) dosyasını yükleyin.");
      return;
    }

    setAppState('analyzing');
    setError(null);

    try {
      const data = await processFiles(files.inventory, files.intune, files.jamf, files.defender);
      setInventory(data);
      setAppState('results');
    } catch (err) {
      console.error(err);
      setError("Dosyalar işlenirken hata oluştu. Lütfen geçerli CSV veya Excel dosyaları yüklediğinizden emin olun.");
      setAppState('upload');
    }
  };

  const resetData = () => {
    setInventory([]);
    setFiles({ inventory: null, intune: null, jamf: null, defender: null });
    setAppState('upload');
    setActiveTab('dashboard');
    setDashboardFilter('ALL');
    setDeviceFilter('All');
  };

  const handleDashboardFilter = (filter: DashboardFilterType) => {
    setDashboardFilter(filter);
    setActiveTab('inventory');
  };

  const handleDeviceFilter = (deviceType: string) => {
    // If user clicks "iOS Mobile" in pie chart, filter table for "iPhone" (which includes iPads)
    if (deviceType === 'iOS Mobile') {
        setDeviceFilter(DeviceType.iPhone);
    } else {
        setDeviceFilter(deviceType);
    }
    setActiveTab('inventory');
  };

  // Derived statistics
  const stats: DashboardStats = useMemo(() => {
    const totalAssets = inventory.length;
    
    // COMPLIANCE LOGIC:
    // 1. MacBook: Needs Jamf AND Defender (Intune NOT required)
    // 2. Desktop/Notebook (Win): Needs Intune AND Defender
    // 3. Phone/iPad: Needs Intune AND Defender
    const compliantCount = inventory.filter(a => {
      const isMac = a.type === DeviceType.MacBook;
      const isPC = a.type === DeviceType.Desktop || a.type === DeviceType.Notebook;
      const isMobile = a.type === DeviceType.iPhone || a.type === DeviceType.iPad;
      
      const hasIntune = a.compliance?.inIntune;
      const hasJamf = a.compliance?.inJamf;
      const hasDefender = a.compliance?.inDefender;

      if (isMac) {
        // Macs do not check Intune
        return hasJamf && hasDefender;
      }
      if (isPC) {
        return hasIntune && hasDefender;
      }
      if (isMobile) {
        return hasIntune && hasDefender;
      }
      // Default fallback (e.g. Monitors) usually just Intune or ignored
      return hasIntune;
    }).length;

    // Missing Intune Count - exclude MacBooks as they are not in Intune
    const missingIntuneCount = inventory.filter(a => a.type !== DeviceType.MacBook && !a.compliance?.inIntune).length;
    
    // JAMF LOGIC: Only MacBooks
    const missingJamfCount = inventory.filter(a => a.type === DeviceType.MacBook && !a.compliance?.inJamf).length;

    // DEFENDER LOGIC: MacBooks + Desktops + Notebooks + iPhones + iPads (Monitors excluded)
    const missingDefenderCount = inventory.filter(a => {
      const allowedTypes = [
        DeviceType.MacBook,
        DeviceType.Desktop,
        DeviceType.Notebook,
        DeviceType.iPhone,
        DeviceType.iPad
      ];
      return allowedTypes.includes(a.type) && !a.compliance?.inDefender;
    }).length;

    const deviceCounts: Record<string, number> = {};
    inventory.forEach(item => {
      let typeKey: string = item.type;
      // Group iPhone and iPad into single Chart category "iOS Mobile"
      if (item.type === DeviceType.iPhone || item.type === DeviceType.iPad) {
          typeKey = 'iOS Mobile';
      }
      deviceCounts[typeKey] = (deviceCounts[typeKey] || 0) + 1;
    });

    const deviceTypeDistribution = Object.keys(deviceCounts).map(key => ({
      name: key,
      value: deviceCounts[key]
    }));
    
    return {
      totalAssets,
      compliantCount,
      missingIntuneCount,
      missingJamfCount,
      missingDefenderCount,
      deviceTypeDistribution
    };
  }, [inventory]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Navigation Bar - Dark Theme for Security App Feel */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10 shadow-lg shadow-red-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-4">
              {/* Custom Brand Icon */}
              <div className="relative group cursor-pointer transition-transform hover:scale-105 duration-300">
                {/* Glow Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl blur opacity-40 group-hover:opacity-75 transition duration-300"></div>
                {/* Icon Container */}
                <div className="relative bg-gradient-to-br from-red-600 to-orange-600 p-2.5 rounded-xl shadow-lg shadow-red-900/40 flex items-center justify-center ring-2 ring-slate-800">
                   <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" className="fill-white/10" />
                      <path d="M9 12l2 2 4-4" />
                   </svg>
                </div>
              </div>
              
              {/* Divider */}
              <div className="h-8 w-px bg-slate-700 hidden sm:block mx-2"></div>

              <div className="flex flex-col justify-center">
                <h1 className="text-xl sm:text-2xl font-bold text-white leading-none tracking-tight flex items-center gap-2">
                  <span className="hidden sm:inline text-slate-100">KoçSistem</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">AssetGuard</span>
                </h1>
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-1">
                  Bütünleşik Envanter ve Güvenlik İstihbarat Merkezi
                </span>
              </div>
            </div>
            
            {appState === 'results' && (
              <div className="flex items-center gap-4">
                <button 
                  onClick={resetData}
                  className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg transition-all border border-transparent hover:border-slate-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  Yeni Analiz
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* UPLOAD VIEW */}
        {appState === 'upload' && (
          <div className="max-w-2xl mx-auto animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-slate-50">
                  <Database className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Veri Kaynaklarını Yükleyin</h2>
                <p className="text-slate-500 mt-2">Merkezi envanter listesi ile bulut platform raporlarını (Excel/CSV) yükleyerek otomatik uyumluluk analizini başlatın.</p>
              </div>

              <FileUploader 
                label="1. Envanter Listesi (Zorunlu)" 
                description="SAP, SQL DB veya Excel kaynaklı ana envanter listesi. Hostname, Seri No içermelidir."
                required
                onFileSelect={(f) => setFiles(prev => ({ ...prev, inventory: f }))}
              />

              <div className="border-t border-slate-100 my-6 pt-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  Bulut Uyumluluk Kontrolleri (Opsiyonel)
                </h3>
                <FileUploader 
                  label="2. Intune Raporu" 
                  description="Endpoint Manager'dan alınan tüm cihazların listesi."
                  onFileSelect={(f) => setFiles(prev => ({ ...prev, intune: f }))}
                />
                <FileUploader 
                  label="3. Jamf Raporu" 
                  description="Jamf Pro'dan alınan Mac cihaz listesi."
                  onFileSelect={(f) => setFiles(prev => ({ ...prev, jamf: f }))}
                />
                <FileUploader 
                  label="4. Defender Raporu" 
                  description="Microsoft Defender for Endpoint cihaz listesi."
                  onFileSelect={(f) => setFiles(prev => ({ ...prev, defender: f }))}
                />
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!files.inventory}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all transform hover:scale-[1.01] active:scale-[0.99]
                  ${files.inventory 
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30' 
                    : 'bg-slate-300 cursor-not-allowed'}
                `}
              >
                Analizi Başlat
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* LOADING VIEW */}
        {appState === 'analyzing' && (
          <div className="flex flex-col items-center justify-center h-96 animate-fadeIn">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-semibold text-slate-800">Veriler Analiz Ediliyor...</h3>
            <p className="text-slate-500 mt-2">Hostname ve seri numaraları güvenlik sağlayıcıları ile eşleştiriliyor.</p>
          </div>
        )}

        {/* RESULTS VIEW */}
        {appState === 'results' && (
          <div className="animate-fadeIn">
            {/* Tab Navigation */}
            <div className="flex space-x-1 rounded-xl bg-slate-200/60 p-1 mb-8 w-fit">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === 'dashboard' 
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === 'inventory' 
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <List className="w-4 h-4" />
                Envanter Listesi
              </button>
            </div>

            {activeTab === 'dashboard' && (
              <Dashboard 
                stats={stats} 
                inventory={inventory}
                onFilterSelect={handleDashboardFilter}
                onDeviceSelect={handleDeviceFilter}
              />
            )}
            
            {activeTab === 'inventory' && (
              <InventoryTable 
                data={inventory} 
                dashboardFilter={dashboardFilter}
                onClearDashboardFilter={() => setDashboardFilter('ALL')}
                deviceFilter={deviceFilter}
                onDeviceFilterChange={setDeviceFilter}
              />
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default App;