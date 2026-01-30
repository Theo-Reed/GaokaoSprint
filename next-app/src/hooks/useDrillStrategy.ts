import { useState, useEffect, useCallback } from 'react';
import { getUserProgressMap, incrementRightCount } from '@/lib/drill-db';

export interface DrillQuestion {
  id: string;
  [key: string]: any;
}

export function useDrillStrategy<T extends DrillQuestion>(
  allQuestions: T[], 
  subject: string = 'biology'
) {
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Load progress on mount
  useEffect(() => {
    let mounted = true;
    getUserProgressMap(subject).then((map) => {
      if (mounted) {
        setProgressMap(map);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [subject]);

  // Mark a question as correct (Optimistic UI + DB sync)
  const markAsCorrect = useCallback(async (qId: string) => {
    // Optimistic update
    setProgressMap(prev => ({
      ...prev,
      [qId]: (prev[qId] || 0) + 1
    }));
    
    // DB update
    await incrementRightCount(qId, subject);
  }, [subject]);

  // Pick next question based on weights
  const pickNextQuestion = useCallback((currentId?: string): T | null => {
    if (!allQuestions || allQuestions.length === 0) return null;
    
    // If loading, just random (fallback)
    if (loading) {
      const candidates = currentId 
        ? allQuestions.filter(q => q.id !== currentId) 
        : allQuestions;
      if (candidates.length === 0) return null;
      return candidates[Math.floor(Math.random() * candidates.length)];
    }

    // Filter out current question
    const candidates = currentId 
      ? allQuestions.filter(q => q.id !== currentId) 
      : allQuestions;
      
    if (candidates.length === 0) {
      return allQuestions[0] || null;
    }

    // Simple Greedy Strategy:
    // 1. Find the minimum 'right_count' among all candidates
    // 2. Pick a random question from that minimum group
    
    let minCount = Infinity;
    for (const q of candidates) {
      const count = progressMap[q.id] || 0;
      if (count < minCount) {
        minCount = count;
      }
    }

    const minBucket = candidates.filter(q => (progressMap[q.id] || 0) === minCount);
    
    return minBucket[Math.floor(Math.random() * minBucket.length)];
  }, [allQuestions, progressMap, loading]);

  return {
    pickNextQuestion,
    markAsCorrect,
    loading,
    progressMap
  };
}
