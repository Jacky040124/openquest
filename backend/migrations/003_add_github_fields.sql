-- Migration: Add GitHub token and username fields to user_preferences
-- Run this in Supabase SQL Editor

-- Add github_token field for storing OAuth token
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS github_token TEXT DEFAULT NULL;

-- Add github_username field for display
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS github_username TEXT DEFAULT NULL;

-- Add comments
COMMENT ON COLUMN public.user_preferences.github_token IS 'GitHub OAuth token for agent push functionality';
COMMENT ON COLUMN public.user_preferences.github_username IS 'GitHub username for display';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_preferences'
  AND column_name IN ('github_token', 'github_username');
