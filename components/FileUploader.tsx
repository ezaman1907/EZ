import React, { useCallback, useState } from 'react';
import { UploadCloud, FileSpreadsheet, X, Check } from 'lucide-react';

interface FileUploaderProps {
  label: string;
  description: string;
  required?: boolean;
  onFileSelect: (file: File | null) => void;
  acceptedFileTypes?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  label, 
  description, 
  required = false, 
  onFileSelect,
  acceptedFileTypes = ".csv, .xlsx, .xls"
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {selectedFile && (
          <span className="text-xs text-emerald-600 flex items-center font-medium bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
            <Check className="w-3 h-3 mr-1" /> Ready
          </span>
        )}
      </div>
      
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-6 transition-all text-center cursor-pointer group
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50 bg-white'}
          `}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept={acceptedFileTypes}
            onChange={handleFileInput}
          />
          <div className="flex flex-col items-center pointer-events-none">
            <div className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? 'bg-blue-100' : 'bg-slate-100 group-hover:bg-blue-50'}`}>
              <UploadCloud className={`w-6 h-6 ${isDragging ? 'text-blue-600' : 'text-slate-500 group-hover:text-blue-500'}`} />
            </div>
            <p className="text-sm font-medium text-slate-700">
              Click or drag file here
            </p>
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
          <div className="flex items-center overflow-hidden">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-slate-900 truncate">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button 
            onClick={removeFile}
            className="p-1 hover:bg-red-100 rounded-full text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};