
-- Add pin_hash column to chatroom_users for 4-digit PIN auth
ALTER TABLE public.chatroom_users ADD COLUMN pin_hash text;

-- Add is_pinned column to messages for pin functionality
ALTER TABLE public.messages ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;

-- Add pinned_by column to track who pinned
ALTER TABLE public.messages ADD COLUMN pinned_by uuid REFERENCES public.chatroom_users(id);

-- Allow anyone to update messages (for pinning)
CREATE POLICY "Anyone can update messages"
  ON public.messages FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create pgcrypto extension for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;
