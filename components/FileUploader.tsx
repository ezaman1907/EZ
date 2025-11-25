import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, X, CheckCircle, ArrowUpCircle, Database, Shield, Smartphone, Laptop } from 'lucide-react';

interface FileUploaderProps {
  label: string;
  description: string;
  required?: boolean;
  onFileSelect: (file: File | null) => void;
  acceptedFileTypes?: string;
  icon?: React.ElementType; // Optional icon prop
  colorTheme?: 'blue' | 'indigo' | 'emerald' | 'rose' | 'slate';
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  label, 
  description, 
  required = false, 
  onFileSelect,
  acceptedFileTypes = ".csv, .xlsx, .xls",
  icon: Icon = FileSpreadsheet,
  colorTheme = 'blue'
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Dynamic Color Classes based on theme
  const getThemeColors = () => {
    switch (colorTheme) {
      case 'indigo': return { border: 'border-indigo-400', bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100' };
      case 'emerald': return { border: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' };
      case 'rose': return { border: 'border-rose-400', bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100' };
      default: return { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100' };
    }
  };
  const theme = getThemeColors();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setSelectedFile(file);
    onFileSelect(file);
  };

  const removeFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
  };

  return (
    <div className="h-full">
      {/* Selected State */}
      {selectedFile ? (
        <div className={`relative h-full flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 shadow-sm ${theme.bg} border-${colorTheme}-200 group overflow-hidden`}>
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-30 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-lg bg-white shadow-sm ${theme.text}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <button 
                        onClick={removeFile}
                        className="text-slate-400 hover:text-red-500 transition-colors bg-white/50 hover:bg-white rounded-full p-1"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                
                <h4 className={`font-bold text-sm ${theme.text} truncate pr-4`}>{label}</h4>
                <p className="text-xs text-slate-500 mt-1 font-mono truncate">{selectedFile.name}</p>
            </div>

            <div className="relative z-10 mt-4 flex items-center gap-2">
                <CheckCircle className={`w-4 h-4 ${theme.text}`} />
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Veri Hazır</span>
            </div>
        </div>
      ) : (
        /* Empty State */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative h-full group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 text-center
            ${isDragging 
              ? `${theme.border} ${theme.bg} shadow-inner` 
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
            }
          `}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            accept={acceptedFileTypes}
            onChange={handleFileInput}
          />
          
          {/* Icon Container with Pulse Effect */}
          <div className={`relative mb-4 transition-transform duration-300 group-hover:scale-110`}>
             <div className={`absolute inset-0 ${theme.bg} rounded-full opacity-20 animate-pulse`}></div>
             <div className={`relative p-4 rounded-full bg-slate-50 border border-slate-100 group-hover:shadow-md`}>
                 <Icon className={`w-6 h-6 ${isDragging ? theme.text : 'text-slate-400 group-hover:text-slate-600'}`} />
             </div>
             {required && (
                 <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm" title="Required"></div>
             )}
          </div>

          <h4 className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
             {label}
          </h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[12rem]">
            {description}
          </p>
          
          {/* Tech Decoration Corners */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-slate-200 rounded-tl-lg m-2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-200 rounded-tr-lg m-2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-200 rounded-bl-lg m-2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-200 rounded-br-lg m-2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      )}
    </div>
  );
};