-- Create chatroom_users table
CREATE TABLE public.chatroom_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chatroom_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chatroom users" ON public.chatroom_users
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert chatroom users" ON public.chatroom_users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update chatroom users" ON public.chatroom_users
  FOR UPDATE USING (true);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.chatroom_users(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read messages" ON public.messages
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert messages" ON public.messages
  FOR INSERT WITH CHECK (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true);

CREATE POLICY "Anyone can view chat files" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-files');

CREATE POLICY "Anyone can upload chat files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chat-files');