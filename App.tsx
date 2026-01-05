
import React, { useState, useMemo, useEffect } from 'react';
import { Asset, DashboardFilterType, InventorySnapshot, DeviceType } from './types';
import { InventoryTable } from './components/InventoryTable';
import { Dashboard } from './components/Dashboard';
import { FileUploader } from './components/FileUploader';
import { Methodology } from './components/Methodology';
import { processFiles } from './services/dataProcessor';
import { calculateDashboardStats } from './services/statsService';
import { LayoutDashboard, List, RotateCcw, Database, Shield, History, Download, Save, Activity, Layers, Smartphone, Laptop, HardDrive, Moon, Sun, ShieldCheck, ChevronRight, AlertTriangle, BookOpen } from 'lucide-react';

const App: React.FC = () => {
  // Theme State
  const [darkMode, setDarkMode] = useState(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'monthly_reports' | 'methodology'>('dashboard');
  
  // Data State
  const [snapshots, setSnapshots] = useState<InventorySnapshot[]>([]);
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
  const [draftSnapshot, setDraftSnapshot] = useState<InventorySnapshot | null>(null);
  
  const [appState, setAppState] = useState<'upload' | 'analyzing' | 'results'>('upload');
  const [dashboardFilter, setDashboardFilter] = useState<DashboardFilterType>('ALL');
  const [deviceFilter, setDeviceFilter] = useState<string>('All');
  
  // Save Modal State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');

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

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleAnalyze = async () => {
    if (!files.inventory) {
      setError("Lütfen devam etmek için Envanter (SAP/DB) dosyasını yükleyin.");
      return;
    }

    setAppState('analyzing');
    setError(null);

    try {
      const { assets, cloudCounts, orphans } = await processFiles(files.inventory, files.intune, files.jamf, files.defender);
      const stats = calculateDashboardStats(assets, cloudCounts);

      const draft: InventorySnapshot = {
        id: 'draft',
        periodLabel: 'TASLAK',
        dateCreated: new Date(),
        assets: assets,
        orphans: orphans, 
        cloudCounts: cloudCounts,
        stats: stats
      };

      setDraftSnapshot(draft);
      setActiveSnapshotId('draft');
      setAppState('results');
      setActiveTab('dashboard');
      
    } catch (err) {
      console.error(err);
      setError("Dosyalar işlenirken hata oluştu.");
      setAppState('upload');
    }
  };

  const handleSaveReport = () => {
    if (!saveName.trim() || !draftSnapshot) return;

    const newSnapshot: InventorySnapshot = {
      ...draftSnapshot,
      id: Date.now().toString(),
      periodLabel: saveName,
      dateCreated: new Date()
    };

    setSnapshots(prev => [...prev, newSnapshot]);
    setDraftSnapshot(null);
    setActiveSnapshotId(newSnapshot.id);
    setIsSaveModalOpen(false);
    setSaveName('');
    setActiveTab('monthly_reports');
    setFiles({ inventory: null, intune: null, jamf: null, defender: null });
  };

  const resetToUpload = () => {
    setAppState('upload');
    setActiveTab('dashboard');
    setDashboardFilter('ALL');
    setDeviceFilter('All');
    setDraftSnapshot(null);
    setActiveSnapshotId(null);
  };

  const handleDashboardFilter = (filter: DashboardFilterType) => {
    setDeviceFilter('All');
    setDashboardFilter(filter);
    setActiveTab('inventory');
  };

  const handleDeviceFilter = (deviceType: string) => {
    setDashboardFilter('ALL');
    // Updated: Match "iPhone & iPad" string from chart
    let filter = deviceType;
    if (deviceType === 'iPhone & iPad' || deviceType === 'iOS Mobile' || deviceType === DeviceType.iPhone || deviceType === DeviceType.iPad) {
        filter = 'iPhone_iPad';
    }
    setDeviceFilter(filter);
    setActiveTab('inventory');
  };

  const currentData = useMemo(() => {
    if (activeSnapshotId?.startsWith('draft')) return draftSnapshot;
    return snapshots.find(s => s.id === activeSnapshotId) || null;
  }, [snapshots, activeSnapshotId, draftSnapshot]);

  const displayedAssets = useMemo(() => {
     if (!currentData) return [];
     if (dashboardFilter === 'ORPHAN_INTUNE') return currentData.orphans.filter(o => o.orphanSource === 'Intune');
     if (dashboardFilter === 'ORPHAN_JAMF') return currentData.orphans.filter(o => o.orphanSource === 'Jamf');
     if (dashboardFilter === 'ORPHAN_DEFENDER') return currentData.orphans.filter(o => o.orphanSource === 'Defender');
     return currentData.assets;
  }, [currentData, dashboardFilter]);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 flex flex-col ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* BACKGROUND PATTERN */}
      <div className={`fixed inset-0 z-0 pointer-events-none ${darkMode ? 'opacity-10' : 'opacity-40'}`} 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="h-1.5 w-full bg-red-600 sticky top-0 z-50 shadow-sm"></div>

      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Raporu Kaydet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Analiz durumunu arşivleyin.</p>
            <input type="text" autoFocus className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white mb-6 focus:ring-2 focus:ring-red-500 outline-none" value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Örn: Kasım 2024 Denetimi" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsSaveModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl">İptal</button>
              <button onClick={handleSaveReport} className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      <header className={`sticky top-1.5 z-40 border-b backdrop-blur-xl transition-colors duration-300 ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200/60'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-18 items-center py-3">
            <div className="flex items-center gap-3.5 group cursor-pointer" onClick={resetToUpload}>
              <div className={`p-2 rounded-xl ${darkMode ? 'bg-red-900/20 text-red-500' : 'bg-red-600 text-white'} shadow-lg shadow-red-600/10 transition-transform group-hover:scale-105 duration-300`}><Shield className="w-6 h-6" /></div>
              <div className="flex flex-col justify-center"><h1 className={`text-xl font-bold tracking-tight leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>KoçSistem <span className="font-light opacity-70">AssetGuard</span></h1><span className="text-[10px] font-bold text-red-600 tracking-widest uppercase mt-0.5">BT Güvenlik Yönetimi</span></div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}>{darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
              {appState === 'results' && (
                <>
                  <div className="hidden md:flex p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 mx-2 border border-slate-200 dark:border-slate-700">
                    <button onClick={() => { setActiveTab('dashboard'); setDashboardFilter('ALL'); }} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}><LayoutDashboard className="w-3.5 h-3.5" /> Panel</button>
                    <button onClick={() => setActiveTab('inventory')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}><List className="w-3.5 h-3.5" /> Envanter</button>
                    <button onClick={() => setActiveTab('monthly_reports')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'monthly_reports' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}><History className="w-3.5 h-3.5" /> Arşiv</button>
                    <button onClick={() => setActiveTab('methodology')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'methodology' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}><BookOpen className="w-3.5 h-3.5" /> Metodoloji</button>
                  </div>
                  {activeSnapshotId?.startsWith('draft') && (
                     <button onClick={() => setIsSaveModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 shadow-md"><Save className="w-3.5 h-3.5" /> Kaydet</button>
                  )}
                  <button onClick={resetToUpload} className={`p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 transition-colors`} title="Yeni Analiz"><RotateCcw className="w-4 h-4" /></button>
                </>
              )}
            </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 relative z-10 w-full">
        {appState === 'upload' && (
          <div className="flex flex-col items-center justify-center pt-6 pb-12 animate-fadeIn">
             <div className="text-center max-w-4xl mb-12"><div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 border shadow-sm ${darkMode ? 'bg-slate-800 text-red-400 border-slate-700' : 'bg-white text-red-600 border-red-100'}`}><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>Yapay Zeka Destekli Varlık Yönetimi</div><h2 className={`text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Güvenlik Uyumluluk Analizi</h2><p className={`text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}><span className="text-red-600 dark:text-red-400 font-bold">KoçSistem BT Ekibi</span> ile SAP dökümünü ve bulut raporlarını yükleyerek saniyeler içinde kapsamlı uyumluluk raporu oluşturun.</p></div>
             <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-7 flex flex-col"><div className={`h-full rounded-3xl border relative overflow-hidden transition-all duration-300 group ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/40'}`}><div className={`absolute top-0 inset-x-0 h-1.5 ${darkMode ? 'bg-gradient-to-r from-red-900 via-red-600 to-red-900' : 'bg-gradient-to-r from-red-400 via-red-600 to-red-400'}`}></div><div className="p-8 flex flex-col h-full relative z-10"><div className="flex justify-between items-start mb-8"><div className="flex items-center gap-5"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${darkMode ? 'bg-slate-700 text-red-400' : 'bg-white border border-slate-100 text-red-600'}`}><Database className="w-7 h-7" /></div><div><h3 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Ana Envanter Verisi</h3><p className={`text-sm mt-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>SAP veya Excel Dökümü (.xlsx, .csv)</p></div></div><span className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${darkMode ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-700'}`}>Zorunlu Alan</span></div><div className="flex-1 min-h-[300px] relative"><FileUploader label="Dosyayı Buraya Bırakın" description="Veya bilgisayarınızdan seçmek için tıklayın" required icon={HardDrive} colorTheme="rose" variant="hero" onFileSelect={(f) => setFiles(prev => ({ ...prev, inventory: f }))} /></div></div></div></div>
                <div className="lg:col-span-5 flex flex-col gap-6"><div className={`p-6 rounded-2xl border flex-1 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200 shadow-lg shadow-slate-200/30'}`}><div className="flex justify-between items-center mb-6"><h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Bulut Kaynakları (Opsiyonel)</h3></div><div className="flex flex-col gap-4">
                    <FileUploader label="Intune Raporu" description="Windows & iOS" icon={Laptop} colorTheme="slate" variant="compact" onFileSelect={(f) => setFiles(prev => ({ ...prev, intune: f }))} />
                    <FileUploader label="Jamf Pro" description="macOS Cihazlar" icon={Layers} colorTheme="slate" variant="compact" onFileSelect={(f) => setFiles(prev => ({ ...prev, jamf: f }))} />
                    <FileUploader label="Defender" description="Uç Nokta Güvenlik" icon={Shield} colorTheme="slate" variant="compact" onFileSelect={(f) => setFiles(prev => ({ ...prev, defender: f }))} />
                  </div></div><button onClick={handleAnalyze} disabled={!files.inventory} className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 shadow-xl transition-all transform active:scale-95 disabled:opacity-50 ${darkMode ? 'bg-red-600 text-white' : 'bg-red-600 text-white'}`}><Activity className="w-6 h-6" />Analizi Başlat</button></div>
             </div>
             {error && (
                <div className="mt-8 flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 border border-red-200"><AlertTriangle className="w-5 h-5" /><p className="font-medium text-sm">{error}</p></div>
             )}
          </div>
        )}
        {appState === 'analyzing' && (<div className="flex flex-col items-center justify-center h-[60vh] animate-fadeIn"><div className="relative w-24 h-24 mb-8"><div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div><div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div><ShieldCheck className="absolute inset-0 m-auto w-8 h-8 text-red-600 animate-pulse" /></div><h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Veriler Analiz Ediliyor</h3></div>)}
        {appState === 'results' && currentData && (
          <div className="space-y-6 animate-fadeIn">
             {activeTab === 'dashboard' && (<Dashboard stats={currentData.stats} inventory={currentData.assets} onFilterSelect={handleDashboardFilter} onDeviceSelect={handleDeviceFilter} />)}
             {activeTab === 'inventory' && (
               <InventoryTable 
                 data={displayedAssets} 
                 dashboardFilter={dashboardFilter} 
                 onClearDashboardFilter={() => setDashboardFilter('ALL')} 
                 deviceFilter={deviceFilter} 
                 onDeviceFilterChange={handleDeviceFilter} 
                 onHome={() => setActiveTab('dashboard')}
               />
             )}
             {activeTab === 'methodology' && (<Methodology />)}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
