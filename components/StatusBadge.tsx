import React from 'react';
import { ShieldCheck, ShieldAlert, CloudOff, Cloud, Layers, Shield } from 'lucide-react';

interface StatusBadgeProps {
  present: boolean;
  label: string;
  type: 'intune' | 'jamf' | 'defender';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ present, label, type }) => {
  if (present) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
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