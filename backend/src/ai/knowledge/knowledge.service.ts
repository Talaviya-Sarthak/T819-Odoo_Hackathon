import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { GROQ_LLM_MODEL } from '../constants';
import { knowledgeCitations, KnowledgeCitations } from './knowledge.citations';
import { RAG_GROUNDED_ANSWER_SYSTEM_PROMPT } from './knowledge.prompts';
import { knowledgeRetriever, KnowledgeRetriever } from './knowledge.retriever';
import { normalizeDocumentText } from './knowledge.utils';

import type { KnowledgeAnswer, VectorSearchResult } from './knowledge.types';

export class KnowledgeService {
  private model: ChatGroq | null = null;

  constructor(
    private readonly retriever: KnowledgeRetriever = knowledgeRetriever,
    private readonly citationsBuilder: KnowledgeCitations = knowledgeCitations,
  ) {
    this.initModel();
  }

  private initModel(): void {
    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) return;

    try {
      this.model = new ChatGroq({
        apiKey,
        model: GROQ_LLM_MODEL,
        temperature: 0.2,
        maxTokens: 1200,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize KnowledgeService ChatGroq model');
      this.model = null;
    }
  }

  /**
   * Executes full Production RAG retrieval, multi-chunk synthesis & grounded answer generation.
   *
   * @param question Natural language user query
   * @returns KnowledgeAnswer object carrying answer text, retrieved chunks, citations, and execution timing
   */
  public async queryKnowledge(question: string): Promise<KnowledgeAnswer> {
    const startTime = Date.now();

    if (!question || !question.trim()) {
      return {
        answer: 'Please provide a valid question to search the internal documentation.',
        chunks: [],
        citations: [],
        executionTimeMs: Date.now() - startTime,
      };
    }

    // 1. Hybrid Search (Vector Similarity + BM25 Keyword Search + Query Expansion)
    const retrieval = await this.retriever.retrieve(question);
    const chunks = retrieval.chunks;

    // 2. Insufficient information handling
    if (chunks.length === 0) {
      return {
        answer: 'The available documentation does not contain enough information to answer this question confidently.',
        chunks: [],
        citations: [],
        executionTimeMs: Date.now() - startTime,
      };
    }

    // 3. Extract Citations
    const citations = this.citationsBuilder.extractCitations(chunks);

    // 4. Synthesize Grounded Answer using Groq LLM
    if (!this.model) {
      this.initModel();
    }

    if (!this.model) {
      return {
        answer: this.generateFallbackAnswer(chunks),
        chunks,
        citations,
        executionTimeMs: Date.now() - startTime,
      };
    }

    try {
      // Format multi-chunk context sorted by reading order (pageNumber, chunkIndex)
      const contextText = chunks
        .map(
          (c, i) =>
            `[EXCERPT ${i + 1}] (Document: "${c.chunk.metadata.title || c.chunk.metadata.filename}", Section: "${c.chunk.metadata.sectionHeading || 'General'}", Page: ${c.chunk.metadata.pageNumber || 1}):\n${normalizeDocumentText(c.chunk.text)}`,
        )
        .join('\n\n---\n\n');

      const messages = [
        new SystemMessage(RAG_GROUNDED_ANSWER_SYSTEM_PROMPT),
        new HumanMessage(`USER QUESTION:\n"${question}"\n\nDOCUMENT CONTEXT:\n${contextText}`),
      ];

      const response = await this.model.invoke(messages);
      let answerText =
        typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

      answerText = this.sanitizeJargon(answerText.trim());

      const executionTimeMs = Date.now() - startTime;
      logger.info({ question, chunkCount: chunks.length, executionTimeMs }, 'Production RAG multi-chunk synthesis complete');

      return {
        answer: answerText,
        chunks,
        citations,
        executionTimeMs,
      };
    } catch (error) {
      logger.error({ err: error, question }, 'Error generating grounded answer; rendering clean multi-chunk fallback');
      return {
        answer: this.generateFallbackAnswer(chunks),
        chunks,
        citations,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  private generateFallbackAnswer(chunks: VectorSearchResult[]): string {
    const cleanTexts = chunks
      .map((c) => normalizeDocumentText(c.chunk.text))
      .filter((t) => t.length > 20);

    if (cleanTexts.length === 0) {
      return 'I couldn\'t fully process this document because parts of the text couldn\'t be extracted.';
    }

    const bullets = cleanTexts
      .slice(0, 4)
      .map((t) => `• ${t.length > 250 ? t.slice(0, 250) + '…' : t}`)
      .join('\n\n');

    return `According to the available documentation:\n\n${bullets}`;
  }

  private sanitizeJargon(text: string): string {
    let cleaned = text;

    // Remove forbidden RAG / tool / parser phrases
    cleaned = cleaned.replace(/the current tool result payload does not contain/gi, 'I couldn\'t find information about this in');
    cleaned = cleaned.replace(/tool result payload|tool result|tool payload/gi, '');
    cleaned = cleaned.replace(/vector database|embedding|knowledge chunk|rag pipeline|rag/gi, '');
    cleaned = cleaned.replace(/parser error|encoding issue|failed to retrieve|page index|chunk index/gi, '');
    cleaned = cleaned.replace(/referenced on page \d+/gi, '');

    return cleaned.replace(/\n{3,}/g, '\n\n').trim();
  }
}

export const knowledgeService = new KnowledgeService();
