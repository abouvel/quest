-- Migration: Add RLS policies for users table
-- Run this in your Supabase SQL Editor

-- Enable RLS on users table if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Policy for users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy for users to view all users (for leaderboard functionality)
-- This allows authenticated users to see basic info of other users
CREATE POLICY "Users can view all users for leaderboard" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Optional: If you want to restrict what fields are visible to other users
-- You can create a more restrictive policy that only shows id and email
-- CREATE POLICY "Users can view limited user info" ON public.users
--   FOR SELECT USING (auth.role() = 'authenticated')
--   WITH CHECK (true); 