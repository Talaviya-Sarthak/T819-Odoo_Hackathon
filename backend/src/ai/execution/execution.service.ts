import { logger } from '../../config/logger';
import type { ExecutionPlan } from '../orchestrator/pipeline.types';
import { initializeDefaultTools } from '../tools/tool.factory';
import { toolRegistry, ToolRegistry } from '../tools/tool.registry';
import type { ToolContext, ToolResult } from '../tools/tool.types';
import { DEFAULT_EXECUTION_TIMEOUT_MS, DEFAULT_MAX_RETRIES } from './execution.constants';
import { executionLogger, ExecutionLogger } from './execution.logger';
import type {
  ExecutionPlanGraph,
  ExecutionStep,
  MultiStepExecutionResult,
  StepExecutionResult,
} from './execution.types';

export class ExecutionEngine {
  constructor(
    private readonly registry: ToolRegistry = toolRegistry,
    private readonly execLogger: ExecutionLogger = executionLogger,
  ) {
    initializeDefaultTools(this.registry);
  }

  /**
   * Constructs an ExecutionPlanGraph from a single ExecutionPlan or multi-intent request.
   */
  public buildGraph(plan: ExecutionPlan, additionalTools: string[] = []): ExecutionPlanGraph {
    const steps: ExecutionStep[] = [
      {
        stepId: `step_primary_${plan.selectedTool}`,
        toolId: plan.selectedTool,
        intent: plan.intent,
      },
    ];

    for (let i = 0; i < additionalTools.length; i++) {
      const toolId = additionalTools[i];
      if (toolId && toolId !== plan.selectedTool) {
        steps.push({
          stepId: `step_secondary_${toolId}`,
          toolId,
          intent: plan.intent,
          dependsOn: [`step_primary_${plan.selectedTool}`],
        });
      }
    }

    return {
      planId: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      strategy: steps.length > 1 ? 'parallel' : 'sequential',
      steps,
      maxRetries: DEFAULT_MAX_RETRIES,
      timeoutMs: DEFAULT_EXECUTION_TIMEOUT_MS,
    };
  }

  /**
   * Executes an ExecutionPlanGraph sequentially or in parallel.
   */
  public async executeGraph(
    graph: ExecutionPlanGraph,
    context: ToolContext,
  ): Promise<MultiStepExecutionResult> {
    const startTime = Date.now();
    const stepResults: StepExecutionResult[] = [];
    const combinedData: Record<string, any> = {};

    logger.info({ planId: graph.planId, stepCount: graph.steps.length, strategy: graph.strategy }, 'Executing Multi-Step Graph');

    if (graph.strategy === 'parallel' && graph.steps.length > 1) {
      // Execute steps in parallel
      const promises = graph.steps.map((step) => this.executeStep(graph.planId, step, context));
      const results = await Promise.all(promises);
      for (const res of results) {
        stepResults.push(res);
        if (res.success && res.result.data) {
          combinedData[res.toolId] = res.result.data;
        }
      }
    } else {
      // Execute steps sequentially
      for (const step of graph.steps) {
        const res = await this.executeStep(graph.planId, step, context);
        stepResults.push(res);
        if (res.success && res.result.data) {
          combinedData[res.toolId] = res.result.data;
        }
      }
    }

    const overallSuccess = stepResults.every((s) => s.success);

    return {
      planId: graph.planId,
      strategy: graph.strategy,
      stepResults,
      combinedData,
      totalDurationMs: Date.now() - startTime,
      success: overallSuccess,
    };
  }

  private async executeStep(
    planId: string,
    step: ExecutionStep,
    context: ToolContext,
  ): Promise<StepExecutionResult> {
    const startTime = Date.now();
    this.execLogger.logStepStart(planId, step.stepId, step.toolId);

    try {
      const toolResult: ToolResult = await this.registry.execute(step.toolId, context);
      const stepRes: StepExecutionResult = {
        stepId: step.stepId,
        toolId: step.toolId,
        result: toolResult,
        durationMs: Date.now() - startTime,
        success: toolResult.success,
      };
      this.execLogger.logStepComplete(planId, stepRes);
      return stepRes;
    } catch (error: any) {
      this.execLogger.logStepFailure(planId, step.stepId, step.toolId, error);
      return {
        stepId: step.stepId,
        toolId: step.toolId,
        result: {
          success: false,
          toolId: step.toolId,
          data: { error: error?.message || 'Execution step failed' },
          metadata: { executionTimeMs: Date.now() - startTime, intent: step.intent, timestamp: new Date().toISOString() },
        },
        durationMs: Date.now() - startTime,
        success: false,
        error: error?.message || 'Execution error',
      };
    }
  }
}

export const executionEngine = new ExecutionEngine();
