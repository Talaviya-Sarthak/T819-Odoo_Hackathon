import { pipeline } from '@xenova/transformers';
import { logger } from '../../config/logger';
import { EMBEDDING_DIMENSIONS } from './knowledge.constants';

/**
 * Interface that all embedding providers (HuggingFace, OpenAI, Voyage) must implement.
 */
export interface IEmbeddingService {
  embedQuery(text: string): Promise<number[]>;
  embedDocuments(texts: string[]): Promise<number[][]>;
  getDimensions(): number;
}

let extractorPromise: Promise<any> | null = null;

/**
 * Singleton model loader for Hugging Face sentence-transformers/all-MiniLM-L6-v2.
 */
async function getExtractor(): Promise<any> {
  if (!extractorPromise) {
    logger.info(
      `Knowledge Embedding Model Loading...\nModel: sentence-transformers/all-MiniLM-L6-v2\nDimensions: ${EMBEDDING_DIMENSIONS}`,
    );
    extractorPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2').then((extractor) => {
      logger.info(
        'Knowledge Embedding Model Loaded\nModel: sentence-transformers/all-MiniLM-L6-v2\nDimensions: 384\nStatus: Ready',
      );
      return extractor;
    }).catch((err) => {
      logger.error({ err }, 'Failed to load HuggingFace sentence-transformers/all-MiniLM-L6-v2 model');
      extractorPromise = null;
      throw err;
    });
  }
  return extractorPromise;
}

export class KnowledgeEmbeddingService implements IEmbeddingService {
  private readonly dimensions: number = EMBEDDING_DIMENSIONS;

  public getDimensions(): number {
    return this.dimensions;
  }

  /**
   * Embeds a user search query into a normalized 384-dimensional dense vector using all-MiniLM-L6-v2.
   *
   * @param text Natural language search query
   * @returns Array of 384 floating point numbers
   */
  public async embedQuery(text: string): Promise<number[]> {
    if (!text || !text.trim()) {
      return new Array<number>(this.dimensions).fill(0);
    }

    if (process.env.NODE_ENV === 'test') {
      return this.generateDeterministicTestVector(text);
    }

    try {
      const extractor = await getExtractor();
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data) as number[];
      return this.ensureDimensions(vector);
    } catch (err) {
      logger.error({ err }, 'Failed to generate query embedding vector via HuggingFace model');
      return this.generateDeterministicTestVector(text);
    }
  }

  /**
   * Embeds document chunk texts in batches using sentence-transformers/all-MiniLM-L6-v2.
   *
   * @param texts Array of document chunk texts
   * @returns Matrix of dense 384-dim embedding vectors
   */
  public async embedDocuments(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) return [];

    if (process.env.NODE_ENV === 'test') {
      return texts.map((t) => this.generateDeterministicTestVector(t));
    }

    logger.info(`Generating embeddings...\nChunks: ${texts.length}\nModel: all-MiniLM-L6-v2`);

    try {
      const extractor = await getExtractor();
      const results: number[][] = [];

      // Batch encode 16 chunks at a time for optimal CPU inference speed
      const batchSize = 16;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const outputs = await Promise.all(
          batch.map((t) => extractor(t && t.trim() ? t : 'document chunk', { pooling: 'mean', normalize: true })),
        );
        for (const out of outputs) {
          const vec = Array.from(out.data) as number[];
          results.push(this.ensureDimensions(vec));
        }
      }

      logger.info(`Embeddings generated successfully.\nChunks: ${texts.length}\nModel: all-MiniLM-L6-v2\nCompleted successfully.`);
      return results;
    } catch (err) {
      logger.error({ err }, 'Failed to batch embed document chunks via HuggingFace model');
      return texts.map((t) => this.generateDeterministicTestVector(t));
    }
  }

  private ensureDimensions(vector: number[]): number[] {
    if (vector.length === this.dimensions) return vector;
    if (vector.length > this.dimensions) return vector.slice(0, this.dimensions);
    const padded = [...vector];
    while (padded.length < this.dimensions) {
      padded.push(0);
    }
    return padded;
  }

  private generateDeterministicTestVector(text: string): number[] {
    const vector = new Array<number>(this.dimensions).fill(0);
    const cleaned = text.toLowerCase().replace(/[^\w\s]/g, '').trim();
    if (!cleaned) return vector;

    const words = cleaned.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word) continue;
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash << 5) - hash + word.charCodeAt(j);
        hash |= 0;
      }
      const idx = Math.abs(hash) % this.dimensions;
      vector[idx] = (vector[idx] || 0) + 1.0;
    }

    let sumSq = 0;
    for (let i = 0; i < this.dimensions; i++) {
      const v = vector[i] || 0;
      sumSq += v * v;
    }
    const norm = Math.sqrt(sumSq);
    if (norm > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vector[i] = (vector[i] || 0) / norm;
      }
    }
    return vector;
  }
}

export const knowledgeEmbeddingService = new KnowledgeEmbeddingService();
