ALTER TABLE public.telegram_users 
ADD COLUMN notification_prefs jsonb NOT NULL DEFAULT '{"replies": true, "meetings": true, "campaigns": true}'::jsonb;