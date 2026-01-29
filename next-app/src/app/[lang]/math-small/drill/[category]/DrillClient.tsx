
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
  explanation?: string;
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
    const [showExplanation, setShowExplanation] = useState(false);

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

    const sanitizeMath = (text: string) => {
        if (!text || typeof text !== 'string') return text;
        
        // 1. Critical Fix: Remove all carriage returns and fragmented newlines found in PDF extraction
        // Replace single newlines with space. Preserve \n\n as paragraph break.
        let clean = text.replace(/\r/g, '').replace(/(?<!\n)\n(?!\n)/g, ' ');

        // 2. Normalize delimiters
        clean = clean.replace(/\$\$/g, '$');

        // 3. Fix double-escaped backslashes for common Math/LaTeX commands (Critical Fix)
        // The source data can contain "double escaped" artifacts (e.g. \\\\cos instead of \\cos),
        // which renders as "newline + cos" or breaks rendering.
        const knownCommands = [
            'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'arcsin', 'arccos', 'arctan',
            'ln', 'log', 'lg', 'exp',
            'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
            'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega',
            'frac', 'sqrt', 'int', 'sum', 'prod', 'lim', 'infty',
            'cdot', 'times', 'div', 'pm', 'mp',
            'le', 'ge', 'leq', 'geq', 'ne', 'neq', 'approx', 'equiv', 'cong',
            'in', 'subset', 'subseteq', 'cup', 'cap', 'emptyset',
            'vec', 'hat', 'bar', 'tilde',
            'angle', 'triangle', 'bot',
            'Leftarrow', 'Rightarrow', 'Leftrightarrow'
        ];
        
        // Replace \\\\(command) with \\(command)
        const commandPattern = new RegExp(`\\\\\\\\(${knownCommands.join('|')})\\b`, 'g');
        clean = clean.replace(commandPattern, '\\$1');

        // Fix double-escaped braces and pipes (often used in sets)
        // Cases like \\{ ... \\} or \\| which render as "newline + {" or "newline + |"
        clean = clean.replace(/\\\\\{/g, '\\{');
        clean = clean.replace(/\\\\\}/g, '\\}');
        clean = clean.replace(/\\\\\|/g, '\\|');

        // 4. Targeted fixes for pi inside frac
        clean = clean.replace(/\\frac\{pi\}/g, '\\frac{\\pi}'); 
        clean = clean.replace(/\\frac\{(\\?)pi\}/g, '\\frac{\\pi}');

        // 5. General symbol cleanup (add missing backslash)
        const autoEscapeSymbols = [
             'sin', 'cos', 'tan', 'ln', 'log',
             'pi', 'alpha', 'beta', 'gamma', 'omega', 'theta', 'lambda', 'mu'
        ];
        
        autoEscapeSymbols.forEach(sym => {
             // Look for symbol NOT preceded by slash
             clean = clean.replace(new RegExp(`(?<!\\\\)\\b${sym}\\b`, 'g'), `\\${sym}`);
             
             // Look for symbol followed by variable text, e.g. "sin x", "omega x"
             // clean = clean.replace(new RegExp(`(?<!\\\\)\\b${sym}([a-z])`, 'g'), `\\${sym} $1`);
        });

        // 6. Wrap standalone sqrt numbers
        clean = clean.replace(/(?<!\\)\bsqrt\s*(\d+)/g, '\\sqrt{$1}');
        
        // 6. Ensure math mode if we have LaTeX commands like \frac, \sqrt, \sin but NO $ wrappers
        if (clean.includes('\\') && !clean.includes('$')) {
            // Rough heuristic: if it looks like latex, wrap it.
            // But be careful of mixed text.
            // Better strategy: Wrap specifically identified math chunks? 
            // For now, let's just leave it to ReactMarkdown's remark-math which handles $...$
            // If the text is "y = \sin x", remark-math might not pick it up without $.
            // So we liberally wrap standard patterns.
            
            // Allow wrapping of entire string if it seems to be a formula
            if (/^[0-9a-z\s+\-*/=_,.()\\{}[\]^]+$/i.test(clean) && clean.length < 100) {
                 clean = `$${clean}$`;
            }
        }

        return clean;
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
            <div className="bg-white shadow-lg rounded-2xl pt-[29px] px-8 pb-8 mb-6 border border-slate-100 flex-grow relative overflow-hidden">
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
                        currentQ.type === 'fill_in' ? (
                            <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
                                <CheckCircle2 size={14} className="mr-1" />
                                已核对答案
                            </span>
                        ) : (
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border ${isCorrect() ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {isCorrect() ? <CheckCircle2 size={14} className="mr-1" /> : <XCircle size={14} className="mr-1" />}
                                {isCorrect() ? '回答正确' : '回答错误'}
                            </span>
                        )
                    )}
                </div>

                <div className="prose prose-slate prose-lg max-w-none mb-8">
                    <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                        components={{
                            p: ({children}) => <div className="mb-4 text-slate-800 leading-relaxed font-serif">{children}</div>
                        }}
                    >
                        {sanitizeMath(currentQ.content)
                            .replace(/\\n/g, '\n')
                            .replace(/\$?(\\quad|\s*\\quad\s*)\$?/g, ' _ ') 
                        }
                    </ReactMarkdown>
                </div>

                {/* 题目插图区域 (自动检测是否存在) */}
                <div className="my-6 flex flex-col items-center justify-center p-0 transition-all">
                    <img 
                        src={`/math-images/${currentQ.id}.png`} 
                        alt="题目插图" 
                        className="max-h-80 object-contain mix-blend-multiply"
                        onLoad={(e) => {
                            (e.target as HTMLImageElement).parentElement!.style.padding = '1rem';
                        }}
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.style.padding = '0';
                        }}
                    />
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

                            // Calculate badge classes preventing conflict
                            let badgeClass = "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold border ";
                            if (isSubmitted) {
                                if (isCorrectOpt) {
                                    badgeClass += "bg-green-600 text-white border-green-600";
                                } else if (isSelected) {
                                    badgeClass += "bg-red-600 text-white border-red-600";
                                } else {
                                    badgeClass += "bg-white text-slate-500 border-slate-200";
                                }
                            } else {
                                if (isSelected) {
                                    badgeClass += "bg-indigo-600 text-white border-indigo-600";
                                } else {
                                    badgeClass += "bg-white text-slate-500 border-slate-200";
                                }
                            }

                            return (
                                <button
                                    key={opt.label}
                                    onClick={() => handleOptionSelect(opt.label)}
                                    disabled={isSubmitted}
                                    className={buttonClass}
                                >
                                    <span className={badgeClass}>
                                        {opt.label}
                                    </span>
                                    <div className="flex-grow pt-0.5">
                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                            {sanitizeMath(opt.text).replace(/\$?(\\quad|\s*\\quad\s*)\$?/g, ' ____ ')}
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
                        {!isSubmitted ? (
                            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                <p className="text-slate-500 mb-4">填空题请在草稿纸上完成计算</p>
                                <button 
                                    onClick={handleSubmit}
                                    className="px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm flex items-center gap-2"
                                >
                                    核对答案 <CheckCircle2 size={18} className="text-indigo-500" />
                                </button>
                            </div>
                        ) : (
                            <div className="mt-4 animate-in zoom-in-95 duration-300">
                                <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col items-center">
                                    <span className="text-sm font-bold text-indigo-400 mb-2 uppercase tracking-wider">正确答案</span>
                                    <div className="text-2xl font-serif text-indigo-900 bg-white px-8 py-4 rounded-xl shadow-sm border border-indigo-50">
                                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                            {sanitizeMath(String(currentQ.answer))}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 答题思路/解析区域 */}
                {isSubmitted && showExplanation && currentQ.explanation && (
                    <div className="mt-8 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                            答题思路
                        </h3>
                        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 text-slate-700 leading-relaxed shadow-sm">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {sanitizeMath(currentQ.explanation).replace(/\\n/g, '\n')}
                            </ReactMarkdown>
                        </div>
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
                        <div className="flex gap-4 w-full md:w-auto">
                            {currentQ.explanation && (
                                <button
                                    onClick={() => setShowExplanation(!showExplanation)}
                                    className={`px-6 py-4 rounded-xl font-bold transition-all border ${
                                        showExplanation 
                                        ? 'bg-amber-100 border-amber-300 text-amber-700' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {showExplanation ? '隐藏解析' : '查看解析'}
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="flex-grow md:flex-grow-0 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                            >
                                下一题 <ChevronRight size={20} />
                            </button>
                        </div>
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

