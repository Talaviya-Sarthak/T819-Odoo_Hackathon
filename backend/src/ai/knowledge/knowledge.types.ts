/**
 * Production Knowledge Engine (RAG) Type Definitions
 * PS-05 Enterprise Intelligence Platform
 */

import type { MemoryContext } from '../memory/memory.types';
import type { ResponseCitation } from '../generator/response.types';

/** Supported document formats for enterprise ingestion */
export type SupportedDocumentFormat = 'pdf' | 'docx' | 'txt' | 'markdown';

/** Document Metadata attached to ingested files */
export interface KnowledgeDocumentMetadata {
  documentId: string;
  filename: string;
  title: string;
  fileType: SupportedDocumentFormat;
  fileSize: number;
  pageCount?: number;
  createdAt: string;
  source: string;
  [key: string]: any;
}

/** Rich Metadata attached to every semantic chunk */
export interface KnowledgeChunkMetadata extends KnowledgeDocumentMetadata {
  documentName?: string;
  chunkIndex: number;
  totalChunks?: number;
  pageNumber?: number;
  sectionHeading?: string;
  tokenEstimate: number;
  sourcePath?: string;
  embeddingVersion?: string;
}

/** Vector document chunk stored in the Knowledge Engine */
export interface KnowledgeChunk {
  id: string;
  text: string;
  vector?: number[];
  metadata: KnowledgeChunkMetadata;
}

/** Diagnostic telemetry generated during document validation */
export interface DocumentValidationDiagnostics {
  documentId: string;
  filename: string;
  totalPages: number;
  extractedPages: number;
  characterCount: number;
  wordCount: number;
  ocrPages: number;
  chunkCount: number;
  embeddingsCreated: number;
  status: 'Complete' | 'Failed' | 'Warning';
  extractionErrors: number;
}

/** Search result returned by Hybrid Vector + Keyword Store query */
export interface VectorSearchResult {
  chunk: KnowledgeChunk;
  similarity: number;
  keywordScore?: number;
  hybridScore?: number;
}

/** Result returned by KnowledgeRetriever */
export interface RetrievalResult {
  query: string;
  expandedQueries?: string[];
  chunks: VectorSearchResult[];
  executionTimeMs: number;
}

/** Input context supplied to KnowledgePromptBuilder */
export interface KnowledgePromptContext {
  question: string;
  retrievedChunks: VectorSearchResult[];
  memoryContext?: MemoryContext;
}

/** Answer object returned by KnowledgeService */
export interface KnowledgeAnswer {
  answer: string;
  chunks: VectorSearchResult[];
  citations: ResponseCitation[];
  diagnostics?: DocumentValidationDiagnostics;
  executionTimeMs: number;
}

/** Statistics overview for the Vector Store and Document Registry */
export interface VectorStoreStats {
  totalDocuments: number;
  totalChunks: number;
  embeddingDimensions: number;
  memoryUsageBytes: number;
}
