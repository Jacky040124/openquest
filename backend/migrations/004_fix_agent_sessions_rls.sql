-- Migration: Fix agent_sessions RLS policies for backend service role access
-- Run this in Supabase SQL Editor
--
-- Problem: The backend uses service role key to insert sessions,
-- but RLS policies require auth.uid() = user_id which fails for service role.
--
-- Solution: Add policies that allow all operations when the user_id is provided
-- (service role can insert/update/delete for any user_id it provides)

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own sessions" ON agent_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON agent_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON agent_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON agent_sessions;

-- New Policy: Allow SELECT for authenticated users (their own) OR service role (all)
CREATE POLICY "Select sessions" ON agent_sessions
    FOR SELECT USING (
        auth.uid() = user_id
        OR auth.role() = 'service_role'
    );

-- New Policy: Allow INSERT - service role can insert for any user_id
-- (backend validates user_id from JWT before calling DAO)
CREATE POLICY "Insert sessions" ON agent_sessions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        OR auth.role() = 'service_role'
    );

-- New Policy: Allow UPDATE for own sessions OR service role
CREATE POLICY "Update sessions" ON agent_sessions
    FOR UPDATE USING (
        auth.uid() = user_id
        OR auth.role() = 'service_role'
    );

-- New Policy: Allow DELETE for own sessions OR service role
CREATE POLICY "Delete sessions" ON agent_sessions
    FOR DELETE USING (
        auth.uid() = user_id
        OR auth.role() = 'service_role'
    );

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'agent_sessions';
