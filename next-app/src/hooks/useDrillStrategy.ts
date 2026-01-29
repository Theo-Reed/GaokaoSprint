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
      
    if (candidates.length === 0) return null;

    // Bucket sort
    // Bucket 0: Never mastered (right_count == 0 or undefined) -> Priority
    // Bucket 1: Low mastery (right_count == 1)
    // Bucket 2: High mastery (right_count > 1)
    
    const zeroBucket: T[] = [];
    const lowBucket: T[] = [];
    const highBucket: T[] = [];

    // Using a simple loop is faster than multiple filters for large arrays
    for (const q of candidates) {
      const count = progressMap[q.id] || 0;
      if (count === 0) {
        zeroBucket.push(q);
      } else if (count === 1) {
        lowBucket.push(q);
      } else {
        highBucket.push(q);
      }
    }

    // Weighted Random Strategy
    // 80% chance to pick from Zero Bucket if not empty
    // 15% chance to pick from Low Bucket (Review)
    // 5% chance to pick from High Bucket (Deep Review) or whatever is left
    
    const rand = Math.random();

    // Priority 1: Zero Bucket (New or Wrong) - 80% weight
    if (zeroBucket.length > 0) {
      // If rand < 0.8, pick here.
      // But if other buckets are empty, we MUST pick here.
      const othersEmpty = lowBucket.length === 0 && highBucket.length === 0;
      if (othersEmpty || rand < 0.8) {
        return zeroBucket[Math.floor(Math.random() * zeroBucket.length)];
      }
    }

    // Priority 2: Low Bucket (Review) - 15% weight (0.8 to 0.95)
    if (lowBucket.length > 0) {
      const zeroEmpty = zeroBucket.length === 0;
      const highEmpty = highBucket.length === 0;
      
      // Pick here if:
      // - It falls in 0.8-0.95 range
      // - OR zero bucket was empty (so rand < 0.8 flowed here)
      // - OR high bucket is empty and we skipped zero (unlikely but logic holds)
      
      if (zeroEmpty || (rand >= 0.8 && rand < 0.95) || highEmpty) {
         // Optimization: if we are here because zero was empty, we treat the probability space as 0..0.95? 
         // Let's keep it simple: if we didn't pick zero, we try here.
         return lowBucket[Math.floor(Math.random() * lowBucket.length)];
      }
    }

    // Priority 3: High Bucket - Leftovers
    if (highBucket.length > 0) {
      return highBucket[Math.floor(Math.random() * highBucket.length)];
    }

    // Fallback (should be covered, but just in case buckets were weird)
    return candidates[Math.floor(Math.random() * candidates.length)];

  }, [allQuestions, progressMap, loading]);

  return {
    pickNextQuestion,
    markAsCorrect,
    loading,
    progressMap
  };
}
