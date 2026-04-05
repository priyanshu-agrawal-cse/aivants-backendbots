
CREATE TABLE public.company_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  website_summary text DEFAULT '',
  services text DEFAULT '',
  growth_signals text DEFAULT '',
  hiring_signals text DEFAULT '',
  marketing_activity text DEFAULT '',
  industry_focus text DEFAULT '',
  outreach_angle text DEFAULT '',
  ai_opening_line text DEFAULT '',
  raw_data jsonb DEFAULT '{}',
  researched_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.company_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own intelligence"
  ON public.company_intelligence FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
