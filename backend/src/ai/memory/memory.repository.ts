import type { ToolResult } from '../tools/tool.types';
import { memoryStore, MemoryStore } from './memory.store';
import type { ConversationSession, ConversationSummary, MemoryMessage } from './memory.types';

/**
 * Repository layer isolating storage mechanics from business logic.
 */
export class MemoryRepository {
  constructor(private readonly store: MemoryStore = memoryStore) {}

  public create(sessionId: string, userId: string): ConversationSession {
    return this.store.createSession(sessionId, userId);
  }

  public find(sessionId: string): ConversationSession | undefined {
    return this.store.getSession(sessionId);
  }

  public save(session: ConversationSession): void {
    this.store.updateSession(session);
  }

  public delete(sessionId: string): boolean {
    return this.store.deleteSession(sessionId);
  }

  public exists(sessionId: string): boolean {
    return Boolean(this.store.getSession(sessionId));
  }

  public appendMessage(sessionId: string, message: MemoryMessage): ConversationSession {
    let session = this.find(sessionId);
    if (!session) {
      throw new Error(`Session "${sessionId}" does not exist in MemoryRepository.`);
    }

    session.messages.push(message);
    this.save(session);
    return session;
  }

  public appendSummary(sessionId: string, summary: ConversationSummary): ConversationSession {
    let session = this.find(sessionId);
    if (!session) {
      throw new Error(`Session "${sessionId}" does not exist in MemoryRepository.`);
    }

    session.summaries.push(summary);
    this.save(session);
    return session;
  }

  public updateToolResult(sessionId: string, toolResult: ToolResult): ConversationSession {
    let session = this.find(sessionId);
    if (!session) {
      throw new Error(`Session "${sessionId}" does not exist in MemoryRepository.`);
    }

    session.lastToolResult = toolResult;
    this.save(session);
    return session;
  }
}

export const memoryRepository = new MemoryRepository();
