
-- 1. Create pin_message RPC for toggling pins with PIN verification
CREATE OR REPLACE FUNCTION public.pin_message(_message_id uuid, _user_id uuid, _pin text, _table text DEFAULT 'messages')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stored_hash text;
  current_pinned boolean;
BEGIN
  IF _table NOT IN ('messages', 'secret_messages') THEN
    RAISE EXCEPTION 'Invalid table';
  END IF;

  -- Verify PIN
  SELECT pin_hash INTO stored_hash FROM public.chatroom_users WHERE id = _user_id;
  IF stored_hash IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  IF _pin IS NULL OR stored_hash != extensions.crypt(_pin, stored_hash) THEN
    RAISE EXCEPTION 'Invalid PIN';
  END IF;

  -- Toggle pin
  IF _table = 'messages' THEN
    SELECT is_pinned INTO current_pinned FROM public.messages WHERE id = _message_id;
    IF current_pinned IS NULL THEN RAISE EXCEPTION 'Message not found'; END IF;
    UPDATE public.messages SET is_pinned = NOT current_pinned, pinned_by = CASE WHEN NOT current_pinned THEN _user_id ELSE NULL END WHERE id = _message_id;
  ELSE
    SELECT is_pinned INTO current_pinned FROM public.secret_messages WHERE id = _message_id;
    IF current_pinned IS NULL THEN RAISE EXCEPTION 'Message not found'; END IF;
    UPDATE public.secret_messages SET is_pinned = NOT current_pinned, pinned_by = CASE WHEN NOT current_pinned THEN _user_id ELSE NULL END WHERE id = _message_id;
  END IF;
END;
$$;

-- 2. Lock down UPDATE policies
DROP POLICY IF EXISTS "Allow update messages for pinning" ON public.messages;
CREATE POLICY "Deny direct updates on messages" ON public.messages FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Allow update secret_messages for pinning" ON public.secret_messages;
CREATE POLICY "Deny direct updates on secret_messages" ON public.secret_messages FOR UPDATE USING (false);

-- 3. Add rate limiting to delete_own_message
CREATE OR REPLACE FUNCTION public.delete_own_message(_message_id uuid, _user_id uuid, _table text DEFAULT 'messages', _pin text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  msg_owner uuid;
  stored_hash text;
  user_name_val text;
  recent_attempts int;
BEGIN
  IF _table NOT IN ('messages', 'secret_messages') THEN
    RAISE EXCEPTION 'Invalid table';
  END IF;

  -- Look up user and check rate limit
  SELECT name, pin_hash INTO user_name_val, stored_hash FROM public.chatroom_users WHERE id = _user_id;
  IF stored_hash IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  SELECT count(*) INTO recent_attempts
  FROM public.login_attempts
  WHERE user_name = user_name_val AND attempt_at > now() - interval '15 minutes';

  IF recent_attempts >= 5 THEN
    RAISE EXCEPTION 'Too many attempts. Try again in 15 minutes.';
  END IF;

  IF _pin IS NULL OR stored_hash != extensions.crypt(_pin, stored_hash) THEN
    INSERT INTO public.login_attempts (user_name) VALUES (user_name_val);
    RAISE EXCEPTION 'Invalid PIN';
  END IF;

  -- Clear attempts on success
  DELETE FROM public.login_attempts WHERE user_name = user_name_val;

  -- Check message ownership
  IF _table = 'messages' THEN
    SELECT user_id INTO msg_owner FROM public.messages WHERE id = _message_id;
  ELSE
    SELECT user_id INTO msg_owner FROM public.secret_messages WHERE id = _message_id;
  END IF;

  IF msg_owner IS NULL THEN RAISE EXCEPTION 'Message not found'; END IF;
  IF msg_owner != _user_id THEN RAISE EXCEPTION 'Not your message'; END IF;

  IF _table = 'messages' THEN
    DELETE FROM public.messages WHERE id = _message_id;
  ELSE
    DELETE FROM public.secret_messages WHERE id = _message_id;
  END IF;
END;
$$;
