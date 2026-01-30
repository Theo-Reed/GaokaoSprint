-- Enable RLS for the table
ALTER TABLE user_drill_progress ENABLE ROW LEVEL SECURITY;

-- DROP existing policies to clean up potential conflicts
DROP POLICY IF EXISTS "Users can view their own progress" ON user_drill_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_drill_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_drill_progress;
DROP POLICY IF EXISTS "Users can upsert their own progress" ON user_drill_progress;

-- 1. SELECT Policy (Read)
CREATE POLICY "Users can view their own progress"
ON user_drill_progress FOR SELECT
USING (auth.uid() = user_id);

-- 2. INSERT Policy (Create)
CREATE POLICY "Users can insert their own progress"
ON user_drill_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE Policy (Modify)
CREATE POLICY "Users can update their own progress"
ON user_drill_progress FOR UPDATE
USING (auth.uid() = user_id);
