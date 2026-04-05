
-- Outreach Scripts table
CREATE TABLE public.outreach_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'cold_outreach',
  hook text NOT NULL DEFAULT '',
  context text NOT NULL DEFAULT '',
  value_proposition text NOT NULL DEFAULT '',
  proof text NOT NULL DEFAULT '',
  call_to_action text NOT NULL DEFAULT '',
  full_template text NOT NULL DEFAULT '',
  variables text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.outreach_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scripts"
  ON public.outreach_scripts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Content Assets table
CREATE TABLE public.content_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'pdf',
  category text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.content_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own content assets"
  ON public.content_assets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket for content assets
INSERT INTO storage.buckets (id, name, public) VALUES ('content-assets', 'content-assets', false);

CREATE POLICY "Authenticated users can upload content assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'content-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own content assets"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'content-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own content assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'content-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
