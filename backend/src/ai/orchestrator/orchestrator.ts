import { logger } from '../../config/logger';
import type { IntentResult } from '../router/intent.types';
import { buildExecutionPlan } from './execution-plan';
import type { ExecutionPlan } from './pipeline.types';

export class AIOrchestrator {
  /**
   * Generates a strongly-typed ExecutionPlan based on classified intent.
   *
   * NOTE: This method ONLY plans. It does not execute tools, query databases,
   * run RAG retrieval, or perform backtests.
   *
   * @param intentResult Result from IntentRouter classification
   * @returns Generated ExecutionPlan
   */
  public plan(intentResult: IntentResult): ExecutionPlan {
    try {
      const plan = buildExecutionPlan(intentResult);
      logger.info(
        { intent: plan.intent, pipeline: plan.pipeline, nextAction: plan.nextAction },
        'AIOrchestrator generated execution plan',
      );
      return plan;
    } catch (error) {
      logger.error({ err: error, intentResult }, 'Error in AIOrchestrator planning');
      return buildExecutionPlan({
        intent: 'general',
        confidence: 0.5,
        reason: 'Fallback plan generated due to orchestrator error',
      });
    }
  }
}

export const aiOrchestrator = new AIOrchestrator();
