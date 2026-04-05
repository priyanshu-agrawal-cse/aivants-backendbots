
-- Companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own companies" ON public.companies FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT,
  company_name TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  score INTEGER DEFAULT 0,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own leads" ON public.leads FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  subject TEXT,
  template_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own campaigns" ON public.campaigns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Email templates table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own templates" ON public.email_templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add foreign key for campaigns.template_id
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.email_templates(id) ON DELETE SET NULL;

-- Email logs table
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'sent',
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own email_logs" ON public.email_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Pipeline stages table
CREATE TABLE public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  stage TEXT NOT NULL DEFAULT 'prospect',
  meeting_booked BOOLEAN NOT NULL DEFAULT false,
  client_won BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own pipeline_stages" ON public.pipeline_stages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS query TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS rating NUMERIC(3,1);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS reviews INTEGER DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tags TEXT[];

CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  from_email text DEFAULT '',
  email_provider text DEFAULT 'sendgrid',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON public.user_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

-- Enable required extensions for cron job
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

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
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_logs;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS webhook_secret text DEFAULT null;

CREATE TABLE IF NOT EXISTS public.telegram_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  telegram_chat_id bigint NOT NULL,
  telegram_username text,
  is_active boolean NOT NULL DEFAULT true,
  linked_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(telegram_chat_id)
);

ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own telegram link"
  ON public.telegram_users
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
ALTER TABLE public.telegram_users 
ADD COLUMN notification_prefs jsonb NOT NULL DEFAULT '{"replies": true, "meetings": true, "campaigns": true}'::jsonb;

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
-- Clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  industry TEXT,
  contract_start DATE,
  contract_end DATE,
  monthly_payment NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own clients" ON public.clients
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  monthly_cost NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own team members" ON public.team_members
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_date DATE,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'planning',
  team_notifications BOOLEAN NOT NULL DEFAULT true,
  client_notifications BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects" ON public.projects
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Project team assignments
CREATE TABLE public.project_team_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'contributor',
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, team_member_id)
);

ALTER TABLE public.project_team_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own project assignments" ON public.project_team_assignments
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = project_team_assignments.project_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = project_team_assignments.project_id AND p.user_id = auth.uid()
  ));

-- Project milestones
CREATE TABLE public.project_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own project milestones" ON public.project_milestones
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = project_milestones.project_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = project_milestones.project_id AND p.user_id = auth.uid()
  ));
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

CREATE TABLE public.revenue_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'payment',
  category TEXT NOT NULL DEFAULT 'client_payment',
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_interval TEXT DEFAULT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.revenue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own revenue entries"
ON public.revenue_entries FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Chat conversations table
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own conversations" ON public.chat_conversations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL DEFAULT '',
  tool_calls JSONB,
  tool_results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own messages" ON public.chat_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.chat_conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.chat_conversations c WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()));

-- AI Knowledge Base
CREATE TABLE public.ai_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own knowledge" ON public.ai_knowledge_base FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- AI Settings
CREATE TABLE public.ai_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'lovable',
  api_key TEXT,
  model_name TEXT DEFAULT 'google/gemini-3-flash-preview',
  temperature NUMERIC DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 4096,
  widget_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ai settings" ON public.ai_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- Fix orphaned data risk by adding ON DELETE CASCADE to foreign keys

-- 1. lead_sheets.category_id -> lead_categories
ALTER TABLE public.lead_sheets 
DROP CONSTRAINT IF EXISTS lead_sheets_category_id_fkey;

ALTER TABLE public.lead_sheets
ADD CONSTRAINT lead_sheets_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.lead_categories(id) ON DELETE CASCADE;

-- 2. project_team_assignments.project_id -> projects
ALTER TABLE public.project_team_assignments 
DROP CONSTRAINT IF EXISTS project_team_assignments_project_id_fkey;

ALTER TABLE public.project_team_assignments
ADD CONSTRAINT project_team_assignments_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- 3. project_team_assignments.team_member_id -> team_members
ALTER TABLE public.project_team_assignments 
DROP CONSTRAINT IF EXISTS project_team_assignments_team_member_id_fkey;

ALTER TABLE public.project_team_assignments
ADD CONSTRAINT project_team_assignments_team_member_id_fkey 
FOREIGN KEY (team_member_id) REFERENCES public.team_members(id) ON DELETE CASCADE;

-- 4. project_milestones.project_id -> projects
ALTER TABLE public.project_milestones 
DROP CONSTRAINT IF EXISTS project_milestones_project_id_fkey;

ALTER TABLE public.project_milestones
ADD CONSTRAINT project_milestones_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- 5. leads.sheet_id -> lead_sheets (SET NULL on delete to preserve leads)
ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS leads_sheet_id_fkey;

ALTER TABLE public.leads
ADD CONSTRAINT leads_sheet_id_fkey 
FOREIGN KEY (sheet_id) REFERENCES public.lead_sheets(id) ON DELETE SET NULL;

-- 6. pipeline_stages.lead_id -> leads
ALTER TABLE public.pipeline_stages 
DROP CONSTRAINT IF EXISTS pipeline_stages_lead_id_fkey;

ALTER TABLE public.pipeline_stages
ADD CONSTRAINT pipeline_stages_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;

-- 7. followup_status.lead_id -> leads
ALTER TABLE public.followup_status 
DROP CONSTRAINT IF EXISTS followup_status_lead_id_fkey;

ALTER TABLE public.followup_status
ADD CONSTRAINT followup_status_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;

-- 8. followup_status.sequence_id -> followup_sequences
ALTER TABLE public.followup_status 
DROP CONSTRAINT IF EXISTS followup_status_sequence_id_fkey;

ALTER TABLE public.followup_status
ADD CONSTRAINT followup_status_sequence_id_fkey 
FOREIGN KEY (sequence_id) REFERENCES public.followup_sequences(id) ON DELETE CASCADE;

-- 9. followup_steps.sequence_id -> followup_sequences
ALTER TABLE public.followup_steps 
DROP CONSTRAINT IF EXISTS followup_steps_sequence_id_fkey;

ALTER TABLE public.followup_steps
ADD CONSTRAINT followup_steps_sequence_id_fkey 
FOREIGN KEY (sequence_id) REFERENCES public.followup_sequences(id) ON DELETE CASCADE;

-- 10. email_logs.lead_id -> leads (SET NULL to preserve history)
ALTER TABLE public.email_logs 
DROP CONSTRAINT IF EXISTS email_logs_lead_id_fkey;

ALTER TABLE public.email_logs
ADD CONSTRAINT email_logs_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

-- 11. company_intelligence.lead_id -> leads
ALTER TABLE public.company_intelligence 
DROP CONSTRAINT IF EXISTS company_intelligence_lead_id_fkey;

ALTER TABLE public.company_intelligence
ADD CONSTRAINT company_intelligence_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;

-- 12. channel_activities.lead_id -> leads (SET NULL to preserve activity log)
ALTER TABLE public.channel_activities 
DROP CONSTRAINT IF EXISTS channel_activities_lead_id_fkey;

ALTER TABLE public.channel_activities
ADD CONSTRAINT channel_activities_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

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

CREATE TABLE public.telegram_chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_chat_id bigint NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL DEFAULT '',
  pending_action jsonb DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_telegram_chat_history_chat_id ON public.telegram_chat_history(telegram_chat_id, created_at DESC);

ALTER TABLE public.telegram_chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on telegram_chat_history"
ON public.telegram_chat_history
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'team_member', 'viewer');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. RLS policies for user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Create system_logs table
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  details JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs, users can view own logs
CREATE POLICY "Admins can view all logs"
  ON public.system_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own logs"
  ON public.system_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can insert logs (from edge functions)
CREATE POLICY "Service can insert logs"
  ON public.system_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index for fast log queries
CREATE INDEX idx_system_logs_user_id ON public.system_logs(user_id);
CREATE INDEX idx_system_logs_category ON public.system_logs(category);
CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at DESC);

-- 7. Create ai_memory table for persistent AI context
CREATE TABLE public.ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  memory_type TEXT NOT NULL DEFAULT 'context',
  key TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, memory_type, key)
);

ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own AI memory"
  ON public.ai_memory
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ai_memory_user_type ON public.ai_memory(user_id, memory_type);
CREATE INDEX idx_ai_memory_expires ON public.ai_memory(expires_at) WHERE expires_at IS NOT NULL;

-- 8. Create automation_jobs table for tracking scheduled jobs
CREATE TABLE public.automation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB DEFAULT '{}'::jsonb,
  result JSONB,
  error_message TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own automation jobs"
  ON public.automation_jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own automation jobs"
  ON public.automation_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_automation_jobs_status ON public.automation_jobs(status, scheduled_for);
CREATE INDEX idx_automation_jobs_user ON public.automation_jobs(user_id);

-- 9. Auto-assign admin role to first user (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the first user; make them admin
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
-- Enable required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- General settings table for company-wide configuration
CREATE TABLE public.general_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_name text NOT NULL DEFAULT 'Aivants',
  timezone text NOT NULL DEFAULT 'UTC',
  date_format text NOT NULL DEFAULT 'MM/DD/YYYY',
  currency text NOT NULL DEFAULT 'USD',
  language text NOT NULL DEFAULT 'en',
  brand_primary_color text NOT NULL DEFAULT '#3b82f6',
  brand_secondary_color text NOT NULL DEFAULT '#6366f1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.general_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own general settings"
  ON public.general_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notification preferences table
CREATE TABLE public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  event_type text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel, event_type)
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notification settings"
  ON public.notification_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Automation rules table
CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  trigger_event text NOT NULL,
  action_type text NOT NULL,
  delay_hours integer NOT NULL DEFAULT 0,
  condition_json jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own automation rules"
  ON public.automation_rules FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Integration settings table
CREATE TABLE public.integration_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  integration_name text NOT NULL,
  api_key text,
  config jsonb DEFAULT '{}'::jsonb,
  is_connected boolean NOT NULL DEFAULT false,
  connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, integration_name)
);

ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own integration settings"
  ON public.integration_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Security settings table
CREATE TABLE public.security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  two_factor_enabled boolean NOT NULL DEFAULT false,
  session_timeout_minutes integer NOT NULL DEFAULT 60,
  ip_whitelist text[] DEFAULT '{}',
  last_api_key_rotation timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own security settings"
  ON public.security_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
ALTER TABLE public.notification_settings ADD CONSTRAINT notification_settings_user_channel_event_key UNIQUE (user_id, channel, event_type);
ALTER TABLE public.integration_settings ADD CONSTRAINT integration_settings_user_integration_key UNIQUE (user_id, integration_name);
