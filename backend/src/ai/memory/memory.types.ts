/**
 * Memory Module Type Definitions
 * PS-05 Enterprise Intelligence Platform
 */

import type { ExecutionPlan } from '../orchestrator/pipeline.types';
import type { ToolResult } from '../tools/tool.types';

/** Role of a message in a conversation session */
export type MessageRole = 'user' | 'assistant' | 'system';

/** A single chat message stored in memory */
export interface MemoryMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

/** Summarized historical context of a long session */
export interface ConversationSummary {
  id: string;
  summary: string;
  messageCount: number;
  timestamp: string;
}

/** Complete stateful conversation session container */
export interface ConversationSession {
  sessionId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages: MemoryMessage[];
  summaries: ConversationSummary[];
  lastToolResult?: ToolResult;
}

/** Context injected into the Response Generator */
export interface MemoryContext {
  summary?: string;
  relevantHistory: MemoryMessage[];
  previousToolResult?: ToolResult;
  currentToolResult: ToolResult;
  currentQuestion: string;
  executionPlan: ExecutionPlan;
}

/** Storage repository statistics */
export interface MemoryStats {
  totalSessions: number;
  totalMessages: number;
  activeUsers: number;
  memoryUsageBytes: number;
}
