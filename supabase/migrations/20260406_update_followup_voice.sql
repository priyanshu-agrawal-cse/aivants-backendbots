-- Add voice columns to followup_steps table
ALTER TABLE public.followup_steps 
ADD COLUMN IF NOT EXISTS voice_persona_id TEXT,
ADD COLUMN IF NOT EXISTS voice_from_number TEXT;

-- Update the existing channel to allow 'voice' (Check constraints if any)
-- Most tables use simple text for channel.

-- Ensure followup_status has campaign_id link (should already have it)
-- This is used for the "from number" fallback.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'followup_status' AND column_name = 'campaign_id'
    ) THEN
        ALTER TABLE public.followup_status ADD COLUMN campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;
    END IF;
END $$;
