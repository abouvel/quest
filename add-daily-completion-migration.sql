-- Migration: Add daily_completed_date to users table
-- Run this in your Supabase SQL Editor

-- Add the new column
ALTER TABLE users 
ADD COLUMN daily_completed_date DATE;

-- Add a comment to document the column
COMMENT ON COLUMN users.daily_completed_date IS 'tracks the last date user completed a quest';

-- Optional: Update existing users to have a default value (if needed)
-- UPDATE users SET daily_completed_date = NULL WHERE daily_completed_date IS NULL; 