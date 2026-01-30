import { supabase } from '@/lib/supabase';

/**
 * Increment the "right_count" for a specific question.
 * Uses atomic upset (or read-modify-type) to increment.
 */
export async function incrementRightCount(questionId: string, subject: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 1. Check existing record
  const { data: existing, error: fetchError } = await supabase
    .from('user_drill_progress')
    .select('right_count')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .eq('subject', subject)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
    console.error('Error fetching progress:', fetchError);
    return;
  }

  const newCount = (existing?.right_count || 0) + 1;

  // 2. Upsert
  const { error: upsertError } = await supabase
    .from('user_drill_progress')
    .upsert({
      user_id: user.id,
      question_id: questionId,
      subject: subject,
      right_count: newCount
    }, { onConflict: 'user_id,question_id' });

  if (upsertError) {
    console.error('Error updating progress:', JSON.stringify(upsertError, null, 2));
  }
}

/**
 * Get map of { questionId: rightCount } for a subject
 */
export async function getUserProgressMap(subject: string): Promise<Record<string, number>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data, error } = await supabase
    .from('user_drill_progress')
    .select('question_id, right_count')
    .eq('user_id', user.id)
    .eq('subject', subject);

  if (error) {
    console.error('Error loading progress map:', error);
    return {};
  }

  const map: Record<string, number> = {};
  data?.forEach((row: any) => {
    map[row.question_id] = row.right_count;
  });
  return map;
}
