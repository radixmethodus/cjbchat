CREATE OR REPLACE FUNCTION public.create_user_with_pin(_name text, _color text, _pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
BEGIN
  INSERT INTO public.chatroom_users (name, color, pin_hash)
  VALUES (_name, _color, extensions.crypt(_pin, extensions.gen_salt('bf')));
END;
$function$;