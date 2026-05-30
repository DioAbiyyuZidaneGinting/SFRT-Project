-- Enable the pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create the public.faqs table
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Create public select policy
DROP POLICY IF EXISTS "Allow public read-only access to FAQs" ON public.faqs;
CREATE POLICY "Allow public read-only access to FAQs" ON public.faqs FOR SELECT USING (true);

-- Create trgm index for fast similarity search
CREATE INDEX IF NOT EXISTS faqs_question_trgm_idx ON public.faqs USING gist (question gist_trgm_ops);

-- Create a custom search function (RPC)
CREATE OR REPLACE FUNCTION search_faqs(query_text TEXT, min_similarity REAL DEFAULT 0.3)
RETURNS TABLE (
    id UUID,
    question TEXT,
    answer TEXT,
    category VARCHAR,
    similarity REAL
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.question, f.answer, f.category, similarity(f.question, query_text) as sim
  FROM public.faqs f
  WHERE similarity(f.question, query_text) >= min_similarity
  ORDER BY sim DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
