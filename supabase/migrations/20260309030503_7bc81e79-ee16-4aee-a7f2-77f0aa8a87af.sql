
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
