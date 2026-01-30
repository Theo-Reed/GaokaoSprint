
"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ChevronRight, Clock, Lightbulb, ChevronLeft } from 'lucide-react';
import questionsData from '@/data/math/questions.json';
import Link from 'next/link';
import { sanitizeMath, markdownComponents, simpleMarkdownComponents } from '@/components/DrillMarkdownHelpers';

interface Question {
  question_number: string;
  large_question_rank?: string;
  category: string;
  content: string;
  score: string;
  thought_process: string;
  source?: string;
  has_figure?: boolean;
}

interface DrillClientProps {
  lang: string;
  category: string;
}

const getRandomQuestion = (category: string) => {
    if (!questionsData || !Array.isArray(questionsData)) return null;
    const filtered = (questionsData as unknown as Question[]).filter(q => q.category === category);
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
};

const getQuestionRankInSource = (currentQ: Question): number | null => {
    if (!currentQ.source || !questionsData || !Array.isArray(questionsData)) return null;
    
    // Filter questions from the same source
    const sameSourceQs = (questionsData as unknown as Question[]).filter(q => q.source === currentQ.source);

    
    // Sort by question_number strictly as integers
    sameSourceQs.sort((a, b) => {
        const numA = parseInt(a.question_number);
        const numB = parseInt(b.question_number);
        return numA - numB;
    });
    
    // Find index
    const index = sameSourceQs.findIndex(q => q.question_number === currentQ.question_number);
    return index !== -1 ? index + 1 : null;
};

const CATEGORY_NAMES: Record<string, string> = {
  'conic': '圆锥曲线',
  'derivative': '导数',
  'solid_geometry': '立体几何',
  'trigonometry': '三角函数',
  'sequence': '数列',
  'probability': '概率统计'
};

// Removed local sanitizeMath, markdownComponents, hintMarkdownComponents


export default function DrillClient({ lang, category }: DrillClientProps) {
    const [question, setQuestion] = useState<Question | null>(null);
    const [timer, setTimer] = useState(0);
    const [isRunning, setIsRunning] = useState(true);
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        const timerId = setTimeout(() => {
            const q = getRandomQuestion(category);
            setQuestion(q as Question);
            setTimer(0);
            setIsRunning(true);
            setShowHint(false);
        }, 0);
        return () => clearTimeout(timerId);
    }, [category]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleNext = () => {
        const q = getRandomQuestion(category);
        setQuestion(q as Question);
        setTimer(0);
        setIsRunning(true);
        setShowHint(false);
    };

    // Calculate source rank if available
    const sourceRank = question ? getQuestionRankInSource(question) : null;


    // Determine layout mode based on category
    // probability: vertical layout (image below text)
    // solid_geometry and others: horizontal layout (image right of text) on large screens
    const isVerticalLayout = category === 'probability';

    if (!question) {
        return (
            <div className="p-10 flex flex-col items-center justify-center min-h-[50vh]">
                <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">该题库暂无题目 ({category})</h2>
                <Link href={`/${lang}/math`} className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 font-medium group">
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    返回
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 min-h-screen flex flex-col">
             {/* Header */}
             <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-700 pb-4">
                 <div>
                    <Link href={`/${lang}/math`} className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 -ml-1 mb-3 flex items-center gap-1 font-medium group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        返回
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {CATEGORY_NAMES[category] || category} <span className="text-indigo-600 dark:text-indigo-400">大题特训</span>
                    </h1>
                 </div>
                 <div className={`
                    flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xl font-bold
                    ${timer > 600 ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}
                 `}>
                     <Clock size={20} />
                     {formatTime(timer)}
                 </div>
             </div>

             {/* Question Card */}
             <div className="bg-white dark:bg-slate-900 shadow-lg rounded-2xl pt-[29px] px-8 pb-8 mb-6 border border-slate-100 dark:border-slate-800 flex-grow relative overflow-hidden">
                {/* Source Badge */}
                <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    {question.source && (
                        <span className="inline-flex items-center px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 text-xs font-medium rounded-full border border-indigo-100 dark:border-indigo-800">
                            {question.source}
                        </span>
                    )}
                    <span className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700">
                        {question.large_question_rank 
                            ? `第 ${question.question_number} 题 / 第 ${question.large_question_rank} 道大题`
                            : sourceRank
                                ? `第 ${question.question_number} 题 / 第 ${sourceRank} 道大题`
                                : `第 ${question.question_number} 题`
                        }
                    </span>
                </div>


                <div className={`flex ${isVerticalLayout ? 'flex-col gap-2' : 'flex-col md:flex-row items-start gap-8'}`}>
                    <div className="prose prose-slate dark:prose-invert prose-lg max-w-none flex-grow">
                        <ReactMarkdown 
                            remarkPlugins={[remarkMath, remarkGfm]} 
                            rehypePlugins={[rehypeKatex]}
                            components={markdownComponents}
                        >
                            {sanitizeMath(question.content)
                                .replace(/^\s*\d+[.、\s]*/, '') // 移除开头的题号
                                .replace(/\\n/g, '\n') // 先将字面量 \n 转换为真实换行
                                // 智能排版：在 (1), (2), (i) 等小题号前自动换行，但在行内引用时保持原样
                                // 使用 replace 而非 split 以确保 Safari 兼容性并提升性能
                                .replace(/(\s|^)(\((?:[1-9]\d*|i+|v|vi)\)|（[1-9]\d*）)/g, (match, prefix, num) => {
                                    // 如果前缀包含换行符，说明已经是新行，不需要处理
                                    if (prefix.includes('\n')) return match;
                                    // 否则强制添加双换行
                                    return `\n\n${num}`;
                                })
                                .trim()}
                        </ReactMarkdown>
                    </div>

                    {/* Question Illustration Area (Statically loaded based on has_figure) */}
                    {question.has_figure && (
                        <div className={`flex-shrink-0 flex flex-col items-center justify-center transition-all ${isVerticalLayout ? 'w-full' : 'md:max-w-xs self-start mt-4 md:mt-0'}`}>
                            <img 
                                src={`/math-images/${encodeURIComponent(`${question.source}-${question.question_number}.png`)}`} 
                                alt="题目插图" 
                                className={`${isVerticalLayout ? 'max-h-64 h-auto w-auto max-w-full' : 'h-72 w-auto'} object-contain mix-blend-multiply dark:mix-blend-normal dark:invert`}
                            />
                        </div>
                    )}
                </div>
             </div>

             {/* Actions Area */}
             <div className="space-y-6">
                 {/* Hint Section */}
                 <div className={`transition-all duration-500 overflow-hidden ${showHint ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="text-amber-500 dark:text-amber-400 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">AI 解题思路提示</h3>
                                <div className="prose prose-sm prose-amber dark:prose-invert max-w-none">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkMath, remarkGfm]} 
                                        rehypePlugins={[rehypeKatex]}
                                        components={simpleMarkdownComponents}
                                    >
                                        {sanitizeMath(question.thought_process)}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Buttons */}
                 <div className="flex flex-col md:flex-row gap-4 items-center justify-between pb-12">
                    <div className="text-sm text-slate-400 dark:text-slate-500">
                        专题题量：{(questionsData as unknown as Question[]).filter(q => q.category === category).length}
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                         <button 
                            onClick={() => setShowHint(!showHint)}
                            className={`px-6 py-4 rounded-xl font-bold transition-all border ${
                                showHint 
                                ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-200' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            } flex items-center justify-center gap-2`}
                         >
                             <Lightbulb size={18} />
                             {showHint ? '隐藏暗示' : '解题思路'}
                         </button>
                         <button 
                            onClick={handleNext}
                            className="flex-grow md:flex-grow-0 px-8 py-4 bg-indigo-600 dark:bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                         >
                             下一题
                             <ChevronRight size={18} />
                         </button>
                    </div>
                 </div>
             </div>
        </div>
    );
}
