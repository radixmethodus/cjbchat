
-- 1. Fix delete_own_message to require PIN verification (not trust client user_id)
CREATE OR REPLACE FUNCTION public.delete_own_message(_message_id uuid, _user_id uuid, _table text DEFAULT 'messages', _pin text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  msg_owner uuid;
  stored_hash text;
BEGIN
  IF _table NOT IN ('messages', 'secret_messages') THEN
    RAISE EXCEPTION 'Invalid table';
  END IF;

  -- Verify the caller's PIN matches the claimed user_id
  SELECT pin_hash INTO stored_hash FROM public.chatroom_users WHERE id = _user_id;
  IF stored_hash IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  IF _pin IS NULL OR stored_hash != extensions.crypt(_pin, stored_hash) THEN
    RAISE EXCEPTION 'Invalid PIN';
  END IF;

  -- Check message ownership
  IF _table = 'messages' THEN
    SELECT user_id INTO msg_owner FROM public.messages WHERE id = _message_id;
  ELSE
    SELECT user_id INTO msg_owner FROM public.secret_messages WHERE id = _message_id;
  END IF;

  IF msg_owner IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  IF msg_owner != _user_id THEN
    RAISE EXCEPTION 'Not your message';
  END IF;

  IF _table = 'messages' THEN
    DELETE FROM public.messages WHERE id = _message_id;
  ELSE
    DELETE FROM public.secret_messages WHERE id = _message_id;
  END IF;
END;
$$;

-- 2. Create login_attempts table for brute-force protection
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  attempt_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Deny all direct access; only the RPC function will interact
CREATE POLICY "Deny all on login_attempts" ON public.login_attempts FOR ALL USING (false);

-- 3. Update verify_user_pin with rate limiting (max 5 attempts per 15 min)
CREATE OR REPLACE FUNCTION public.verify_user_pin(_name text, _pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stored_hash text;
  recent_attempts int;
BEGIN
  -- Check rate limit: max 5 failed attempts in 15 minutes
  SELECT count(*) INTO recent_attempts
  FROM public.login_attempts
  WHERE user_name = _name
    AND attempt_at > now() - interval '15 minutes';

  IF recent_attempts >= 5 THEN
    RAISE EXCEPTION 'Too many login attempts. Try again in 15 minutes.';
  END IF;

  SELECT pin_hash INTO stored_hash
  FROM public.chatroom_users
  WHERE name = _name;

  IF stored_hash IS NULL THEN
    -- Record attempt even for non-existent users to prevent enumeration timing
    INSERT INTO public.login_attempts (user_name) VALUES (_name);
    RETURN false;
  END IF;

  IF stored_hash = extensions.crypt(_pin, stored_hash) THEN
    -- Success: clear old attempts for this user
    DELETE FROM public.login_attempts WHERE user_name = _name;
    RETURN true;
  ELSE
    -- Record failed attempt
    INSERT INTO public.login_attempts (user_name) VALUES (_name);
    RETURN false;
  END IF;
END;
$$;
