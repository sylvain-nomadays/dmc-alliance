-- =============================================
-- DMC Alliance - Partner Videos
-- Ajout de la gestion des vidéos pour les partenaires
-- =============================================

-- Ajouter les colonnes vidéo à la table partners
ALTER TABLE partners
ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;

-- Structure d'une vidéo dans le JSONB:
-- {
--   "id": "uuid",
--   "url": "https://youtube.com/embed/xxx ou URL directe",
--   "type": "youtube" | "vimeo" | "upload",
--   "title_fr": "Titre FR",
--   "title_en": "Title EN",
--   "description_fr": "Description FR",
--   "description_en": "Description EN",
--   "thumbnail_url": "URL de la miniature",
--   "is_featured": true/false,
--   "order": 1
-- }

-- Créer un bucket pour les vidéos uploadées si nécessaire
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  104857600, -- 100MB max
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Politique de lecture publique pour les vidéos
CREATE POLICY IF NOT EXISTS "Public videos access"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Politique d'upload pour les admins
CREATE POLICY IF NOT EXISTS "Admin video upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos'
  AND auth.role() = 'authenticated'
);

-- Politique de suppression pour les admins
CREATE POLICY IF NOT EXISTS "Admin video delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos'
  AND auth.role() = 'authenticated'
);

-- Commentaire sur la colonne
COMMENT ON COLUMN partners.videos IS 'Liste des vidéos de présentation du partenaire (JSONB array)';
