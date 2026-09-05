import { logger } from '../../config/logger';
import { DEFAULT_TOP_K, SIMILARITY_THRESHOLD } from './knowledge.constants';
import { knowledgeEmbeddingService, KnowledgeEmbeddingService } from './knowledge.embeddings';
import type { KnowledgeChunk, RetrievalResult, VectorSearchResult } from './knowledge.types';
import { knowledgeVectorStore, KnowledgeVectorStore } from './knowledge.vectorstore';

export interface RetrieverOptions {
  topK?: number;
  minSimilarity?: number;
  enableQueryExpansion?: boolean;
}

export class KnowledgeRetriever {
  constructor(
    private readonly vectorStore: KnowledgeVectorStore = knowledgeVectorStore,
    private readonly embeddingService: KnowledgeEmbeddingService = knowledgeEmbeddingService,
  ) {}

  /**
   * Retrieves, re-ranks, and merges top-K relevant document context chunks using
   * Hybrid Search (Vector Similarity + BM25 Keyword Matching + Query Expansion).
   *
   * @param query User natural language question
   * @param options Retrieval options
   * @returns RetrievalResult payload with merged, re-ranked context chunks
   */
  public async retrieve(query: string, options: RetrieverOptions = {}): Promise<RetrievalResult> {
    const startTime = Date.now();
    const topK = options.topK ?? DEFAULT_TOP_K;
    const minSimilarity = options.minSimilarity ?? SIMILARITY_THRESHOLD;

    if (!query || !query.trim()) {
      return { query, chunks: [], executionTimeMs: Date.now() - startTime };
    }

    console.log('\n========== RAG RETRIEVAL DEBUG ==========');
    console.log(`Incoming Question: "${query}"`);

    try {
      // 1. Query Expansion (Generate expanded search terms)
      const expandedQueries = this.expandQuery(query);

      // 2. Vector Similarity Search
      const queryVector = await this.embeddingService.embedQuery(query);
      console.log(`↓ Generated embedding (${queryVector.length} dimensions)`);
      console.log('↓ Vector search & BM25 hybrid matching');

      const vectorResults = await this.vectorStore.search(queryVector, topK * 2, minSimilarity);

      // 3. BM25 / Keyword Search scoring across all vector store chunks
      const allChunks = this.vectorStore.getAllChunks();
      const hybridResults = this.performHybridScoring(query, expandedQueries, vectorResults, allChunks);

      // 4. Sort & Re-rank by Hybrid Score
      hybridResults.sort((a, b) => (b.hybridScore ?? b.similarity) - (a.hybridScore ?? a.similarity));

      // 5. Select top K results
      const topChunks = hybridResults.slice(0, topK);

      // 6. Sort selected chunks by document reading order (pageNumber, chunkIndex)
      topChunks.sort((a, b) => {
        const pageA = a.chunk.metadata.pageNumber || 1;
        const pageB = b.chunk.metadata.pageNumber || 1;
        if (pageA !== pageB) return pageA - pageB;
        return a.chunk.metadata.chunkIndex - b.chunk.metadata.chunkIndex;
      });

      console.log('\n↓ Top similarity scores & page numbers:');
      let totalContextChars = 0;
      for (const res of topChunks) {
        const scoreStr = (res.hybridScore ?? res.similarity).toFixed(2);
        const pageNum = res.chunk.metadata.pageNumber || 1;
        const section = res.chunk.metadata.sectionHeading || 'General';
        console.log(`  • Similarity: ${scoreStr} | Page ${pageNum} | Section: "${section}"`);
        totalContextChars += res.chunk.text.length;
      }

      const promptContextTokens = Math.round(totalContextChars / 4);
      console.log(`\nPrompt context size: ${promptContextTokens.toLocaleString()} tokens`);
      console.log('=========================================\n');

      const executionTimeMs = Date.now() - startTime;
      logger.info(
        { query, retrievedCount: topChunks.length, expandedCount: expandedQueries.length, executionTimeMs },
        'Hybrid KnowledgeRetriever search and re-ranking complete',
      );

      return {
        query,
        expandedQueries,
        chunks: topChunks,
        executionTimeMs,
      };
    } catch (error) {
      logger.error({ err: error, query }, 'KnowledgeRetriever query failure');
      console.log('=========================================\n');
      return {
        query,
        chunks: [],
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Generates expanded synonym terms for short user queries.
   */
  private expandQuery(query: string): string[] {
    const terms = [query];
    const q = query.toLowerCase();

    if (q.includes('return') || q.includes('damaged') || q.includes('refund')) {
      terms.push('refund policy', 'return window', 'replacement', 'damaged items', 'customer support', 'warranty');
    }
    if (q.includes('onboard') || q.includes('start') || q.includes('setup')) {
      terms.push('getting started', 'installation', 'account configuration', 'user guide');
    }
    if (q.includes('price') || q.includes('plan') || q.includes('cost')) {
      terms.push('pricing tiers', 'subscription', 'billing policy', 'license fees');
    }

    return Array.from(new Set(terms));
  }

  /**
   * Combines Vector Cosine Similarity with BM25 Keyword Search scores.
   */
  private performHybridScoring(
    query: string,
    expandedQueries: string[],
    vectorResults: VectorSearchResult[],
    allChunks: KnowledgeChunk[],
  ): VectorSearchResult[] {
    const resultMap = new Map<string, VectorSearchResult>();

    for (const vRes of vectorResults) {
      resultMap.set(vRes.chunk.id, {
        ...vRes,
        keywordScore: 0,
        hybridScore: vRes.similarity,
      });
    }

    const keywords = this.extractKeywords([...expandedQueries, query].join(' '));

    if (keywords.length > 0) {
      for (const chunk of allChunks) {
        const textLower = chunk.text.toLowerCase();
        let matchCount = 0;

        for (const kw of keywords) {
          if (textLower.includes(kw)) {
            matchCount++;
          }
        }

        const keywordScore = matchCount / keywords.length;

        if (keywordScore > 0) {
          const existing = resultMap.get(chunk.id);
          const similarity = existing ? existing.similarity : 0.05;
          const hybridScore = 0.65 * similarity + 0.35 * keywordScore;

          resultMap.set(chunk.id, {
            chunk,
            similarity,
            keywordScore,
            hybridScore,
          });
        }
      }
    }

    return Array.from(resultMap.values());
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['what', 'is', 'the', 'a', 'an', 'and', 'or', 'in', 'on', 'of', 'for', 'to', 'with', 'how', 'can', 'i', 'do']);
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
  }
}

export const knowledgeRetriever = new KnowledgeRetriever();
