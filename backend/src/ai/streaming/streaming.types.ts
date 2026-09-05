/**
 * AI Streaming Types
 * PS-05 Enterprise Intelligence Platform
 */

export type SSEStage = 'Thinking...' | 'Planning...' | 'Retrieving...' | 'Generating...' | 'Completed' | 'Analyzing' | 'Routing' | 'Synthesizing' | (string & {});

export interface SSEEventPayload {
  stage: SSEStage;
  message: string;
  data?: any;
  timestamp: string;
}
