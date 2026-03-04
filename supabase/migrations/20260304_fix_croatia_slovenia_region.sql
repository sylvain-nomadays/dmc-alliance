-- Fix: Croatia and Slovenia were incorrectly assigned to 'asia' region instead of 'europe'
-- This happened because the admin form defaulted to 'asia' when no region was explicitly set
UPDATE destinations SET region = 'europe' WHERE slug IN ('croatie', 'slovenie') AND region != 'europe';
