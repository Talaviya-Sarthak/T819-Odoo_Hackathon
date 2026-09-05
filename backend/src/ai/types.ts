/**
 * AI Module Type Definitions
 * PS-05 Enterprise Intelligence Platform
 */

import type { GeneratedArtifact } from './artifacts/artifact.types';
import type { AIResponse, AIResponseMetadata, ResponseCitation, ResponseContext } from './generator/response.types';
import type { ConversationSession, MemoryContext, MemoryMessage } from './memory/memory.types';
import type { ExecutionPlan, NextAction, PipelineName } from './orchestrator/pipeline.types';
import type { IntentCategory, IntentResult } from './router/intent.types';
import type { AITool, ToolContext, ToolResult } from './tools';
import type { VisualizationResult } from './visualization/visualization.types';

export interface ChatInput {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  success: boolean;
  sessionId: string;
  answer: string;
  visualizations?: VisualizationResult[];
  artifacts?: GeneratedArtifact[];
  citations?: ResponseCitation[];
  metadata: AIResponseMetadata;
}

export type {
  IntentCategory,
  IntentResult,
  PipelineName,
  NextAction,
  ExecutionPlan,
  AITool,
  ToolContext,
  ToolResult,
  AIResponse,
  AIResponseMetadata,
  ResponseContext,
  ResponseCitation,
  ConversationSession,
  MemoryMessage,
  MemoryContext,
  VisualizationResult,
  GeneratedArtifact,
};
