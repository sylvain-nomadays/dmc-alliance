-- =============================================
-- DMC Alliance - Storage Setup
-- =============================================

-- Create media bucket for images/files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- Allow public read access to media bucket
CREATE POLICY "Public read access to media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow authenticated admins to upload
CREATE POLICY "Admins can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow authenticated admins to update their uploads
CREATE POLICY "Admins can update media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Allow authenticated admins to delete
CREATE POLICY "Admins can delete media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =============================================
-- PARTNER MEDIA POLICIES (partners can manage their own files)
-- =============================================

-- Partners can upload to their folder
CREATE POLICY "Partners can upload to their folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND EXISTS (
    SELECT 1 FROM profiles p
    JOIN partners pa ON pa.owner_id = p.id
    WHERE p.id = auth.uid()
    AND p.role = 'partner'
    AND storage.foldername(name) = 'partners/' || pa.slug
  )
);

-- Partners can update their files
CREATE POLICY "Partners can update their files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media'
  AND EXISTS (
    SELECT 1 FROM profiles p
    JOIN partners pa ON pa.owner_id = p.id
    WHERE p.id = auth.uid()
    AND p.role = 'partner'
    AND storage.foldername(name) = 'partners/' || pa.slug
  )
);

-- Partners can delete their files
CREATE POLICY "Partners can delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media'
  AND EXISTS (
    SELECT 1 FROM profiles p
    JOIN partners pa ON pa.owner_id = p.id
    WHERE p.id = auth.uid()
    AND p.role = 'partner'
    AND storage.foldername(name) = 'partners/' || pa.slug
  )
);
