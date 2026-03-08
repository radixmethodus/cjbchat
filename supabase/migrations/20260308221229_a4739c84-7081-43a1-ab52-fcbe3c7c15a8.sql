
CREATE OR REPLACE FUNCTION validate_pc_message()
RETURNS trigger LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.room NOT IN ('A', 'B', 'C', 'D') THEN
    RAISE EXCEPTION 'Invalid room. Must be A, B, C, or D';
  END IF;
  IF char_length(NEW.content) > 2000 THEN
    RAISE EXCEPTION 'Message too long (max 2000 characters)';
  END IF;
  IF char_length(NEW.nickname) > 20 THEN
    RAISE EXCEPTION 'Nickname too long (max 20 characters)';
  END IF;
  RETURN NEW;
END;
$$;
