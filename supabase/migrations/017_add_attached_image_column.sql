-- Add attached_image column to request table
ALTER TABLE public.request
ADD COLUMN IF NOT EXISTS attached_image TEXT;

COMMENT ON COLUMN public.request.attached_image IS 'Public URL of image attached by customer when submitting a request';

-- Create storage bucket for request images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('request-images', 'request-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to request-images bucket
CREATE POLICY "Authenticated users can upload request images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'request-images');

-- Allow public read access to request images
CREATE POLICY "Public read access for request images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'request-images');
