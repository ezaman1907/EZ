
import React from 'react';
import { ShieldCheck, ShieldAlert, CloudOff, Cloud, Layers, Shield, AlertTriangle, CheckCircle2, XCircle, Info, MinusCircle } from 'lucide-react';

interface StatusBadgeProps {
  present: boolean;
  label: string;
  type: 'intune' | 'jamf' | 'defender';
  complianceState?: string;
  lastCheckInDays?: number;
  matchMethod?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ present, label, type, complianceState, lastCheckInDays, matchMethod }) => {
  
  if (present) {
    let tooltip = `Durum: Aktif (${label})`;
    if (matchMethod) tooltip += `\nEşleşme Kriteri: ${matchMethod}`;
    if (lastCheckInDays) tooltip += `\nSon Görülme: ${lastCheckInDays} gün önce`;
    if (complianceState) tooltip += `\nCloud Durumu: ${complianceState}`;

    const isWarning = type === 'intune' && (
       (complianceState && complianceState.toLowerCase().includes('non')) ||
       (lastCheckInDays && lastCheckInDays > 30)
    );

    // WARNING STATE (Present but issue)
    if (isWarning) {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm shadow-amber-500/5 cursor-help transition-all hover:scale-105" title={tooltip}>
            <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
            {complianceState?.includes('Non') ? 'UYUMSUZ' : 'ESKİ VERİ'}
          </span>
        );
    }

    // ACTIVE STATE (All good)
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5 cursor-help transition-all hover:scale-105" title={tooltip}>
        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
        AKTİF
      </span>
    );
  }

  // MISSING STATE (Missing agent)
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm shadow-rose-500/5 transition-all hover:scale-105" title={`${label} kaydı bulunamadı.`}>
      <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
      EKSİK
    </span>
  );
};
