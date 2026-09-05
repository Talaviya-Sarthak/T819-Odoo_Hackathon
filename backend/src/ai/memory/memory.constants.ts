/**
 * Memory Module Constants
 * PS-05 Enterprise Intelligence Platform
 */

/** Maximum raw chat history messages stored in a session before trimming */
export const MAX_CHAT_HISTORY_MESSAGES = 20;

/** Maximum recent chat messages included directly in LLM context budget */
export const MAX_CONTEXT_MESSAGES = 6;

/** Number of new messages that trigger an automated LLM summarization pass */
export const SUMMARY_TRIGGER_MESSAGE_COUNT = 10;

/** Approximate token budget allocated for context injection */
export const MAX_CONTEXT_TOKEN_BUDGET = 3000;

/** Session expiration time in minutes (default 24 hours) */
export const DEFAULT_SESSION_TTL_MINUTES = 60 * 24;

/** Model used for conversation summarization */
export const SUMMARIZER_MODEL = 'llama-3.3-70b-versatile';

/** Temperature for deterministic factual summarization */
export const SUMMARIZER_TEMPERATURE = 0.1;
