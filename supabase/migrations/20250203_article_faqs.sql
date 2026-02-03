-- Create article_faqs table for FAQ sections on magazine articles
-- Date: 2025-02-03

CREATE TABLE IF NOT EXISTS article_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,

  -- Questions and Answers (French is primary, others are translations)
  question_fr TEXT NOT NULL,
  question_en TEXT,
  question_de TEXT,
  question_nl TEXT,
  question_es TEXT,
  question_it TEXT,

  answer_fr TEXT NOT NULL,
  answer_en TEXT,
  answer_de TEXT,
  answer_nl TEXT,
  answer_es TEXT,
  answer_it TEXT,

  -- Ordering
  order_index INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_article_faqs_article ON article_faqs(article_id);
CREATE INDEX IF NOT EXISTS idx_article_faqs_order ON article_faqs(article_id, order_index);

-- RLS Policies
ALTER TABLE article_faqs ENABLE ROW LEVEL SECURITY;

-- Allow public read access for active FAQs
CREATE POLICY "Public can view active FAQs" ON article_faqs
  FOR SELECT
  USING (is_active = true);

-- Allow authenticated users (admins) to manage FAQs
CREATE POLICY "Authenticated users can manage FAQs" ON article_faqs
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE article_faqs IS 'FAQ items for magazine articles';
COMMENT ON COLUMN article_faqs.question_fr IS 'Question in French (primary language)';
COMMENT ON COLUMN article_faqs.answer_fr IS 'Answer in French (primary language)';
COMMENT ON COLUMN article_faqs.order_index IS 'Display order within the article';
