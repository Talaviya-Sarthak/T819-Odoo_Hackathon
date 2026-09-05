import { GROQ_LLM_MODEL } from '../constants';

/** LLM model used for response generation */
export const RESPONSE_GENERATOR_MODEL = GROQ_LLM_MODEL;

/** Temperature for natural language response generation (low for factual adherence) */
export const RESPONSE_GENERATOR_TEMPERATURE = 0.2;

/** Maximum output tokens for natural language response */
export const RESPONSE_GENERATOR_MAX_TOKENS = 2048;
