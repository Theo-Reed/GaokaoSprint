
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Send, RefreshCw, Trophy, Edit3, BookOpen, AlertCircle, Zap, Search, X, Filter, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import smallData from '@/data/english/small_compositions.json';
import largeData from '@/data/english/large_compositions.json';

type CompositionType = 'small' | 'large';
type TrainerMode = 'write' | 'generate';

interface GradingResult {
  gemini: any;
  gpt: any;
  deepseek: any;
  claude: any;
}

export const CompositionTrainer = ({ lang = 'cn' }: { lang?: string }) => {
  const [mode, setMode] = useState<TrainerMode>('write');
  const [type, setType] = useState<CompositionType>('small');
  const [topic, setTopic] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [aiResult, setAiResult] = useState<string>('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<Partial<GradingResult>>({});
  const [isSelecting, setIsSelecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isCn = lang === 'cn';

  const startTraining = (selectedType: CompositionType, specificTopic: any = null) => {
    if (specificTopic) {
      setTopic(specificTopic);
    } else {
      const data = selectedType === 'small' ? smallData : largeData;
      // Generate a stable index based on the current date (YYYYMMDD)
      const now = new Date();
      const dateString = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const dateNum = parseInt(dateString);
      const index = dateNum % data.length;
      setTopic(data[index]);
    }
    setAnswer('');
    setAiResult('');
    setResults({});
    setTimer(0);
    setIsTimerRunning(true);
    setIsSelecting(false);
  };

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchGrade = async (model: keyof GradingResult) => {
    try {
      const isGenerating = mode === 'generate';
      const endpoint = isGenerating ? '/api/generate-essay/' : '/api/grade/';
      
      const payload = isGenerating ? {
        topic: topic.prompt,
        type,
        model,
        gradingStandards: type === 'small' ? 'Gaokao 15-point scale' : 'Gaokao 25-point scale',
        scaffoldStart: topic.scaffold?.start || '',
        scaffoldEnd: topic.scaffold?.end || ''
      } : {
        topic: topic.prompt,
        answer: answer,
        type,
        model
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Model ${model} failed`);
      }

      const data = await response.json();
      
      let parsed;
      if (isGenerating) {
        // Just store the string result
        parsed = { 
          score: 0, 
          suggestions: [], 
          essayContent: data.essay 
        };
      } else {
        const rawResponse = data.result || data[model];
        try {
          let cleaned = typeof rawResponse === 'string' ? rawResponse : JSON.stringify(rawResponse);
          
          // Robust JSON extraction: look for the outermost {}
          const firstBrace = cleaned.indexOf('{');
          const lastBrace = cleaned.lastIndexOf('}');
          
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
          }
          
          // Fallback cleanup
          cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
          
          parsed = JSON.parse(cleaned);
        } catch (e) {
          console.error(`Failed to parse JSON for ${model}:`, e);
          parsed = { score: 0, suggestions: [], summary: String(rawResponse) };
        }
      }

      setResults(prev => ({ ...prev, [model]: parsed }));
    } catch (error) {
      console.error(`${mode === 'generate' ? 'Generation' : 'Grading'} failed for ${model}:`, error);
      setResults(prev => ({ ...prev, [model]: { score: 0, suggestions: [], summary: "Error: Request failed" } }));
    }
  };

  const handleSubmit = async () => {
    if (mode === 'write' && !answer.trim()) return;
    setIsSubmitting(true);
    setIsTimerRunning(false);
    setResults({});

    // Start all 4 requests in parallel
    const models: (keyof GradingResult)[] = ['gemini', 'gpt', 'deepseek', 'claude'];
    
    Promise.all(models.map(m => fetchGrade(m))).finally(() => {
      setIsSubmitting(false);
    });
  };

  if (!topic) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
            {isCn ? '英语作文限时书写' : 'English Writing Practice'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">{isCn ? '全真模拟高考写作环境，配备四模型 AI 联合测评。' : 'Simulate Gaokao writing environment with Multi-AI evaluation.'}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <button 
            onClick={() => { setMode('write'); setType('small'); startTraining('small'); }}
            className="group p-8 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-400 hover:shadow-xl transition-all text-left"
          >
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-6 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Edit3 size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{isCn ? '小作文 (15分)' : 'Small Composition'}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">应用文写作（书信、通知等）。要求 80 词左右。</p>
          </button>
          <button 
            onClick={() => { setMode('write'); setType('large'); startTraining('large'); }}
            className="group p-8 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-400 hover:shadow-xl transition-all text-left"
          >
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-6 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <BookOpen size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{isCn ? '读后续写 (25分)' : 'Story Continuation'}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">根据给定开头续写故事。要求 150 词左右。</p>
          </button>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
            {isCn ? '英语作文 AI 生成' : 'AI Composition Generator'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">{isCn ? '严格按照高考满分标准，为你生成高分范文。' : 'Generate high-score model essays based on Gaokao standards.'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button 
            onClick={() => { setMode('generate'); setType('small'); startTraining('small'); }}
            className="group p-8 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-400 hover:shadow-xl transition-all text-left"
          >
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-6 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Zap size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{isCn ? '生成小作文范文' : 'Generate Small Comp'}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">提供题目，瞬间生成满分级应用文范文。</p>
          </button>
          <button 
            onClick={() => { setMode('generate'); setType('large'); startTraining('large'); }}
            className="group p-8 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-400 hover:shadow-xl transition-all text-left"
          >
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-6 group-hover:bg-indigo-500 dark:group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Zap size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{isCn ? '生成读后续写范文' : 'Generate Story Cont'}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">攻克读后续写，生成情节生动、语言地道的范文。</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <button 
            onClick={() => setTopic(null)}
            className="text-sm text-slate-500 hover:text-indigo-500 mb-2 flex items-center gap-1 font-medium group dark:text-slate-400 dark:hover:text-indigo-400"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            {isCn ? '返回' : 'Back'}
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {mode === 'write' ? (
              type === 'small' ? (isCn ? '小作文限时书写' : 'Small Comp Writing') : (isCn ? '读后续写限时书写' : 'Story Cont Writing')
            ) : (
              type === 'small' ? (isCn ? '小作文 AI 生成' : 'Small Comp AI Gen') : (isCn ? '读后续写 AI 生成' : 'Story Cont AI Gen')
            )}
            <button 
              onClick={() => setIsSelecting(true)}
              className="ml-3 group inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500 rounded-lg text-sm transition-all"
            >
              <span className="text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 font-medium">
                {topic.year} {Array.isArray(topic.region) ? topic.region[0] : topic.region}
              </span>
              <Search size={14} className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-400" />
            </button>
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full font-mono text-xl font-bold text-slate-700 dark:text-slate-300">
            <Clock size={20} className="text-slate-400 dark:text-slate-500" />
            {formatTime(timer)}
          </div>
          <button 
            onClick={() => startTraining(type)}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:rotate-180 transition-all duration-500"
            title={isCn ? '更换题目' : 'Change Topic'}
          >
            <RefreshCw size={24} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Topic Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm overflow-auto max-h-[600px]">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-indigo-500" />
              {isCn ? '题目要求' : 'Prompt'}
            </h3>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
              <ReactMarkdown>{topic.prompt}</ReactMarkdown>
            </div>
            
            {topic.scaffold && (
              <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
                 <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">帮助结构 (Scaffold)</h4>
                 {topic.scaffold.start && (
                   <div className="mb-4">
                     <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded mb-1 inline-block">开头必须接续:</span>
                     <p className="text-sm italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">{topic.scaffold.start}</p>
                   </div>
                 )}
                 {topic.scaffold.end && (
                   <div>
                     <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded mb-1 inline-block">落款必须接续:</span>
                     <p className="text-sm italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">{topic.scaffold.end}</p>
                   </div>
                 )}
              </div>
            )}
          </div>
        </div>

        {/* Editor Column */}
        <div className="flex flex-col h-full relative">
          {mode === 'write' ? (
            <div className="flex-grow flex flex-col relative group">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={isCn ? '在此输入你的作文...' : 'Start writing here...'}
                className="flex-grow min-h-[450px] w-full p-6 pb-24 text-lg border-2 border-slate-200 dark:border-slate-800 rounded-2xl focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-0 transition-all bg-white dark:bg-slate-900 font-serif resize-none text-slate-900 dark:text-gray-100 shadow-sm"
              />
              <div className="absolute bottom-16 right-6 text-xs text-slate-400 dark:text-slate-500 font-mono bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded-md backdrop-blur-sm">
                {answer.trim().split(/\s+/).filter(x => x).length} words
              </div>
            </div>
          ) : (
            <div className="flex-grow min-h-[450px] w-full p-8 border-2 border-slate-200 dark:border-slate-800 border-dashed rounded-2xl bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center">
               <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-6">
                  <Zap size={40} />
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{isCn ? '满分范文 AI 生成' : 'Model Essay AI Generation'}</h3>
               <p className="text-slate-500 dark:text-slate-400 max-w-xs">{isCn ? '点击下方按钮，四核 AI 将根据左侧题目要求，严格遵循高考第五档标准为您同步生成多篇风格迥异的满分范文。' : 'Click the button below to generate Tier 5 model essays following Gaokao standards.'}</p>
            </div>
          )}

          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || (mode === 'write' && !answer.trim())}
              className={`
                w-[80%] py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                ${isSubmitting || (mode === 'write' && !answer.trim()) ? 'bg-slate-300/70 dark:bg-slate-700/50 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 hover:shadow-indigo-100 dark:hover:shadow-none hover:-translate-y-0.5 active:scale-[0.98] blur-none'}
              `}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  {isCn ? (mode === 'write' ? 'AI 正在分析并评分...' : 'AI 正在生成满分范文...') : (mode === 'write' ? 'AI Scoring...' : 'AI Generating...')}
                </>
              ) : (
                <>
                  {mode === 'write' ? <Send size={20} /> : <Zap size={20} />}
                  {isCn ? (mode === 'write' ? '提交并获取 AI 评分' : '立即生成满分范文') : (mode === 'write' ? 'Submit for AI Grading' : 'Generate Model Essays')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {(Object.keys(results).length > 0 || isSubmitting) && (
        <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
             <Trophy size={28} className="text-amber-500" />
             {isCn ? (mode === 'write' ? '多模型 AI 联合测评' : '多模型 AI 满分范文展示') : (mode === 'write' ? 'Multi-AI Evaluation' : 'Multi-AI Model Essays')}
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {['gemini', 'gpt', 'deepseek', 'claude'].map((model) => {
               const feedback = results[model as keyof GradingResult];
               return (
                 <div key={model} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow min-h-[150px] flex flex-col">
                   <div className="flex items-center justify-between mb-3 text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                     <span>
                       {model === 'gpt' ? 'ChatGPT (GPT-4o)' : 
                        model === 'gemini' ? (mode === 'write' ? 'Gemini 2.5 Flash' : 'Gemini 2.5 Pro') : 
                        model.charAt(0).toUpperCase() + model.slice(1)}
                     </span>
                     {!feedback && <RefreshCw size={14} className="animate-spin text-indigo-500" />}
                   </div>
                   <div className="text-slate-800 dark:text-slate-200 leading-relaxed text-base flex-grow">
                     {feedback ? (
                       <div className="animate-in fade-in duration-300 space-y-4">
                         {mode === 'write' && (
                           <div className="flex items-baseline gap-2">
                             <span className="text-indigo-500 font-black text-xl">{isCn ? '评分：' : 'Score:'}</span>
                             <span className="text-3xl font-black text-slate-900 dark:text-white">{feedback.score}</span>
                             <span className="text-sm text-slate-400 dark:text-slate-500 font-bold">/ {type === 'small' ? 15 : 25}</span>
                           </div>
                         )}
                         
                         {mode === 'write' ? (
                           <div className="space-y-2">
                             <ul className="space-y-[0.7em]">
                               {['内容覆盖', '语言词汇', '句式多样', '连贯衔接'].map((label, i) => {
                                 const content = feedback.suggestions?.[i];
                                 if (!content) return null;
                                 
                                 const cleanContent = content.replace(/^\[.*?\]\s*/, '');
                                 
                                 return (
                                   <li key={i} className="flex gap-2">
                                     <span className="text-slate-300 dark:text-slate-600 font-black shrink-0">{i + 1}.</span>
                                     <div className="prose prose-slate prose-sm dark:prose-invert max-w-none prose-strong:text-indigo-600 prose-strong:font-black dark:prose-strong:text-indigo-400">
                                       <div className="flex flex-col">
                                         <strong className="text-indigo-600 dark:text-indigo-400 mb-[0.7em]">[{label}]</strong>
                                         <div className="[&_p]:my-0 [&_>*:first-child]:mt-0 [&_>*:last-child]:mb-0 text-slate-700 dark:text-slate-300 leading-relaxed">
                                           <ReactMarkdown>{cleanContent}</ReactMarkdown>
                                         </div>
                                       </div>
                                     </div>
                                   </li>
                                 );
                               })}
                               
                               {feedback.summary && (
                                 <li className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                   <div className="prose prose-slate prose-sm dark:prose-invert max-w-none prose-strong:text-indigo-600 prose-strong:font-black dark:prose-strong:text-indigo-400 w-full">
                                     <div className="flex flex-col">
                                       <strong className="text-indigo-600 dark:text-indigo-400 mb-[0.7em]">[{isCn ? '综合点评' : 'Summary'}]</strong>
                                       <div className="[&_p]:my-0 [&_>*:first-child]:mt-0 [&_>*:last-child]:mb-0 text-slate-700 dark:text-slate-300 leading-relaxed">
                                         <ReactMarkdown>{feedback.summary}</ReactMarkdown>
                                       </div>
                                     </div>
                                   </div>
                                 </li>
                               )}
                             </ul>
                           </div>
                         ) : (
                           <div className="prose prose-slate prose-lg dark:prose-invert max-w-none pt-2 [&_p]:my-[10px]">
                             <div className="text-slate-700 dark:text-slate-300 leading-relaxed font-serif whitespace-pre-wrap">
                               <ReactMarkdown>
                                 {(feedback as any).essayContent || ''}
                               </ReactMarkdown>
                             </div>
                           </div>
                         )}
                       </div>
                     ) : (
                       <div className="flex items-center gap-2 text-slate-300 dark:text-slate-600 italic font-normal">
                         {isCn ? (mode === 'write' ? '分析中...' : '生成中...') : (mode === 'write' ? 'Analyzing...' : 'Generating...')}
                       </div>
                     )}
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      )}

      {/* Topic Selection Modal */}
      {isSelecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-900/5">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{isCn ? '题库精准匹配' : 'Topic Search'}</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{type === 'small' ? 'Small Composition' : 'Story Continuation'}</p>
              </div>
              <button onClick={() => setIsSelecting(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} className="text-slate-400 dark:text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-950">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={20} />
                <input 
                  type="text"
                  autoFocus
                  placeholder={isCn ? "搜索年份、省份 (如: 2024 浙江)..." : "Search year or region..."}
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl focus:border-indigo-500 dark:focus:border-indigo-500 focus:outline-none text-lg font-medium shadow-inner text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-2">
              {(type === 'small' ? smallData : largeData)
                .filter(t => {
                  const regionStr = Array.isArray(t.region) ? t.region.join(' ') : String(t.region);
                  const combined = `${t.year} ${regionStr}`.toLowerCase();
                  return combined.includes(searchQuery.toLowerCase());
                })
                .slice(0, 50) // Limit display for performance
                .map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => startTraining(type, t)}
                    className="w-full p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800 rounded-2xl text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">{t.year}</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{Array.isArray(t.region) ? t.region.join(' / ') : t.region}</span>
                      </div>
                      <div className="text-sm text-slate-400 dark:text-slate-500 line-clamp-1">{t.prompt}</div>
                    </div>
                    <Filter size={18} className="text-slate-200 dark:text-slate-700 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                ))
              }
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center text-xs text-slate-400 dark:text-slate-500 font-bold">
              {isCn ? '点击题目即可开始特训' : 'Click a topic to start training'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
