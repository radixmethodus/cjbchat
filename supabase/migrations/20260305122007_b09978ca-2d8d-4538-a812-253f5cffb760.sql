
-- 1. Drop the legacy 2-arg overload of update_user_color (no PIN check)
DROP FUNCTION IF EXISTS public.update_user_color(uuid, text);

-- 2. Add rate limiting to create_user_with_pin
CREATE OR REPLACE FUNCTION public.create_user_with_pin(_name text, _color text, _pin text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  recent_attempts int;
BEGIN
  -- Rate limit: max 5 registration attempts per hour per name
  SELECT count(*) INTO recent_attempts
  FROM public.login_attempts
  WHERE user_name = _name
    AND attempt_at > now() - interval '1 hour';

  IF recent_attempts >= 5 THEN
    RAISE EXCEPTION 'Too many registration attempts. Try again later.';
  END IF;

  -- Record the attempt
  INSERT INTO public.login_attempts (user_name) VALUES (_name);

  -- Create the user
  INSERT INTO public.chatroom_users (name, color, pin_hash)
  VALUES (_name, _color, extensions.crypt(_pin, extensions.gen_salt('bf'::text)));

  -- Clear attempts on success
  DELETE FROM public.login_attempts WHERE user_name = _name;
END;
$$;
