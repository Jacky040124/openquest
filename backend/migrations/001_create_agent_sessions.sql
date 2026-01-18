-- Migration: Create agent_sessions table for persistent session management
-- Run this in Supabase SQL Editor

-- Create the agent_sessions table
CREATE TABLE IF NOT EXISTS agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    repo_url TEXT NOT NULL,
    issue_number INT NOT NULL,
    issue_title TEXT NOT NULL,
    solution JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 hour'),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'implementing', 'completed', 'expired', 'failed'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_expires_at ON agent_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);

-- Enable Row Level Security
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON agent_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own sessions
CREATE POLICY "Users can create own sessions" ON agent_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON agent_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" ON agent_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update expires_at when last_accessed_at changes
CREATE OR REPLACE FUNCTION update_session_expiry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.expires_at = NEW.last_accessed_at + INTERVAL '1 hour';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update expires_at
DROP TRIGGER IF EXISTS trigger_update_session_expiry ON agent_sessions;
CREATE TRIGGER trigger_update_session_expiry
    BEFORE UPDATE OF last_accessed_at ON agent_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_expiry();

-- Comment on table
COMMENT ON TABLE agent_sessions IS 'Stores agent analysis sessions with TTL-based expiry';
COMMENT ON COLUMN agent_sessions.solution IS 'JSON containing summary, affected_files, code_changes, commit_message';
COMMENT ON COLUMN agent_sessions.status IS 'pending: awaiting implementation, implementing: in progress, completed: done, expired: TTL exceeded, failed: error occurred';
