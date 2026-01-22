"use client";

import React, { useState, useEffect, useRef } from "react";
import { EXAM_POOL, QuizQuestion, ANALYSIS_LEVELS } from "../data/training-data";
import { sample, sampleSize } from "lodash";

export const GrammarQuiz = ({ lang = 'en' }: { lang?: string }) => {
  const isCn = lang === 'cn';
  
  const text = {
    title: isCn ? '极速快问' : 'Speed Quiz',
    question: isCn ? '问题' : 'Q',
    combo: isCn ? '连对' : 'Combo',
    next: isCn ? '下一题' : 'Next Question',
    check: isCn ? '提交答案' : 'Check Answer',
    solved: isCn ? '下一题' : 'Next Question',
    trySimilar: isCn ? '试试同类题' : 'Try Similar Question',
    correct: isCn ? '🎉 正确! ' : '🎉 CORRECT! ',
    incorrect: isCn ? '❌ 错误。请看解析：' : '❌ Incorrect. See explanation:',
    loading: isCn ? '正在加载题库...' : 'Loading Exam Matrix...',
    complete: isCn ? '🚀 练习完成！加载新一轮...' : '🚀 Session Complete! Loading new set...',
    placeholder: isCn ? '输入答案...' : 'Type answer...',
    reset: isCn ? '重置进度' : 'Reset Progress',
    resetConfirm: isCn ? '确定要清除所有做题记录吗？' : 'Are you sure you want to clear all history?'
  };

  const [quizPool, setQuizPool] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [examInput, setExamInput] = useState("");
  const [examFeedback, setExamFeedback] = useState("");
  const [isExamCorrect, setIsExamCorrect] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const getCategoryName = (id: string) => {
    const names: Record<string, {en: string, cn: string}> = {
      'tense_voice': { en: 'Tense & Voice', cn: '时态与语态' },
      'modals': { en: 'Modals', cn: '情态动词' },
      'nonfinite_basic': { en: 'Non-Finite (Basic)', cn: '非谓语(基础)' },
      'nonfinite_adv': { en: 'Non-Finite (Advanced)', cn: '非谓语(进阶)' },
      'attributive': { en: 'Attributive Clauses', cn: '定语从句' },
      'noun_clauses': { en: 'Noun Clauses', cn: '名词性从句' },
      'adverbial': { en: 'Adverbial Clauses', cn: '状语从句' },
      'inversion': { en: 'Inversion', cn: '倒装句' },
      'emphasis_it': { en: 'Emphasis & It', cn: '强调句与It用法' },
      'subjunctive': { en: 'Subjunctive Mood', cn: '虚拟语气' },
      'adj_adv': { en: 'Adj / Adv / Art', cn: '形容词/副词/冠词' },
      'agreement': { en: 'Subject-Verb Agreement', cn: '主谓一致' },
      'phrasal_collo': { en: 'Phrases & Collocations', cn: '固定搭配' },
      'ultimate_context': { en: 'Context Challenge', cn: '终极语境挑战' },
    };
    const entry = names[id];
    if (!entry) return id.replace(/_/g, ' ').toUpperCase();
    return isCn ? entry.cn : entry.en.toUpperCase();
  };

  // Auto-focus logic: Focus input for typing, Focus button for "Next" action
  useEffect(() => {
    if (examFeedback || isExamCorrect) {
       submitRef.current?.focus();
    } else {
       // Small timeout to ensure disabled attribute is removed before focusing
       setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [examFeedback, isExamCorrect, currentQuizIndex]);

  const currentQuiz = quizPool[currentQuizIndex];

  // Initialize Exam Session
  useEffect(() => {
    startNewExamSession();
  }, []);

  const getCompletedQuestions = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('gaokao_completed_questions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const markQuestionAsCompleted = (id: string) => {
    const completed = getCompletedQuestions();
    if (!completed.includes(id)) {
      const updated = [...completed, id];
      const jsonStr = JSON.stringify(updated);
      localStorage.setItem('gaokao_completed_questions', jsonStr);
      // Debug log when saving
      console.log(`[GrammarQuiz] Progress saved. Total completed: ${updated.length}`);
    }
  };

  const clearHistory = () => {
    if (confirm(text.resetConfirm)) {
      localStorage.removeItem('gaokao_completed_questions');
      console.log('[GrammarQuiz] History cleared.');
      startNewExamSession();
    }
  };

  // Expose clearHistory to window for console access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).resetGrammarQuiz = clearHistory;
      console.log('[GrammarQuiz] Debug tool available: window.resetGrammarQuiz()');
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).resetGrammarQuiz;
      }
    };
  }, []);

  const startNewExamSession = () => {
    const completedIds = getCompletedQuestions();
    console.log(`[GrammarQuiz] Starting new session. Found ${completedIds.length} completed questions.`);
    
    // Generate a 12-question exam, one from each Analysis Level
    const sessionQuestions = ANALYSIS_LEVELS.map(level => {
      // Find all questions matching this level's category
      const candidates = EXAM_POOL.filter(q => q.categoryId === level.categoryId);
      
      // Filter out completed questions first
      const unseenCandidates = candidates.filter(q => !completedIds.includes(q.id));
      console.log(`[GrammarQuiz] Level ${level.categoryId}: Total ${candidates.length}, Unseen ${unseenCandidates.length}`);
      
      // Priority: Unseen -> Any
      const poolToSample = unseenCandidates.length > 0 ? unseenCandidates : candidates;
      
      // Pick one random question from the pool
      return sample(poolToSample) || candidates[0];
    }).filter(Boolean) as QuizQuestion[];

    setQuizPool(sessionQuestions);
    setCurrentQuizIndex(0);
    setExamInput("");
    setExamFeedback("");
    setIsExamCorrect(false);
    setSessionScore(0);
  };

  const handleExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuiz) return;

    const userAnswer = examInput.trim().toLowerCase();
    const isCorrect = Array.isArray(currentQuiz.expected)
        ? currentQuiz.expected.some(exp => exp.toLowerCase() === userAnswer)
        : currentQuiz.expected.toLowerCase() === userAnswer;

    if (isCorrect) {
      setIsExamCorrect(true);
      setExamFeedback(text.correct + (isCn ? currentQuiz.explanationCN : currentQuiz.explanationEN));
      setSessionScore(prev => prev + 1);
      markQuestionAsCompleted(currentQuiz.id);
    } else {
      setIsExamCorrect(false);
      // Show explanation even if wrong
      setExamFeedback(`${text.incorrect} ${isCn ? currentQuiz.explanationCN : currentQuiz.explanationEN}`);
    }
  };

  const handleRetry = () => {
     const completedIds = getCompletedQuestions();
     
     // Find other questions of the SAME category to maintain the 12-level structure
     const sameCategoryCandidates = EXAM_POOL.filter(q => 
        q.categoryId === currentQuiz.categoryId && 
        q.id !== currentQuiz.id
     );
     
     // Filter unseen
     const unseenCandidates = sameCategoryCandidates.filter(q => !completedIds.includes(q.id));
     const poolToSample = unseenCandidates.length > 0 ? unseenCandidates : sameCategoryCandidates;
     
     if (poolToSample.length > 0) {
         const newQuestion = sample(poolToSample)!;
         setQuizPool(prev => {
             const newPool = [...prev];
             newPool[currentQuizIndex] = newQuestion;
             return newPool;
         });
         setExamInput("");
         setExamFeedback("");
     } else {
         // Fallback if no other questions exist in category
         setExamInput("");
         setExamFeedback("");
         alert("No other questions available for this category yet.");
     }
  };

  const nextQuiz = () => {
      if (currentQuizIndex < quizPool.length - 1) {
          setCurrentQuizIndex(prev => prev + 1);
          setExamInput("");
          setExamFeedback("");
          setIsExamCorrect(false);
      } else {
          setExamFeedback(text.complete);
          setTimeout(startNewExamSession, 1500);
      }
  };

  if (!currentQuiz) return <div className="p-8 text-center text-slate-400">{text.loading}</div>;

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-slate-100 flex flex-col h-full">
      {/* Header */}
      <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span>⚔️</span> {text.title}
          </h3>
          <p className="text-purple-200 text-xs mt-1">
            {text.question} {currentQuizIndex + 1} / {quizPool.length}
          </p>
        </div>
        <div>
           {/* Header "Next" button removed */}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-6">
            <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider rounded mb-3">
                {getCategoryName(currentQuiz.categoryId)}
            </span>
            <p className="text-lg font-serif text-slate-800 leading-relaxed">
                {currentQuiz.question}
            </p>
        </div>

        <form onSubmit={(e) => {
            // If already correct, next question
            if (isExamCorrect) {
                e.preventDefault();
                nextQuiz();
                return;
            }
            // If incorrect and showing feedback, retry
            if (!isExamCorrect && examFeedback) {
                e.preventDefault();
                handleRetry();
                return;
            }
            // Default: submit answer
            handleExamSubmit(e);
        }} className="mt-auto">
            <div className="flex gap-2 mb-3">
                <input 
                    ref={inputRef}
                    type="text" 
                    value={examInput}
                    onChange={(e) => setExamInput(e.target.value)}
                    placeholder={text.placeholder}
                    className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all"
                    disabled={isExamCorrect || (!!examFeedback && !isExamCorrect)}
                />
            </div>
            
            <button 
                ref={submitRef}
                type="submit"
                // Disable if input empty (unless we are in a "next" or "retry" state)
                disabled={!examInput && !examFeedback}
                className={`w-full py-2.5 rounded-lg font-bold text-white shadow-sm transition-all ${
                    isExamCorrect 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : (examFeedback ? 'bg-orange-500 hover:bg-orange-600' : 'bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed')
                }`}
            >
                {isExamCorrect 
                    ? text.solved // "Next Question"
                    : (examFeedback ? text.trySimilar : text.check) // "Try Similar" or "Check"
                }
            </button>
        </form>

        <div className="min-h-[40px] mt-4 flex items-center justify-center text-center">
            {examFeedback && (
            <div className={`text-sm px-3 py-1 rounded-md ${isExamCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {examFeedback}
            </div>
            )}
        </div>
      </div>
    </div>
  );
};
