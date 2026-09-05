/**
 * Response Generator Type Definitions
 * PS-05 Enterprise Intelligence Platform
 */

import type { MemoryContext } from '../memory/memory.types';
import type { ExecutionPlan, PipelineName } from '../orchestrator/pipeline.types';
import type { IntentCategory } from '../router/intent.types';
import type { ToolResult } from '../tools/tool.types';

/** Citation or data source reference */
export interface ResponseCitation {
  source: string;
  reference?: string;
}

/** Detailed metadata attached to every generated response */
export interface AIResponseMetadata {
  intent: IntentCategory;
  pipeline: PipelineName;
  tool: string;
  model: string;
  executionTimeMs: number;
  citations?: ResponseCitation[];
  anonymized?: boolean;
  redactedCount?: number;
  detectedPiiTypes?: string[];
  [key: string]: any;
}

/** Context object provided to the ResponseGenerator */
export interface ResponseContext {
  userQuestion: string;
  executionPlan: ExecutionPlan;
  toolResult: ToolResult;
  memoryContext?: MemoryContext;
}

/** Final strongly-typed response returned to the API caller */
export interface AIResponse {
  success: boolean;
  answer: string;
  metadata: AIResponseMetadata;
}
