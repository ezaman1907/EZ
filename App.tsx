import React, { useState, useMemo } from 'react';
import { Asset, DashboardStats, DashboardFilterType, DeviceType, InventorySnapshot } from './types';
import { InventoryTable } from './components/InventoryTable';
import { Dashboard } from './components/Dashboard';
import { FileUploader } from './components/FileUploader';
import { processFiles } from './services/dataProcessor';
import { calculateDashboardStats } from './services/statsService';
import { LayoutDashboard, List, RotateCcw, Database, Shield, ChevronRight, Calendar, History, Download, Save, FileText, CheckCircle, X, Cpu, Activity, Layers, Smartphone, Laptop } from 'lucide-react';

const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'monthly_reports'>('dashboard');
  
  // Data State
  const [snapshots, setSnapshots] = useState<InventorySnapshot[]>([]);
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
  
  // "Draft" state holds the analyzed data before it is saved
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

  const handleAnalyze = async () => {
    if (!files.inventory) {
      setError("Lütfen devam etmek için Envanter (SAP/DB) dosyasını yükleyin.");
      return;
    }

    setAppState('analyzing');
    setError(null);

    try {
      // 1. Process Files
      const { assets, cloudCounts } = await processFiles(files.inventory, files.intune, files.jamf, files.defender);
      
      // 2. Calculate Stats
      const stats = calculateDashboardStats(assets, cloudCounts);

      // 3. Create Draft Snapshot (Temporary ID, No Name yet)
      const draft: InventorySnapshot = {
        id: 'draft',
        periodLabel: 'DRAFT',
        dateCreated: new Date(),
        assets: assets,
        cloudCounts: cloudCounts,
        stats: stats
      };

      setDraftSnapshot(draft);
      setActiveSnapshotId('draft'); // Set focus to draft
      setAppState('results');
      setActiveTab('dashboard');
      
    } catch (err) {
      console.error(err);
      setError("Dosyalar işlenirken hata oluştu. Lütfen geçerli CSV veya Excel dosyaları yüklediğinizden emin olun.");
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
    setDraftSnapshot(null); // Clear draft
    setActiveSnapshotId(newSnapshot.id); // Switch to the saved version
    setIsSaveModalOpen(false);
    setSaveName('');
    
    // Automatically switch to Monthly Reports view to show it's saved
    setActiveTab('monthly_reports');
    
    // Reset file inputs
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
    setDashboardFilter(filter);
    setActiveTab('inventory');
  };

  const handleDeviceFilter = (deviceType: string) => {
    if (deviceType === 'iOS Mobile') {
        setDeviceFilter(DeviceType.iPhone);
    } else {
        setDeviceFilter(deviceType);
    }
    setActiveTab('inventory');
  };

  const handleExportCSV = (snapshot: InventorySnapshot) => {
    if (!snapshot) return;

    // CSV Headers
    const headers = [
      'Referans No', 
      'Seri No', 
      'Hostname', 
      'Marka', 
      'Model', 
      'Cihaz Tipi', 
      'Kullanıcı', 
      'Durum', 
      'Stok', 
      'Intune', 
      'Jamf', 
      'Defender'
    ];

    // CSV Rows
    const rows = snapshot.assets.map(asset => {
      return [
        asset.assetTag,
        asset.serialNumber,
        asset.hostname,
        asset.brand || '',
        asset.model || '',
        asset.type,
        asset.assignedUser || '',
        asset.statusDescription || '',
        asset.isStock ? 'EVET' : 'HAYIR',
        asset.compliance?.inIntune ? 'VAR' : 'YOK',
        asset.compliance?.inJamf ? 'VAR' : 'YOK',
        asset.compliance?.inDefender ? 'VAR' : 'YOK'
      ];
    });

    const escapeCsv = (field: any) => {
      const str = String(field || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `AssetGuard_${snapshot.periodLabel.replace(/\s+/g, '_')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Determine which data to show
  const currentData = useMemo(() => {
    if (activeSnapshotId === 'draft') return draftSnapshot;
    return snapshots.find(s => s.id === activeSnapshotId) || null;
  }, [snapshots, activeSnapshotId, draftSnapshot]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* SAVE REPORT MODAL */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Raporu Kaydet</h3>
              <button onClick={() => setIsSaveModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Analiz edilen verileri saklamak için bir dönem ismi giriniz.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Dönem İsmi (Örn: Kasım 2025)</label>
              <input 
                type="text"
                autoFocus
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Rapor ismi..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsSaveModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                İptal
              </button>
              <button 
                onClick={handleSaveReport}
                disabled={!saveName.trim()}
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                Kaydet ve Listele
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Technological Header */}
      <header className="relative bg-[#0f172a] border-b border-slate-800 sticky top-0 z-40 shadow-2xl shadow-slate-900/50 overflow-hidden">
        {/* Tech Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between h-[5.5rem] items-center">
            
            {/* Left: Branding */}
            <div className="flex items-center gap-5">
              <div 
                onClick={resetToUpload}
                className="relative group cursor-pointer"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
                <div className="relative bg-[#1e293b] p-3 rounded-2xl border border-slate-700/50 shadow-inner flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                   <Shield className="w-7 h-7 text-red-500 group-hover:text-red-400 transition-colors" />
                   <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                </div>
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                   <h1 className="text-2xl font-bold tracking-tight text-white">
                     <span className="text-red-600">KoçSistem</span> <span className="text-white">BT AssetGuard</span>
                   </h1>
                   <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">v2.4</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                   <Activity className="w-3 h-3 text-emerald-500" />
                   <span className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
                     Intelligent Inventory Intelligence
                   </span>
                </div>
              </div>
            </div>
            
            {/* Right: Actions & Navigation */}
            <div className="flex items-center gap-4">
              {/* Navigation Tabs (Floating Island Style) */}
              {appState === 'results' && (
                <div className="flex bg-slate-800/50 backdrop-blur-md rounded-xl p-1.5 border border-slate-700/50 shadow-lg mr-4">
                   <button
                     onClick={() => setActiveTab('dashboard')}
                     className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
                       activeTab === 'dashboard' 
                       ? 'bg-gradient-to-b from-slate-700 to-slate-800 text-white shadow-md border border-slate-600' 
                       : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                     }`}
                   >
                     <LayoutDashboard className={`w-3.5 h-3.5 ${activeTab === 'dashboard' ? 'text-red-400' : ''}`} /> 
                     Dashboard
                   </button>
                   <button
                     onClick={() => setActiveTab('inventory')}
                     className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
                       activeTab === 'inventory' 
                       ? 'bg-gradient-to-b from-slate-700 to-slate-800 text-white shadow-md border border-slate-600' 
                       : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                     }`}
                   >
                     <List className={`w-3.5 h-3.5 ${activeTab === 'inventory' ? 'text-blue-400' : ''}`} /> 
                     Envanter
                   </button>
                   <button
                     onClick={() => setActiveTab('monthly_reports')}
                     className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 ${
                       activeTab === 'monthly_reports' 
                       ? 'bg-gradient-to-b from-slate-700 to-slate-800 text-white shadow-md border border-slate-600' 
                       : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                     }`}
                   >
                     <History className={`w-3.5 h-3.5 ${activeTab === 'monthly_reports' ? 'text-orange-400' : ''}`} /> 
                     Raporlar
                   </button>
                </div>
              )}

              {/* Action Buttons */}
              {activeSnapshotId === 'draft' && (
                <button
                  onClick={() => setIsSaveModalOpen(true)}
                  className="group relative flex items-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] overflow-hidden"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  <Save className="w-4 h-4" />
                  KAYDET
                </button>
              )}

              {activeSnapshotId !== 'draft' && activeSnapshotId && currentData && (
                <button 
                  onClick={() => handleExportCSV(currentData)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-lg transition-all border border-slate-700 hover:border-slate-500"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden md:inline">DIŞA AKTAR</span>
                </button>
              )}
              
              {appState === 'results' && (
                <button 
                    onClick={resetToUpload}
                    className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white hover:bg-red-900/20 hover:border-red-900/50 transition-all"
                    title="Yeni Analiz Başlat"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* UPLOAD VIEW */}
        {appState === 'upload' && (
          <div className="max-w-5xl mx-auto animate-fadeIn relative z-10">
            {/* Background Grid - VISUAL ENHANCEMENT */}
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-red-400/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Hero Text */}
            <div className="text-center mb-12 pt-4">
               <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-4 inline-block shadow-sm">
                  Sistem Girişi
               </span>
               <h2 className="text-4xl font-black text-slate-900 tracking-tight sm:text-5xl mb-4 drop-shadow-sm">
                 Veri Giriş Portalı
               </h2>
               <p className="max-w-2xl mx-auto text-lg text-slate-500 font-medium">
                  Yapay zeka destekli analiz için envanter ve doğrulama kaynaklarınızı yükleyin.
               </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
               {/* Left: Core Data (Inventory) */}
               <div className="lg:col-span-5 flex flex-col h-full">
                  <div className="bg-white rounded-3xl shadow-xl shadow-blue-100/50 border border-slate-200 p-6 flex-1 relative overflow-hidden group hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-300">
                     {/* Header */}
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/30">
                           <Database className="w-6 h-6 text-white" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-slate-800">Ana Envanter</h3>
                           <p className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full w-fit mt-1">Zorunlu Kaynak</p>
                        </div>
                     </div>

                     {/* Uploader */}
                     <div className="h-64">
                        <FileUploader 
                            label="SAP / SQL Export" 
                            description="Merkezi envanter veritabanı dökümü (.xlsx)"
                            required
                            icon={Database}
                            colorTheme="blue"
                            onFileSelect={(f) => setFiles(prev => ({ ...prev, inventory: f }))}
                        />
                     </div>
                     
                     {/* Decor */}
                     <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mb-10 blur-3xl opacity-50 pointer-events-none group-hover:bg-blue-100 transition-colors"></div>
                  </div>
               </div>

               {/* Middle: Connection */}
               <div className="lg:col-span-1 hidden lg:flex items-center justify-center h-full py-12">
                  <div className="h-full w-[2px] bg-gradient-to-b from-transparent via-slate-300 to-transparent relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center z-10 shadow-sm animate-pulseSlow">
                         <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                  </div>
               </div>

               {/* Right: Validation Data (Cloud) */}
               <div className="lg:col-span-6">
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200 p-6 shadow-lg shadow-slate-100">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                           <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-slate-800">Bulut Doğrulama</h3>
                           <p className="text-xs text-slate-400">Çapraz doğrulama kaynakları (Opsiyonel)</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="h-48">
                            <FileUploader 
                              label="Intune (Windows)" 
                              description="Endpoint Manager"
                              icon={Laptop}
                              colorTheme="indigo"
                              onFileSelect={(f) => setFiles(prev => ({ ...prev, intune: f }))}
                            />
                        </div>
                        <div className="h-48">
                            <FileUploader 
                              label="Jamf Pro (macOS)" 
                              description="Apple MDM export"
                              icon={Layers}
                              colorTheme="emerald"
                              onFileSelect={(f) => setFiles(prev => ({ ...prev, jamf: f }))}
                            />
                        </div>
                        <div className="sm:col-span-2 h-32">
                             <FileUploader 
                              label="Microsoft Defender" 
                              description="Güvenlik ve tehdit koruması raporu"
                              icon={Shield}
                              colorTheme="rose"
                              onFileSelect={(f) => setFiles(prev => ({ ...prev, defender: f }))}
                            />
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Action Area */}
            <div className="max-w-3xl mx-auto mt-12">
                {error && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-xl flex items-center gap-3 shadow-sm animate-fadeIn">
                    <div className="p-2 bg-rose-100 rounded-lg">
                       <Shield className="w-4 h-4 text-rose-600" />
                    </div>
                    {error}
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={!files.inventory}
                  className={`w-full group relative overflow-hidden rounded-2xl py-5 font-bold text-lg tracking-wide transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-2xl
                    ${files.inventory
                      ? 'bg-slate-900 text-white hover:shadow-slate-900/40' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                  `}
                >
                  <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-1000 ${files.inventory ? 'group-hover:translate-x-full' : ''}`}></div>
                  <span className="flex items-center justify-center gap-3">
                    SİSTEMİ ANALİZ ET
                    <Cpu className={`w-5 h-5 ${files.inventory ? 'text-emerald-400 animate-pulse' : ''}`} />
                  </span>
                </button>
                <p className="text-center text-xs text-slate-400 mt-4">
                   Güvenli İşlem • Veriler tarayıcınızda yerel olarak işlenir.
                </p>
            </div>
          </div>
        )}

        {/* LOADING VIEW */}
        {appState === 'analyzing' && (
          <div className="flex flex-col items-center justify-center h-96 animate-fadeIn">
            <div className="relative">
               <div className="w-24 h-24 border-4 border-slate-100 border-t-red-600 rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <Cpu className="w-8 h-8 text-red-600 animate-pulse" />
               </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mt-8">Veriler Analiz Ediliyor...</h3>
            <p className="text-slate-500 mt-2 text-lg">Yapay zeka destekli eşleştirme ve risk hesaplama yapılıyor.</p>
          </div>
        )}

        {/* RESULTS VIEW */}
        {appState === 'results' && (
          <div className="animate-fadeIn">
            
            {/* MONTHLY REPORTS TAB */}
            {activeTab === 'monthly_reports' && (
              <div className="max-w-5xl mx-auto">
                 <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                           <History className="w-6 h-6 text-orange-600" />
                        </div>
                        Geçmiş Rapor Arşivi
                    </h2>
                 </div>
                 
                 {snapshots.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                           <FileText className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-700">Henüz kayıtlı rapor yok</h3>
                        <p className="text-slate-500 text-sm mt-1">Analiz sonuçlarını kaydederek burada arşivleyebilirsiniz.</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {snapshots.map(snapshot => (
                          <div key={snapshot.id} className="group bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                             
                             <div className="relative z-10 flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                       <Calendar className="w-3 h-3 text-slate-400" />
                                       <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{snapshot.dateCreated.toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{snapshot.periodLabel}</h3>
                                </div>
                                <div className="bg-slate-900 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg shadow-slate-900/20">
                                   {snapshot.stats.totalAssets} <span className="font-normal opacity-70 text-xs">Varlık</span>
                                </div>
                             </div>
                             
                             <div className="relative z-10 grid grid-cols-3 gap-2 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="text-center">
                                   <span className="block text-xs text-slate-500 mb-1">Uyumlu</span>
                                   <span className="block font-bold text-emerald-600 text-lg">{snapshot.stats.compliantCount}</span>
                                </div>
                                <div className="text-center border-l border-slate-200">
                                   <span className="block text-xs text-slate-500 mb-1">Stok</span>
                                   <span className="block font-bold text-amber-600 text-lg">{snapshot.stats.stockCount}</span>
                                </div>
                                <div className="text-center border-l border-slate-200">
                                   <span className="block text-xs text-slate-500 mb-1">Risk</span>
                                   <span className="block font-bold text-red-600 text-lg">{snapshot.stats.missingDefenderCount}</span>
                                </div>
                             </div>

                             <div className="relative z-10 mt-auto flex gap-3">
                                <button 
                                   onClick={() => {
                                      setActiveSnapshotId(snapshot.id);
                                      setActiveTab('dashboard');
                                   }}
                                   className="flex-1 bg-slate-900 text-white hover:bg-slate-800 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg"
                                >
                                   Raporu Aç
                                </button>
                                <button 
                                   onClick={() => handleExportCSV(snapshot)}
                                   className="px-4 bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-lg transition-all shadow-sm"
                                   title="CSV İndir"
                                >
                                   <Download className="w-4 h-4" />
                                </button>
                             </div>
                          </div>
                        ))}
                    </div>
                 )}
              </div>
            )}

            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && currentData && (
              <>
                 {activeSnapshotId === 'draft' && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-8 flex justify-between items-center shadow-sm animate-fadeIn">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                             <Activity className="w-5 h-5" />
                          </div>
                          <div>
                             <h4 className="text-sm font-bold text-blue-900">Canlı Önizleme Modu</h4>
                             <p className="text-xs text-blue-700 mt-0.5">Veriler analiz edildi ancak henüz veritabanına kaydedilmedi.</p>
                          </div>
                       </div>
                       <button 
                          onClick={() => setIsSaveModalOpen(true)}
                          className="text-xs font-bold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20"
                       >
                          RAPORU KAYDET
                       </button>
                    </div>
                 )}
                 <Dashboard 
                    stats={currentData.stats} 
                    inventory={currentData.assets}
                    onFilterSelect={handleDashboardFilter}
                    onDeviceSelect={handleDeviceFilter}
                 />
              </>
            )}
            
            {/* INVENTORY TAB */}
            {activeTab === 'inventory' && currentData && (
              <InventoryTable 
                data={currentData.assets} 
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