import React, { useState } from 'react';
import { X, CheckCircle, UploadCloud, FileType, AlertCircle, FolderOpen, MousePointer2 } from 'lucide-react';

interface FileUploaderProps {
  label: string;
  description: string;
  required?: boolean;
  onFileSelect: (file: File | null) => void;
  acceptedFileTypes?: string;
  icon?: React.ElementType; // Optional icon prop
  colorTheme?: 'blue' | 'indigo' | 'emerald' | 'rose' | 'slate' | 'purple';
  variant?: 'card' | 'compact' | 'hero'; // 'hero' for main inventory
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  label, 
  description, 
  required = false, 
  onFileSelect,
  acceptedFileTypes = ".csv, .xlsx, .xls",
  icon: Icon = UploadCloud,
  colorTheme = 'blue',
  variant = 'card'
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Dynamic Color Classes based on theme
  const getThemeColors = () => {
    switch (colorTheme) {
      case 'rose': return { 
          border: 'border-rose-300 dark:border-rose-500/30', 
          activeBorder: 'border-rose-500 bg-rose-50 dark:bg-rose-900/10', 
          text: 'text-rose-600 dark:text-rose-400',
          iconBg: 'bg-rose-100 dark:bg-rose-900/30',
          hover: 'hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-900/10',
          svgStroke: 'stroke-rose-300 dark:stroke-rose-500/30',
          svgActiveStroke: 'stroke-rose-500',
          svgHoverStroke: 'group-hover:stroke-rose-400',
      };
      case 'emerald': return { 
          border: 'border-emerald-200 dark:border-emerald-500/30', 
          activeBorder: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10', 
          text: 'text-emerald-600 dark:text-emerald-400',
          iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
          hover: 'hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10',
          svgStroke: 'stroke-emerald-300 dark:stroke-emerald-500/30',
          svgActiveStroke: 'stroke-emerald-500',
          svgHoverStroke: 'group-hover:stroke-emerald-400',
      };
      default: return { 
          border: 'border-slate-300 dark:border-slate-700', 
          activeBorder: 'border-blue-500 bg-blue-50 dark:bg-blue-900/10', 
          text: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-slate-100 dark:bg-slate-800',
          hover: 'hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/80',
          svgStroke: 'stroke-slate-300 dark:stroke-slate-600',
          svgActiveStroke: 'stroke-blue-500',
          svgHoverStroke: 'group-hover:stroke-blue-400',
      };
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

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the file input
    setSelectedFile(null);
    onFileSelect(null);
  };

  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';

  // Base classes for the container
  // Removed border classes for Hero variant to use SVG instead
  const containerClasses = `
    relative w-full rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden group
    flex
    ${!isHero ? 'border-2 border-dashed' : ''}
    ${isCompact 
        ? 'flex-row items-center px-4 py-3 gap-4 min-h-[72px]' 
        : isHero
            ? 'flex-col items-center justify-center text-center p-10 gap-6 h-full min-h-[320px]'
            : 'flex-col items-center justify-center text-center p-6 gap-3 h-full min-h-[160px]'
    }
    ${selectedFile 
        ? `bg-white dark:bg-slate-800 border-solid ${colorTheme === 'rose' ? 'border-rose-200' : 'border-emerald-500/50'} shadow-sm` 
        : isDragging 
            ? `${!isHero ? theme.activeBorder : 'bg-slate-50 dark:bg-slate-800/50'} scale-[1.005]` 
            : `bg-slate-50/50 dark:bg-slate-800/30 ${!isHero ? `${theme.border} ${theme.hover}` : ''}`
    }
  `;

  return (
    <div className={`w-full ${!isCompact ? 'h-full' : ''}`}>
      <label 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={containerClasses}
      >
        <input
          type="file"
          className="hidden"
          accept={acceptedFileTypes}
          onChange={handleFileInput}
        />

        {/* --- HERO SVG BORDER --- */}
        {isHero && !selectedFile && (
           <div className="absolute inset-0 pointer-events-none w-full h-full">
              <svg className="w-full h-full overflow-visible">
                 <rect 
                    x="3" 
                    y="3" 
                    width="calc(100% - 6px)" 
                    height="calc(100% - 6px)" 
                    rx="14" 
                    ry="14" 
                    fill="none" 
                    strokeDasharray="10 8"
                    strokeWidth="3"
                    className={`transition-colors duration-300 ${isDragging ? theme.svgActiveStroke : `${theme.svgStroke} ${theme.svgHoverStroke}`}`}
                    strokeLinecap="round"
                 />
              </svg>
           </div>
        )}

        {/* --- STATE: FILE SELECTED --- */}
        {selectedFile ? (
          <>
             {/* Icon */}
             <div className={`
                flex-shrink-0 flex items-center justify-center rounded-full transition-transform duration-500 group-hover:scale-110
                ${isHero ? 'w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' : isCompact ? 'w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'w-12 h-12 mb-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}
             `}>
               <CheckCircle className={`${isHero ? 'w-10 h-10' : isCompact ? 'w-5 h-5' : 'w-6 h-6'}`} />
             </div>

             {/* Text Content */}
             <div className={`flex-1 min-w-0 ${!isCompact && 'text-center w-full'} ${isHero ? 'space-y-2' : ''}`}>
                 <p className={`${isHero ? 'text-xl' : 'text-sm'} font-bold text-slate-800 dark:text-white truncate`} title={selectedFile.name}>
                    {selectedFile.name}
                 </p>
                 <p className={`${isHero ? 'text-sm' : 'text-[11px]'} text-slate-500 dark:text-slate-400 font-medium`}>
                    {(selectedFile.size / 1024).toFixed(1)} KB • Hazır
                 </p>
             </div>

             {/* Remove Button */}
             <button 
                onClick={removeFile}
                className={`
                    rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors z-20 flex items-center justify-center
                    ${isHero ? 'absolute top-4 right-4 p-2 bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600' : 'p-1.5'}
                `}
                title="Dosyayı kaldır"
             >
                <X className={`${isHero ? 'w-5 h-5' : 'w-4 h-4'}`} />
             </button>
             
             {isHero && (
                <div className="absolute inset-0 border-4 border-emerald-500/10 pointer-events-none rounded-2xl animate-pulse"></div>
             )}
          </>
        ) : (
          /* --- STATE: EMPTY / WAITING --- */
          <>
             {/* Background Pattern for Hero */}
             {isHero && !isDragging && (
                 <div className="absolute inset-4 m-auto opacity-[0.03] dark:opacity-[0.05] pointer-events-none rounded-xl" 
                      style={{ backgroundImage: 'radial-gradient(#64748b 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }}>
                 </div>
             )}

             {/* Icon */}
             <div className={`
                transition-all duration-300 group-hover:scale-110 flex-shrink-0 flex items-center justify-center rounded-full
                ${isHero 
                    ? `w-24 h-24 mb-2 ${theme.iconBg} shadow-sm z-10` 
                    : `w-14 h-14 ${isCompact ? 'w-10 h-10' : 'mb-1'} ${isDragging ? 'bg-white shadow-sm' : 'bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600'}`
                }
             `}>
                <Icon className={`
                    ${isHero ? 'w-10 h-10' : 'w-5 h-5'} 
                    ${isDragging ? theme.text : (isHero ? theme.text : 'text-slate-400 dark:text-slate-500')}
                `} />
             </div>
             
             {/* Text */}
             <div className={`flex-1 min-w-0 ${!isCompact && 'text-center'} relative z-10`}>
                <h4 className={`${isHero ? 'text-lg md:text-xl' : 'text-sm'} font-bold text-slate-700 dark:text-slate-200`}>
                  {label}
                </h4>
                {(!isCompact || description) && (
                    <p className={`
                        ${isHero ? 'text-sm mt-2 max-w-xs mx-auto' : 'text-[11px] mt-1'} 
                        text-slate-400 dark:text-slate-500 leading-relaxed
                    `}>
                    {description}
                    </p>
                )}
                
                {isHero && (
                    <div className="mt-6">
                        <span className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${colorTheme === 'rose' ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 hover:shadow-rose-100 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                           <FolderOpen className="w-4 h-4" />
                           Dosya Seçiniz
                        </span>
                    </div>
                )}
             </div>
             
             {required && !isHero && (
               <div className="flex-shrink-0">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
                    Zorunlu
                  </span>
               </div>
             )}
          </>
        )}
      </label>
    </div>
  );
};