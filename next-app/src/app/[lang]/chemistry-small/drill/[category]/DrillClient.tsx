
"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ChevronRight, Clock, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react';
import questionsData from '@/data/chemistry/small_questions.json';
import Link from 'next/link';

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

export default function DrillClient({ lang, category }: DrillClientProps) {
    const [questions, setQuestions] = useState<SmallQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [fillInAnswer, setFillInAnswer] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(true);
    const [showExplanation, setShowExplanation] = useState(false);

    useEffect(() => {
        const filtered = (questionsData as unknown as SmallQuestion[]).filter(q => q.category === category);
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
        setCurrentIndex(0);
        resetQuestionState();
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

    const resetQuestionState = () => {
        setSelectedOptions([]);
        setFillInAnswer("");
        setIsSubmitted(false);
        setShowExplanation(false);
        setTimer(0);
        setIsTimerRunning(true);
    };

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
                <h2 className="text-xl font-bold mb-4 text-slate-400">该专题暂无题目 ({CATEGORY_NAMES[category]})</h2>
                <Link href={`/${lang}/chemistry-small`} className="text-indigo-600 hover:underline">返回专题选择</Link>
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

    const sanitizeMath = (text: string) => {
        if (!text || typeof text !== 'string') return text;
        let clean = text.replace(/\r/g, '').replace(/(?<!\n)\n(?!\n)/g, ' ');
        clean = clean.replace(/\$\$/g, '$');
        const knownCommands = ['sin', 'cos', 'tan', 'ln', 'log', 'alpha', 'beta', 'gamma', 'delta', 'pi', 'frac', 'sqrt', 'infty', 'cdot', 'times', 'le', 'ge', 'neq', 'vec', 'bar', 'triangle', 'rightarrow', 'leftharpoons', 'uparrow', 'downarrow', 'mol', 'aq', 's', 'l', 'g', 'Delta', 'pH', 'c', 'K', 'Q', 'E'];
        const commandPattern = new RegExp(`\\\\\\\\(${knownCommands.join('|')})\\b`, 'g');
        clean = clean.replace(commandPattern, '\\$1');
        clean = clean.replace(/\\\\\{/g, '\\{').replace(/\\\\\}/g, '\\}').replace(/\\\\\|/g, '\\|');
        if (clean.includes('\\') && !clean.includes('$')) {
            if (/^[0-9a-z\s+\-*/=_,.()\\{}[\]^]+$/i.test(clean) && clean.length < 100) {
                 clean = `$${clean}$`;
            }
        }
        return clean;
    };

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 min-h-screen flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
                <div>
                    <Link href={`/${lang}/chemistry-small`} className="text-sm text-slate-500 hover:text-indigo-600 mb-2 flex items-center gap-1 font-medium group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />返回
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">{CATEGORY_NAMES[category]} <span className="text-indigo-600">小题特训</span></h1>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xl font-bold ${timer > 180 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                    <Clock size={20} />{formatTime(timer)}
                </div>
            </div>

            <div className="bg-white shadow-lg rounded-2xl pt-[29px] px-8 pb-8 mb-6 border border-slate-100 flex-grow relative overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                    {currentQ.source && <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100">{currentQ.source}</span>}
                    <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200">第 {currentQ.question_number} 题 / 第 {currentQ.type_rank} 道{currentQ.type === 'single_choice' ? '单选题' : currentQ.type === 'multi_choice' ? '多选题' : '填空题'}</span>
                    {isSubmitted && (
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border ${isCorrect() ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {isCorrect() ? <CheckCircle2 size={14} className="mr-1" /> : <XCircle size={14} className="mr-1" />}{isCorrect() ? '回答正确' : '回答错误'}
                        </span>
                    )}
                </div>

                <div className="prose prose-slate prose-lg max-w-none mb-8">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} components={{ p: ({children}) => <div className="mb-4 text-slate-800 leading-relaxed font-serif">{children}</div> }}>
                        {sanitizeMath(currentQ.content).replace(/\\n/g, '\n').replace(/\$?(\\quad|\s*\\quad\s*)\$?/g, ' _ ')}
                    </ReactMarkdown>
                </div>

                <div className="my-6 flex flex-col items-center justify-center p-0 transition-all">
                    <img 
                        src={`/chemistry-images/${currentQ.id}.png`} 
                        alt="题目插图" 
                        className="max-h-80 object-contain mix-blend-multiply"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
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
                                    buttonClass += "bg-indigo-50 border-indigo-600 text-indigo-900 ring-1 ring-indigo-600/20 ";
                                    badgeClass += "bg-indigo-600 text-white border-indigo-600 shadow-sm";
                                } else if (isSelected) {
                                    buttonClass += "bg-slate-50 border-slate-300 text-slate-400 ";
                                    badgeClass += "bg-slate-400 text-white border-slate-400";
                                } else {
                                    buttonClass += "bg-white border-slate-100 text-slate-300 ";
                                    badgeClass += "bg-white text-slate-200 border-slate-100";
                                }
                            } else {
                                if (isSelected) {
                                    buttonClass += "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md ";
                                    badgeClass += "bg-indigo-600 text-white border-indigo-600 shadow-sm";
                                } else {
                                    buttonClass += "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50 ";
                                    badgeClass += "bg-white text-slate-500 border-slate-200";
                                }
                            }
                            return (
                                <button key={opt.label} onClick={() => handleOptionSelect(opt.label)} disabled={isSubmitted} className={buttonClass}>
                                    <span className={badgeClass}>{opt.label}</span>
                                    <div className="flex-grow pt-0.5">
                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{sanitizeMath(opt.text).replace(/\$?(\\quad|\s*\\quad\s*)\$?/g, ' ____ ')}</ReactMarkdown>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {currentQ.type === 'fill_in' && (
                    <div className="mt-6">
                        {!isSubmitted ? (
                            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                <p className="text-slate-500 mb-4">填空题请在草稿纸上完成计算</p>
                                <button onClick={handleSubmit} className="px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">核对答案 <CheckCircle2 size={18} className="text-indigo-500" /></button>
                            </div>
                        ) : (
                            <div className="mt-4 animate-in zoom-in-95 duration-300">
                                <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col items-center">
                                    <span className="text-sm font-bold text-indigo-400 mb-2 uppercase tracking-wider">正确答案</span>
                                    <div className="text-2xl font-serif text-indigo-900 bg-white px-8 py-4 rounded-xl shadow-sm border border-indigo-50">
                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{sanitizeMath(String(currentQ.answer))}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isSubmitted && showExplanation && currentQ.explanation && (
                    <div className="mt-8 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>答题思路</h3>
                        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 text-slate-700 leading-relaxed shadow-sm">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{sanitizeMath(currentQ.explanation).replace(/\\n/g, '\n')}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="text-sm text-slate-400">专题进度：{currentIndex + 1} / {questions.length}</div>
                <div className="flex gap-4 w-full md:w-auto">
                    {!isSubmitted ? (
                        <button onClick={handleSubmit} disabled={(currentQ.type !== 'fill_in' && selectedOptions.length === 0)} className={`flex-grow md:flex-grow-0 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${(currentQ.type !== 'fill_in' && selectedOptions.length === 0) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'}`}>检查答案</button>
                    ) : (
                        <div className="flex gap-4 w-full md:w-auto">
                            {currentQ.explanation && (
                                <button onClick={() => setShowExplanation(!showExplanation)} className={`px-6 py-4 rounded-xl font-bold transition-all border ${showExplanation ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{showExplanation ? '隐藏解析' : '查看解析'}</button>
                            )}
                            <button onClick={handleNext} className="flex-grow md:flex-grow-0 px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm">下一题 <ChevronRight size={20} /></button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
