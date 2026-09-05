import { env } from '../config/env';
import { logger } from '../config/logger';
import { ApiError } from '../utils/httpError';
import { responsePresentationAgent, ResponsePresentationAgent } from './agents/response.presentation.agent';
import { artifactGenerator, ArtifactGenerator } from './artifacts/artifact.generator';
import type { GeneratedArtifact } from './artifacts/artifact.types';
import { executionEngine, ExecutionEngine } from './execution/execution.service';
import { responseGenerator } from './generator/response.generator';
import type { AIResponse } from './generator/response.types';
import { memoryManager } from './memory/memory.manager';
import { aiOrchestrator } from './orchestrator/orchestrator';
import { intentRouter } from './router/router';
import { initializeDefaultTools } from './tools/tool.factory';
import { toolRegistry } from './tools/tool.registry';
import type { ToolContext } from './tools/tool.types';
import { visualDecisionEngine, VisualDecisionEngine } from './visualization/visual.decision.engine';
import type { VisualizationResult } from './visualization/visualization.types';

export interface AIServiceChatResult {
  sessionId: string;
  response: AIResponse;
  visualizations: VisualizationResult[];
  artifacts: GeneratedArtifact[];
}

export class AIService {
  constructor(
    private readonly execEngine: ExecutionEngine = executionEngine,
    private readonly presentationAgent: ResponsePresentationAgent = responsePresentationAgent,
    private readonly visualEngine: VisualDecisionEngine = visualDecisionEngine,
    private readonly artGenerator: ArtifactGenerator = artifactGenerator,
  ) {
    initializeDefaultTools(toolRegistry);
  }

  /**
   * Complete multi-turn, multi-tool, visualization & artifact-enabled Enterprise AI pipeline execution.
   */
  public async chat(
    message: string,
    userId: string = 'guest-system-user',
    sessionId?: string,
  ): Promise<AIServiceChatResult> {
    const apiKey = env.GROQ_API_KEY;

    if (!apiKey) {
      throw ApiError.unauthorized(
        'AI_API_KEY_MISSING',
        'Groq API key is not configured on the server. Please set GROQ_API_KEY in environment variables.',
      );
    }

    // 1. Session Init / Retrieval & Save User Message
    const session = memoryManager.getOrCreateSession(sessionId, userId);
    memoryManager.saveUserMessage(session.sessionId, message);

    // 2. Classify Intent & Plan Execution
    const intentResult = await intentRouter.classify(message);
    const executionPlan = aiOrchestrator.plan(intentResult);

    logger.info(
      {
        message,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        pipeline: executionPlan.pipeline,
        selectedTool: executionPlan.selectedTool,
      },
      '[AI Pipeline Step 1-2] Intent Classified & Planned',
    );

    // 3. Multi-Step Execution Graph Build & Execution
    const graph = this.execEngine.buildGraph(executionPlan);
    const context: ToolContext = {
      query: message,
      userId,
      sessionId: session.sessionId,
      executionPlan,
    };
    const multiResult = await this.execEngine.executeGraph(graph, context);

    const primaryStep = multiResult.stepResults[0];
    const toolResult = primaryStep?.result || {
      success: false,
      toolId: executionPlan.selectedTool,
      data: {},
      metadata: { executionTimeMs: 0, intent: executionPlan.intent, timestamp: new Date().toISOString() },
    };

    logger.info(
      {
        toolId: toolResult.toolId,
        success: toolResult.success,
        generatedSQL: toolResult.data?.generatedSQL || 'N/A',
        datasetName: toolResult.data?.datasetName || 'N/A',
        hasData: !!toolResult.data,
      },
      '[AI Pipeline Step 3-4] Tool Execution & SQL Completed',
    );

    // 4. Save Tool Result & Build Memory Context
    memoryManager.saveToolResult(session.sessionId, toolResult);
    const memoryContext = memoryManager.buildContext(session.sessionId, message, executionPlan, toolResult);

    // 5. Synthesize Raw Answer with LLM Response Generator
    const rawResponse = await responseGenerator.generate({
      userQuestion: message,
      executionPlan,
      toolResult,
      memoryContext,
    });

    logger.info(
      {
        rawAnswerLength: rawResponse.answer.length,
        rawAnswerSnippet: rawResponse.answer.substring(0, 100),
      },
      '[AI Pipeline Step 5] LLM Answer Synthesized',
    );

    // 6. Response Presentation Agent (Transforms raw text into clean, structured presentation output)
    const presentation = this.presentationAgent.present({
      userQuestion: message,
      rawText: rawResponse.answer,
      executionPlan,
      toolResult,
    });

    const finalResponse: AIResponse = {
      ...rawResponse,
      answer: presentation.answer,
    };

    // 7. Visualization Decision Agent (Confidence scoring, SQL result dependence, max 0-2 charts)
    const visualizations = this.visualEngine.selectVisualizations(
      message,
      executionPlan.intent,
      toolResult,
    );

    logger.info(
      {
        chartCount: visualizations.length,
        chartTypes: visualizations.map((v) => v.chartType),
      },
      '[AI Pipeline Step 7] Visual Decision Engine Selected Charts',
    );

    // 8. Explicit Export Artifacts Generation ONLY when explicitly requested by user
    const artifacts: GeneratedArtifact[] = [];
    const msgLower = message.toLowerCase();
    const isExplicitExportRequest =
      msgLower.includes('export') ||
      msgLower.includes('download') ||
      msgLower.includes('generate report') ||
      msgLower.includes('create report') ||
      msgLower.includes('save csv') ||
      msgLower.includes('download pdf') ||
      msgLower.includes('export csv') ||
      msgLower.includes('save markdown');

    if (isExplicitExportRequest) {
      const artifactFormat = msgLower.includes('csv') ? 'csv' : msgLower.includes('json') ? 'json' : 'markdown';
      const artifact = this.artGenerator.generateReportArtifact(
        `Export_${executionPlan.intent}`,
        finalResponse.answer,
        toolResult,
        finalResponse.metadata.citations || [],
        artifactFormat,
      );
      artifacts.push(artifact);
    }

    // 9. Save Assistant Message & Maintain Memory
    memoryManager.saveAssistantMessage(session.sessionId, finalResponse.answer);
    void memoryManager.summarizeConversation(session.sessionId);
    memoryManager.trimConversation(session.sessionId);

    return {
      sessionId: session.sessionId,
      response: finalResponse,
      visualizations,
      artifacts,
    };
  }
}

export const aiService = new AIService();
