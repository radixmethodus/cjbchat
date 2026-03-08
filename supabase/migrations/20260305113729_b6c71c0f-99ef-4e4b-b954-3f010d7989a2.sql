
-- Replace pin_message with rate-limited version
CREATE OR REPLACE FUNCTION public.pin_message(_message_id uuid, _user_id uuid, _pin text, _table text DEFAULT 'messages'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  stored_hash text;
  current_pinned boolean;
  user_name_val text;
  recent_attempts int;
BEGIN
  IF _table NOT IN ('messages', 'secret_messages') THEN
    RAISE EXCEPTION 'Invalid table';
  END IF;

  -- Look up user
  SELECT name, pin_hash INTO user_name_val, stored_hash FROM public.chatroom_users WHERE id = _user_id;
  IF stored_hash IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Rate limit check
  SELECT count(*) INTO recent_attempts
  FROM public.login_attempts
  WHERE user_name = user_name_val AND attempt_at > now() - interval '15 minutes';

  IF recent_attempts >= 5 THEN
    RAISE EXCEPTION 'Too many attempts. Try again in 15 minutes.';
  END IF;

  -- Verify PIN
  IF _pin IS NULL OR stored_hash != extensions.crypt(_pin, stored_hash) THEN
    INSERT INTO public.login_attempts (user_name) VALUES (user_name_val);
    RAISE EXCEPTION 'Invalid PIN';
  END IF;

  -- Clear attempts on success
  DELETE FROM public.login_attempts WHERE user_name = user_name_val;

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

-- Replace update_user_color (the PIN-requiring overload) with rate-limited version
CREATE OR REPLACE FUNCTION public.update_user_color(_user_id uuid, _color text, _pin text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  stored_hash text;
  user_name_val text;
  recent_attempts int;
BEGIN
  -- Look up user
  SELECT name, pin_hash INTO user_name_val, stored_hash FROM public.chatroom_users WHERE id = _user_id;
  IF stored_hash IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Rate limit check
  SELECT count(*) INTO recent_attempts
  FROM public.login_attempts
  WHERE user_name = user_name_val AND attempt_at > now() - interval '15 minutes';

  IF recent_attempts >= 5 THEN
    RAISE EXCEPTION 'Too many attempts. Try again in 15 minutes.';
  END IF;

  -- Verify PIN
  IF _pin IS NULL OR stored_hash != extensions.crypt(_pin, stored_hash) THEN
    INSERT INTO public.login_attempts (user_name) VALUES (user_name_val);
    RAISE EXCEPTION 'Invalid PIN';
  END IF;

  -- Clear attempts on success
  DELETE FROM public.login_attempts WHERE user_name = user_name_val;

  UPDATE public.chatroom_users SET color = _color WHERE id = _user_id;
END;
$$;
