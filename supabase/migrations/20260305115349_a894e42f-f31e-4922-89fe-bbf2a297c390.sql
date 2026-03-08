
UPDATE storage.buckets SET public = false WHERE id = 'chat-files';

DROP POLICY IF EXISTS "Anyone can upload chat files" ON storage.objects;
CREATE POLICY "Anyone can upload chat files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-files'
  AND LOWER(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'doc', 'docx', 'mp3', 'mp4', 'wav', 'zip')
);
