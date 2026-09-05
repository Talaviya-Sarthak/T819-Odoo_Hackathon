import { logger } from '../../config/logger';
import type { ExecutionPlan } from '../orchestrator/pipeline.types';
import type { ToolResult } from '../tools/tool.types';
import { buildMemoryContext } from './memory.context';

import {
  MAX_CHAT_HISTORY_MESSAGES,
  SUMMARY_TRIGGER_MESSAGE_COUNT,
} from './memory.constants';
import { memoryRepository, MemoryRepository } from './memory.repository';
import { conversationSummarizer, ConversationSummarizer } from './memory.summary';
import type {
  ConversationSession,
  ConversationSummary,
  MemoryContext,
  MemoryMessage,
  MemoryStats,
} from './memory.types';
import { trimMessages } from './memory.utils';

export class MemoryManager {
  constructor(
    private readonly repo: MemoryRepository = memoryRepository,
    private readonly summarizer: ConversationSummarizer = conversationSummarizer,
  ) {}

  /**
   * Retrieves an existing session or creates a new one if ID is missing/not found.
   */
  public getOrCreateSession(sessionId?: string, userId: string = 'guest-system-user'): ConversationSession {
    const targetId = sessionId && sessionId.trim() ? sessionId : `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let session = this.repo.find(targetId);
    if (!session) {
      session = this.repo.create(targetId, userId);
    }

    return session;
  }

  /**
   * Saves a new user message into memory.
   */
  public saveUserMessage(sessionId: string, content: string): MemoryMessage {
    const message: MemoryMessage = {
      id: `msg_u_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    this.repo.appendMessage(sessionId, message);
    return message;
  }

  /**
   * Saves a new assistant response into memory.
   */
  public saveAssistantMessage(sessionId: string, content: string): MemoryMessage {
    const message: MemoryMessage = {
      id: `msg_a_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
    };

    this.repo.appendMessage(sessionId, message);
    return message;
  }

  /**
   * Saves latest executed tool result into memory session.
   */
  public saveToolResult(sessionId: string, toolResult: ToolResult): void {
    this.repo.updateToolResult(sessionId, toolResult);
  }

  /**
   * Assembles MemoryContext for Response Generator.
   */
  public buildContext(
    sessionId: string,
    currentQuestion: string,
    executionPlan: ExecutionPlan,
    currentToolResult: ToolResult,
  ): MemoryContext {
    const session = this.getOrCreateSession(sessionId);
    return buildMemoryContext(session, currentQuestion, executionPlan, currentToolResult);
  }

  /**
   * Triggers LLM summarization if session message count exceeds threshold.
   */
  public async summarizeConversation(sessionId: string): Promise<ConversationSummary | undefined> {
    const session = this.repo.find(sessionId);
    if (!session || session.messages.length < SUMMARY_TRIGGER_MESSAGE_COUNT) {
      return undefined;
    }

    try {
      const summary = await this.summarizer.summarize(session);
      this.repo.appendSummary(sessionId, summary);
      logger.info({ sessionId, messageCount: session.messages.length }, 'Conversation summarized');
      return summary;
    } catch (error) {
      logger.error({ err: error, sessionId }, 'Failed to summarize conversation');
      return undefined;
    }
  }

  /**
   * Trims session chat history to retain recent MAX_CHAT_HISTORY_MESSAGES.
   */
  public trimConversation(sessionId: string, maxMessages: number = MAX_CHAT_HISTORY_MESSAGES): void {
    const session = this.repo.find(sessionId);
    if (!session || session.messages.length <= maxMessages) {
      return;
    }

    session.messages = trimMessages(session.messages, maxMessages);
    this.repo.save(session);
    logger.debug({ sessionId, remaining: session.messages.length }, 'Trimmed conversation history');
  }

  /**
   * Clears/deletes a session from memory.
   */
  public clearSession(sessionId: string): boolean {
    return this.repo.delete(sessionId);
  }

  /**
   * Returns memory stats across all active sessions.
   */
  public getStats(): MemoryStats {
    const sessions = (this.repo as any).store?.listSessions() || [];
    let totalMessages = 0;
    const userSet = new Set<string>();

    for (const session of sessions) {
      totalMessages += session.messages.length;
      userSet.add(session.userId);
    }

    return {
      totalSessions: sessions.length,
      totalMessages,
      activeUsers: userSet.size,
      memoryUsageBytes: JSON.stringify(sessions).length,
    };
  }
}

export const memoryManager = new MemoryManager();
