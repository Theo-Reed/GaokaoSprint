
"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ChevronRight, Clock, CheckCircle2, XCircle, ChevronLeft, RotateCcw } from 'lucide-react';
import questionsData from '@/data/math/small_questions.json';
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
  score_rule?: string;
  source?: string;
}

interface DrillClientProps {
  lang: string;
  category: string;
}

const CATEGORY_NAMES: Record<string, string> = {
    'logic': '集合与逻辑',
    'complex': '复数专题',
    'function': '函数专题',
    'derivative': '导数专题',
    'trigo_func': '三角函数',
    'trigo_sol': '解三角形',
    'sequence': '数列专题',
    'vector': '向量专题',
    'inequality': '不等式专题',
    'line_circle': '直线与圆',
    'conic': '圆锥曲线',
    'solid_geometry': '立体几何',
    'probability': '概率统计',
};

export default function DrillClient({ lang, category }: DrillClientProps) {
    const [questions, setQuestions] = useState<SmallQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [fillInAnswer, setFillInAnswer] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(true);

    useEffect(() => {
        const filtered = (questionsData as unknown as SmallQuestion[]).filter(q => q.category === category);
        // Shuffle the questions
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
            setSelectedOptions(prev => 
                prev.includes(label) 
                    ? prev.filter(l => l !== label) 
                    : [...prev, label].sort()
            );
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
            // Re-shuffle and start over or show finished
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
                <Link href={`/${lang}/math-small`} className="text-indigo-600 hover:underline">返回专题选择</Link>
            </div>
        );
    }

    const isCorrect = () => {
        if (currentQ.type === 'fill_in') {
            return fillInAnswer.trim() === String(currentQ.answer).trim();
        }
        const userAns = [...selectedOptions].sort().join("");
        const correctAns = Array.isArray(currentQ.answer) 
            ? [...currentQ.answer].sort().join("") 
            : currentQ.answer;
        return userAns === correctAns;
    };

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 min-h-screen flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
                <div>
                    <Link href={`/${lang}/math-small`} className="text-sm text-slate-500 hover:text-indigo-600 mb-2 flex items-center gap-1 font-medium group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        返回
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {CATEGORY_NAMES[category]} <span className="text-indigo-600">小题特训</span>
                    </h1>
                </div>
                <div className={`
                    flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xl font-bold
                    ${timer > 180 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}
                `}>
                    <Clock size={20} />
                    {formatTime(timer)}
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-white shadow-lg rounded-2xl p-8 mb-6 border border-slate-100 flex-grow relative overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                    {currentQ.source && (
                        <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100">
                            {currentQ.source}
                        </span>
                    )}
                    <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200">
                        第 {currentQ.question_number} 题 / 第 {currentQ.type_rank} 道{currentQ.type === 'single_choice' ? '单选题' : currentQ.type === 'multi_choice' ? '多选题' : '填空题'}
                    </span>
                    {isSubmitted && (
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border ${isCorrect() ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {isCorrect() ? <CheckCircle2 size={14} className="mr-1" /> : <XCircle size={14} className="mr-1" />}
                            {isCorrect() ? '回答正确' : '回答错误'}
                        </span>
                    )}
                </div>

                <div className="prose prose-slate prose-lg max-w-none mb-8">
                    <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                        components={{
                            p: ({children}) => <div className="text-slate-800 leading-relaxed font-serif whitespace-pre-wrap">{children}</div>
                        }}
                    >
                        {currentQ.content.replace(/\\n/g, '\n')}
                    </ReactMarkdown>
                </div>

                {/* Options Area */}
                {currentQ.type !== 'fill_in' && currentQ.options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQ.options.map((opt) => {
                            const isSelected = selectedOptions.includes(opt.label);
                            const isCorrectOpt = Array.isArray(currentQ.answer) 
                                ? currentQ.answer.includes(opt.label)
                                : currentQ.answer === opt.label;
                            
                            let buttonClass = "flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 text-left ";
                            if (isSubmitted) {
                                if (isCorrectOpt) buttonClass += "bg-green-50 border-green-500 text-green-800 ring-1 ring-green-500 ";
                                else if (isSelected) buttonClass += "bg-red-50 border-red-500 text-red-800 ";
                                else buttonClass += "bg-white border-slate-100 text-slate-400 ";
                            } else {
                                if (isSelected) buttonClass += "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-md ";
                                else buttonClass += "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50 ";
                            }

                            return (
                                <button
                                    key={opt.label}
                                    onClick={() => handleOptionSelect(opt.label)}
                                    disabled={isSubmitted}
                                    className={buttonClass}
                                >
                                    <span className={`
                                        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold border
                                        ${isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}
                                        ${isSubmitted && isCorrectOpt ? 'bg-green-600 text-white border-green-600' : ''}
                                        ${isSubmitted && isSelected && !isCorrectOpt ? 'bg-red-600 text-white border-red-600' : ''}
                                    `}>
                                        {opt.label}
                                    </span>
                                    <div className="flex-grow pt-0.5">
                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                            {opt.text}
                                        </ReactMarkdown>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Fill-in Area */}
                {currentQ.type === 'fill_in' && (
                    <div className="mt-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">输入答案：</label>
                        <input 
                            type="text"
                            value={fillInAnswer}
                            onChange={(e) => setFillInAnswer(e.target.value)}
                            disabled={isSubmitted}
                            placeholder="请输入最终结果..."
                            className="w-full md:w-1/2 p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-mono"
                        />
                        {isSubmitted && (
                            <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${isCorrect() ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                <span className="font-bold">正确答案：</span>
                                <span className="font-mono text-lg">{String(currentQ.answer)}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="text-sm text-slate-400">
                    专题进度：{currentIndex + 1} / {questions.length}
                </div>
                
                <div className="flex gap-4 w-full md:w-auto">
                    {!isSubmitted ? (
                        <button
                            onClick={handleSubmit}
                            disabled={(currentQ.type !== 'fill_in' && selectedOptions.length === 0) || (currentQ.type === 'fill_in' && !fillInAnswer.trim())}
                            className={`
                                flex-grow md:flex-grow-0 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                                ${((currentQ.type !== 'fill_in' && selectedOptions.length === 0) || (currentQ.type === 'fill_in' && !fillInAnswer.trim())) 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'}
                            `}
                        >
                            检查答案
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="flex-grow md:flex-grow-0 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                            下一题 <ChevronRight size={20} />
                        </button>
                    )}
                </div>
            </div>
            
            {/* Score Rule Info */}
            {isSubmitted && currentQ.score_rule && (
                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-500 italic">
                    评分规则：{currentQ.score_rule}
                </div>
            )}
        </div>
    );
}

