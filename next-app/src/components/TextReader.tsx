"use client";

import React, { useState } from 'react';
import { getVocabEntry, VocabEntry } from '@/lib/vocabulary';
import { X, BookOpen, GraduationCap, Target, CheckCircle, RotateCcw } from 'lucide-react';

interface TextReaderProps {
  content: string;
  title?: string;
}

export const TextReader: React.FC<TextReaderProps> = ({ content, title }) => {
  const [selectedWord, setSelectedWord] = useState<VocabEntry | null>(null);
  const [knownWords, setKnownWords] = useState<Set<string>>(new Set());
  const [definitionMode, setDefinitionMode] = useState<'bilingual' | 'english'>('bilingual');

  // Split content into words but preserve punctuation
  const tokens = content.split(/(\b[\w']+\b)/g);

  const handleWordClick = (word: string) => {
    // If it's already known, maybe allow clicking to review/un-know? 
    // For now, if it's known, we treat it as text (or allow re-opening to unmark).
    // Let's allow re-opening even if known, but visually it will be unhighlighted.
    const entry = getVocabEntry(word);
    if (entry) {
      setSelectedWord(entry);
    }
  };

  const markAsKnown = (word: string) => {
    const normalize = word.toLowerCase();
    setKnownWords(prev => {
      const next = new Set(prev);
      next.add(normalize);
      return next;
    });
    setSelectedWord(null); // Close after marking
  };

  const markAsUnknown = (word: string) => {
    const normalize = word.toLowerCase();
    setKnownWords(prev => {
      const next = new Set(prev);
      if (next.has(normalize)) {
        next.delete(normalize);
      }
      return next;
    });
  };

  return (
    <div className="flex gap-6 h-full p-4 items-start relative box-border">
      {/* Main Text Area */}
      <div className="flex-1 bg-white p-8 rounded-xl shadow-sm border border-slate-200 overflow-y-auto max-h-[85vh] leading-loose text-lg text-slate-700">
        {title && <h2 className="text-3xl font-bold mb-6 text-slate-800">{title}</h2>}
        
        <p className="whitespace-pre-wrap">
          {tokens.map((token, index) => {
            const entry = getVocabEntry(token);
            
            // It's a vocab word if we have an entry
            if (entry) {
              const isKnown = knownWords.has(entry.word.toLowerCase());
              const isSelected = selectedWord?.word === entry.word;

              // If known, render as normal text (or subtle interaction)
              if (isKnown) {
                return (
                  <span
                    key={index}
                    onClick={() => handleWordClick(token)}
                    className={`
                       cursor-pointer transition-colors duration-200
                       ${isSelected ? 'bg-emerald-100 text-emerald-900' : 'text-slate-400 hover:text-slate-600'}
                    `}
                    title="Marked as Known (Click to review)"
                  >
                    {token}
                  </span>
                );
              }

              // Unknown word (Highlighed)
              return (
                <span
                  key={index}
                  onClick={() => handleWordClick(token)}
                  className={`
                    cursor-pointer px-1 py-0.5 rounded-md transition-all duration-200 font-medium
                    ${isSelected 
                      ? 'bg-blue-600 text-white shadow-md transform scale-105 inline-block mx-0.5' 
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-b-2 border-blue-200 hover:border-blue-400'}
                  `}
                >
                  {token}
                </span>
              );
            }
            // Non-vocab token (punctuation, spaces, unknown words)
            return <span key={index} className="text-slate-600">{token}</span>;
          })}
        </p>
      </div>

      {/* Floating Sidebar */}
      {selectedWord && (
        <div className="w-[400px] shrink-0 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden sticky top-4 flex flex-col max-h-[85vh] animate-in slide-in-from-right-4 duration-200">
          {/* Header */}
          <div className="bg-slate-50 p-5 border-b border-slate-200">
            {/* Top Toolbar */}
            <div className="flex justify-between items-center mb-4">
               <button
                  onClick={() => setDefinitionMode(prev => prev === 'bilingual' ? 'english' : 'bilingual')}
                  className="text-xs font-bold px-2 py-1 rounded bg-white border border-slate-200 text-slate-600 hover:border-slate-300 transition-colors shadow-sm flex items-center gap-2"
                  title="Switch Language Mode"
               >
                  <span className={definitionMode === 'english' ? 'text-slate-400' : 'text-blue-600'}>中 / En</span>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${definitionMode === 'english' ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${definitionMode === 'english' ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <span className={definitionMode === 'english' ? 'text-indigo-600' : 'text-slate-400'}>En</span>
               </button>

              <button 
                onClick={() => setSelectedWord(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full p-1 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex justify-between items-start mb-3">
              <h3 className="text-3xl font-bold text-slate-800 capitalize">{selectedWord.word}</h3>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedWord.pos.map(p => (
                <span key={p} className="text-xs font-bold px-2.5 py-1 bg-slate-200 text-slate-600 rounded-full uppercase tracking-wide">
                  {p}
                </span>
              ))}
              <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                 ★ {selectedWord.stats.stars}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                {knownWords.has(selectedWord.word.toLowerCase()) ? (
                     <button
                     onClick={() => markAsUnknown(selectedWord.word)}
                     className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                   >
                     <RotateCcw size={18} /> Review Again
                   </button>
                ) : (
                    <button
                    onClick={() => markAsKnown(selectedWord.word)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                  >
                    <CheckCircle size={18} /> Mark as Known
                  </button>
                )}
            </div>
          </div>

          {/* Content Scrollable */}
          <div className="overflow-y-auto p-5 space-y-8 flex-1">
            
            {/* Meanings */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <BookOpen size={14} /> Meaning
              </h4>
              <div className="space-y-3">
                {selectedWord.pos.map((pos, idx) => (
                  <div key={idx} className="group">
                     {/* Primary Definition Line */}
                    <div className="flex items-start gap-1 mb-1">
                        <span className={`font-bold text-slate-800 ${definitionMode === 'english' ? 'text-base' : 'text-lg'}`}>
                              <span className="text-slate-500 font-bold mr-1 italic">{pos}.</span>
                              {definitionMode === 'bilingual' ? selectedWord.meanings.cn[idx] : selectedWord.meanings.en[idx]}
                        </span>
                    </div>
                    {/* Secondary Definition Line (only if bilingual) */}
                    {definitionMode === 'bilingual' && (
                        <div className="flex items-baseline gap-2 pl-6">
                            <span className="text-sm text-slate-500 leading-relaxed">{selectedWord.meanings.en[idx]}</span>
                        </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Teach Examples (Gymnastics) */}
            {selectedWord.examples.teach && selectedWord.examples.teach.length > 0 && (
                <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                    <GraduationCap size={14} /> Master It
                </h4>
                <div className="space-y-3">
                    {selectedWord.examples.teach.map((ex, i) => (
                    <div key={i} className="text-slate-700 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-[15px] leading-relaxed relative">
                        {/* Decorative quote mark */}
                        <span className="absolute top-2 left-2 text-emerald-200 text-4xl font-serif opacity-50">“</span>
                        <span className="relative z-10 pl-2 block" dangerouslySetInnerHTML={{
                            // Simple heuristic highlight to bold the target word forms
                            __html: ex.replace(new RegExp(`(${selectedWord.word}\\w*)`, 'gi'), '<b class="text-emerald-800">$1</b>')
                        }} />
                    </div>
                    ))}
                </div>
                </div>
            )}

            {/* Exam Examples */}
            {selectedWord.examples.exams && selectedWord.examples.exams.length > 0 && (
                <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    <Target size={14} /> Real Exam Context
                </h4>
                <div className="space-y-3">
                    {selectedWord.examples.exams.slice(0, 3).map((ex, i) => (
                    <div key={i} className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-white bg-indigo-500 px-1.5 py-0.5 rounded">{ex.year}</span>
                        </div>
                        <div className="leading-relaxed">
                            {ex.text}
                        </div>
                    </div>
                    ))}
                </div>
                </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
