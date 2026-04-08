-- Add voice-related columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS voice_persona_id TEXT DEFAULT 'default_persona',
ADD COLUMN IF NOT EXISTS voice_from_number TEXT;

-- Add captured_responses to voice_calls table
ALTER TABLE public.voice_calls
ADD COLUMN IF NOT EXISTS response_data JSONB DEFAULT '{}';

-- Update RLS policies to ensure user can update their own campaigns with new fields
-- (Current policies should already handle this if they are set to ALL, but good to be safe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'campaigns' AND policyname = 'Users can manage own campaigns'
    ) THEN
        CREATE POLICY "Users can manage own campaigns" ON public.campaigns 
        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
