
-- 1. Fix update_user_color: require PIN verification
CREATE OR REPLACE FUNCTION public.update_user_color(_user_id uuid, _color text, _pin text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT pin_hash INTO stored_hash FROM public.chatroom_users WHERE id = _user_id;
  IF stored_hash IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  IF _pin IS NULL OR stored_hash != extensions.crypt(_pin, stored_hash) THEN
    RAISE EXCEPTION 'Invalid PIN';
  END IF;
  UPDATE public.chatroom_users SET color = _color WHERE id = _user_id;
END;
$$;

-- 2. Create delete_own_message RPC with ownership check
CREATE OR REPLACE FUNCTION public.delete_own_message(_message_id uuid, _user_id uuid, _table text DEFAULT 'messages')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  msg_owner uuid;
BEGIN
  IF _table NOT IN ('messages', 'secret_messages') THEN
    RAISE EXCEPTION 'Invalid table';
  END IF;

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

-- 3. Restrict DELETE policies to deny direct deletes
DROP POLICY IF EXISTS "Anyone can delete messages" ON public.messages;
CREATE POLICY "Deny direct deletes on messages" ON public.messages FOR DELETE USING (false);

DROP POLICY IF EXISTS "Anyone can delete secret_messages" ON public.secret_messages;
CREATE POLICY "Deny direct deletes on secret_messages" ON public.secret_messages FOR DELETE USING (false);

-- 4. Add message content length validation trigger
CREATE OR REPLACE FUNCTION public.validate_message_content()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.content IS NOT NULL AND char_length(NEW.content) > 4000 THEN
    RAISE EXCEPTION 'Message content exceeds maximum length of 4000 characters';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_messages_content
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_message_content();

CREATE TRIGGER trg_validate_secret_messages_content
  BEFORE INSERT OR UPDATE ON public.secret_messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_message_content();
