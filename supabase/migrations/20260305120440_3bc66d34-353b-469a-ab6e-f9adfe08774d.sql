
-- Validate file_url on INSERT: only allow Supabase storage URLs or NULL
CREATE OR REPLACE FUNCTION public.validate_file_url()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.file_url IS NOT NULL THEN
    -- Only allow URLs from our own Supabase storage
    IF NEW.file_url NOT LIKE '%cbsoqfyfmaporeomzugr.supabase.co/storage/%' THEN
      RAISE EXCEPTION 'External file URLs are not allowed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_messages_file_url
  BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_file_url();

CREATE TRIGGER validate_secret_messages_file_url
  BEFORE INSERT OR UPDATE ON public.secret_messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_file_url();
