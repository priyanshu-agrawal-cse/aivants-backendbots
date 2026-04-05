-- Proposals table
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  client_name TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  document_url TEXT,
  document_name TEXT,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own proposals" ON public.proposals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket for proposal documents
INSERT INTO storage.buckets (id, name, public) VALUES ('proposals', 'proposals', true);

CREATE POLICY "Authenticated users can upload proposals" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'proposals');

CREATE POLICY "Authenticated users can read proposals" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'proposals');

CREATE POLICY "Users can delete own proposal files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'proposals');