
import React from 'react';
import { ShieldCheck, ShieldAlert, CloudOff, Cloud, Layers, Shield, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  present: boolean;
  label: string;
  type: 'intune' | 'jamf' | 'defender';
  // Optional extra details
  complianceState?: string;
  lastCheckInDays?: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ present, label, type, complianceState, lastCheckInDays }) => {
  
  if (present) {
    // INTUNE SPECIAL LOGIC:
    // If present but marked "NonCompliant" or "NotCompliant" in source, or stale (>30 days), warn.
    const isIntuneWarning = type === 'intune' && (
       (complianceState && complianceState.toLowerCase().includes('non')) ||
       (lastCheckInDays && lastCheckInDays > 30)
    );

    if (isIntuneWarning) {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shadow-sm" title={`Status: ${complianceState || 'Unknown'}, Last Sync: ${lastCheckInDays || '?'} days ago`}>
            <AlertTriangle className="w-3 h-3 mr-1.5" />
            {complianceState?.includes('Non') ? 'Non-Compliant' : 'Stale'}
          </span>
        );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm" title={lastCheckInDays ? `Last Sync: ${lastCheckInDays} days ago` : 'Active'}>
        {type === 'intune' ? <Cloud className="w-3 h-3 mr-1.5" /> : type === 'jamf' ? <Layers className="w-3 h-3 mr-1.5" /> : <ShieldCheck className="w-3 h-3 mr-1.5" />}
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200 shadow-sm">
      {type === 'intune' ? <CloudOff className="w-3 h-3 mr-1.5" /> : type === 'jamf' ? <ShieldAlert className="w-3 h-3 mr-1.5" /> : <Shield className="w-3 h-3 mr-1.5" />}
      Missing
    </span>
  );
};
