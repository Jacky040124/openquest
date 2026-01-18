-- Migration: Fix user_preferences RLS policies to allow service role access
-- This ensures the backend can update github_token and other fields
-- Run this in Supabase SQL Editor

-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;

-- Create new policies that allow both:
-- 1. Users to manage their own preferences (auth.uid() = user_id)
-- 2. Service role to manage any preferences (for backend operations)

-- SELECT policy
CREATE POLICY "user_preferences_select_policy" ON public.user_preferences
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR auth.role() = 'service_role'
        OR current_setting('role', true) = 'service_role'
    );

-- INSERT policy
CREATE POLICY "user_preferences_insert_policy" ON public.user_preferences
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR auth.role() = 'service_role'
        OR current_setting('role', true) = 'service_role'
    );

-- UPDATE policy
CREATE POLICY "user_preferences_update_policy" ON public.user_preferences
    FOR UPDATE
    USING (
        auth.uid() = user_id
        OR auth.role() = 'service_role'
        OR current_setting('role', true) = 'service_role'
    );

-- DELETE policy
CREATE POLICY "user_preferences_delete_policy" ON public.user_preferences
    FOR DELETE
    USING (
        auth.uid() = user_id
        OR auth.role() = 'service_role'
        OR current_setting('role', true) = 'service_role'
    );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'user_preferences';
