import { supabase } from '@/lib/supabase';

/**
 * Increment the "right_count" for a specific question.
 * Uses atomic upset (or read-modify-type) to increment.
 */
export async function incrementRightCount(questionId: string, subject: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 1. Check existing record. 
  // We use simpler query to avoid "Column not found" errors if 'id' or 'created_at' are missing.
  // We update ALL matching rows if duplicates exist, which is acceptable here.
  const { data: existingData, error: fetchError } = await supabase
    .from('user_drill_progress')
    .select('right_count')
    .eq('user_id', user.id)
    .eq('question_id', questionId)
    .eq('subject', subject)
    .limit(1);

  if (fetchError) {
    console.error('Error fetching progress (read):', JSON.stringify(fetchError, null, 2));
    // If table doesn't exist or serious error, we probably shouldn't proceed.
    return;
  }

  const existingRow = existingData?.[0];
  const newCount = (existingRow?.right_count || 0) + 1;

  if (existingRow) {
    // 2. Update all matching rows (safe if duplicates exist)
    const { error: updateError } = await supabase
      .from('user_drill_progress')
      .update({ right_count: newCount })
      .eq('user_id', user.id)
      .eq('question_id', questionId)
      .eq('subject', subject);
      
    if (updateError) {
      console.error('Error updating progress (update):', updateError);
    }
  } else {
    // 3. Insert new record
    const { error: insertError } = await supabase
      .from('user_drill_progress')
      .insert({
        user_id: user.id,
        question_id: questionId,
        subject: subject,
        right_count: newCount
      });

    if (insertError) {
       // Check specifically for RLS violation
       if (insertError.code === '42501') {
         console.error('🛑 [DrillDB] Permission Denied: Please run scripts/fix_supabase_rls.sql in Supabase SQL Editor.');
       }
       // If Insert fails (e.g. RLS or Constraint), log it.
       // It's possible a race condition created the row between our read and insert.
       console.error('Error updating progress (insert):', insertError);
    }
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
  
  if (!data || data.length === 0) {
    console.warn(`[DrillDB] No progress records found for subject: ${subject} (User: ${user.id})`);
  } else {
    console.log(`[DrillDB] Loaded ${data.length} progress records for ${subject}`);
  }

  const map: Record<string, number> = {};
  data?.forEach((row: any) => {
    map[row.question_id] = row.right_count;
  });
  return map;
}
