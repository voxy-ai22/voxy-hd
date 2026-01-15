import React, { useState, useCallback } from 'react';
import { Sparkles, Link as LinkIcon, Loader2, AlertCircle, ChevronDown, CheckCircle2, Clipboard, Image as ImageIcon } from 'lucide-react';
import { Dropzone } from './Dropzone';
import { ResultView } from './ResultView';
import { uploadToRemote, enhanceLink } from '../services/api';
import { LinkEnhancerState, VoxyModel } from '../types';

export const VoxyLinkEnhancer: React.FC = () => {
  const [state, setState] = useState<LinkEnhancerState>({
    status: 'idle',
    remoteUrl: null,
    hdUrl: null,
    selectedModel: 'hd1',
    errorMessage: null,
  });

  const handleFileSelect = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, status: 'uploading', errorMessage: null, remoteUrl: null, hdUrl: null }));
    try {
      const url = await uploadToRemote(file);
      setState(prev => ({ ...prev, status: 'idle', remoteUrl: url }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        errorMessage: error.message || 'Server tidak memberikan link hasil upload. Coba lagi.'
      }));
    }
  }, []);

  const handleEnhance = async () => {
    if (!state.remoteUrl) return;
    setState(prev => ({ ...prev, status: 'enhancing', errorMessage: null }));
    try {
      const resultUrl = await enhanceLink(state.remoteUrl, state.selectedModel);
      setState(prev => ({ ...prev, status: 'success', hdUrl: resultUrl }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        errorMessage: error.message || 'Proses enhancement gagal. Silakan coba model lain.' 
      }));
    }
  };

  const reset = () => {
    setState({ status: 'idle', remoteUrl: null, hdUrl: null, selectedModel: 'hd1', errorMessage: null });
  };

  const pasteLink = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith('http')) {
        setState(prev => ({ ...prev, remoteUrl: text, errorMessage: null }));
      }
    } catch (err) {
      console.warn("Gagal mengakses clipboard:", err);
    }
  };

  if (state.status === 'success' && state.hdUrl && state.remoteUrl) {
    return <ResultView originalUrl={state.remoteUrl} hdUrl={state.hdUrl} onReset={reset} />;
  }

  return (
    <div className="p-8 md:p-12 animate-fade-scale">
      <div className="mb-10 text-center md:text-left">
        <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
          <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
            <LinkIcon size={24} />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Voxy HD Link</h2>
        </div>
        <p className="text-slate-400 text-lg">Alur: Upload Gambar &rarr; Dapatkan Link &rarr; Pilih Model &rarr; HD Slider.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* STEP 1: UPLOAD / LINK SOURCE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white">1</span>
              Sumber Gambar (Original)
            </h3>
            {state.remoteUrl && (
              <button 
                onClick={() => setState(prev => ({ ...prev, remoteUrl: null, errorMessage: null }))} 
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-semibold"
              >
                Ganti Gambar
              </button>
            )}
          </div>
          
          {!state.remoteUrl && state.status !== 'uploading' ? (
            <div className="space-y-6">
              <Dropzone onFileSelect={handleFileSelect} />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800"></span></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest"><span className="bg-slate-900 px-4 text-slate-500">Atau Gunakan Link</span></div>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="Masukkan URL gambar (https://...)" 
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all placeholder:text-slate-600 text-sm"
                      onChange={(e) => setState(prev => ({ ...prev, remoteUrl: e.target.value, errorMessage: null }))}
                    />
                </div>
                <button 
                  onClick={pasteLink}
                  className="px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all active:scale-95 flex items-center gap-2 font-bold text-xs uppercase"
                  title="Tempel dari Clipboard"
                >
                  <Clipboard size={18} />
                  Paste
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-slate-800/30 rounded-3xl border border-purple-500/20 flex flex-col gap-6 animate-in fade-in slide-in-from-top-2 duration-300 shadow-inner">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <ImageIcon size={18} className="text-purple-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Preview & Link Source</span>
                </div>
                {state.remoteUrl && <CheckCircle2 size={18} className="text-green-500" />}
              </div>
              
              <div className="relative group">
                <input 
                  type="text" 
                  value={state.remoteUrl || ''} 
                  placeholder={state.status === 'uploading' ? 'Sedang mengunggah...' : 'Link akan muncul otomatis'}
                  readOnly
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-blue-400 text-[10px] font-mono outline-none focus:ring-1 focus:ring-purple-500/30 transition-all cursor-default shadow-inner"
                />
              </div>

              {state.remoteUrl && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/5 relative group shadow-2xl">
                   <img 
                    src={state.remoteUrl} 
                    alt="Source Preview" 
                    className="w-full h-full object-contain" 
                    onError={() => setState(prev => ({ ...prev, errorMessage: "URL gambar tidak valid atau tidak dapat diakses secara publik." }))} 
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* STEP 2: CONFIG & ACTION */}
        {state.remoteUrl && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-white">2</span>
                Konfigurasi Enhancement
              </h3>
              
              <div className="p-5 bg-slate-800/20 rounded-3xl border border-white/5 relative group backdrop-blur-md">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-3 ml-1 tracking-widest">Pilih Mesin HD</label>
                <div className="relative">
                    <select 
                      value={state.selectedModel}
                      onChange={(e) => setState(prev => ({ ...prev, selectedModel: e.target.value as VoxyModel }))}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-2xl px-5 py-4 text-white appearance-none cursor-pointer focus:ring-2 focus:ring-purple-500/50 outline-none pr-12 transition-all font-bold text-sm shadow-xl"
                    >
                      <option value="hd1">Voxy HDV1 (Super HD Engine)</option>
                      <option value="hd2">Voxy HDV2 (Portrait Focus)</option>
                      <option value="hd3">Voxy HDV3 (Artistic Enhance)</option>
                      <option value="hd4">Voxy HDV4 (Clean Sharpener)</option>
                      <option value="hd5">Voxy HDV5 (Remini Pro AI)</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover:text-slate-300 transition-colors" size={20} />
                </div>
                <p className="mt-4 text-[11px] text-slate-500 italic ml-1">
                    * Setiap model memiliki algoritma unik untuk memproses detail piksel.
                </p>
              </div>
            </div>

            <button
              onClick={handleEnhance}
              disabled={state.status === 'enhancing' || !state.remoteUrl}
              className="group relative w-full py-6 rounded-3xl bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-black text-2xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] shadow-[0_20px_50px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:grayscale overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {state.status === 'enhancing' ? (
                <>
                  <Loader2 className="animate-spin" size={28} />
                  MEMPROSES...
                </>
              ) : (
                <>
                  <Sparkles size={28} className="group-hover:rotate-12 transition-transform" />
                  ENHANCE SEKARANG
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* UPLOADING STATE */}
      {state.status === 'uploading' && (
        <div className="mt-12 flex flex-col items-center gap-6 py-16 bg-slate-800/10 rounded-[3rem] border border-dashed border-slate-800 shadow-inner animate-in fade-in zoom-in-95">
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-purple-500/20 rounded-full animate-pulse"></div>
            <Loader2 className="animate-spin text-purple-500 relative z-10" size={64} strokeWidth={1.5} />
          </div>
          <div className="text-center">
             <p className="text-white font-black text-xl tracking-tight mb-2">MENGUNGGAH KE VOXY...</p>
             <p className="text-slate-500 text-sm font-medium">Mohon tunggu, kami sedang menyiapkan link gambar Anda.</p>
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {state.status === 'error' && (
        <div className="mt-12 p-8 rounded-3xl border bg-red-500/5 border-red-500/20 text-red-400 flex flex-col md:flex-row items-center md:items-start gap-6 animate-in slide-in-from-top-4 backdrop-blur-sm">
          <div className="p-3 bg-red-500/10 rounded-2xl">
            <AlertCircle className="shrink-0" size={32} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="font-black text-xl mb-1 tracking-tight">Terjadi Kesalahan</p>
            <p className="text-sm opacity-80 mb-6 leading-relaxed max-w-xl">{state.errorMessage}</p>
            <button 
              onClick={reset} 
              className="px-8 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 border border-red-500/20"
            >
              Ulangi Proses
            </button>
          </div>
        </div>
      )}
    </div>
  );
};