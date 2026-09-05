/**
 * Multi-Step AI Execution Engine Types
 * PS-05 Enterprise Intelligence Platform
 */

import type { IntentCategory } from '../router/intent.types';
import type { ToolResult } from '../tools/tool.types';

export type ExecutionStrategy = 'sequential' | 'parallel';

export interface ExecutionStep {
  stepId: string;
  toolId: string;
  intent: IntentCategory;
  dependsOn?: string[];
  retryCount?: number;
  timeoutMs?: number;
}

export interface ExecutionPlanGraph {
  planId: string;
  strategy: ExecutionStrategy;
  steps: ExecutionStep[];
  maxRetries: number;
  timeoutMs: number;
}

export interface StepExecutionResult {
  stepId: string;
  toolId: string;
  result: ToolResult;
  durationMs: number;
  success: boolean;
  error?: string;
}

export interface MultiStepExecutionResult {
  planId: string;
  strategy: ExecutionStrategy;
  stepResults: StepExecutionResult[];
  combinedData: Record<string, any>;
  totalDurationMs: number;
  success: boolean;
}
