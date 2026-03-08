CREATE OR REPLACE FUNCTION public.update_user_color(_user_id uuid, _color text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.chatroom_users SET color = _color WHERE id = _user_id;
END;
$$;