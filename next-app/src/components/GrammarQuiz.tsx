"use client";

import React, { useState, useEffect } from "react";
import { EXAM_POOL, QuizQuestion } from "@/data/training-data";
import { sampleSize } from "lodash";

export const GrammarQuiz = ({ lang = 'en' }: { lang?: string }) => {
  const isCn = lang === 'cn';
  
  const text = {
    title: isCn ? '极速快问' : 'Speed Quiz',
    question: isCn ? '问题' : 'Q',
    combo: isCn ? '连对' : 'Combo',
    next: isCn ? '下一题' : 'Next',
    check: isCn ? '提交答案' : 'Check Answer',
    solved: isCn ? '已解决!' : 'Solved!',
    correct: isCn ? '🎉 正确! ' : '🎉 CORRECT! ',
    incorrect: isCn ? '❌ 错误。正在切换题目...' : '❌ Incorrect. Try another.',
    loading: isCn ? '正在加载题库...' : 'Loading Exam Matrix...',
    complete: isCn ? '🚀 练习完成！加载新一轮...' : '🚀 Session Complete! Loading new set...',
    placeholder: isCn ? '输入答案...' : 'Type answer...'
  };

  const [quizPool, setQuizPool] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [examInput, setExamInput] = useState("");
  const [examFeedback, setExamFeedback] = useState("");
  const [isExamCorrect, setIsExamCorrect] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);

  const currentQuiz = quizPool[currentQuizIndex];

  // Initialize Exam Session
  useEffect(() => {
    startNewExamSession();
  }, []);

  const startNewExamSession = () => {
    // Pick 4 random unique questions from the pool
    const sessionQuestions = sampleSize(EXAM_POOL, 4);
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

    const userAnswer = examInput.trim();
    if (userAnswer.toLowerCase() === currentQuiz.expected.toLowerCase()) {
      setIsExamCorrect(true);
      setExamFeedback(text.correct + currentQuiz.explanation);
      setSessionScore(prev => prev + 1);
    } else {
      setIsExamCorrect(false);
      setExamFeedback(text.incorrect);
      
      // Auto-swap incorrect question for variety
      setTimeout(() => {
         const remainingPool = EXAM_POOL.filter(q => q.id !== currentQuiz.id && !quizPool.find(p => p.id === q.id));
         if (remainingPool.length > 0) {
             const newQuestion = sampleSize(remainingPool, 1)[0];
             setQuizPool(prev => {
                 const newPool = [...prev];
                 newPool[currentQuizIndex] = newQuestion;
                 return newPool;
             });
             setExamInput("");
             setExamFeedback("");
         }
      }, 1500);
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
            {text.question} {currentQuizIndex + 1} / {quizPool.length} • {text.combo}: {sessionScore}
          </p>
        </div>
        <div>
           {isExamCorrect && (
              <button 
                  onClick={nextQuiz}
                  className="px-3 py-1 bg-white text-purple-700 rounded-lg hover:bg-purple-50 text-xs font-bold animate-pulse shadow-sm"
              >
                  {text.next} →
              </button>
           )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-6">
            <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wider rounded mb-3">
                {currentQuiz.categoryId.replace(/_/g, ' ')}
            </span>
            <p className="text-lg font-serif text-slate-800 leading-relaxed">
                {currentQuiz.question}
            </p>
        </div>

        <form onSubmit={handleExamSubmit} className="mt-auto">
            <div className="flex gap-2 mb-3">
                <input 
                    type="text" 
                    value={examInput}
                    onChange={(e) => setExamInput(e.target.value)}
                    placeholder={text.placeholder}
                    className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all"
                    disabled={isExamCorrect}
                />
            </div>
            
            <button 
                type="submit"
                disabled={!examInput}
                className={`w-full py-2.5 rounded-lg font-bold text-white shadow-sm transition-all ${
                    isExamCorrect 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
            >
                {isExamCorrect ? text.solved : text.check}
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
