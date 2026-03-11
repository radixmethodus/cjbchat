
-- 1. Drop the overly broad SELECT/UPDATE/DELETE policies on push_subscriptions
DROP POLICY IF EXISTS "Anyone can read push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Anyone can update push_subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Anyone can delete push_subscriptions" ON public.push_subscriptions;

-- 2. Create restrictive policies that block direct access
CREATE POLICY "Deny direct select on push_subscriptions"
  ON public.push_subscriptions
  AS RESTRICTIVE
  FOR SELECT
  TO public
  USING (false);

CREATE POLICY "Deny direct update on push_subscriptions"
  ON public.push_subscriptions
  AS RESTRICTIVE
  FOR UPDATE
  TO public
  USING (false);

CREATE POLICY "Deny direct delete on push_subscriptions"
  ON public.push_subscriptions
  AS RESTRICTIVE
  FOR DELETE
  TO public
  USING (false);

-- 3. RPC: check if a subscription exists by endpoint, returns notify prefs only
CREATE OR REPLACE FUNCTION public.get_push_subscription_prefs(_endpoint text)
RETURNS TABLE(notify_all boolean, notify_mentions boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ps.notify_all, ps.notify_mentions
  FROM public.push_subscriptions ps
  WHERE ps.endpoint = _endpoint
  LIMIT 1;
$$;

-- 4. RPC: update notification preferences by endpoint
CREATE OR REPLACE FUNCTION public.update_push_prefs(_endpoint text, _notify_all boolean, _notify_mentions boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.push_subscriptions
  SET notify_all = _notify_all, notify_mentions = _notify_mentions
  WHERE endpoint = _endpoint;
END;
$$;

-- 5. RPC: delete a push subscription by endpoint
CREATE OR REPLACE FUNCTION public.delete_push_subscription(_endpoint text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.push_subscriptions WHERE endpoint = _endpoint;
END;
$$;
