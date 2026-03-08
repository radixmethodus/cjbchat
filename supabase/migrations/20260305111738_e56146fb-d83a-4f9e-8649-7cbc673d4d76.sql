
-- Fix search_path for delete_own_message
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

-- Fix search_path for validate_message_content
CREATE OR REPLACE FUNCTION public.validate_message_content()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.content IS NOT NULL AND char_length(NEW.content) > 4000 THEN
    RAISE EXCEPTION 'Message content exceeds maximum length of 4000 characters';
  END IF;
  RETURN NEW;
END;
$$;
