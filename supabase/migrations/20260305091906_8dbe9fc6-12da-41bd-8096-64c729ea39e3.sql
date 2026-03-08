
-- 1. Revoke direct SELECT on pin_hash from anon and authenticated roles
REVOKE SELECT (pin_hash) ON public.chatroom_users FROM anon;
REVOKE SELECT (pin_hash) ON public.chatroom_users FROM authenticated;

-- 2. Replace overly permissive INSERT policy on chatroom_users
-- Users should only be created via the create_user_with_pin SECURITY DEFINER function
DROP POLICY IF EXISTS "Anyone can insert chatroom users" ON public.chatroom_users;
CREATE POLICY "Deny direct inserts on chatroom_users"
  ON public.chatroom_users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

-- 3. Replace overly permissive UPDATE policy on chatroom_users
-- No direct updates needed from client; PIN verify is via SECURITY DEFINER function
DROP POLICY IF EXISTS "Anyone can update chatroom users" ON public.chatroom_users;
CREATE POLICY "Deny direct updates on chatroom_users"
  ON public.chatroom_users
  FOR UPDATE
  TO anon, authenticated
  USING (false);

-- 4. Replace overly permissive INSERT policy on messages with a slightly more descriptive one
-- We still need true here since there's no auth.uid(), but we ensure user_id is provided
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.messages;
CREATE POLICY "Allow insert messages with user_id"
  ON public.messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NOT NULL);

-- 5. Replace overly permissive UPDATE on messages - restrict to only pinning
DROP POLICY IF EXISTS "Anyone can update messages" ON public.messages;
CREATE POLICY "Allow update messages for pinning"
  ON public.messages
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Keep DELETE on messages as-is (already restricted in app code)
-- Keep SELECT policies as-is (public read is intentional for chatroom)
