'use client';

import React, { useState } from 'react';
import { BIOLOGY_SC1_DATA, BiologyPoint } from '@/data/biology/sc1-data';

export default function BiologyExplorer() {
  const [selectedPoint, setSelectedPoint] = useState<BiologyPoint>(BIOLOGY_SC1_DATA[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [readingMode, setReadingMode] = useState<'normal' | 'sepia' | 'dark'>('normal');
  const [isLoading, setIsLoading] = useState(false);

  // Next.js basePath prefix for assets
  const assetPath = (path: string) => `/GaokaoSprint${path}`;

  const filters = {
    normal: '',
    sepia: 'sepia(0.3) contrast(0.9) brightness(1.06)',
    dark: 'invert(0.9) hue-rotate(180deg) brightness(0.9)'
  };

  const handlePointSelect = (point: BiologyPoint) => {
    if (point.id === selectedPoint.id) return;
    setIsLoading(true);
    setSelectedPoint(point);
    // Short artificial delay to let the iframe start its internal loading
    setTimeout(() => setIsLoading(false), 400);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 bg-white border-r border-slate-200 flex flex-col h-full shadow-lg z-10`}
      >
        <div className="p-6 border-b border-slate-100 bg-indigo-600">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🧬 生物背书引擎
          </h2>
          <p className="text-indigo-100 text-xs mt-1">选择性必修 1 - MVP 版本</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Group points by chapter */}
          {Array.from(new Set(BIOLOGY_SC1_DATA.map(p => p.chapter))).map(chapter => (
            <div key={chapter} className="space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                {chapter}
              </h3>
              <div className="space-y-1">
                {BIOLOGY_SC1_DATA.filter(p => p.chapter === chapter).map(point => (
                  <button
                    key={point.id}
                    onClick={() => handlePointSelect(point)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedPoint.id === point.id 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="font-bold text-sm tracking-tight">{point.title}</div>
                    <div className={`text-xs mt-1 line-clamp-1 ${selectedPoint.id === point.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                      {point.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute left-4 top-4 z-20 bg-white p-2 rounded-full shadow-md border border-slate-200 hover:bg-slate-50 overflow-hidden"
        >
          {isSidebarOpen ? '⇠' : '⇢'}
        </button>

        {/* PDF Header Info */}
        <div className="bg-white border-b border-slate-200 px-16 py-3 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
             <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors text-slate-600"
              title="切换侧边栏"
            >
              {isSidebarOpen ? '📖' : '📚'}
            </button>
            <div>
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                {selectedPoint.chapter}
              </span>
              <h1 className="text-base font-black text-slate-800 leading-tight">{selectedPoint.title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['normal', 'sepia', 'dark'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setReadingMode(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    readingMode === m 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {m === 'normal' ? '标准' : m === 'sepia' ? '护眼' : '黑夜'}
                </button>
              ))}
            </div>
            
             <div className="text-right">
               <div className="text-sm font-black text-slate-700">
                 Page {selectedPoint.page}
               </div>
               <p className="text-[10px] text-slate-400 font-medium italic">High-Res Textbook Mode</p>
             </div>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden flex flex-col relative bg-slate-200">
          {isLoading && (
            <div className="absolute inset-0 z-40 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">Optimizing View...</p>
              </div>
            </div>
          )}
          
          <div 
            className="w-full h-full"
            style={{ 
              filter: readingMode === 'normal' ? 'none' : filters[readingMode],
              transition: 'filter 0.3s ease'
            }}
          >
            <iframe
              key={selectedPoint.id}
              src={`${assetPath(selectedPoint.pdfPath)}#page=${selectedPoint.page}&view=FitH`}
              className="w-full h-full border-none shadow-2xl bg-white"
              title="Biology Textbook Viewer"
            />
          </div>
          
          {/* Study Mask Overlay */}
          <div className="absolute inset-0 pointer-events-none border-[1px] border-black/5"></div>
        </div>
      </div>
    </div>
  );
}
