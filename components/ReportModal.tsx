
import React from 'react';
import { X, FileText, Download, ShieldCheck, AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, content }) => {
  if (!isOpen) return null;

  // Simple helper to format markdown-like text for display
  const renderContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Headers (###)
      if (line.startsWith('###')) {
        return <h3 key={index} className="text-lg font-bold text-slate-900 mt-6 mb-3 pb-2 border-b border-slate-100">{line.replace('###', '').trim()}</h3>;
      }
      // Bold text (**text**)
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="text-slate-700 leading-relaxed mb-2">
            {parts.map((part, i) => (
              i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900">{part}</strong> : part
            ))}
          </p>
        );
      }
      // List items (-)
      if (line.trim().startsWith('- ')) {
        return (
            <li key={index} className="text-slate-700 leading-relaxed ml-4 list-disc mb-1">
                {line.replace('- ', '')}
            </li>
        )
      }
      // Empty lines
      if (line.trim() === '') {
        return <div key={index} className="h-2"></div>;
      }
      // Default paragraph
      return <p key={index} className="text-slate-700 leading-relaxed mb-2">{line}</p>;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">BT Varlık Güvenlik Raporu</h2>
              <p className="text-xs text-slate-500 font-medium">AI Generated Assessment • {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
           <div className="prose prose-slate max-w-none">
              {/* Report Badge */}
              <div className="flex items-center gap-2 mb-8 bg-orange-50 border border-orange-100 p-3 rounded-lg w-fit">
                 <AlertTriangle className="w-4 h-4 text-orange-600" />
                 <span className="text-xs font-semibold text-orange-800 uppercase tracking-wide">Confidential Internal Report</span>
              </div>

              {/* Render Parsed Content */}
              <div className="space-y-1">
                {renderContent(content)}
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-slate-500">
             <ShieldCheck className="w-4 h-4 text-emerald-500" />
             <span>Verified by AssetGuard AI Engine</span>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
             >
                Close
             </button>
             <button 
                onClick={() => window.print()}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-lg shadow-slate-900/20 flex items-center gap-2 transition-colors"
             >
                <Download className="w-4 h-4" />
                Print / Save PDF
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
