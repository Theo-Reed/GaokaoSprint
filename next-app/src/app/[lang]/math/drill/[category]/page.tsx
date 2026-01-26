
"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // Don't forget CSS
import { ChevronRight, Clock, Lightbulb } from 'lucide-react';
import questionsData from '@/data/math-questions.json';
import Link from 'next/link';

interface Question {
  question_number: string;
  category: string;
  content: string;
  score: string;
  thought_process: string;
}

interface PageProps {
  params: Promise<{
    lang: string;
    category: string;
  }>;
}

// Helper to get random question
const getRandomQuestion = (category: string) => {
    // Map URL category 'conic' to data category if needed, or ensure they match.
    // In our json, categories are: conic, derivative, solid_geometry, trigonometry, sequence, probability
    // URL categories match these.
    const filtered = questionsData.filter(q => q.category === category);
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
};

const CATEGORY_NAMES: Record<string, string> = {
  'conic': '圆锥曲线',
  'derivative': '导数',
  'solid_geometry': '立体几何',
  'trigonometry': '三角函数',
  'sequence': '数列',
  'probability': '概率统计'
};

export async function generateStaticParams() {
  const languages = ['cn', 'en'];
  const categories = Object.keys(CATEGORY_NAMES);

  const params: { lang: string; category: string }[] = [];
  for (const lang of languages) {
    for (const category of categories) {
      params.push({ lang, category });
    }
  }
  return params;
}

export default function MathDrillPage({ params }: PageProps) {
    // Unwrap params using React.use() or await in useEffect (but this is a client component, so we use useEffect or just unwrap if it was server component)
    // Actually, in Next.js 15, params is a Promise. Let's use a hook to unwrap it properly or make this a server component that passes data to client.
    // Better: Make this a Client Component and unwrap with `use`.
    const { lang, category } = React.use(params);

    const [question, setQuestion] = useState<Question | null>(null);
    const [timer, setTimer] = useState(0);
    const [isRunning, setIsRunning] = useState(true);
    const [showHint, setShowHint] = useState(false);

    useEffect(() => {
        // Load initial question
        const q = getRandomQuestion(category);
        setQuestion(q);
        setTimer(0);
        setIsRunning(true);
        setShowHint(false);
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
        setQuestion(q);
        setTimer(0);
        setIsRunning(true);
        setShowHint(false);
    };

    if (!question) {
        return (
            <div className="p-10 text-center">
                <h2 className="text-xl font-bold">该题库暂无题目 ({category})</h2>
                <Link href={`/${lang}/math`} className="text-indigo-600 hover:underline mt-4 inline-block">返回选择其他专题</Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-10 min-h-screen flex flex-col">
             {/* Header */}
             <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
                 <div>
                    <Link href={`/${lang}/math`} className="text-sm text-slate-500 hover:text-indigo-600 mb-1 inline-flex items-center">
                        ← 返回专题列表
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {CATEGORY_NAMES[category] || category} <span className="text-indigo-600">强化训练</span>
                    </h1>
                 </div>
                 <div className={`
                    flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xl font-bold
                    ${timer > 600 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}
                 `}>
                     <Clock size={20} />
                     {formatTime(timer)}
                 </div>
             </div>

             {/* Question Card */}
             <div className="bg-white shadow-lg rounded-2xl p-8 mb-8 border border-slate-100 flex-grow">
                <div className="prose prose-slate prose-lg max-w-none">
                    <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                        components={{
                            // Custom renderer for p tags to handle block math better if needed
                            p: ({children}) => <div className="mb-4 text-slate-800 leading-relaxed font-serif">{children}</div>
                        }}
                    >
                        {question.content}
                    </ReactMarkdown>
                </div>
             </div>

             {/* Actions Area */}
             <div className="space-y-6">
                 {/* Hint Section */}
                 <div className={`transition-all duration-500 overflow-hidden ${showHint ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="text-amber-500 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-bold text-amber-900 mb-2">AI 解题思路提示</h3>
                                <div className="prose prose-sm prose-amber max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {question.thought_process}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Buttons */}
                 <div className="flex gap-4 justify-center pb-12">
                     <button 
                        onClick={() => setShowHint(!showHint)}
                        className="px-6 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2"
                     >
                         <Lightbulb size={18} />
                         {showHint ? '隐藏提示' : '没思路？看提示'}
                     </button>
                     <button 
                        onClick={handleNext}
                        className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                     >
                         下一题
                         <ChevronRight size={18} />
                     </button>
                 </div>
             </div>
        </div>
    );
}

