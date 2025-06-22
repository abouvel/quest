-- Complete setup for Quest App RLS and Storage Policies
-- Run this entire script in your Supabase SQL Editor

-- ========================================
-- 1. ENABLE RLS ON QUESTS TABLE
-- ========================================
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. QUESTS TABLE POLICIES
-- ========================================

-- SELECT policy: Any authenticated user can view all quests
CREATE POLICY "Any authenticated user can view quests"
ON public.quests
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  true
);

-- INSERT policy: Only users can insert their own quests
CREATE POLICY "Users can insert their own quests"
ON public.quests
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- UPDATE policy: Only users can update their own quests
CREATE POLICY "Users can update their own quests"
ON public.quests
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
);

-- DELETE policy: Only users can delete their own quests
CREATE POLICY "Users can delete their own quests"
ON public.quests
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
);

-- ========================================
-- 3. ADD IMAGE_PATH COLUMN
-- ========================================
ALTER TABLE quests ADD COLUMN IF NOT EXISTS image_path TEXT;

-- ========================================
-- 4. STORAGE POLICIES FOR LOCATION-IMG BUCKET
-- ========================================

-- Policy for uploading to private folder
CREATE POLICY "Users can upload to their private folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'location-img'::text 
  AND (storage.foldername(name))[1] = 'private'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy for reading from private folder (only own images)
CREATE POLICY "Users can read their own private images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'location-img'::text 
  AND (storage.foldername(name))[1] = 'private'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy for updating own private images
CREATE POLICY "Users can update their own private images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'location-img'::text 
  AND (storage.foldername(name))[1] = 'private'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy for deleting own private images
CREATE POLICY "Users can delete their own private images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'location-img'::text 
  AND (storage.foldername(name))[1] = 'private'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- ========================================
-- 5. VERIFICATION QUERIES
-- ========================================

-- Check if RLS is enabled on quests table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'quests';

-- Check quests table policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'quests';

-- Check storage policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check if image_path column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quests' AND column_name = 'image_path'; 