/**
 * AI Tool System Type Definitions
 * PS-05 Enterprise Intelligence Platform
 */

import type { ExecutionPlan } from '../orchestrator/pipeline.types';

/** Runtime context provided to an AI Tool when executing */
export interface ToolContext {
  query: string;
  userId: string;
  sessionId?: string;
  executionPlan: ExecutionPlan;
  params?: Record<string, any>;
}

/** Standardized output returned by every AI Tool execution */
export interface ToolResult {
  success: boolean;
  toolId: string;
  data: any;
  metadata: {
    executionTimeMs: number;
    intent: string;
    timestamp: string;
    [key: string]: any;
  };
}
