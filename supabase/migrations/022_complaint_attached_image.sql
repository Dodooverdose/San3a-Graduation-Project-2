-- Add attached_image column to complaint table to store optional evidence
-- photo uploaded when a customer or technician files a complaint.

ALTER TABLE public.complaint
ADD COLUMN IF NOT EXISTS attached_image TEXT;

COMMENT ON COLUMN public.complaint.attached_image IS
  'Public URL of an image attached by the complainant (customer or technician) as evidence.';

-- Storage bucket for complaint evidence images.
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-images', 'complaint-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to the complaint-images bucket.
DROP POLICY IF EXISTS "Authenticated users can upload complaint images"
  ON storage.objects;
CREATE POLICY "Authenticated users can upload complaint images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'complaint-images');

-- Allow public read access to complaint images (bucket is public so admins
-- and the original submitter can preview them).
DROP POLICY IF EXISTS "Public read access for complaint images"
  ON storage.objects;
CREATE POLICY "Public read access for complaint images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'complaint-images');
