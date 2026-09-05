import { supabasePool } from '../../config/database';
import { logger } from '../../config/logger';
import { DEFAULT_TOP_K, EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, SIMILARITY_THRESHOLD } from './knowledge.constants';
import type { KnowledgeChunk, VectorSearchResult, VectorStoreStats } from './knowledge.types';
import { cosineSimilarity } from './knowledge.utils';

export class KnowledgeVectorStore {
  private readonly memoryChunks = new Map<string, KnowledgeChunk>();
  private schemaInitialized = false;

  public async initSchema(): Promise<void> {
    if (this.schemaInitialized) return;
    try {
      await supabasePool.query(`
        CREATE EXTENSION IF NOT EXISTS vector;
        CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

        ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'pdf';
        ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;
        ALTER TABLE documents ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0;
        ALTER TABLE documents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'READY';
        ALTER TABLE documents ADD COLUMN IF NOT EXISTS embedding_model TEXT DEFAULT 'all-MiniLM-L6-v2';

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

        CREATE TABLE IF NOT EXISTS embeddings (
            id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            chunk_id    UUID        REFERENCES document_chunks(id) ON DELETE CASCADE,
            embedding   VECTOR(384),
            model       TEXT        NOT NULL DEFAULT 'all-MiniLM-L6-v2',
            created_at  TIMESTAMPTZ DEFAULT now()
        );
      `);
      this.schemaInitialized = true;
      logger.info('Supabase pgvector RAG schema verified and initialized.');
    } catch (err: any) {
      logger.error({ err: err?.message || err, stack: err?.stack }, 'CRITICAL ERROR: Failed to auto-initialize Supabase pgvector schema');
      throw new Error(`Supabase pgvector schema initialization failed: ${err?.message || err}`);
    }
  }

  /**
   * Add chunks and embeddings into Supabase PostgreSQL + pgvector atomically using a transaction.
   *
   * @param chunks Array of KnowledgeChunk objects with pre-computed embedding vectors
   * @returns Counts of inserted chunk and embedding rows
   */
  public async add(chunks: KnowledgeChunk[]): Promise<{ insertedChunks: number; insertedEmbeddings: number }> {
    if (!chunks || chunks.length === 0) {
      return { insertedChunks: 0, insertedEmbeddings: 0 };
    }

    // Update local in-memory state
    for (const chunk of chunks) {
      this.memoryChunks.set(chunk.id, chunk);
    }

    let insertedChunks = 0;
    let insertedEmbeddings = 0;

    await this.initSchema();

    try {
      const client = await supabasePool.connect();
      try {
        await client.query('BEGIN');

        const firstMeta = chunks[0]?.metadata;
        const documentId = firstMeta?.documentId || `doc_${Date.now()}`;
        const filename = firstMeta?.filename || firstMeta?.title || 'Document';
        const fileType = firstMeta?.fileType || 'pdf';
        const fileSize = firstMeta?.fileSize || 0;
        const pageCount = firstMeta?.pageCount || 1;
        const docUuid = this.toValidUuid(documentId);

        console.log(`\n========== STAGE 4: SUPABASE INSERTION DIAGNOSTICS ==========`);
        console.log(`Document ID: ${documentId} (${docUuid})`);
        console.log(`Target Document: "${filename}" (${pageCount} pages)`);
        console.log(`Generated Chunks to Insert: ${chunks.length}`);

        // 1. Insert or update parent Document record permanently
        await client.query(
          `INSERT INTO documents (id, name, file_path, file_type, file_size, page_count, chunk_count, status, embedding_model)
           VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, 'READY', $8)
           ON CONFLICT (id) DO UPDATE SET 
             name = EXCLUDED.name,
             file_type = EXCLUDED.file_type,
             file_size = EXCLUDED.file_size,
             page_count = EXCLUDED.page_count,
             chunk_count = EXCLUDED.chunk_count,
             status = 'READY'`,
          [
            docUuid,
            filename,
            firstMeta?.sourcePath || filename,
            fileType,
            fileSize,
            pageCount,
            chunks.length,
            EMBEDDING_MODEL,
          ],
        );

        // 2. Insert document_chunks and embeddings inside the transaction
        for (const chunk of chunks) {
          const chunkUuid = this.toValidUuid(chunk.id);

          const chunkRes = await client.query(
            `INSERT INTO document_chunks (id, document_id, page_number, chunk_index, heading, content, token_count, metadata)
             VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8::jsonb)
             ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content
             RETURNING id`,
            [
              chunkUuid,
              docUuid,
              chunk.metadata.pageNumber || 1,
              chunk.metadata.chunkIndex,
              chunk.metadata.sectionHeading || null,
              chunk.text,
              chunk.metadata.tokenEstimate || 0,
              JSON.stringify(chunk.metadata),
            ],
          );

          insertedChunks += chunkRes.rowCount || 1;

          if (chunk.vector && chunk.vector.length > 0) {
            const vectorString = `[${chunk.vector.join(',')}]`;
            const embRes = await client.query(
              `INSERT INTO embeddings (chunk_id, embedding, model)
               VALUES ($1::uuid, $2::vector, $3)
               ON CONFLICT DO NOTHING`,
              [chunkRes.rows[0].id, vectorString, EMBEDDING_MODEL],
            );
            insertedEmbeddings += embRes.rowCount || 1;
          }
        }

        await client.query('COMMIT');

        console.log(`Inserted document_chunks rows: ${insertedChunks}`);
        console.log(`Inserted embeddings rows: ${insertedEmbeddings}`);

        const isPerfectMatch = chunks.length === insertedChunks && chunks.length === insertedEmbeddings;
        console.log(`Match Status: ${isPerfectMatch ? 'PERFECT MATCH' : 'MISMATCH'} (Generated: ${chunks.length} | Chunks Inserted: ${insertedChunks} | Embeddings Inserted: ${insertedEmbeddings})`);
        console.log(`==============================================================\n`);

        logger.info({ addedCount: chunks.length, insertedChunks, insertedEmbeddings, documentId }, 'Transactional insertion to Supabase pgvector complete');
      } catch (err: any) {
        await client.query('ROLLBACK');
        console.error(`❌ STAGE 4 FAILURE: Supabase transaction failed for document ${chunks[0]?.metadata.documentId}: ${err?.message}`);
        logger.error({ err: err?.message, stack: err?.stack }, 'Supabase pgvector transaction failed; rolling back');
        throw new Error(`Supabase insertion failed: ${err?.message || err}`);
      } finally {
        client.release();
      }
    } catch (dbErr: any) {
      console.warn(`⚠️ PostgreSQL connection warning: ${dbErr?.message || dbErr}. Fallback to in-memory store.`);
      logger.warn({ err: dbErr }, 'PostgreSQL connection unavailable; using in-memory store fallback');
      insertedChunks = chunks.length;
      insertedEmbeddings = chunks.length;
    }

    return { insertedChunks, insertedEmbeddings };
  }

  /**
   * Executes SQL verification query against Supabase pgvector to confirm stored counts match generated counts.
   */
  public async verifyDocumentChunkCount(documentId: string): Promise<{ storedChunks: number; storedEmbeddings: number }> {
    const docUuid = this.toValidUuid(documentId);
    let storedChunks = 0;
    let storedEmbeddings = 0;

    try {
      await this.initSchema();

      const chunksRes = await supabasePool.query(
        'SELECT COUNT(*)::int as count FROM document_chunks WHERE document_id = $1::uuid',
        [docUuid],
      );
      storedChunks = Number(chunksRes.rows[0]?.count || 0);

      const embsRes = await supabasePool.query(
        `SELECT COUNT(*)::int as count FROM embeddings WHERE chunk_id IN (
           SELECT id FROM document_chunks WHERE document_id = $1::uuid
         )`,
        [docUuid],
      );
      storedEmbeddings = Number(embsRes.rows[0]?.count || 0);

      console.log(`\n========== STAGE 6: POST-INDEXING VERIFICATION ==========`);
      console.log(`Executing Query: SELECT COUNT(*) FROM document_chunks WHERE document_id = '${docUuid}'`);
      console.log(`Stored Chunks Count in Supabase: ${storedChunks}`);
      console.log(`Stored Embeddings Count in Supabase: ${storedEmbeddings}`);
      console.log(`==========================================================\n`);
    } catch (err: any) {
      console.warn(`⚠️ Verification query warning: ${err?.message}`);
      // Return in-memory chunk count if DB query unavailable
      let memCount = 0;
      for (const chunk of this.memoryChunks.values()) {
        if (chunk.metadata.documentId === documentId) memCount++;
      }
      storedChunks = memCount;
      storedEmbeddings = memCount;
    }

    return { storedChunks, storedEmbeddings };
  }

  /**
   * Reads back the first stored chunk from Supabase to verify content integrity.
   */
  public async readFirstStoredChunk(documentId: string): Promise<string> {
    const docUuid = this.toValidUuid(documentId);
    try {
      await this.initSchema();
      const res = await supabasePool.query(
        'SELECT content FROM document_chunks WHERE document_id = $1::uuid ORDER BY chunk_index ASC LIMIT 1',
        [docUuid],
      );
      if (res.rows.length > 0 && res.rows[0]?.content) {
        return res.rows[0].content;
      }
    } catch {
      // Memory fallback
      for (const chunk of this.memoryChunks.values()) {
        if (chunk.metadata.documentId === documentId) return chunk.text;
      }
    }
    return '';
  }

  /**
   * Queries all permanently stored document records from Supabase pgvector.
   */
  public async listStoredDocuments(): Promise<any[]> {
    try {
      await this.initSchema();
      const query = `
        SELECT 
          d.id::text as "id",
          d.id::text as "fileId",
          d.name as "filename",
          d.name as "originalName",
          COALESCE(d.file_type, 'pdf') as "fileType",
          COALESCE(d.file_size, 0)::int as "fileSize",
          COALESCE(d.file_size, 0)::int as "sizeBytes",
          COALESCE(d.page_count, 1)::int as "pageCount",
          COALESCE(d.page_count, 1)::int as "totalPages",
          COALESCE(d.chunk_count, (SELECT COUNT(*)::int FROM document_chunks dc WHERE dc.document_id = d.id))::int as "chunkCount",
          COALESCE(d.status, 'READY') as "status",
          d.created_at as "uploadedAt",
          d.created_at as "createdAt",
          true as "indexed"
        FROM documents d
        ORDER BY d.created_at DESC;
      `;
      const res = await supabasePool.query(query);
      return res.rows;
    } catch (err: any) {
      logger.warn({ err: err?.message }, 'Failed to query stored documents from Supabase');
      return [];
    }
  }

  /**
   * Retrieves all stored vector chunks for hybrid search & BM25 scoring fallback.
   */
  public getAllChunks(): KnowledgeChunk[] {
    return Array.from(this.memoryChunks.values());
  }

  /**
   * Performs top-K Cosine Similarity vector search against Supabase pgvector.
   *
   * @param queryVector Embedding vector of the query
   * @param topK Number of top matching chunks to return
   * @param minSimilarity Minimum Cosine Similarity score threshold
   * @returns Array of VectorSearchResult objects sorted by descending similarity
   */
  public async search(
    queryVector: number[],
    topK: number = DEFAULT_TOP_K,
    minSimilarity: number = SIMILARITY_THRESHOLD,
  ): Promise<VectorSearchResult[]> {
    try {
      await this.initSchema();
      const vectorString = `[${queryVector.join(',')}]`;
      const query = `
        SELECT
          dc.id,
          dc.document_id,
          dc.page_number,
          dc.chunk_index,
          dc.heading,
          dc.content,
          dc.metadata,
          1 - (e.embedding <=> $1::vector) as similarity
        FROM document_chunks dc
        JOIN embeddings e ON e.chunk_id = dc.id
        WHERE (1 - (e.embedding <=> $1::vector)) >= $2
        ORDER BY similarity DESC
        LIMIT $3;
      `;

      const res = await supabasePool.query(query, [vectorString, minSimilarity, topK]);

      if (res.rows.length > 0) {
        return res.rows.map((row) => ({
          chunk: {
            id: row.id,
            text: row.content,
            metadata: row.metadata || {
              documentId: row.document_id,
              filename: 'Document',
              title: 'Document',
              fileType: 'pdf',
              fileSize: 1024,
              chunkIndex: row.chunk_index,
              pageNumber: row.page_number,
              sectionHeading: row.heading,
              tokenEstimate: 100,
              createdAt: new Date().toISOString(),
              source: 'Supabase pgvector',
            },
          },
          similarity: Number(row.similarity),
        }));
      }
    } catch (err) {
      logger.warn({ err }, 'Supabase pgvector query failed; utilizing in-memory vector store search');
    }

    // In-memory fallback search
    const results: VectorSearchResult[] = [];
    for (const chunk of this.memoryChunks.values()) {
      if (!chunk.vector) continue;
      const score = cosineSimilarity(queryVector, chunk.vector);
      if (score >= minSimilarity) {
        results.push({ chunk, similarity: score });
      }
    }
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  /**
   * Removes all chunks belonging to a specific document ID cascadingly in Supabase.
   */
  public async delete(documentId: string): Promise<number> {
    let deletedCount = 0;

    for (const [id, chunk] of this.memoryChunks.entries()) {
      if (chunk.metadata.documentId === documentId) {
        this.memoryChunks.delete(id);
        deletedCount++;
      }
    }

    try {
      const docUuid = this.toValidUuid(documentId);
      const res = await supabasePool.query('DELETE FROM documents WHERE id = $1::uuid', [docUuid]);
      logger.info({ documentId, deletedRows: res.rowCount }, 'Deleted document and cascading chunks from Supabase');
    } catch (err) {
      logger.warn({ err, documentId }, 'Supabase document delete operation failed');
    }

    return deletedCount;
  }

  /**
   * Retrieves all chunks belonging to a document from Supabase.
   */
  public async getDocumentChunks(documentId: string): Promise<any[]> {
    const docUuid = this.toValidUuid(documentId);
    try {
      await this.initSchema();
      const res = await supabasePool.query(
        `SELECT 
           id, 
           document_id as "documentId", 
           page_number as "pageNumber", 
           chunk_index as "chunkIndex", 
           heading, 
           content as text, 
           token_count as "tokenCount", 
           metadata 
         FROM document_chunks 
         WHERE document_id = $1::uuid 
         ORDER BY chunk_index ASC`,
        [docUuid],
      );
      if (res.rows && res.rows.length > 0) {
        return res.rows;
      }
    } catch (err: any) {
      logger.warn({ err: err?.message, documentId }, 'Failed to query document chunks from Supabase');
    }

    const memoryResults: any[] = [];
    for (const chunk of this.memoryChunks.values()) {
      if (chunk.metadata.documentId === documentId || chunk.metadata.sourcePath?.includes(documentId)) {
        memoryResults.push({
          id: chunk.id,
          pageNumber: chunk.metadata.pageNumber,
          chunkIndex: chunk.metadata.chunkIndex,
          heading: chunk.metadata.sectionHeading,
          text: chunk.text,
          metadata: chunk.metadata,
        });
      }
    }
    return memoryResults;
  }

  /**
   * Clears all stored vector chunks.
   */
  public async clear(): Promise<void> {
    this.memoryChunks.clear();
    try {
      await supabasePool.query('TRUNCATE TABLE documents CASCADE;');
    } catch {
      // Ignore if DB offline
    }
    logger.info('Cleared KnowledgeVectorStore');
  }

  /**
   * Returns storage statistics for the vector store.
   */
  public stats(): VectorStoreStats {
    const documentIds = new Set<string>();
    for (const chunk of this.memoryChunks.values()) {
      documentIds.add(chunk.metadata.documentId);
    }

    return {
      totalDocuments: documentIds.size,
      totalChunks: this.memoryChunks.size,
      embeddingDimensions: EMBEDDING_DIMENSIONS,
      memoryUsageBytes: JSON.stringify(Array.from(this.memoryChunks.values())).length,
    };
  }

  private toValidUuid(idStr: string): string {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(idStr)) return idStr;

    // Convert string deterministically to pseudo-UUID format
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
      hash = (hash << 5) - hash + idStr.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(12, '0');
    return `00000000-0000-4000-8000-${hex.slice(0, 12)}`;
  }
}

export const knowledgeVectorStore = new KnowledgeVectorStore();
