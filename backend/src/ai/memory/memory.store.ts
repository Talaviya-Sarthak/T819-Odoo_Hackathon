import { logger } from '../../config/logger';
import { DEFAULT_SESSION_TTL_MINUTES } from './memory.constants';
import type { ConversationSession } from './memory.types';

/**
 * Low-level in-memory session store backed by a JavaScript Map.
 * Easily replaceable by Redis or PostgreSQL later without touching application logic.
 */
export class MemoryStore {
  private readonly store = new Map<string, ConversationSession>();

  public createSession(sessionId: string, userId: string): ConversationSession {
    const now = new Date().toISOString();
    const session: ConversationSession = {
      sessionId,
      userId,
      createdAt: now,
      updatedAt: now,
      messages: [],
      summaries: [],
    };

    this.store.set(sessionId, session);
    logger.debug({ sessionId, userId }, 'Created new session in MemoryStore');
    return session;
  }

  public getSession(sessionId: string): ConversationSession | undefined {
    return this.store.get(sessionId);
  }

  public updateSession(session: ConversationSession): void {
    session.updatedAt = new Date().toISOString();
    this.store.set(session.sessionId, session);
  }

  public deleteSession(sessionId: string): boolean {
    return this.store.delete(sessionId);
  }

  public listSessions(): ConversationSession[] {
    return Array.from(this.store.values());
  }

  public clearExpiredSessions(ttlMinutes: number = DEFAULT_SESSION_TTL_MINUTES): number {
    const cutoffTime = Date.now() - ttlMinutes * 60 * 1000;
    let deletedCount = 0;

    for (const [sessionId, session] of this.store.entries()) {
      const updatedTime = new Date(session.updatedAt).getTime();
      if (updatedTime < cutoffTime) {
        this.store.delete(sessionId);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.info({ deletedCount }, 'Cleared expired sessions from MemoryStore');
    }

    return deletedCount;
  }
}

export const memoryStore = new MemoryStore();
