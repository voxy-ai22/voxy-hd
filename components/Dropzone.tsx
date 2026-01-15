
import React, { useState, useRef, useCallback } from 'react';
import { Upload, Shield } from 'lucide-react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 group cursor-pointer
        flex flex-col items-center justify-center text-center
        ${isDragging 
          ? 'border-blue-500 bg-blue-500/10 scale-[0.99]' 
          : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30'
        }
      `}
      onClick={triggerFileInput}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
      />
      
      <div className={`
        w-20 h-20 mb-6 rounded-2xl flex items-center justify-center transition-all duration-300
        ${isDragging ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 rotate-3' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'}
      `}>
        <Shield size={32} strokeWidth={1.5} />
      </div>
      
      <h3 className="text-xl font-semibold mb-2 text-slate-200">
        {isDragging ? 'Lepaskan Gambar!' : 'Pilih atau Seret Gambar Ke Sini'}
      </h3>
      <p className="text-slate-400 max-w-xs mx-auto">
        Format: JPG, PNG, WEBP. Maksimal 5MB. <br/>
        <span className="text-blue-400 font-semibold mt-2 block">Kuota: 4 Gambar / 24 Jam</span>
      </p>

      {/* Hover background effect */}
      <div className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-blue-500/5"></div>
    </div>
  );
};
