-- ====================================================================
-- TCS | CHARUSAT UNIVERSITY — Supabase pgvector RAG Schema Setup
-- Run this script inside your Supabase SQL Editor (https://supabase.com/dashboard)
-- ====================================================================

-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create Documents Table (Tracks parent files, PDFs, syllabus docs)
CREATE TABLE IF NOT EXISTS documents (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT        NOT NULL,
    file_path       TEXT,
    file_type       TEXT        DEFAULT 'pdf',
    file_size       BIGINT      DEFAULT 0,
    page_count      INTEGER     DEFAULT 1,
    chunk_count     INTEGER     DEFAULT 0,
    status          TEXT        NOT NULL DEFAULT 'READY',
    embedding_model TEXT        DEFAULT 'all-MiniLM-L6-v2',
    uploaded_by     TEXT        DEFAULT 'system',
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Document Chunks Table (Holds chunked text & metadata)
CREATE TABLE IF NOT EXISTS document_chunks (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID        REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER     DEFAULT 1,
    chunk_index INTEGER     NOT NULL,
    heading     TEXT,
    content     TEXT        NOT NULL,
    token_count INTEGER     DEFAULT 0,
    metadata    JSONB       DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Embeddings Table (Stores 384-dimensional dense vectors for all-MiniLM-L6-v2)
CREATE TABLE IF NOT EXISTS embeddings (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id    UUID        REFERENCES document_chunks(id) ON DELETE CASCADE,
    embedding   VECTOR(384),
    model       TEXT        NOT NULL DEFAULT 'all-MiniLM-L6-v2',
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- 5. Create Fast HNSW Vector Index for Cosine Similarity Search (< 10ms response time)
CREATE INDEX IF NOT EXISTS embeddings_hnsw_idx 
ON embeddings 
USING hnsw (embedding vector_cosine_ops);

-- 6. Helper Function for Top-K Vector Cosine Similarity Search
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding VECTOR(384),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  page_number INT,
  chunk_index INT,
  heading TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.page_number,
    dc.chunk_index,
    dc.heading,
    dc.content,
    dc.metadata,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN embeddings e ON e.chunk_id = dc.id
  WHERE (1 - (e.embedding <=> query_embedding)) >= match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
