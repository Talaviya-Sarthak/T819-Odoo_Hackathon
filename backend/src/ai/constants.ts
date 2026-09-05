/**
 * AI Module Constants
 * PS-05 Enterprise Intelligence Platform
 */

/** Primary Target LLM model hosted on Groq API */
export const GROQ_LLM_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

/** Secondary fallback models used if rate limits or quota errors occur on primary model */
export const GROQ_FALLBACK_MODELS = [
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
  'groq/compound-mini',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

/** Default generation temperature (low temperature for deterministic, factual business responses) */
export const DEFAULT_AI_TEMPERATURE = 0.2;

/** Maximum response tokens allowed per query */
export const MAX_AI_TOKENS = 2048;
