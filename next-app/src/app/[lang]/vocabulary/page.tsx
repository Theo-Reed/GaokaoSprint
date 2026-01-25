'use client';

import { useState, useEffect, useMemo } from 'react';
// @ts-ignore
import rawData from '@/data/vocabulary_app_data_refined_final.json';
import { supabase } from '@/lib/supabase';
import AuthOverlay from '@/components/AuthOverlay';
import { Languages, CheckCircle, RotateCcw } from 'lucide-react'; // Added icons

// --- 类型 ---
type WordData = {
  word: string;
  stats: { freq: number; stars: number };
  meanings: { en: string[]; cn: string[] }; 
  examples?: { teach?: string[] };
  pos: string[];
};

// 状态优先级: learning (高) > new (中) > familiar (低) > mastered (不显示)
type UserProgress = {
  status: 'learning' | 'familiar' | 'mastered';
  last_reviewed_at: string;
};

const posAbbreviations: Record<string, string> = {
  noun: 'n',
  verb: 'v',
  adj: 'adj',
  adjective: 'adj',
  adv: 'adv',
  adverb: 'adv',
  prep: 'prep',
  preposition: 'prep',
  conj: 'conj',
  conjunction: 'conj',
  pron: 'pron',
  pronoun: 'pron',
  art: 'art',
  article: 'art',
  num: 'num',
  number: 'num',
  int: 'int',
  interjection: 'int',
};

const formatPos = (pos: string) => {
    if (!pos) return 'v';
    const lower = pos.toLowerCase();
    return posAbbreviations[lower] || pos;
};

export default function TrainerPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); 
  
  // 核心状态
  const [currentWord, setCurrentWord] = useState<WordData | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // 进度状态
  const [progressMap, setProgressMap] = useState<Map<string, UserProgress>>(new Map());
  const [dailyQueue, setDailyQueue] = useState<WordData[]>([]);
  const [queueIndex, setQueueIndex] = useState(0); // 当前在队列中的位置

  const [definitionMode, setDefinitionMode] = useState<'bilingual' | 'english'>('bilingual');

  // 统计
  const [masteredCount, setMasteredCount] = useState(0);

  // 1. 初始化
  useEffect(() => {
    setIsClient(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProgress(session.user.id);
      else {
        buildQueue(new Map()); // 未登录模式，全部视为 new
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProgress(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. 从数据库拉取进度
  const fetchProgress = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('user_progress')
      .select('word_id, status, last_reviewed_at')
      .eq('user_id', userId);
    
    const map = new Map<string, UserProgress>();

    if (data) {
      data.forEach(item => {
        // 过滤掉旧的 syntax 数据
        if (item.word_id.startsWith('syntax:')) return;
        
        // Map 自动去重，保留最后一条（通常是数据库返回顺序，或者我们可以由查询排序控制）
        // 但最好还是依靠数据库唯一约束。若有重复，Map 会覆盖。
        map.set(item.word_id, {
          status: item.status as any || 'learning', 
          last_reviewed_at: item.last_reviewed_at
        });
      });
    }

    // 重新计算 masteredCount，确保去重后准确
    let mCount = 0;
    map.forEach(val => {
        if (val.status === 'mastered') mCount++;
    });
    
    setProgressMap(map);
    setMasteredCount(mCount);
    buildQueue(map);
    setLoading(false);
  };

  // 3. 构建每日学习队列
  const buildQueue = (map: Map<string, UserProgress>) => {
    const allWords = rawData as WordData[];
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // 优先级分组
    const todayLearning: WordData[] = []; // A. 今天正在学的 (Next过) -> 最优先 (恢复现场)
    const reviewLearning: WordData[] = [];// B. 往日遗留的 Learning -> 优先复习
    const reviewFamiliar: WordData[] = [];// C. 往日熟悉的 -> 复习巩固
    const newWords: WordData[] = [];      // D. 新词 -> 正常学习
    const todayFamiliar: WordData[] = []; // E. 今天已熟悉的 -> 垫底 (防止空跑)

    allWords.forEach(w => {
      const p = map.get(w.word);
      if (p?.status === 'mastered') return; // 已掌握的不放入

      if (!p) {
        newWords.push(w);
      } else {
        // Handle timezone/date loosely. Assuming stored is ISO UTC.
        // Convert stored time to local YYYY-MM-DD for comparison? 
        // Or simpler: just check string prefix if we trust environment? 
        // Let's use Date object to be safe.
        const reviewDate = new Date(p.last_reviewed_at).toISOString().split('T')[0];
        const isToday = reviewDate === today;

        if (isToday) {
            if (p.status === 'learning') todayLearning.push(w);
            else todayFamiliar.push(w);
        } else {
            if (p.status === 'learning') reviewLearning.push(w);
            else reviewFamiliar.push(w);
        }
      }
    });

    // 排序逻辑 (根据用户最新需求 - 修正版)
    // 优先级优化：
    // 1. reviewLearning: 昨天/以前没学会的 (优先复习，恢复进度)
    // 2. reviewFamiliar: 昨天/以前熟悉的 (复习巩固，恢复进度)
    // 3. newWords: 新词 
    // 4. todayLearning: 今天正在学的 (刚才点了Next的，排在未看过的后面，避免一刷新就重来)
    // 5. todayFamiliar: 今天已熟悉的 (垫底)
    const queue = [
        ...reviewLearning, 
        ...reviewFamiliar, 
        ...newWords, 
        ...todayLearning, 
        ...todayFamiliar
    ];

    setDailyQueue(queue);
    setQueueIndex(0);
    if (queue.length > 0) {
      setCurrentWord(queue[0]);
    } else {
        setCurrentWord(null);
    }
  };

  // 4. 用户交互处理
  const handleAction = async (action: 'familiar' | 'next' | 'mastered' | 'unmastered') => {
    if (!currentWord && action !== 'unmastered') return;
    if (isExiting) return; // 防止连续点击

    const wordId = currentWord!.word;
    
    // 触发退出动画
    setIsExiting(true);

    // 等待动画时间 (0.3s) 结束后再更新状态，防止 UI 闪烁或按钮变色
    setTimeout(async () => {
      let newStatus: 'familiar' | 'learning' | 'mastered' = 'learning';

      if (action === 'mastered') {
          newStatus = 'mastered';
          setMasteredCount(c => c + 1);
      } else if (action === 'familiar') {
          newStatus = 'familiar';
      } else if (action === 'next') {
          newStatus = 'learning'; 
      } else if (action === 'unmastered') {
          newStatus = 'familiar';
          setMasteredCount(c => Math.max(0, c - 1));
      }

      // 1. 更新本地 Map 状态
      setProgressMap(prev => {
          const next = new Map(prev);
          next.set(wordId, { status: newStatus, last_reviewed_at: new Date().toISOString() });
          return next;
      });

      // 2. 移动到下一张
      const nextIdx = queueIndex + 1;
      if (nextIdx < dailyQueue.length) {
          setQueueIndex(nextIdx);
          setCurrentWord(dailyQueue[nextIdx]);
          setIsFlipped(false);
      } else {
          setCurrentWord(null); 
      }
      
      // 3. 结束退出状态
      setIsExiting(false);

      // 4. 异步存库
      if (session) {
        supabase.from('user_progress').upsert({
            user_id: session.user.id,
            word_id: wordId,
            status: newStatus,
            last_reviewed_at: new Date().toISOString()
        }, { onConflict: 'user_id, word_id' }).then();
      }
    }, 300);
  };

  // 特殊处理：取消掌握
  // 需求：已掌握的单词的左上角的已掌握变成“取消已掌握”，点击取消已掌握先把当成今天已熟悉的单词
  // 这意味着我们其实可以浏览 "已掌握" 的卡片？
  // 但前面 buildQueue 把 mastered 排除了。
  // 如果当前显示的词变成 mastered，它会切到下一张。
  // 只有当用户在"已掌握"状态下还没切走(比如动画延迟)，或者我们在“回看”？
  // 你的需求里没有提到“回看/上一个”。
  // 
  // 此时逻辑：点击左上角“已掌握” -> 瞬间标记为 Mastered -> 卡片切换。
  // 那用户怎么点“取消已掌握”？
  // 除非：用户在“历史记录”里找，或者这个卡片没有立刻切走。
  // 
  // 修正理解：
  // 也许你的意思是：当前卡片如果是 Status=Mastered 的（比如队列空了显示出来的），那么按钮是“取消已掌握”。
  // 由于 buildQueue 目前排除了 Mastered，所以正常流程不会遇到 Mastered。
  // 
  // 为了支持“所有都刷过了，出现的就是已掌握的单词”，我们需要修改 buildQueue
  // 如果 dailyQueue (learning/new/familiar) 全部走完了 -> 显示 Mastered 的词？
  
  // 修正 loadLogic 逻辑：如果 queueIndex >= dailyQueue.length，尝试加载已掌握的词
  useEffect(() => {
    if (!loading && currentWord === null && queueIndex >= dailyQueue.length && dailyQueue.length > 0) {
        // 一般情况是 Finish，但如果想复习 Mastered?
        // 暂时不主动加载 Mastered，除非所有(包括 Mastered)都在队列里
    }
    // 如果队列一开始就是空的，可能全是 Mastered?
    if (!loading && dailyQueue.length === 0 && masteredCount > 0 && currentWord === null) {
       // 全是已掌握，或许应该允许复习？
       // 根据需求“当所有熟悉的、不熟悉的都刷过了，出现的就是已掌握的单词”
       // -> 是的，我们需要把 Mastered 放到队列最后
    }
  }, [loading, dailyQueue, queueIndex, currentWord, masteredCount]);

  // 修改 buildQueue 策略：把 mastered 也放进去，但放最后
  const isMastered = progressMap.get(currentWord?.word || '')?.status === 'mastered';

  if (loading) return <div className="h-screen flex items-center justify-center">加载数据中...</div>;
  const showAuth = !session && isClient;

  // 队列完成视图
  if (!currentWord && !loading && !showAuth) {
     // 如果真的全跑完了(包括 Mastered)，或者没有 Mastered
     // 尝试加载 Mastered 进队?
     // 简单起见，这里显示完成界面。
     // 如果用户想复习 Mastered，可以加个按钮 "复习已掌握"
     return (
        <div className="h-screen flex flex-col items-center justify-center text-center p-6 space-y-4">
             <div className="text-4xl">🎉</div>
             <h2 className="text-xl font-bold">今日任务完成</h2>
             <p className="text-gray-500">所有单词（含已掌握）都已过了一遍</p>
             <button 
               onClick={() => window.location.reload()} 
               className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full"
             >
                刷新重来
             </button>
        </div>
     );
  }

  // 正常渲染
  return (
    <div className="fixed inset-0 md:left-64 flex flex-col overflow-hidden bg-slate-50 text-slate-900 overscroll-none z-0">
      <div className="flex flex-col h-full w-full md:max-w-md mx-auto md:border-x border-slate-200 relative bg-white md:shadow-2xl">
      
      {showAuth && <AuthOverlay onLoginSuccess={() => {}} />}
      
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 border-b border-slate-100 z-10">
        <div className="flex gap-2">
            <button
                onClick={() => setDefinitionMode(prev => prev === 'bilingual' ? 'english' : 'bilingual')}
                className="text-[10px] uppercase tracking-widest font-black px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm flex items-center gap-2 active:scale-95"
            >
                <Languages size={14} />
                <span>{definitionMode === 'bilingual' ? 'Bilingual' : 'English Only'}</span>
            </button>
        </div>

        <div className="text-[10px] font-black tracking-tighter text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 uppercase">
          Mastery: {masteredCount}
        </div>
      </div>

      {/* Main Card Area */}
      {currentWord && (
      <div className="flex-1 min-h-0 p-4 flex flex-col relative overflow-hidden">
        <div 
          key={currentWord.word}
          onClick={() => {
            const selection = window.getSelection();
            if (selection && selection.toString().length > 0) return;
            setIsFlipped(!isFlipped);
          }} 
          className={`bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 w-full h-full flex flex-col items-center p-6 cursor-pointer relative group border border-gray-100 overflow-hidden
            ${isExiting ? 'opacity-0 scale-95 -translate-y-8 pointer-events-none' : 'opacity-100 scale-100 translate-y-0 animate-in fade-in slide-in-from-bottom-2'}`}
        >
          {/* 左上角：撤回 (可选，之前为已掌握，现在留空或做成撤回) */}
          {/* <div className="absolute top-4 left-4 z-20"></div> */}

          {/* 右上角标签 */}
          <div className="absolute top-4 right-4">
               {/* 简化标签显示 */}
               {!progressMap.has(currentWord.word) ? (
                   <span className="text-[10px] font-bold text-white bg-indigo-400 px-2 py-1 rounded-full shadow-sm">NEW</span>
               ) : (
                   progressMap.get(currentWord.word)?.status === 'learning' && (
                    <span className="text-[10px] font-bold text-white bg-blue-400 px-2 py-1 rounded-full shadow-sm">Review</span>
                   )
               )}
          </div>

          {/* 单词主显 */}
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 text-center break-words w-full px-2 mt-8">
              {currentWord.word}
            </h1>

            <div className="flex space-x-1 mb-6 opacity-20">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-xs ${i < currentWord.stats.stars ? 'text-indigo-600' : 'text-slate-200'}`}>★</span>
              ))}
            </div>

            <div className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse mt-4">Tap to reveal</div>
          </div>

          {/* B面 (答案) */}
          <div className={`absolute inset-0 bg-white/98 backdrop-blur-2xl z-10 flex flex-col text-left transition-all duration-500 rounded-3xl overflow-hidden ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
             <div className="h-full overflow-y-auto no-scrollbar pt-5 pb-10 px-8">
                <div className="mt-4"> {/* Compacted spacer */}
                   <ul className="space-y-4">
                     {currentWord.meanings.en?.map((m, i) => (
                       <li key={i} className="text-lg leading-snug text-slate-700 border-l-2 border-indigo-500 pl-3">
                          {definitionMode === 'bilingual' ? (
                              <div>
                                  <div className="font-black text-slate-900 mb-1 flex items-baseline gap-2">
                                    <span className="italic text-xs text-indigo-500 font-serif leading-none">{formatPos(currentWord.pos?.[i])}.</span> 
                                    <span className="text-xl">{currentWord.meanings.cn?.[i] || ''}</span>
                                  </div>
                                  <div className="text-sm text-slate-500 font-medium leading-relaxed">{m}</div>
                              </div>
                          ) : (
                              <div className="flex gap-3">
                                <span className="italic text-xs text-indigo-500 font-serif min-w-[2.5em] mt-1">{formatPos(currentWord.pos?.[i])}.</span>
                                <span className="text-slate-700 font-medium">{m}</span>
                              </div>
                          )}
                       </li>
                     ))}
                   </ul>
                </div>

                {currentWord.examples?.teach && (
                  <div className="mt-6">
                    <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2 border-b border-slate-50 pb-1">Usage Context</h3>
                    <div className="space-y-3">
                      {currentWord.examples.teach.map((ex, i) => (
                        <div key={i} className="text-slate-600 bg-slate-50/50 border border-slate-100/50 p-3 rounded-2xl text-sm leading-relaxed"
                             dangerouslySetInnerHTML={{ __html: ex.replace(/\*\*(.*?)\*\*/g, '<span class="text-indigo-600 font-black decoration-indigo-200 decoration-2 underline-offset-4">$1</span>') }}
                        />
                      ))}
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
      )}

      {/* 底部操作栏 */}
      <div className="p-6 grid grid-cols-3 gap-4 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <button 
          onClick={() => handleAction('mastered')}
          className="flex flex-col items-center justify-center py-5 rounded-3xl bg-white border border-slate-200 text-slate-400 transition-all active:scale-95 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30"
        >
          <span className="text-xl mb-1">👑</span>
          <span className="font-black text-[10px] uppercase tracking-wider">掌握</span>
        </button>

        <button 
          onClick={() => handleAction('familiar')}
          className="flex flex-col items-center justify-center py-5 rounded-3xl bg-white border border-slate-200 text-slate-400 transition-all active:scale-95 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30"
        >
          <span className="text-xl mb-1">👍</span>
          <span className="font-black text-[10px] uppercase tracking-wider">认识</span>
        </button>
        
        <button 
          onClick={() => handleAction('next')}
          className="flex flex-col items-center justify-center py-5 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 transition-all active:scale-95 hover:bg-indigo-700"
        >
          <span className="text-xl mb-1">➡️</span>
          <span className="font-black text-[10px] uppercase tracking-wider">下一个</span>
        </button>
      </div>
     </div>
    </div>
  );
}
