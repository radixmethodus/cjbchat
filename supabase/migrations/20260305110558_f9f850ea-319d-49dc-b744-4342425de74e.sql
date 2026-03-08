
CREATE OR REPLACE FUNCTION public.on_new_user_joined()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.messages (user_id, content)
  VALUES (NEW.id, E'\x01JOIN\x01' || NEW.name || ' joined for the first time.');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_new_user_joined
  AFTER INSERT ON public.chatroom_users
  FOR EACH ROW
  EXECUTE FUNCTION public.on_new_user_joined();
