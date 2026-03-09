
CREATE TABLE public.pc_stars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.pc_messages(id) ON DELETE CASCADE,
  nickname text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, nickname)
);

ALTER TABLE public.pc_stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pc_stars" ON public.pc_stars FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pc_stars" ON public.pc_stars FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete own pc_stars" ON public.pc_stars FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.pc_stars;
