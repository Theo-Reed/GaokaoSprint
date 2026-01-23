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
    // Syntax question IDs are stored with prefix or just as is.
    // Let's assume they are unique strings in string format.
    // To distinguish from words, maybe the question IDs are distinct enough?
    // Vocab words are "abandon", "ability".
    // Syntax ids are like "tense_1", "clause_5"? Check data/training-data.ts later.
    // If collision risk, we should prefix.
    
    // Actually, let's fetch ALL and filter in memory or rely on upsert.
    // But better to distinguish. I will prefix local IDs with nothing (legacy) but maybe prefix when determining?
    // Wait, vocab uses the word itself. Syntax uses IDs from training-data.
    // Let's simply store them. If "abandon" is a syntax question ID, that's a conflict.
    // Checking Exam Pool...
    
    const { data } = await supabase.from('user_progress').select('word_id');
    if (data) {
      const dbIds = data.map(item => item.word_id).filter(id => id.startsWith('syntax:'));
      // Remove prefix for internal usage
      const cleanIds = dbIds.map(id => id.replace('syntax:', ''));
      setLocalCompleted(cleanIds);
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
          await supabase.from('user_progress').upsert({
              user_id: session.user.id,
              word_id: `syntax:${id}`
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
