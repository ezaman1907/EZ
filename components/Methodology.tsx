
import React from 'react';
import { BookOpen, CheckCircle2, AlertTriangle, FileKey, Shield, Cloud, Layers, UserCheck } from 'lucide-react';
import { SPECIAL_EXEMPTIONS, SPECIAL_EXEMPT_USERS } from '../services/dataProcessor';

export const Methodology: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 animate-fadeIn max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-10 border-b border-slate-100 dark:border-slate-700 pb-6">
        <div className="p-3.5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400">
          <BookOpen className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Metodoloji ve Teknik Dokümantasyon</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">KoçSistem AssetGuard uyumluluk analizi ve istisna kuralları.</p>
        </div>
      </div>

      <div className="space-y-12">
        {/* 1. Veri Kaynakları */}
        <section>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-600 dark:text-slate-300">1</span>
            Veri Kaynakları ve Eşleştirme
          </h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            Sistem, referans veri kaynağı olarak yüklenen <strong>SAP/Envanter</strong> dosyasını kabul eder. Bu listedeki her cihaz, aşağıdaki bulut raporlarıyla karşılaştırılır:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2 mb-2">
                 <Cloud className="w-4 h-4 text-blue-500" />
                 <strong className="text-slate-900 dark:text-white text-sm">Microsoft Intune</strong>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Windows ve iOS/Mobil cihazların yönetim durumu kontrol edilir.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
               <div className="flex items-center gap-2 mb-2">
                 <Layers className="w-4 h-4 text-slate-500" />
                 <strong className="text-slate-900 dark:text-white text-sm">Jamf Pro</strong>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">macOS (MacBook) cihazların yönetim durumu kontrol edilir.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
               <div className="flex items-center gap-2 mb-2">
                 <Shield className="w-4 h-4 text-indigo-500" />
                 <strong className="text-slate-900 dark:text-white text-sm">Defender</strong>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tüm bilgisayarlar (Win/Mac) için uç nokta güvenlik (EDR) durumu.</p>
            </div>
          </div>
          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-800/50">
            <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">Eşleştirme Algoritması</h4>
            <p className="text-sm text-blue-700 dark:text-blue-200 leading-relaxed">
              Cihazlar öncelikle benzersiz <strong>Seri Numarası (Serial Number)</strong> üzerinden eşleştirilir. Seri numarası eksik veya hatalıysa, <strong>Hostname</strong> üzerinden ikincil eşleştirme denenir.
            </p>
          </div>
        </section>

        {/* 2. Uyumluluk Kuralları */}
        <section>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-600 dark:text-slate-300">2</span>
            Güvenlik Uyumluluk Kriterleri
          </h3>
          <div className="overflow-hidden border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3">Platform / Cihaz Tipi</th>
                  <th className="px-5 py-3">Gerekli Güvenlik Ajanları</th>
                  <th className="px-5 py-3">Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                <tr>
                  <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">Windows PC (Desktop/Notebook)</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Intune + Defender
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400">Hem MDM yönetimi hem de Antivirüs aktif olmalı.</td>
                </tr>
                <tr>
                  <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">macOS (MacBook)</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Jamf + Defender
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400">Jamf (MDM) ve Defender (EDR) birlikte bulunmalı.</td>
                </tr>
                <tr>
                  <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">iOS / Mobil</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Sadece Intune
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400">Mobil cihazlar için Defender zorunluluğu yoktur.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. İstisnalar */}
        <section>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-5 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-600 dark:text-slate-300">3</span>
            İstisnalar ve Özel Muafiyetler
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Bazı cihazlar operasyonel gereklilikler, test süreçleri veya VIP statüsü nedeniyle standart güvenlik politikalarından muaf tutulur. Bu cihazlar istatistiklerde "Eksik" olarak işaretlenmez ve skorlamada <strong>Uyumlu</strong> kabul edilir.
          </p>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Otomatik İstisnalar */}
            <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-800">
              <h4 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5" />
                Sistematik (Otomatik) İstisnalar
              </h4>
              <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                  <span><strong>Stok Cihazları:</strong> Kullanım tipi "Stok" olan cihazlar üretim ortamında sayılmaz.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                  <span><strong>Departman Mac'leri:</strong> Departman kullanımındaki Mac cihazları Jamf zorunluluğundan muaftır.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></span>
                  <span><strong>Monitörler:</strong> Güvenlik takibi yapılmaz.</span>
                </li>
              </ul>
            </div>

            {/* Özel Manuel İstisnalar */}
            <div className={`grid grid-cols-1 ${SPECIAL_EXEMPT_USERS.length > 0 ? 'lg:grid-cols-2' : ''} gap-6`}>
              {/* Device Exemptions */}
              <div className="bg-teal-50 dark:bg-teal-900/10 p-6 rounded-2xl border border-teal-100 dark:border-teal-800 shadow-sm relative overflow-hidden">
                <FileKey className="absolute -bottom-4 -right-4 w-24 h-24 text-teal-100 dark:text-teal-800/20 opacity-50 rotate-12" />
                <h4 className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-2 mb-4 relative z-10">
                  <FileKey className="w-5 h-5" />
                  Cihaz İstisnaları (Serial)
                </h4>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-teal-200 dark:border-teal-700/50 max-h-64 overflow-y-auto relative z-10 shadow-inner">
                  <table className="w-full text-left text-xs">
                    <tbody className="divide-y divide-teal-50 dark:divide-slate-700">
                      {SPECIAL_EXEMPTIONS.map((serial) => (
                        <tr key={serial} className="hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                            {serial}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* User Exemptions */}
              {SPECIAL_EXEMPT_USERS.length > 0 && (
                <div className="bg-teal-50 dark:bg-teal-900/10 p-6 rounded-2xl border border-teal-100 dark:border-teal-800 shadow-sm relative overflow-hidden">
                  <UserCheck className="absolute -bottom-4 -right-4 w-24 h-24 text-teal-100 dark:text-teal-800/20 opacity-50 rotate-12" />
                  <h4 className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-2 mb-4 relative z-10">
                    <UserCheck className="w-5 h-5" />
                    Kullanıcı İstisnaları (İsim)
                  </h4>
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-teal-200 dark:border-teal-700/50 max-h-48 overflow-y-auto relative z-10 shadow-inner">
                    <table className="w-full text-left text-xs">
                      <tbody className="divide-y divide-teal-50 dark:divide-slate-700">
                        {SPECIAL_EXEMPT_USERS.map((user) => (
                          <tr key={user} className="hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                              {user}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>
      </div>
    </div>
  );
};
