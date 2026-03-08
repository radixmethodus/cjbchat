
CREATE TABLE public.secret_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content text,
  file_url text,
  file_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES public.chatroom_users(id),
  is_pinned boolean NOT NULL DEFAULT false,
  pinned_by uuid REFERENCES public.chatroom_users(id)
);

ALTER TABLE public.secret_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert secret_messages with user_id" ON public.secret_messages FOR INSERT WITH CHECK (user_id IS NOT NULL);
CREATE POLICY "Allow update secret_messages for pinning" ON public.secret_messages FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete secret_messages" ON public.secret_messages FOR DELETE USING (true);
CREATE POLICY "Anyone can read secret_messages" ON public.secret_messages FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.secret_messages;
