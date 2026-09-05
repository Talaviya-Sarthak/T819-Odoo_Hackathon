import type { ExecutionPlan } from '../orchestrator/pipeline.types';
import type { ToolResult } from '../tools/tool.types';
import { MAX_CONTEXT_MESSAGES, MAX_CONTEXT_TOKEN_BUDGET } from './memory.constants';
import type { ConversationSession, MemoryContext } from './memory.types';
import { findRelevantMessages } from './memory.utils';

/**
 * Builds a comprehensive MemoryContext object from a session and current execution outputs.
 *
 * @param session Current conversation session
 * @param currentQuestion Raw user question string
 * @param executionPlan Generated execution plan
 * @param currentToolResult Executed tool result
 * @returns Fully populated MemoryContext
 */
export function buildMemoryContext(
  session: ConversationSession,
  currentQuestion: string,
  executionPlan: ExecutionPlan,
  currentToolResult: ToolResult,
): MemoryContext {
  const latestSummary = session.summaries.length > 0
    ? session.summaries[session.summaries.length - 1]?.summary
    : undefined;

  const relevantHistory = findRelevantMessages(
    session.messages,
    MAX_CONTEXT_MESSAGES,
    MAX_CONTEXT_TOKEN_BUDGET,
  );

  return {
    summary: latestSummary,
    relevantHistory,
    previousToolResult: session.lastToolResult,
    currentToolResult,
    currentQuestion,
    executionPlan,
  };
}
