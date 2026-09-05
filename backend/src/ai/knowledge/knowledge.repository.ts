import type { KnowledgeChunk, VectorSearchResult, VectorStoreStats } from './knowledge.types';
import { knowledgeVectorStore, KnowledgeVectorStore } from './knowledge.vectorstore';

export class KnowledgeRepository {
  constructor(private readonly vectorStore: KnowledgeVectorStore = knowledgeVectorStore) {}

  public async saveChunks(chunks: KnowledgeChunk[]): Promise<void> {
    await this.vectorStore.add(chunks);
  }

  public async search(
    queryVector: number[],
    topK?: number,
    minSimilarity?: number,
  ): Promise<VectorSearchResult[]> {
    return this.vectorStore.search(queryVector, topK, minSimilarity);
  }

  public async deleteDocument(documentId: string): Promise<number> {
    return this.vectorStore.delete(documentId);
  }

  public async clearAll(): Promise<void> {
    await this.vectorStore.clear();
  }

  public getStats(): VectorStoreStats {
    return this.vectorStore.stats();
  }
}

export const knowledgeRepository = new KnowledgeRepository();
