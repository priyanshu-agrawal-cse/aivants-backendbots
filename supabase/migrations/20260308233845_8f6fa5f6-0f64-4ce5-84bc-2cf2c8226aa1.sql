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