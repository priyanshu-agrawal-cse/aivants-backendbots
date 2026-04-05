
-- Add description and followup_type to followup_sequences
ALTER TABLE public.followup_sequences 
ADD COLUMN IF NOT EXISTS description text DEFAULT '',
ADD COLUMN IF NOT EXISTS followup_type text NOT NULL DEFAULT 'sales';

-- Add action_type and notes to followup_steps
ALTER TABLE public.followup_steps
ADD COLUMN IF NOT EXISTS action_type text NOT NULL DEFAULT 'email',
ADD COLUMN IF NOT EXISTS notes text DEFAULT '';

-- Add followup_type and condition_stop_on to followup_status
ALTER TABLE public.followup_status
ADD COLUMN IF NOT EXISTS followup_type text NOT NULL DEFAULT 'sales',
ADD COLUMN IF NOT EXISTS scheduled_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS condition_stop_on text DEFAULT NULL;
