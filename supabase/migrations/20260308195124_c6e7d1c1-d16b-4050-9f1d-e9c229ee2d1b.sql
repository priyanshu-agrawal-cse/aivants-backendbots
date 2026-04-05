
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
