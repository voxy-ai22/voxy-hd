'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { AlertCircle, Loader2, Sparkles, Link as LinkIcon, Zap } from 'lucide-react';
import { Dropzone } from './components/Dropzone';
import { ResultView } from './components/ResultView';
import { VoxyLinkEnhancer } from './components/VoxyLinkEnhancer';
import { uploadImage, getRemainingLimit } from './services/api';
import { UploadState } from './types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'ai' | 'link'>('ai');
  const [remaining, setRemaining] = useState(4);
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    originalImage: null,
    hdUrl: null,
    errorMessage: null,
  });

  useEffect(() => {
    setRemaining(getRemainingLimit());
  }, [state.status]);

  const handleFileSelect = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setState(prev => ({ ...prev, originalImage: e.target?.result as string }));
    reader.readAsDataURL(file);

    setState(prev => ({ ...prev, status: 'uploading', errorMessage: null }));

    try {
      const response = await uploadImage(file);
      if (response.status && response.hd_url) {
        setState(prev => ({ ...prev, status: 'success', hdUrl: response.hd_url }));
      } else {
        throw new Error(response.message || 'Gagal memproses gambar');
      }
    } catch (error: any) {
      setState(prev => ({ ...prev, status: 'error', errorMessage: error.message }));
    }
  }, []);

  const reset = () => {
    setState({ status: 'idle', originalImage: null, hdUrl: null, errorMessage: null });
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-12">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full animate-pulse bg-blue-600/10"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full bg-purple-600/10"></div>
      </div>

      <header className="mb-12 text-center max-w-2xl w-full animate-fade-scale">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border bg-blue-500/10 border-blue-500/20 text-blue-400 text-xs font-bold tracking-[0.2em] uppercase">
          <Zap size={14} className="fill-current" />
          <span>Voxy Engine v4.0 Next.js</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter text-white">
          VOXY <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">AI HD</span>
        </h1>

        <div className="relative flex justify-center mb-12 group">
          <div className="relative bg-slate-900/80 p-1.5 rounded-[1.8rem] border border-white/5 flex gap-1 shadow-2xl backdrop-blur-xl">
            <button 
              onClick={() => setActiveTab('ai')}
              className={`relative px-8 py-3.5 rounded-[1.5rem] text-sm font-black transition-all duration-300 flex items-center gap-3 z-10 ${activeTab === 'ai' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {activeTab === 'ai' && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-[1.5rem] -z-10 shadow-lg shadow-blue-600/20 animate-in fade-in zoom-in-95"></div>
              )}
              <Sparkles size={18} />
              AI HD
            </button>
            <button 
              onClick={() => setActiveTab('link')}
              className={`relative px-8 py-3.5 rounded-[1.5rem] text-sm font-black transition-all duration-300 flex items-center gap-3 z-10 ${activeTab === 'link' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {activeTab === 'link' && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-500 rounded-[1.5rem] -z-10 shadow-lg shadow-purple-600/20 animate-in fade-in zoom-in-95"></div>
              )}
              <LinkIcon size={18} />
              HD LINK
            </button>
          </div>
        </div>

        {activeTab === 'ai' && (
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="bg-slate-800/40 px-5 py-2 rounded-2xl border border-white/5 flex items-center gap-3 backdrop-blur-sm">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
               <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sisa Kuota: <span className="text-white">{remaining} / 4</span></span>
            </div>
          </div>
        )}
      </header>

      <main className="w-full max-w-4xl relative">
        <div className="backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden bg-slate-900/60 ring-1 ring-white/5">
          {activeTab === 'ai' ? (
            <div className="animate-fade-scale">
              {state.status === 'idle' || state.status === 'error' ? (
                <div className="p-8 md:p-16">
                  <div className="mb-10 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Voxy AI Upscaler</h2>
                    <p className="text-slate-400 text-sm italic">Memakai AI Gemini Flash 2.5 (Free Tier)</p>
                  </div>
                  <Dropzone onFileSelect={handleFileSelect} />
                  {state.status === 'error' && (
                    <div className="mt-8 flex items-start gap-4 p-6 rounded-3xl border bg-red-500/5 border-red-500/20 text-red-400 animate-in slide-in-from-top-4">
                      <AlertCircle className="shrink-0" size={24} />
                      <div>
                        <p className="font-bold mb-1">Upscaling Failed</p>
                        <p className="text-sm opacity-80">{state.errorMessage}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : state.status === 'uploading' ? (
                <div className="p-20 flex flex-col items-center justify-center min-h-[400px] text-center">
                  <Loader2 className="animate-spin text-blue-500 mb-8" size={80} strokeWidth={1} />
                  <h2 className="text-3xl font-black mb-4 text-white">RECONSTRUCTING...</h2>
                  <p className="text-slate-400">Sedang memproses gambar di server AI.</p>
                </div>
              ) : (
                <ResultView originalUrl={state.originalImage || ''} hdUrl={state.hdUrl || ''} onReset={reset} />
              )}
            </div>
          ) : (
            <div className="min-h-[500px]">
              <VoxyLinkEnhancer />
            </div>
          )}
        </div>
      </main>

      <footer className="mt-20 text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
        &copy; 2024 VOXY LABS &bull; NEXT.JS EDITION
      </footer>
    </div>
  );
}