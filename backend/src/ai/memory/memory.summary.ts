import { ChatGroq } from '@langchain/groq';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { SUMMARIZER_MODEL, SUMMARIZER_TEMPERATURE } from './memory.constants';
import type { ConversationSession, ConversationSummary } from './memory.types';

export class ConversationSummarizer {
  private model: ChatGroq | null = null;

  constructor() {
    this.initModel();
  }

  private initModel(): void {
    const apiKey = env.GROQ_API_KEY;
    if (!apiKey) return;

    try {
      this.model = new ChatGroq({
        apiKey,
        model: SUMMARIZER_MODEL,
        temperature: SUMMARIZER_TEMPERATURE,
        maxTokens: 512,
      });
    } catch (error) {
      logger.error({ err: error }, 'Failed to initialize ConversationSummarizer ChatGroq model');
      this.model = null;
    }
  }

  /**
   * Generates a concise factual summary of session messages.
   *
   * @param session Target conversation session
   * @returns Generated ConversationSummary object
   */
  public async summarize(session: ConversationSession): Promise<ConversationSummary> {
    const messageCount = session.messages.length;
    const fallbackSummary: ConversationSummary = {
      id: `sum_${Date.now()}`,
      summary: this.generateDeterministicSummary(session),
      messageCount,
      timestamp: new Date().toISOString(),
    };

    if (!this.model) {
      this.initModel();
    }

    if (!this.model) {
      return fallbackSummary;
    }

    try {
      const historyText = session.messages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n');

      const systemPrompt = `You are a factual conversation summarizer for an Enterprise Intelligence Platform.
Summarize the key facts, user preferences, dataset analytics insights, and backtesting conclusions from the conversation transcript below.
Keep the summary under 150 words. Do not hallucinate. Maintain factual fidelity.`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`TRANSCRIPT TO SUMMARIZE:\n${historyText}`),
      ];

      const response = await this.model.invoke(messages);
      const summaryText = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      return {
        id: `sum_${Date.now()}`,
        summary: summaryText.trim(),
        messageCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error({ err: error, sessionId: session.sessionId }, 'Error in ConversationSummarizer');
      return fallbackSummary;
    }
  }

  private generateDeterministicSummary(session: ConversationSession): string {
    const userMsgs = session.messages.filter((m) => m.role === 'user');
    const topics = userMsgs.slice(-3).map((m) => m.content).join(' | ');
    return `Session context includes ${session.messages.length} messages. Recent topics covered: ${topics || 'General inquiry'}.`;
  }
}

export const conversationSummarizer = new ConversationSummarizer();
