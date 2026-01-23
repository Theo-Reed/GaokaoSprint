'use client';

import { useState, useEffect } from 'react';
// @ts-ignore
import rawData from '@/data/vocabulary_app_data_refined_final.json';
import { supabase } from '@/lib/supabase';
import AuthOverlay from '@/components/AuthOverlay';

// --- 类型 ---
type WordData = {
  word: string;
  stats: { freq: number; stars: number };
  meanings: { en: string[] }; 
  examples?: { teach?: string[] };
};

type QueueItem = {
  word: WordData;
  source: 'new' | 'learning';
};

export default function TrainerPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // 新增：是否在客户端
  
  // 核心状态
  const [currentCard, setCurrentCard] = useState<QueueItem | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learningQueue, setLearningQueue] = useState<WordData[]>([]);
  const [todayLearnedCount, setTodayLearnedCount] = useState(0);

  // 这里的 Set 用于快速判断是否学过（从数据库拉取）
  const [remoteLearnedSet, setRemoteLearnedSet] = useState<Set<string>>(new Set());

  // 1. 初始化
  useEffect(() => {
    setIsClient(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProgress(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProgress(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. 从数据库拉取已背单词的 ID
  const fetchProgress = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase.from('user_progress').select('word_id');
    if (data) {
      // 过滤掉 'syntax:' 前缀的记录 (那是语法特训的进度)
      const learned = new Set(
          data
          .map(item => item.word_id)
          .filter(id => !id.startsWith('syntax:'))
      );
      setRemoteLearnedSet(learned);
    }
    setLoading(false);
  };
    
  // 3. 加载下一张卡片 (监听 remoteLearnedSet 变化后也会触发)
  useEffect(() => {
    if (!loading) loadNextCard();
  }, [loading, remoteLearnedSet, learningQueue]); 
  // 注意：learningQueue 变化不应重置 currentCard，只有当 currentCard 为空时才触发

  const loadNextCard = () => {
    if (currentCard) return; // 如果当前有卡片，不打断

    // A. 优先死磕
    if (learningQueue.length > 0) {
      const next = learningQueue[0];
      setLearningQueue(prev => prev.slice(1));
      setCurrentCard({ word: next, source: 'learning' });
      setIsFlipped(false);
      return;
    }

    // B. 新词
    // 找到第一个不在 remoteLearnedSet 里的词
    const nextNew = (rawData as WordData[]).find(w => !remoteLearnedSet.has(w.word));
    
    if (nextNew) {
      setCurrentCard({ word: nextNew, source: 'new' });
      setIsFlipped(false);
    } else {
      setCurrentCard(null); // 通关
    }
  };

  const forceNext = () => {
    // 强制触发一次取词逻辑 (因为 useEffect 依赖复杂，手动控制更稳)
    setCurrentCard(null); 
    // useEffect 会监测到 currentCard 变 null 且 dependencies 没变吗？
    // 最好手动调用一下逻辑：
    setTimeout(() => {
        // A. 优先死磕 (重新读取最新的 state)
        //由于闭包问题，这里可能有坑，最简单的做法是只 setNull，利用 useEffect 重新 load
        // 但为了保险，直接在这里写逻辑副本
        setLearningQueue(prev => {
            if (prev.length > 0) {
                const next = prev[0];
                setCurrentCard({ word: next, source: 'learning' });
                setIsFlipped(false);
                return prev.slice(1);
            }
            // 取新词... 这里需要访问最新的 remoteLearnedSet
            // 简单处理：设为 null，让 useEffect 再次接管
            setCurrentCard(null); 
            return prev;
        });
    }, 0);
  };


  const handleResponse = async (degree: 'forgot' | 'easy') => {
    if (!currentCard) return;

    if (degree === 'forgot') {
      // 放入死磕队列
      setLearningQueue(prev => [...prev, currentCard.word]);
      forceNext();
    } else {
      // 认识 -> 存数据库
      const wordId = currentCard.word.word;
      
      // 1. 乐观 UI 更新 (立刻变)
      setRemoteLearnedSet(prev => new Set(prev).add(wordId));
      setTodayLearnedCount(c => c + 1);

      // 2. 异步存库
      if (session) {
        await supabase.from('user_progress').upsert({
            user_id: session.user.id,
            word_id: wordId
        });
      }

      forceNext();
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">加载数据中...</div>;
  
  // 决定是否显示登录框
  // 条件：没登录 AND (已在客户端加载完毕)
  const showAuth = !session && isClient;

  // 如果完全没有卡片了
  if (!currentCard && !loading && !showAuth) return <div className="h-screen flex items-center justify-center text-2xl">🎉 全本背诵完成！</div>;

  const word = currentCard?.word;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 border-x border-gray-100 relative overflow-hidden text-gray-900">
      
      {/* 登录弹窗 (如果未登录) */}
      {showAuth && (
         <AuthOverlay onLoginSuccess={() => {}} />
      )}
      
      {/* Top Bar */}
      <div className="flex justify-end items-center p-4 bg-white shadow-sm z-10">
        <div className="text-xs font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          已斩: {remoteLearnedSet.size} / {(rawData as WordData[]).length}
        </div>
      </div>

       {/* 死磕指示器 */}
       {learningQueue.length > 0 && (
        <div className="bg-red-50 text-red-500 text-xs text-center py-1 font-medium">
          😓 还有 {learningQueue.length} 个难词等着你
        </div>
      )}

      {/* Main Card Area */}
      {word && (
      <div className="flex-1 p-4 flex flex-col justify-center relative">
        <div 
          onClick={() => setIsFlipped(!isFlipped)} 
          className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 w-full min-h-[400px] flex flex-col items-center justify-center p-6 cursor-pointer relative group border border-gray-100"
        >
          {/* Source Tag */}
          <div className="absolute top-6 right-6">
            {currentCard!.source === 'new' ? 
              <span className="text-xs font-bold text-white bg-green-500 px-2 py-1 rounded shadow-sm">NEW</span> : 
              <span className="text-xs font-bold text-white bg-orange-500 px-2 py-1 rounded shadow-sm">AGAIN</span>
            }
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 text-center break-words w-full">
            {word.word}
          </h1>

          {/* Stars */}
          <div className="flex space-x-1 mb-8 opacity-50">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`text-sm ${i < word.stats.stars ? 'text-yellow-500' : 'text-gray-200'}`}>★</span>
            ))}
          </div>

          <div className={`text-gray-400 text-sm transition-opacity ${isFlipped ? 'opacity-0' : 'opacity-100'}`}>
            点击翻转
          </div>

          {/* B面 (答案) */}
          <div className={`absolute inset-0 bg-white z-10 flex flex-col p-8 text-left transition-all duration-300 rounded-3xl ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
             <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                <div>
                   <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider mb-2">Definition</h3>
                   <ul className="space-y-2">
                     {word.meanings.en?.slice(0, 2).map((m, i) => (
                       <li key={i} className="text-lg leading-snug text-gray-700 border-l-2 border-blue-500 pl-3">{m}</li>
                     ))}
                   </ul>
                </div>

                {word.examples?.teach && (
                  <div>
                    <h3 className="text-xs font-black text-gray-300 uppercase tracking-wider mb-2">Context</h3>
                    <div className="space-y-3">
                      {word.examples.teach.map((ex, i) => (
                        <div key={i} className="text-gray-600 bg-gray-50 p-3 rounded-xl text-sm leading-relaxed"
                             dangerouslySetInnerHTML={{ __html: ex.replace(/\*\*(.*?)\*\*/g, '<span class="text-blue-600 font-bold">$1</span>') }}
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

      {/* Interaction Bar */}
      <div className="p-6 grid grid-cols-2 gap-4 bg-white/50 backdrop-blur-md">
        <button 
          onClick={() => handleResponse('forgot')}
          className="flex flex-col items-center justify-center py-4 rounded-2xl bg-orange-100 text-orange-600 active:scale-95 transition-transform"
        >
          <span className="text-2xl mb-1">🤔</span>
          <span className="font-bold">不认识</span>
        </button>
        <button 
          onClick={() => handleResponse('easy')}
          className="flex flex-col items-center justify-center py-4 rounded-2xl bg-green-100 text-green-600 active:scale-95 transition-transform"
        >
          <span className="text-2xl mb-1">⚡️</span>
          <span className="font-bold">认识</span>
        </button>
      </div>
    </div>
  );
}
