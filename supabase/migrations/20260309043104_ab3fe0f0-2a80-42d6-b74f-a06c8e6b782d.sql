
-- Push subscriptions table
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  notify_all boolean NOT NULL DEFAULT true,
  notify_mentions boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read push_subscriptions" ON public.push_subscriptions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert push_subscriptions" ON public.push_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update push_subscriptions" ON public.push_subscriptions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete push_subscriptions" ON public.push_subscriptions FOR DELETE USING (true);

-- VAPID key config (single-row, protected)
CREATE TABLE public.push_config (
  id int PRIMARY KEY DEFAULT 1,
  public_key text NOT NULL,
  private_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.push_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all on push_config" ON public.push_config FOR ALL USING (false) WITH CHECK (false);

-- Security definer function to expose only the public key
CREATE OR REPLACE FUNCTION public.get_vapid_public_key()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public_key FROM public.push_config WHERE id = 1;
$$;
