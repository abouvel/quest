-- Simple migration to add likes and comments to quests table
-- Run this in your Supabase SQL Editor

-- Add likes column (integer count)
ALTER TABLE quests ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

-- Add comments column (JSON array with username and content)
ALTER TABLE quests ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;

-- Simple function to increment likes
CREATE OR REPLACE FUNCTION increment_quest_likes(quest_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_like_count INTEGER;
BEGIN
  UPDATE quests 
  SET likes = COALESCE(likes, 0) + 1 
  WHERE id = quest_id;
  
  SELECT likes INTO new_like_count FROM quests WHERE id = quest_id;
  RETURN new_like_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple function to add comment
CREATE OR REPLACE FUNCTION add_quest_comment(quest_id UUID, comment_text TEXT)
RETURNS JSONB AS $$
DECLARE
  current_comments JSONB;
  new_comment JSONB;
  username TEXT;
BEGIN
  -- Get username from auth.users
  SELECT COALESCE(raw_user_meta_data->>'username', email) INTO username 
  FROM auth.users WHERE id = auth.uid();
  
  -- Create new comment
  new_comment := jsonb_build_object(
    'username', username,
    'content', comment_text,
    'created_at', now()
  );
  
  -- Get current comments and add new one
  SELECT COALESCE(comments, '[]'::jsonb) || jsonb_build_array(new_comment) 
  INTO current_comments 
  FROM quests WHERE id = quest_id;
  
  -- Update the quest
  UPDATE quests SET comments = current_comments WHERE id = quest_id;
  
  RETURN current_comments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 3. UPDATE RLS POLICIES FOR LIKES AND COMMENTS
-- ========================================

-- Allow users to update likes and comments on any quest (for social features)
DROP POLICY IF EXISTS "Users can update their own quests" ON quests;
CREATE POLICY "Users can update quests for likes and comments"
ON quests
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  -- Allow updates to likes and comments on any quest
  -- But only allow other updates on own quests
  (likes IS DISTINCT FROM OLD.likes OR comments IS DISTINCT FROM OLD.comments) OR
  auth.uid() = user_id
);

-- ========================================
-- 4. CREATE HELPER FUNCTIONS FOR FRONTEND
-- ========================================

-- Function to get like count
CREATE OR REPLACE FUNCTION get_quest_like_count(quest_id UUID)
RETURNS INTEGER AS $$
DECLARE
  like_count INTEGER;
BEGIN
  SELECT jsonb_array_length(likes) INTO like_count 
  FROM quests WHERE id = quest_id;
  
  RETURN COALESCE(like_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user liked a quest
CREATE OR REPLACE FUNCTION has_user_liked_quest(quest_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_liked BOOLEAN;
BEGIN
  SELECT likes ? auth.uid()::text INTO user_liked 
  FROM quests WHERE id = quest_id;
  
  RETURN COALESCE(user_liked, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 5. VERIFICATION QUERIES
-- ========================================

-- Check if columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quests' AND column_name IN ('likes', 'comments');

-- Check if functions were created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('increment_quest_likes', 'add_quest_comment', 'get_quest_like_count', 'has_user_liked_quest'); 