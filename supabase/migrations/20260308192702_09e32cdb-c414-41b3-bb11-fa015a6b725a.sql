
-- Add deal_value to pipeline_stages
ALTER TABLE public.pipeline_stages ADD COLUMN IF NOT EXISTS deal_value numeric DEFAULT 0;

-- Add reply classification columns to email_logs
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS reply_classification text DEFAULT null;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS reply_sentiment text DEFAULT null;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS reply_body text DEFAULT null;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS channel text DEFAULT 'email';

-- Create channel_activities table for multi-channel tracking
CREATE TABLE IF NOT EXISTS public.channel_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'email',
  activity_type text NOT NULL DEFAULT 'sent',
  notes text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.channel_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own channel activities"
  ON public.channel_activities
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
