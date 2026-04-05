
-- Add enhanced fields to followup_status
ALTER TABLE public.followup_status
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'lead',
ADD COLUMN IF NOT EXISTS sender_name text DEFAULT '',
ADD COLUMN IF NOT EXISTS sender_email text DEFAULT '',
ADD COLUMN IF NOT EXISTS purpose text DEFAULT '',
ADD COLUMN IF NOT EXISTS end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS notes text DEFAULT '',
ADD COLUMN IF NOT EXISTS client_name text DEFAULT '',
ADD COLUMN IF NOT EXISTS client_email text DEFAULT '',
ADD COLUMN IF NOT EXISTS client_company text DEFAULT '';
