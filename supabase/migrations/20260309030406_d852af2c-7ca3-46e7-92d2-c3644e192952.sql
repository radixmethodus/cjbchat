
CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room text NOT NULL,
  reporter_nickname text NOT NULL,
  reported_nickname text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Anyone can insert complaints
CREATE POLICY "Anyone can insert complaints"
  ON public.complaints FOR INSERT
  WITH CHECK (true);

-- No one can read/update/delete complaints from client
CREATE POLICY "Deny select on complaints"
  ON public.complaints FOR SELECT
  USING (false);

CREATE POLICY "Deny update on complaints"
  ON public.complaints FOR UPDATE
  USING (false);

CREATE POLICY "Deny delete on complaints"
  ON public.complaints FOR DELETE
  USING (false);

-- Validate complaint content
CREATE OR REPLACE FUNCTION public.validate_complaint()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF char_length(NEW.reason) > 500 THEN
    RAISE EXCEPTION 'Reason too long (max 500 characters)';
  END IF;
  IF char_length(NEW.reporter_nickname) > 20 OR char_length(NEW.reported_nickname) > 20 THEN
    RAISE EXCEPTION 'Nickname too long';
  END IF;
  IF NEW.room NOT IN ('A', 'B', 'C', 'D') THEN
    RAISE EXCEPTION 'Invalid room';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_complaint_trigger
  BEFORE INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.validate_complaint();
