
-- Follow-up sequences table
CREATE TABLE public.followup_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.followup_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sequences"
  ON public.followup_sequences FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Follow-up steps table
CREATE TABLE public.followup_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES public.followup_sequences(id) ON DELETE CASCADE,
  step_number integer NOT NULL DEFAULT 1,
  delay_days integer NOT NULL DEFAULT 1,
  script_id uuid REFERENCES public.outreach_scripts(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  content_asset_id uuid REFERENCES public.content_assets(id) ON DELETE SET NULL,
  subject_override text DEFAULT '',
  body_override text DEFAULT '',
  channel text NOT NULL DEFAULT 'email',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.followup_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own followup steps"
  ON public.followup_steps FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.followup_sequences fs
      WHERE fs.id = followup_steps.sequence_id AND fs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.followup_sequences fs
      WHERE fs.id = followup_steps.sequence_id AND fs.user_id = auth.uid()
    )
  );

-- Follow-up status per lead
CREATE TABLE public.followup_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  sequence_id uuid NOT NULL REFERENCES public.followup_sequences(id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 0,
  last_email_sent_at timestamp with time zone,
  next_followup_date timestamp with time zone,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.followup_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own followup status"
  ON public.followup_status FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Enable realtime on followup_status for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.followup_status;
