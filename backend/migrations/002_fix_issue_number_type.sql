-- Migration: Fix issue_number column type to handle large GitHub issue IDs
-- Run this in Supabase SQL Editor

-- GitHub issue IDs can exceed PostgreSQL INT max value (2,147,483,647)
-- Change to BIGINT to support values up to 9,223,372,036,854,775,807

ALTER TABLE agent_sessions
ALTER COLUMN issue_number TYPE BIGINT;

-- Verify the change
COMMENT ON COLUMN agent_sessions.issue_number IS 'GitHub issue number/ID (BIGINT to support large values)';
