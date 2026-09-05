import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { GROQ_FALLBACK_MODELS, GROQ_LLM_MODEL } from '../constants';
import {
  RESPONSE_GENERATOR_MAX_TOKENS,
  RESPONSE_GENERATOR_TEMPERATURE,
} from './response.constants';
import { RESPONSE_GENERATION_SYSTEM_PROMPT } from './response.prompts';
import type { AIResponse, ResponseContext } from './response.types';
import {
  buildResponseMetadata,
  formatGeneratorPromptInput,
  generateFallbackAnswer,
} from './response.utils';

export class ResponseGenerator {
  /**
   * Converts a user question, execution plan, toolResult, and memoryContext into a professional natural language response.
   * Includes multi-model fallback to handle Groq API 429 rate limits seamlessly.
   */
  public async generate(context: ResponseContext): Promise<AIResponse> {
    const startTimeMs = Date.now();
    const { executionPlan, toolResult } = context;

    const citations = toolResult?.metadata?.citations || toolResult?.data?.citations || [];
    const apiKey = env.GROQ_API_KEY;

    if (!apiKey) {
      logger.warn('GROQ_API_KEY missing. Using direct analytical fallback synthesis.');
      return {
        success: true,
        answer: generateFallbackAnswer(context),
        metadata: buildResponseMetadata(executionPlan, startTimeMs, 'analytics-fallback', citations),
      };
    }

    const candidateModels = [GROQ_LLM_MODEL, ...GROQ_FALLBACK_MODELS];
    const promptText = formatGeneratorPromptInput(context);
    const messages = [
      new SystemMessage(RESPONSE_GENERATION_SYSTEM_PROMPT),
      new HumanMessage(promptText),
    ];

    for (const modelName of candidateModels) {
      try {
        const model = new ChatGroq({
          apiKey,
          model: modelName,
          temperature: RESPONSE_GENERATOR_TEMPERATURE,
          maxTokens: RESPONSE_GENERATOR_MAX_TOKENS,
        });

        const response = await model.invoke(messages);
        const answer = typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);

        if (answer && answer.trim()) {
          logger.info({ modelName, answerLength: answer.length }, 'ResponseGenerator synthesis succeeded');
          return {
            success: true,
            answer: answer.trim(),
            metadata: buildResponseMetadata(executionPlan, startTimeMs, modelName, citations),
          };
        }
      } catch (error: any) {
        logger.warn({ modelName, err: error?.message || error }, 'Model attempt failed in ResponseGenerator. Trying fallback model...');
      }
    }

    // Direct analytical fallback synthesis if all LLM models hit quota limits
    logger.warn('All LLM model attempts exhausted. Using direct analytical fallback synthesis.');
    return {
      success: true,
      answer: generateFallbackAnswer(context),
      metadata: buildResponseMetadata(executionPlan, startTimeMs, 'analytics-fallback', citations),
    };
  }
}

export const responseGenerator = new ResponseGenerator();
