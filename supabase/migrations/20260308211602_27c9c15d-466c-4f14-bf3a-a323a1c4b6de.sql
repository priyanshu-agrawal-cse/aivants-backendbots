
-- Lead Categories (Industry Workspaces)
CREATE TABLE public.lead_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  industry_type TEXT NOT NULL DEFAULT 'Other',
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own lead categories"
ON public.lead_categories FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Lead Sheets (groups of leads within a category)
CREATE TABLE public.lead_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.lead_categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  lead_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own lead sheets"
ON public.lead_sheets FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add sheet_id to leads table
ALTER TABLE public.leads ADD COLUMN sheet_id UUID REFERENCES public.lead_sheets(id) ON DELETE SET NULL;
