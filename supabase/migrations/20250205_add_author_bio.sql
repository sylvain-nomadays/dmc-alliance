-- Migration: Add author bio field to articles table
-- Description: Ajoute un champ bio pour l'auteur de l'article (FR/EN)

-- Ajouter les colonnes author_bio
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_bio_fr TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_bio_en TEXT;

-- Commentaires pour documentation
COMMENT ON COLUMN articles.author_bio_fr IS 'Bio de l''auteur en français (affichée sur la page article)';
COMMENT ON COLUMN articles.author_bio_en IS 'Bio de l''auteur en anglais (affichée sur la page article)';
