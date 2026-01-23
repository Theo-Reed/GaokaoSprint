'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AuthOverlay from '@/components/AuthOverlay';

export function useGrammarProgress(isCn: boolean) {
  const [session, setSession] = useState<any>(null);
  const [localCompleted, setLocalCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. 初始化
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProgress(session.user.id);
      } else {
        // Fallback to localStorage for initial load if no user (or we block)
        // But requested is to store to database, so we focus on DB.
        // We still support localStorage for non-logged in? No, strictly requested strict mode earlier.
        // But let's check localStorage just in case to sync?
        // Let's keep it simple: strict auth requested for Vocab, maybe Syntax too?
        // The user says "also store syntax tool to DB", implying strict logic might apply or at least sync.
        
        // For now, load local storage as migration/fallback source
        loadLocal();
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProgress(session.user.id);
      else {
        loadLocal();
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadLocal = () => {
    if (typeof window === 'undefined') return;
     try {
      const stored = localStorage.getItem('gaokao_completed_questions');
      if (stored) {
          setLocalCompleted(JSON.parse(stored));
      }
    } catch {}
  }

  // 2. 从数据库拉取
  const fetchProgress = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase.from('user_syntax_progress').select('syntax_id');
    if (data) {
      setLocalCompleted(data.map(item => item.syntax_id));
    }
    setLoading(false);
  };

  // 3. Mark as completed
  const markCompleted = async (id: string) => {
      // Optimistic update
      setLocalCompleted(prev => {
          if (prev.includes(id)) return prev;
          return [...prev, id];
      });

      // DB Sync
      if (session) {
          await supabase.from('user_syntax_progress').upsert({
              user_id: session.user.id,
              syntax_id: id
          });
      }

      // Local Sync (Legacy/Backup)
      const current = getLocalCompletedRaw();
      if (!current.includes(id)) {
          localStorage.setItem('gaokao_completed_questions', JSON.stringify([...current, id]));
      }
  };

  const getLocalCompletedRaw = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('gaokao_completed_questions');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  };
  
  return {
    session,
    loading,
    completedIds: localCompleted,
    markCompleted
  };
}
