
-- Add body column to campaigns table
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS body text DEFAULT '';

-- Create campaign_leads junction table
CREATE TABLE public.campaign_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  added_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, lead_id)
);

-- Enable RLS
ALTER TABLE public.campaign_leads ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users can manage own campaign leads"
  ON public.campaign_leads
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
