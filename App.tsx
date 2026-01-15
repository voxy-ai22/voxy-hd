
import React, { useState, useCallback, useEffect } from 'react';
import { AlertCircle, Loader2, ShieldCheck, Sparkles, Link as LinkIcon, Zap } from 'lucide-react';
import { Dropzone } from './components/Dropzone';
import { ResultView } from './components/ResultView';
import { VoxyLinkEnhancer } from './components/VoxyLinkEnhancer';
import { uploadImage, getRemainingLimit } from './services/api';
import { UploadState } from './types';

type ActiveTab = 'ai' | 'link';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ai');
  const [remaining, setRemaining] = useState(getRemainingLimit());
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
    <div className="min-h-screen flex flex-col items-center p-4 md:p-12 bg-[#0b0f1a]">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full animate-pulse bg-blue-600/5"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full bg-purple-600/5"></div>
      </div>

      <header className="mb-12 text-center max-w-2xl w-full animate-fade-scale">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border bg-blue-500/10 border-blue-500/20 text-blue-400 text-xs font-bold tracking-[0.2em] uppercase">
          <Zap size={14} className="fill-current" />
          <span>Multi-Model Engine v3.5</span>
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter text-white">
          VOXY <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">AI HD</span>
        </h1>

        {/* Sliding Tab Menu */}
        <div className="relative flex justify-center mb-12 group">
          <div className="absolute inset-0 blur-2xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors rounded-[2rem]"></div>
          <div className="relative bg-slate-900/80 p-1.5 rounded-[1.8rem] border border-white/5 flex gap-1 shadow-2xl backdrop-blur-xl">
            <button 
              onClick={() => setActiveTab('ai')}
              className={`relative px-10 py-4 rounded-[1.5rem] text-sm font-black transition-all duration-300 flex items-center gap-3 z-10 ${activeTab === 'ai' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {activeTab === 'ai' && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-[1.5rem] shadow-lg shadow-blue-600/20 -z-10 animate-in fade-in zoom-in-95 duration-300"></div>
              )}
              <Sparkles size={18} />
              VOXY AI HD
            </button>
            <button 
              onClick={() => setActiveTab('link')}
              className={`relative px-10 py-4 rounded-[1.5rem] text-sm font-black transition-all duration-300 flex items-center gap-3 z-10 ${activeTab === 'link' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {activeTab === 'link' && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-500 rounded-[1.5rem] shadow-lg shadow-purple-600/20 -z-10 animate-in fade-in zoom-in-95 duration-300"></div>
              )}
              <LinkIcon size={18} />
              VOXY HD LINK
            </button>
          </div>
        </div>

        {activeTab === 'ai' && (
          <div className="flex flex-col items-center gap-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-slate-800/40 px-5 py-2.5 rounded-2xl border border-white/5 flex items-center gap-3 backdrop-blur-sm shadow-inner">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]"></div>
               <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sisa Kuota: <span className="text-white">{remaining} / 4</span></span>
            </div>
          </div>
        )}
      </header>

      <main className="w-full max-w-4xl relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-[100px] opacity-20 -z-10"></div>
        <div className="backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_40px_160px_-40px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-700 bg-slate-900/60 ring-1 ring-white/5">
          {activeTab === 'ai' ? (
            <div key="tab-ai" className="animate-fade-scale">
              {state.status === 'idle' || state.status === 'error' ? (
                <div className="p-12 md:p-20">
                  <div className="mb-10 text-center">
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Voxy AI Upscaler</h2>
                    <p className="text-slate-400">Penyempurnaan gambar otomatis bertenaga Gemini 2.5 Flash.</p>
                  </div>
                  <Dropzone onFileSelect={handleFileSelect} />
                  {state.status === 'error' && (
                    <div className="mt-8 flex items-start gap-4 p-6 rounded-3xl border bg-red-500/5 border-red-500/20 text-red-400 animate-in slide-in-from-top-4">
                      <AlertCircle className="shrink-0" size={24} />
                      <div>
                        <p className="font-bold text-lg mb-1 tracking-tight">Upscaling Failed</p>
                        <p className="text-sm opacity-80 leading-relaxed">{state.errorMessage}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : state.status === 'uploading' ? (
                <div className="p-20 flex flex-col items-center justify-center min-h-[500px] text-center">
                  <div className="relative mb-16">
                    <div className="absolute inset-[-60px] blur-[100px] rounded-full animate-pulse bg-blue-500/30"></div>
                    <div className="relative">
                      <Loader2 className="animate-spin text-blue-500" size={100} strokeWidth={1} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles size={32} className="text-blue-400 animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <h2 className="text-4xl font-black mb-4 text-white tracking-tight">RECONSTRUCTING...</h2>
                  <p className="text-slate-400 max-w-xs mx-auto text-lg">Membangun kembali setiap piksel untuk kejernihan maksimal.</p>
                </div>
              ) : (
                <ResultView originalUrl={state.originalImage || ''} hdUrl={state.hdUrl || ''} onReset={reset} />
              )}
            </div>
          ) : (
            <div key="tab-link" className="min-h-[600px]">
              <VoxyLinkEnhancer />
            </div>
          )}
        </div>
      </main>

      <footer className="mt-20 text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em] flex flex-col items-center gap-6">
        <div className="flex items-center gap-8 py-4 px-8 bg-slate-900/40 rounded-full border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-3">
                <span className="opacity-40">PRIMARY:</span>
                <span className="text-blue-400">GEMINI CLOUD</span>
            </div>
            <div className="w-px h-4 bg-slate-800"></div>
            <div className="flex items-center gap-3">
                <span className="opacity-40">SECONDARY:</span>
                <span className="text-purple-400">REMINI & FAA</span>
            </div>
        </div>
        <p className="opacity-40">&copy; 2024 VOXY LABS &bull; DESIGNED BY GOBEL</p>
      </footer>
    </div>
  );
};

export default App;
