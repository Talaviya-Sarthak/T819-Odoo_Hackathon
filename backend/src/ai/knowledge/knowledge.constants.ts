/**
 * Production Knowledge Engine (RAG) Constants
 * PS-05 Enterprise Intelligence Platform
 */

/** Target semantic chunk size in tokens (600 - 1000 tokens ≈ 2400 - 4000 characters) */
export const TARGET_CHUNK_TOKENS = 750;
export const DEFAULT_CHUNK_SIZE = 3000; // ~750 tokens in characters

/** Target semantic chunk overlap in tokens (100 - 150 tokens ≈ 400 - 600 characters) */
export const TARGET_CHUNK_OVERLAP_TOKENS = 125;
export const DEFAULT_CHUNK_OVERLAP = 500; // ~125 tokens in characters

/** Default number of top relevant chunks to retrieve for re-ranking */
export const DEFAULT_TOP_K = 8;

/** Maximum context chunks passed to LLM prompt builder */
export const MAX_CONTEXT_CHUNKS = 10;

/** Minimum cosine similarity threshold (0.0 to 1.0) for vector search recall */
export const SIMILARITY_THRESHOLD = 0.10;

/** Embedding vector dimensionality (384-dimensional feature space) */
export const EMBEDDING_DIMENSIONS = 384;

/** Model identifier for embedding generation service */
export const EMBEDDING_MODEL = 'all-MiniLM-L6-v2';

/** Active vector store backend identifier */
export const VECTOR_STORE_TYPE = 'memory';

/** Current Embedding Engine Version */
export const EMBEDDING_VERSION = 'v1.2.0-semantic-hybrid';
