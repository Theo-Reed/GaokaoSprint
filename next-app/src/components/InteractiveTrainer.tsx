"use client";

// Interactive Trainer Component
import React, { useState } from "react";
import { SentenceAnalyzer } from "@/components/SentenceAnalyzer";
import { GrammarQuiz } from "@/components/GrammarQuiz";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import AuthOverlay from "@/components/AuthOverlay";

// Simple icon wrapper to avoid external deps for now
const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg 
    className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ExpandableSection = ({ title, subtitle, children, defaultOpen = false, colorClass = "blue" }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const colors = {
    blue: "bg-blue-600",
    purple: "bg-purple-600",
  };

  const selectedColor = colors[colorClass as keyof typeof colors] || colors.blue;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-5 text-left transition-colors ${isOpen ? 'bg-slate-50' : 'bg-white'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-1.5 h-12 rounded-full ${selectedColor}`}></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="text-slate-400">
          <ChevronIcon isOpen={isOpen} />
        </div>
      </button>
      
      <div 
        className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out ${isOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
           {children}
        </div>
      </div>
    </div>
  );
};

export const InteractiveTrainer = ({ lang = 'en' }: { lang?: string }) => {
  const isCn = lang === 'cn';
  const { session, loading } = useGrammarProgress(isCn);
  const [showAuth, setShowAuth] = useState(false);

  // 如果未登录且加载完毕，强制显示登录 (Strict Mode per user request)
  // 但是 InteractiveTrainer 之前可能是公开的？
  // 用户说 "把语法特训工具也储存到数据库"，暗示需要登录。
  // 我们可以像 Vocab 那样做一个 Overlay。
  const isBlocking = !session && !loading;

  const text = {
    mainTitle: isCn ? '高考英语 • 核心能力特训系统' : 'GaoKao English Mastery System',
    subTitle: isCn ? '深度拆解长难句 / 全考点极速通关' : 'Deep structure analysis & comprehensive exam point training.',
    footer: isCn ? 'V4.2 • 2026新课标考纲适配' : 'System v4.2 • Optimized for 2026 Curriculum',
    
    // Modules
    quizTitle: isCn ? '核心考点全能特训' : 'Core Competency Drill',
    quizDesc: isCn ? '9大必考语法点 • 极速快问快答 • 智能错误重练' : 'Rapid-fire testing across all grammar categories and logic traps.',
    
    analyzeTitle: isCn ? '长难句深度拆解' : 'Deep Syntax Decoder',
    analyzeDesc: isCn ? '主谓宾可视化精析 • 逻辑漏洞排查 • 难点可视化' : 'Master the core sentence components with guided visualization.',
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 relative">
      
      {/* Auth Blocking Overlay */}
      {isBlocking && (
         <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
            <div className="text-center p-8 bg-white shadow-2xl rounded-2xl border border-blue-100 max-w-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {isCn ? '需要登录' : 'Login Required'}
                </h3>
                <p className="text-gray-500 mb-6 text-sm">
                    {isCn 
                        ? '为了同步您的做题进度和错题本，请先登录数据库。' 
                        : 'Please login to sync your progress and error log.'}
                </p>
                <div className="relative h-64">
                    {/* Reuse AuthOverlay logic but we need it to be mounted. 
                        Actually AuthOverlay is fixed screen. 
                        Let's just render AuthOverlay if blocking.
                    */}
                </div>
            </div>
         </div>
      )}

      {isBlocking && <AuthOverlay onLoginSuccess={() => {}} />}


      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
          {text.mainTitle}
        </h2>
        <p className="text-slate-500 text-lg">
          {text.subTitle}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Module 1: Full Exam Point Coverage (NOW FIRST) */}
        <ExpandableSection 
            title={text.quizTitle} 
            subtitle={text.quizDesc}
            defaultOpen={true}
            colorClass="purple"
        >
          <GrammarQuiz lang={lang} />
        </ExpandableSection>

        {/* Module 2: SVO Analysis (NOW SECOND) */}
        <ExpandableSection 
            title={text.analyzeTitle} 
            subtitle={text.analyzeDesc}
            defaultOpen={false}
            colorClass="blue"
        >
          <SentenceAnalyzer lang={lang} />
        </ExpandableSection>

      </div>

      <div className="text-center text-xs text-slate-300 mt-12 pb-8">
        {text.footer}
      </div>
    </div>
  );
};
