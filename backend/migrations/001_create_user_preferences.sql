-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    languages TEXT[] DEFAULT '{}',
    skills JSONB DEFAULT '[]',
    project_interests TEXT[] DEFAULT '{}',
    issue_interests TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Add comment to table
COMMENT ON TABLE public.user_preferences IS 'User preferences for repository and issue recommendations';
COMMENT ON COLUMN public.user_preferences.user_id IS 'Foreign key reference to Supabase auth.users.id';
COMMENT ON COLUMN public.user_preferences.languages IS 'Programming languages like Python, TypeScript, Go';
COMMENT ON COLUMN public.user_preferences.skills IS 'List of Skill objects with name, category, familiarity';
COMMENT ON COLUMN public.user_preferences.project_interests IS 'Project types from ProjectInterest enum (webapp, llm, mobile, etc.)';
COMMENT ON COLUMN public.user_preferences.issue_interests IS 'Issue types from IssueInterest enum (bug_fix, optimization, etc.)';

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only read/update their own preferences
CREATE POLICY "Users can view own preferences"
    ON public.user_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
    ON public.user_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
    ON public.user_preferences
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy: Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
    ON public.user_preferences
    FOR DELETE
    USING (auth.uid() = user_id);

