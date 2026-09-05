import type { MemoryContext, MemoryMessage } from './memory.types';

/**
 * Estimates token count for text (approx 4 characters per token).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Sorts array of MemoryMessage objects chronologically by timestamp.
 */
export function sortMessages(messages: MemoryMessage[]): MemoryMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

/**
 * Retains the most recent N messages from history.
 */
export function trimMessages(messages: MemoryMessage[], maxCount: number): MemoryMessage[] {
  if (messages.length <= maxCount) return messages;
  return messages.slice(messages.length - maxCount);
}

/**
 * Extracts relevant history messages within token budget constraints.
 */
export function findRelevantMessages(
  messages: MemoryMessage[],
  maxCount: number = 6,
  tokenBudget: number = 2000,
): MemoryMessage[] {
  const sorted = sortMessages(messages);
  const recent = sorted.slice(-maxCount);

  const result: MemoryMessage[] = [];
  let currentTokens = 0;

  for (let i = recent.length - 1; i >= 0; i--) {
    const msg = recent[i];
    if (!msg) continue;

    const tokens = estimateTokens(msg.content);
    if (currentTokens + tokens > tokenBudget && result.length > 0) {
      break;
    }
    result.unshift(msg);
    currentTokens += tokens;
  }

  return result;
}

/**
 * Formats a MemoryContext object into a clean Markdown narrative section for prompt injection.
 */
export function buildConversationPrompt(context: MemoryContext): string {
  const parts: string[] = [];

  if (context.summary) {
    parts.push(`### CONVERSATION SUMMARY (PAST CONTEXT):\n${context.summary}`);
  }

  if (context.relevantHistory.length > 0) {
    const historyFormatted = context.relevantHistory
      .map((m) => `**${m.role.toUpperCase()}**: ${m.content}`)
      .join('\n');
    parts.push(`### RECENT CONVERSATION HISTORY:\n${historyFormatted}`);
  }

  if (context.previousToolResult?.data) {
    parts.push(
      `### PREVIOUS TOOL RESULT:\n${JSON.stringify(context.previousToolResult.data, null, 2)}`,
    );
  }

  return parts.join('\n\n');
}

/** Serializes memory object to JSON string */
export function serializeMemory(data: any): string {
  return JSON.stringify(data);
}

/** Deserializes JSON string to memory object */
export function deserializeMemory<T>(json: string): T {
  return JSON.parse(json);
}
