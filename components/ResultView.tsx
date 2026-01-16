'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, RefreshCw, CheckCircle2, Share2, Sparkles, Image as ImageIcon, Eye } from 'lucide-react';

interface ResultViewProps {
  originalUrl: string;
  hdUrl: string;
  onReset: () => void;
}

type ViewMode = 'original' | 'compare' | 'hd';

export const ResultView: React.FC<ResultViewProps> = ({ originalUrl, hdUrl, onReset }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [showScan, setShowScan] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('compare');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowScan(false), 3000);
    
    let frame = 0;
    let animationId: number;

    const animateSlider = () => {
        frame += 0.05;
        const targetPos = 50 + Math.sin(frame) * 10;
        setSliderPos(targetPos);
        if (frame < 3) {
            animationId = requestAnimationFrame(animateSlider);
        } else {
            setSliderPos(50);
        }
    };
    
    const sliderTimer = setTimeout(() => {
        animationId = requestAnimationFrame(animateSlider);
    }, 500);
    
    return () => {
        clearTimeout(timer);
        clearTimeout(sliderTimer);
        if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (viewMode !== 'compare' || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
    if (showScan) setShowScan(false); 
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = hdUrl;
    link.download = `voxy-hd-enhanced-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-scale">
      <div className="p-6 md:p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-none flex items-center gap-2">
              Voxy AI HD Enhanced
            </h2>
            <p className="text-slate-400 text-sm mt-1">AI has finished upscaling your image.</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2 text-sm font-medium border border-slate-700/50"
        >
          <RefreshCw size={18} />
          <span className="hidden sm:inline">Try Another</span>
        </button>
      </div>

      <div className="p-6 md:p-8">
        {/* VIEW SELECTOR */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-800/50 p-1 rounded-2xl border border-white/5 flex gap-1">
            <button 
              onClick={() => setViewMode('original')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'original' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <ImageIcon size={14} />
              Before
            </button>
            <button 
              onClick={() => setViewMode('compare')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'compare' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Eye size={14} />
              Compare
            </button>
            <button 
              onClick={() => setViewMode('hd')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'hd' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Sparkles size={14} />
              After
            </button>
          </div>
        </div>

        {/* Comparison Area */}
        <div className="relative mb-8 select-none group">
            <div 
                ref={containerRef}
                className={`relative aspect-video md:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-800 ring-1 ring-white/10 shadow-2xl ${viewMode === 'compare' ? 'cursor-ew-resize' : ''} group/slider`}
                onMouseMove={handleMove}
                onTouchMove={handleMove}
            >
                {/* HD Image (Background) */}
                <img 
                    src={hdUrl} 
                    alt="Enhanced HD" 
                    className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${viewMode === 'original' ? 'opacity-0' : 'opacity-100'}`} 
                />
                
                {/* Original Image (Foreground with Clip or Hidden) */}
                <div 
                    className="absolute inset-0 w-full h-full overflow-hidden transition-[clip-path,opacity] duration-300 ease-out"
                    style={{ 
                      clipPath: viewMode === 'compare' ? `inset(0 ${100 - sliderPos}% 0 0)` : 'none',
                      opacity: viewMode === 'hd' ? 0 : 1
                    }}
                >
                    <img 
                        src={originalUrl} 
                        alt="Original" 
                        className="absolute inset-0 w-full h-full object-contain bg-slate-800"
                    />
                    
                    {/* Label Before */}
                    {viewMode !== 'hd' && (
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white/80 border border-white/10 uppercase tracking-wider animate-in fade-in duration-1000">
                          Before
                      </div>
                    )}
                </div>

                {/* Label After */}
                {viewMode !== 'original' && (
                  <div className="absolute top-4 right-4 bg-blue-600/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white border border-blue-400/40 uppercase tracking-wider animate-in fade-in duration-1000">
                      After (Voxy HD)
                  </div>
                )}

                {/* SCANNING LINE EFFECT */}
                {showScan && (
                   <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-400 shadow-[0_0_20px_#3b82f6] animate-scan"></div>
                      <div className="absolute inset-0 shimmer-bg opacity-30"></div>
                   </div>
                )}

                {/* Slider Handle (Only in compare mode) */}
                {viewMode === 'compare' && (
                  <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(255,255,255,0.6)] z-10 transition-[left] duration-75 ease-out"
                      style={{ left: `${sliderPos}%` }}
                  >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center text-slate-900 border-4 border-slate-900 group-hover/slider:scale-110 transition-transform">
                          <div className="flex gap-1">
                              <div className="w-0.5 h-4 bg-slate-900 rounded-full"></div>
                              <div className="w-0.5 h-4 bg-slate-900 rounded-full"></div>
                          </div>
                      </div>
                  </div>
                )}
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleDownload}
            className="flex-[2] py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/30 group"
          >
            <Download size={22} className="group-hover:translate-y-0.5 transition-transform" />
            Download HD Master
          </button>
          
          <button
             className="flex-1 px-6 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-slate-700"
             onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'Voxy AI Enhanced Image', url: hdUrl }).catch(() => {
                      navigator.clipboard.writeText(hdUrl);
                      alert('Link copied to clipboard!');
                  });
                } else {
                  navigator.clipboard.writeText(hdUrl);
                  alert('Link copied to clipboard!');
                }
             }}
          >
            <Share2 size={20} />
            Share
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
            <CheckCircle2 size={14} className="text-green-500" />
            <span>Image upscaled using Voxy AI Engine</span>
        </div>
      </div>
    </div>
  );
};