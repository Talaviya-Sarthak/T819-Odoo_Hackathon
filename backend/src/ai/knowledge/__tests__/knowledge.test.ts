import { beforeEach, describe, expect, test } from 'vitest';
import { KnowledgeChunker, knowledgeChunker } from '../knowledge.chunker';
import { KnowledgeCitations, knowledgeCitations } from '../knowledge.citations';
import { EMBEDDING_DIMENSIONS } from '../knowledge.constants';
import { KnowledgeEmbeddingService, knowledgeEmbeddingService } from '../knowledge.embeddings';
import { KnowledgeIngestionService, knowledgeIngestionService } from '../knowledge.ingestion';
import { KnowledgeRepository } from '../knowledge.repository';
import { KnowledgeRetriever, knowledgeRetriever } from '../knowledge.retriever';
import { KnowledgeService, knowledgeService } from '../knowledge.service';
import type { KnowledgeChunk, KnowledgeDocumentMetadata } from '../knowledge.types';
import { cosineSimilarity, estimateTokenCount, normalizeDocumentText, titleFromFilename } from '../knowledge.utils';
import { KnowledgeVectorStore, knowledgeVectorStore } from '../knowledge.vectorstore';

describe('Phase 7: Enterprise Knowledge Engine (RAG) Unit Tests', { timeout: 30000 }, () => {
  // --- SECTION 1: Document Utilities Tests (8 tests) ---
  describe('1. Document Utilities', () => {
    test('1.1 normalizeDocumentText removes carriage returns and non-printable ASCII', () => {
      const raw = 'Header\r\nLine 1\rLine 2\x05\n\n\nLine 3';
      const clean = normalizeDocumentText(raw);
      expect(clean).toContain('Header');
      expect(clean).toContain('Line 1');
      expect(clean).not.toContain('\r');
    });

    test('1.2 normalizeDocumentText handles empty or null string gracefully', () => {
      expect(normalizeDocumentText('')).toBe('');
    });

    test('1.3 cosineSimilarity calculates 1.0 for identical vectors', () => {
      const vec = [0.5, 0.5, 0.5, 0.5];
      const score = cosineSimilarity(vec, vec);
      expect(score).toBeCloseTo(1.0);
    });

    test('1.4 cosineSimilarity calculates 0.0 for orthogonal vectors', () => {
      const vecA = [1, 0];
      const vecB = [0, 1];
      expect(cosineSimilarity(vecA, vecB)).toBe(0);
    });

    test('1.5 cosineSimilarity handles empty or mismatched vectors safely', () => {
      expect(cosineSimilarity([], [1, 2])).toBe(0);
      expect(cosineSimilarity([1, 2], [1])).toBe(0);
    });

    test('1.6 titleFromFilename formats filename into clean title', () => {
      expect(titleFromFilename('employee_handbook_2024.pdf')).toBe('Employee handbook 2024');
      expect(titleFromFilename('financial_q3_report.docx')).toBe('Financial q3 report');
    });

    test('1.7 titleFromFilename handles empty filename safely', () => {
      expect(titleFromFilename('')).toBe('Untitled Document');
    });

    test('1.8 estimateTokenCount computes 4 chars per token heuristic', () => {
      expect(estimateTokenCount('12345678')).toBe(2);
      expect(estimateTokenCount('')).toBe(0);
    });
  });

  // --- SECTION 2: Document Chunker Tests (7 tests) ---
  describe('2. KnowledgeChunker', () => {
    let chunker: KnowledgeChunker;

    beforeEach(() => {
      chunker = new KnowledgeChunker({ chunkSize: 100, chunkOverlap: 20 });
    });

    test('2.1 instantiates with custom chunkSize and chunkOverlap', () => {
      expect(chunker).toBeDefined();
    });

    test('2.2 throws error if chunkOverlap >= chunkSize', () => {
      expect(() => new KnowledgeChunker({ chunkSize: 50, chunkOverlap: 50 })).toThrow();
    });

    test('2.3 splitDocument returns empty array for empty document text', () => {
      const meta: KnowledgeDocumentMetadata = {
        documentId: 'doc_1',
        filename: 'empty.txt',
        title: 'Empty',
        fileType: 'txt',
        fileSize: 0,
        createdAt: new Date().toISOString(),
        source: 'empty.txt',
      };
      const chunks = chunker.splitDocument('', meta);
      expect(chunks).toEqual([]);
    });

    test('2.4 splitDocument produces chunks with valid index and metadata', () => {
      const meta: KnowledgeDocumentMetadata = {
        documentId: 'doc_2',
        filename: 'policy.txt',
        title: 'Policy',
        fileType: 'txt',
        fileSize: 500,
        createdAt: new Date().toISOString(),
        source: 'policy.txt',
      };
      const text = 'Paragraph 1. '.repeat(20);
      const chunks = chunker.splitDocument(text, meta);

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0]?.metadata.chunkIndex).toBe(0);
      expect(chunks[1]?.metadata.chunkIndex).toBe(1);
      expect(chunks[0]?.metadata.documentId).toBe('doc_2');
    });

    test('2.5 chunker attaches token estimates to each chunk', () => {
      const meta: KnowledgeDocumentMetadata = {
        documentId: 'doc_3',
        filename: 'test.md',
        title: 'Test',
        fileType: 'markdown',
        fileSize: 200,
        createdAt: new Date().toISOString(),
        source: 'test.md',
      };
      const chunks = chunker.splitDocument('Sample markdown text content for token estimation.', meta);
      expect(chunks[0]?.metadata.tokenEstimate).toBeGreaterThan(0);
    });

    test('2.6 handles single-paragraph short text without splitting', () => {
      const meta: KnowledgeDocumentMetadata = {
        documentId: 'doc_4',
        filename: 'short.txt',
        title: 'Short',
        fileType: 'txt',
        fileSize: 30,
        createdAt: new Date().toISOString(),
        source: 'short.txt',
      };
      const chunks = chunker.splitDocument('Short text paragraph.', meta);
      expect(chunks.length).toBe(1);
    });

    test('2.7 default knowledgeChunker singleton is available', () => {
      expect(knowledgeChunker).toBeDefined();
    });
  });

  // --- SECTION 3: Embedding Service Tests (6 tests) ---
  describe('3. KnowledgeEmbeddingService', () => {
    let embedder: KnowledgeEmbeddingService;

    beforeEach(() => {
      embedder = new KnowledgeEmbeddingService();
    });

    test('3.1 returns vector of correct dimensions (384)', async () => {
      const vector = await embedder.embedQuery('What is the refund policy?');
      expect(vector.length).toBe(EMBEDDING_DIMENSIONS);
    });

    test('3.2 produces unit L2 norm normalized vector', async () => {
      const vector = await embedder.embedQuery('Enterprise security audit');
      let sumSq = 0;
      for (const val of vector) {
        sumSq += val * val;
      }
      expect(Math.sqrt(sumSq)).toBeCloseTo(1.0, 2);
    });

    test('3.3 embedDocuments embeds array of texts into matrix', async () => {
      const matrix = await embedder.embedDocuments(['First text', 'Second text']);
      expect(matrix.length).toBe(2);
      expect(matrix[0]?.length).toBe(EMBEDDING_DIMENSIONS);
    });

    test('3.4 produces identical vectors for identical inputs', async () => {
      const vec1 = await embedder.embedQuery('Consistent test query');
      const vec2 = await embedder.embedQuery('Consistent test query');
      expect(vec1).toEqual(vec2);
    });

    test('3.5 produces distinct vectors for different inputs', async () => {
      const vec1 = await embedder.embedQuery('Financial quarterly revenue');
      const vec2 = await embedder.embedQuery('Employee maternity leave policy');
      expect(vec1).not.toEqual(vec2);
    });

    test('3.6 knowledgeEmbeddingService singleton is initialized', () => {
      expect(knowledgeEmbeddingService).toBeDefined();
      expect(knowledgeEmbeddingService.getDimensions()).toBe(384);
    });
  });

  // --- SECTION 4: Vector Store Tests (7 tests) ---
  describe('4. KnowledgeVectorStore', () => {
    let store: KnowledgeVectorStore;

    beforeEach(async () => {
      store = new KnowledgeVectorStore();
      await store.clear();
    });

    test('4.1 add chunks into vector store', async () => {
      const chunk: KnowledgeChunk = {
        id: 'c1',
        text: 'Refund policy text',
        vector: [1, 0, 0],
        metadata: {
          documentId: 'd1',
          filename: 'refund.pdf',
          title: 'Refund Policy',
          fileType: 'pdf',
          fileSize: 100,
          chunkIndex: 0,
          tokenEstimate: 5,
          createdAt: new Date().toISOString(),
          source: 'refund.pdf',
        },
      };

      await store.add([chunk]);
      expect(store.stats().totalChunks).toBe(1);
      expect(store.stats().totalDocuments).toBe(1);
    });

    test('4.2 search returns matching chunks sorted by similarity', async () => {
      const chunkA: KnowledgeChunk = {
        id: 'ca',
        text: 'Exact match',
        vector: [1, 0, 0],
        metadata: { documentId: 'da', filename: 'a.txt', title: 'A', fileType: 'txt', fileSize: 10, chunkIndex: 0, tokenEstimate: 2, createdAt: '', source: 'a.txt' },
      };
      const chunkB: KnowledgeChunk = {
        id: 'cb',
        text: 'Orthogonal text',
        vector: [0, 1, 0],
        metadata: { documentId: 'db', filename: 'b.txt', title: 'B', fileType: 'txt', fileSize: 10, chunkIndex: 0, tokenEstimate: 2, createdAt: '', source: 'b.txt' },
      };

      await store.add([chunkA, chunkB]);

      const results = await store.search([1, 0, 0], 2, 0.1);
      expect(results.length).toBe(1);
      expect(results[0]?.chunk.id).toBe('ca');
      expect(results[0]?.similarity).toBeCloseTo(1.0);
    });

    test('4.3 delete removes document chunks', async () => {
      const chunk: KnowledgeChunk = {
        id: 'cd',
        text: 'Sample',
        vector: [1, 0, 0],
        metadata: { documentId: 'doc_to_del', filename: 'del.txt', title: 'Del', fileType: 'txt', fileSize: 10, chunkIndex: 0, tokenEstimate: 2, createdAt: '', source: 'del.txt' },
      };
      await store.add([chunk]);
      expect(store.stats().totalChunks).toBe(1);

      const deletedCount = await store.delete('doc_to_del');
      expect(deletedCount).toBe(1);
      expect(store.stats().totalChunks).toBe(0);
    });

    test('4.4 clear empties the store', async () => {
      const chunk: KnowledgeChunk = {
        id: 'cc',
        text: 'Clear test',
        vector: [1, 0, 0],
        metadata: { documentId: 'dc', filename: 'c.txt', title: 'C', fileType: 'txt', fileSize: 10, chunkIndex: 0, tokenEstimate: 2, createdAt: '', source: 'c.txt' },
      };
      await store.add([chunk]);
      await store.clear();
      expect(store.stats().totalChunks).toBe(0);
    });

    test('4.5 respects topK limit', async () => {
      const chunks: KnowledgeChunk[] = [1, 2, 3, 4, 5].map((i) => ({
        id: `chk_${i}`,
        text: `Chunk ${i}`,
        vector: [1, 0, 0],
        metadata: { documentId: `d_${i}`, filename: `${i}.txt`, title: `${i}`, fileType: 'txt', fileSize: 10, chunkIndex: 0, tokenEstimate: 2, createdAt: '', source: `${i}.txt` },
      }));

      await store.add(chunks);
      const results = await store.search([1, 0, 0], 3, 0.1);
      expect(results.length).toBe(3);
    });

    test('4.6 respects minSimilarity threshold', async () => {
      const chunk: KnowledgeChunk = {
        id: 'low_sim',
        text: 'Low similarity',
        vector: [0.1, 0.9, 0],
        metadata: { documentId: 'dlow', filename: 'low.txt', title: 'Low', fileType: 'txt', fileSize: 10, chunkIndex: 0, tokenEstimate: 2, createdAt: '', source: 'low.txt' },
      };
      await store.add([chunk]);

      const resultsHigh = await store.search([1, 0, 0], 5, 0.9);
      expect(resultsHigh.length).toBe(0);
    });

    test('4.7 knowledgeVectorStore singleton exists', () => {
      expect(knowledgeVectorStore).toBeDefined();
    });
  });

  // --- SECTION 5: Knowledge Retriever Tests (5 tests) ---
  describe('5. KnowledgeRetriever', () => {
    let retriever: KnowledgeRetriever;
    let store: KnowledgeVectorStore;

    beforeEach(async () => {
      store = new KnowledgeVectorStore();
      await store.clear();
      retriever = new KnowledgeRetriever(store, knowledgeEmbeddingService);
    });

    test('5.1 returns empty chunks for empty query', async () => {
      const result = await retriever.retrieve('');
      expect(result.chunks).toEqual([]);
    });

    test('5.2 retrieves relevant chunks for matched content query', async () => {
      const text = 'Enterprise employees receive 20 days paid leave per year.';
      const vec = await knowledgeEmbeddingService.embedQuery(text);

      await store.add([{
        id: 'leave_chk',
        text,
        vector: vec,
        metadata: { documentId: 'handbook', filename: 'handbook.pdf', title: 'Handbook', fileType: 'pdf', fileSize: 200, chunkIndex: 0, tokenEstimate: 10, createdAt: '', source: 'handbook.pdf' },
      }]);

      const result = await retriever.retrieve('paid leave policy');
      expect(result.chunks.length).toBeGreaterThan(0);
      expect(result.chunks[0]?.chunk.text).toContain('paid leave');
    });

    test('5.3 respects custom topK in options', async () => {
      const result = await retriever.retrieve('query', { topK: 2 });
      expect(result.chunks.length).toBeLessThanOrEqual(2);
    });

    test('5.4 returns executionTimeMs in result payload', async () => {
      const result = await retriever.retrieve('test timing');
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    test('5.5 knowledgeRetriever singleton is defined', () => {
      expect(knowledgeRetriever).toBeDefined();
    });
  });

  // --- SECTION 6: Citation Generator Tests (4 tests) ---
  describe('6. KnowledgeCitations', () => {
    let citations: KnowledgeCitations;

    beforeEach(() => {
      citations = new KnowledgeCitations();
    });

    test('6.1 extractCitations extracts unique document citations', () => {
      const searchResults = [{
        chunk: {
          id: 'c1',
          text: 'Policy text',
          metadata: { documentId: 'd1', filename: 'Policy_2024.pdf', title: 'Policy', fileType: 'pdf' as const, fileSize: 100, chunkIndex: 0, pageNumber: 5, tokenEstimate: 10, createdAt: '', source: 'Policy_2024.pdf' },
        },
        similarity: 0.95,
      }];

      const extracted = citations.extractCitations(searchResults);
      expect(extracted.length).toBe(1);
      expect(extracted[0]?.source).toBe('Policy_2024.pdf');
      expect(extracted[0]?.reference).toBe('Page 5');
    });

    test('6.2 extractCitations handles empty search results safely', () => {
      expect(citations.extractCitations([])).toEqual([]);
    });

    test('6.3 formatCitationsMarkdown generates clean Markdown references', () => {
      const c = [{ source: 'Report.pdf', reference: 'Page 12' }];
      const md = citations.formatCitationsMarkdown(c);
      expect(md).toContain('Sources & Citations');
      expect(md).toContain('Report.pdf');
      expect(md).toContain('Page 12');
    });

    test('6.4 knowledgeCitations singleton is defined', () => {
      expect(knowledgeCitations).toBeDefined();
    });
  });

  // --- SECTION 7: Ingestion Service Tests (5 tests) ---
  describe('7. KnowledgeIngestionService', () => {
    let ingestion: KnowledgeIngestionService;
    let store: KnowledgeVectorStore;

    beforeEach(async () => {
      store = new KnowledgeVectorStore();
      await store.clear();
      ingestion = new KnowledgeIngestionService(knowledgeChunker, knowledgeEmbeddingService, store);
    });

    test('7.1 ingestDocument parses, chunks, embeds, and indexes document text', async () => {
      const chunks = await ingestion.ingestDocument({
        filename: 'Financial_Policy.pdf',
        fileContent: 'Section 1. Annual expenditure limits are capped at $50,000 per department.',
        fileType: 'pdf',
      });

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]?.vector).toBeDefined();
      expect(store.stats().totalChunks).toBe(chunks.length);
    });

    test('7.2 handles empty file content gracefully', async () => {
      const chunks = await ingestion.ingestDocument({
        filename: 'empty.txt',
        fileContent: '',
      });
      expect(chunks).toEqual([]);
    });

    test('7.3 infers file format from extension automatically', async () => {
      const chunks = await ingestion.ingestDocument({
        filename: 'readme.md',
        fileContent: '# System Overview\n\nEnterprise architecture specifications.',
      });

      expect(chunks[0]?.metadata.fileType).toBe('markdown');
    });

    test('7.4 supports Buffer input content', async () => {
      const buf = Buffer.from('Buffer text content for ingestion test.');
      const chunks = await ingestion.ingestDocument({
        filename: 'buffer.txt',
        fileContent: buf,
      });

      expect(chunks.length).toBe(1);
    });

    test('7.5 knowledgeIngestionService singleton is defined', () => {
      expect(knowledgeIngestionService).toBeDefined();
    });
  });

  // --- SECTION 8: Knowledge Service & RAG Pipeline Tests (6 tests) ---
  describe('8. KnowledgeService & RAG Pipeline', () => {
    let service: KnowledgeService;
    let store: KnowledgeVectorStore;
    let ingestion: KnowledgeIngestionService;

    beforeEach(async () => {
      store = new KnowledgeVectorStore();
      await store.clear();
      ingestion = new KnowledgeIngestionService(knowledgeChunker, knowledgeEmbeddingService, store);
      const retriever = new KnowledgeRetriever(store, knowledgeEmbeddingService);
      service = new KnowledgeService(retriever, knowledgeCitations);
    });

    test('8.1 returns insufficient info response when vector store is empty', async () => {
      const answer = await service.queryKnowledge('What is the refund policy?');
      expect(answer.answer).toContain('does not contain enough information');
      expect(answer.chunks.length).toBe(0);
    });

    test('8.2 returns grounded answer and citations when relevant document exists', async () => {
      await ingestion.ingestDocument({
        filename: 'Refund_Policy_2025.pdf',
        fileContent: 'Customers may request a full refund within 30 days of purchase.',
        pageCount: 3,
      });

      const answer = await service.queryKnowledge('What is the refund policy?');
      expect(answer.answer).toBeDefined();
      expect(answer.chunks.length).toBeGreaterThan(0);
      expect(answer.citations.length).toBeGreaterThan(0);
      expect(answer.citations[0]?.source).toBe('Refund_Policy_2025.pdf');
    });

    test('8.3 handles empty question input gracefully', async () => {
      const answer = await service.queryKnowledge('');
      expect(answer.answer).toContain('valid question');
    });

    test('8.4 KnowledgeRepository methods work as expected', async () => {
      const repo = new KnowledgeRepository(store);
      expect(repo.getStats().totalChunks).toBe(0);
    });

    test('8.5 knowledgeService singleton is defined', () => {
      expect(knowledgeService).toBeDefined();
    });

    test('8.6 end-to-end RAG workflow execution time is tracked', async () => {
      const answer = await service.queryKnowledge('Test question timing');
      expect(answer.executionTimeMs).toBeGreaterThanOrEqual(0);
    });
  });
});
