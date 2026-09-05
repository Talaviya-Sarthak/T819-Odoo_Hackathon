import { beforeEach, describe, expect, test } from 'vitest';
import { buildExecutionPlan } from '../../orchestrator/execution-plan';
import type { ToolResult } from '../../tools/tool.types';
import { memoryManager, MemoryManager } from '../memory.manager';
import { memoryRepository, MemoryRepository } from '../memory.repository';
import { memoryStore, MemoryStore } from '../memory.store';

describe('Memory Layer Unit Tests', () => {
  let store: MemoryStore;
  let repo: MemoryRepository;
  let manager: MemoryManager;

  beforeEach(() => {
    store = new MemoryStore();
    repo = new MemoryRepository(store);
    manager = new MemoryManager(repo);
  });

  test('1. Session Creation and Retrieval', () => {
    const session = manager.getOrCreateSession('test_session_1', 'user_123');
    expect(session).toBeDefined();
    expect(session.sessionId).toBe('test_session_1');
    expect(session.userId).toBe('user_123');
    expect(session.messages.length).toBe(0);

    const retrieved = repo.find('test_session_1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.sessionId).toBe('test_session_1');
  });

  test('2. Save User & Assistant Messages', () => {
    const session = manager.getOrCreateSession('test_session_2', 'user_123');

    const userMsg = manager.saveUserMessage(session.sessionId, 'Show monthly sales');
    expect(userMsg.role).toBe('user');
    expect(userMsg.content).toBe('Show monthly sales');

    const assistantMsg = manager.saveAssistantMessage(session.sessionId, 'Sales summary generated.');
    expect(assistantMsg.role).toBe('assistant');
    expect(assistantMsg.content).toBe('Sales summary generated.');

    const updated = repo.find('test_session_2');
    expect(updated?.messages.length).toBe(2);
  });

  test('3. Save Tool Result into Session', () => {
    const session = manager.getOrCreateSession('test_session_3', 'user_123');
    const toolResult: ToolResult = {
      success: true,
      toolId: 'analytics_tool',
      data: { totalDatasets: 5 },
      metadata: { executionTimeMs: 10, intent: 'analytics', timestamp: new Date().toISOString() },
    };

    manager.saveToolResult(session.sessionId, toolResult);

    const updated = repo.find('test_session_3');
    expect(updated?.lastToolResult).toBeDefined();
    expect(updated?.lastToolResult?.toolId).toBe('analytics_tool');
  });

  test('4. Conversation Trimming Policy', () => {
    const session = manager.getOrCreateSession('test_session_4', 'user_123');

    for (let i = 0; i < 25; i++) {
      manager.saveUserMessage(session.sessionId, `Question ${i}`);
    }

    expect(session.messages.length).toBe(25);

    manager.trimConversation(session.sessionId, 10);

    const trimmed = repo.find('test_session_4');
    expect(trimmed?.messages.length).toBe(10);
    expect(trimmed?.messages[0]?.content).toBe('Question 15');
  });

  test('5. Build Memory Context', () => {
    const session = manager.getOrCreateSession('test_session_5', 'user_123');
    manager.saveUserMessage(session.sessionId, 'What is the top sales product?');

    const plan = buildExecutionPlan({ intent: 'analytics', confidence: 0.95, reason: 'Test' });
    const currentToolResult: ToolResult = {
      success: true,
      toolId: 'analytics_tool',
      data: { topProduct: 'Laptop Pro' },
      metadata: { executionTimeMs: 5, intent: 'analytics', timestamp: new Date().toISOString() },
    };

    const context = manager.buildContext(
      session.sessionId,
      'What is the top sales product?',
      plan,
      currentToolResult,
    );

    expect(context).toBeDefined();
    expect(context.currentQuestion).toBe('What is the top sales product?');
    expect(context.currentToolResult.data.topProduct).toBe('Laptop Pro');
    expect(context.relevantHistory.length).toBeGreaterThan(0);
  });

  test('6. Memory Stats Verification', () => {
    manager.getOrCreateSession('stat_1', 'user_a');
    manager.getOrCreateSession('stat_2', 'user_b');

    const stats = manager.getStats();
    expect(stats.totalSessions).toBeGreaterThanOrEqual(2);
    expect(stats.activeUsers).toBeGreaterThanOrEqual(2);
  });
});
