
"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ChevronRight, Clock, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react';
import questionsData from '@/data/chemistry/small_questions.json';
import Link from 'next/link';
import { sanitizeMath, markdownComponents } from '@/components/DrillMarkdownHelpers';

interface Option {
  label: string;
  text: string;
}

interface SmallQuestion {
  id: string;
  question_number: string;
  type: 'single_choice' | 'multi_choice' | 'fill_in';
  type_rank: number;
  category: string;
  content: string;
  options: Option[] | null;
  answer: string | string[];
  explanation?: string;
  score_rule?: string;
  source?: string;
  has_figure?: boolean;
}

interface DrillClientProps {
  lang: string;
  category: string;
}

const CATEGORY_NAMES: Record<string, string> = {
  'concepts': '基本概念',
  'inorganic': '元素化合物',
  'organic': '有机化学',
  'physical_chem': '反应原理',
  'experiment': '化学实验',
};

// Removed local sanitizeMath and markdownComponents


export default function DrillClient({ lang, category }: DrillClientProps) {
    const [questions, setQuestions] = useState<SmallQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [fillInAnswer, setFillInAnswer] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(true);
    const [showExplanation, setShowExplanation] = useState(false);

    const resetQuestionState = () => {
        setSelectedOptions([]);
        setFillInAnswer("");
        setIsSubmitted(false);
        setShowExplanation(false);
        setTimer(0);
        setIsTimerRunning(true);
    };

    useEffect(() => {
        const timerId = setTimeout(() => {
            if (!questionsData || !Array.isArray(questionsData)) {
                setQuestions([]);
                return;
            }
            const filtered = (questionsData as unknown as SmallQuestion[]).filter(q => q.category === category);
            const shuffled = [...filtered].sort(() => Math.random() - 0.5);
            setQuestions(shuffled);
            setCurrentIndex(0);
            resetQuestionState();
        }, 0);
        return () => clearTimeout(timerId);
    }, [category]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleOptionSelect = (label: string) => {
        if (isSubmitted) return;
        const currentQ = questions[currentIndex];
        if (currentQ.type === 'single_choice') {
            setSelectedOptions([label]);
        } else if (currentQ.type === 'multi_choice') {
            setSelectedOptions(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label].sort());
        }
    };

    const handleSubmit = () => {
        setIsSubmitted(true);
        setIsTimerRunning(false);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            resetQuestionState();
        } else {
            const shuffled = [...questions].sort(() => Math.random() - 0.5);
            setQuestions(shuffled);
            setCurrentIndex(0);
            resetQuestionState();
        }
    };

    const currentQ = questions[currentIndex];

    if (!currentQ) {
        return (
            <div className="p-10 flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-xl font-bold mb-4 text-slate-400 dark:text-slate-400">该专题暂无题目 ({CATEGORY_NAMES[category]})</h2>
                <Link href={`/${lang}/chemistry-small`} className="text-indigo-600 dark:text-slate-300 hover:underline">返回专题选择</Link>
            </div>
        );
    }

    const isCorrect = () => {
        if (currentQ.type === 'fill_in') {
            return fillInAnswer.trim() === String(currentQ.answer).trim();
        }
        const userAns = [...selectedOptions].sort().join("");
        const correctAns = Array.isArray(currentQ.answer) ? [...currentQ.answer].sort().join("") : currentQ.answer;
        return userAns === correctAns;
    };

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 min-h-screen flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-700 pb-4">
                <div>
                    <Link href={`/${lang}/chemistry-small`} className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 -ml-1 mb-3 flex items-center gap-1 font-medium group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />返回
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{CATEGORY_NAMES[category]} <span className="text-indigo-600 dark:text-slate-300">小题特训</span></h1>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xl font-bold ${timer > 180 ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                    <Clock size={20} />{formatTime(timer)}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 shadow-lg rounded-2xl pt-[29px] px-8 pb-8 mb-6 border border-slate-100 dark:border-slate-800 flex-grow relative overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                    {currentQ.source && <span className="inline-flex items-center px-3 py-1 bg-slate-50 dark:bg-slate-800/50 text-indigo-700 dark:text-slate-200 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700">{currentQ.source}</span>}
                    <span className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700">第 {currentQ.question_number} 题 / 第 {currentQ.type_rank} 道{currentQ.type === 'single_choice' ? '单选题' : currentQ.type === 'multi_choice' ? '多选题' : '填空题'}</span>
                    {isSubmitted && (
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border ${isCorrect() ? 'bg-indigo-600 dark:bg-slate-500 text-white border-indigo-600 dark:border-indigo-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                            {isCorrect() ? <CheckCircle2 size={14} className="mr-1" /> : <XCircle size={14} className="mr-1" />}{isCorrect() ? '回答正确' : '回答错误'}
                        </span>
                    )}
                </div>

                <div className="flex flex-col md:flex-row items-start gap-8">
                    <div className="prose prose-slate dark:prose-invert prose-lg max-w-none flex-grow">
                        <ReactMarkdown 
                            remarkPlugins={[remarkMath, remarkGfm]} 
                            rehypePlugins={[rehypeKatex]} 
                            components={markdownComponents}
                        >
                            {sanitizeMath(currentQ.content)
                                .replace(/^\s*\d+[\.．、\s]*/, '') // 移除开头的题号
                                .replace(/\\n/g, '\n')
                                .replace(/\$?(\\quad|\s*\\quad\s*)\$?/g, ' _ ')
                                .trim()}
                        </ReactMarkdown>
                    </div>

                    {/* Question Image Area */}
                    {currentQ.has_figure && (
                        <div className="flex-shrink-0 flex flex-col items-center justify-center bg-white dark:bg-transparent rounded-xl md:max-w-[300px]">
                            <img 
                                src={`/chemistry-images/${encodeURIComponent(`${currentQ.source}-${currentQ.question_number}.png`)}`} 
                                alt="题目插图" 
                                className="max-h-64 h-auto w-auto object-contain mix-blend-multiply dark:mix-blend-normal dark:invert"
                            />
                        </div>
                    )}
                </div>

                {currentQ.type !== 'fill_in' && currentQ.options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQ.options.map((opt) => {
                            const isSelected = selectedOptions.includes(opt.label);
                            const isCorrectOpt = Array.isArray(currentQ.answer) ? currentQ.answer.includes(opt.label) : currentQ.answer === opt.label;
                            let buttonClass = "flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 text-left ";
                            let badgeClass = "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold border ";
                            
                            if (isSubmitted) {
                                if (isCorrectOpt) {
                                    buttonClass += "bg-slate-50 dark:bg-slate-800/60 border-indigo-600 dark:border-indigo-500 text-indigo-900 dark:text-slate-100 ring-1 ring-indigo-600/20 ";
                                    badgeClass += "bg-indigo-600 dark:bg-slate-500 text-white border-indigo-600 dark:border-indigo-500 shadow-sm";
                                } else if (isSelected) {
                                    buttonClass += "bg-slate-50 dark:bg-red-900/20 border-slate-300 dark:border-red-900/50 text-slate-400 dark:text-red-300 ";
                                    badgeClass += "bg-slate-400 dark:bg-red-800 text-white border-slate-400 dark:border-red-800";
                                } else {
                                    buttonClass += "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 ";
                                    badgeClass += "bg-white dark:bg-slate-900 text-slate-200 dark:text-slate-700 border-slate-100 dark:border-slate-800";
                                }
                            } else {
                                if (isSelected) {
                                    buttonClass += "bg-slate-50 dark:bg-slate-800/50 border-indigo-500 text-indigo-700 dark:text-slate-200 shadow-md ";
                                    badgeClass += "bg-indigo-600 text-white border-indigo-600 shadow-sm";
                                } else {
                                    buttonClass += "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800 ";
                                    badgeClass += "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700";
                                }
                            }
                            return (
                                <button key={opt.label} onClick={() => handleOptionSelect(opt.label)} disabled={isSubmitted} className={buttonClass}>
                                    <span className={badgeClass}>{opt.label}</span>
                                    <div className="flex-grow pt-0.5">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkMath]} 
                                            rehypePlugins={[rehypeKatex]}
                                            components={markdownComponents}
                                        >
                                            {sanitizeMath(opt.text).replace(/\$?(\\quad|\s*\\quad\s*)\$?/g, ' ____ ')}
                                        </ReactMarkdown>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {currentQ.type === 'fill_in' && (
                    <div className="mt-6">
                        {!isSubmitted ? (
                            <div className="bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                <p className="text-slate-500 dark:text-slate-400 mb-4">填空题请在草稿纸上完成计算</p>
                                <button onClick={handleSubmit} className="px-8 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">核对答案 <CheckCircle2 size={18} className="text-indigo-500" /></button>
                            </div>
                        ) : (
                            <div className="mt-4 animate-in zoom-in-95 duration-300">
                                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
                                    <span className="text-sm font-bold text-indigo-400 dark:text-slate-200 mb-2 uppercase tracking-wider">正确答案</span>
                                    <div className="text-2xl font-serif text-indigo-900 dark:text-slate-100 bg-white dark:bg-slate-800 px-8 py-4 rounded-xl shadow-sm border border-indigo-50 dark:border-slate-700">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkMath]} 
                                            rehypePlugins={[rehypeKatex]}
                                            components={markdownComponents}
                                        >
                                            {sanitizeMath(String(currentQ.answer))}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isSubmitted && showExplanation && currentQ.explanation && (
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-500">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><span className="w-1.5 h-6 bg-slate-500 rounded-full"></span>答题思路</h3>
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border border-amber-100 dark:border-amber-900/50 text-slate-700 dark:text-slate-200 leading-relaxed shadow-sm">
                            <ReactMarkdown 
                                remarkPlugins={[remarkMath]} 
                                rehypePlugins={[rehypeKatex]}
                                components={markdownComponents}
                            >
                                {sanitizeMath(currentQ.explanation).replace(/\\n/g, '\n')}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="text-sm text-slate-400 dark:text-slate-400">专题进度：{currentIndex + 1} / {questions.length}</div>
                <div className="flex gap-4 w-full md:w-auto">
                    {!isSubmitted ? (
                        <button onClick={handleSubmit} disabled={(currentQ.type !== 'fill_in' && selectedOptions.length === 0)} className={`flex-grow md:flex-grow-0 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${(currentQ.type !== 'fill_in' && selectedOptions.length === 0) ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-none'}`}>检查答案</button>
                    ) : (
                        <div className="flex gap-4 w-full md:w-auto">
                            {currentQ.explanation && (
                                <button onClick={() => setShowExplanation(!showExplanation)} className={`px-6 py-4 rounded-xl font-bold transition-all border ${showExplanation ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-200' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{showExplanation ? '隐藏解析' : '查看解析'}</button>
                            )}
                            <button onClick={handleNext} className="flex-grow md:flex-grow-0 px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm">下一题 <ChevronRight size={20} /></button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
