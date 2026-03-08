
CREATE TABLE pc_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room text NOT NULL,
  nickname text NOT NULL,
  color text NOT NULL DEFAULT '#00B800',
  content text NOT NULL,
  reply_to uuid REFERENCES pc_messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pc_messages_room ON pc_messages(room);
CREATE INDEX idx_pc_messages_created_at ON pc_messages(created_at);

-- Validation trigger
CREATE OR REPLACE FUNCTION validate_pc_message()
RETURNS trigger LANGUAGE plpgsql AS $$
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

CREATE TRIGGER trg_validate_pc_message
  BEFORE INSERT ON pc_messages
  FOR EACH ROW EXECUTE FUNCTION validate_pc_message();

ALTER TABLE pc_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pc_messages" ON pc_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pc_messages" ON pc_messages FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE pc_messages;
