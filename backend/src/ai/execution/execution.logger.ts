import { logger } from '../../config/logger';
import type { StepExecutionResult } from './execution.types';

export class ExecutionLogger {
  public logStepStart(planId: string, stepId: string, toolId: string): void {
    logger.info({ planId, stepId, toolId }, 'Starting execution step');
  }

  public logStepComplete(planId: string, stepResult: StepExecutionResult): void {
    logger.info(
      {
        planId,
        stepId: stepResult.stepId,
        toolId: stepResult.toolId,
        durationMs: stepResult.durationMs,
        success: stepResult.success,
      },
      'Completed execution step',
    );
  }

  public logStepFailure(planId: string, stepId: string, toolId: string, error: any): void {
    logger.error({ err: error, planId, stepId, toolId }, 'Execution step failed');
  }
}

export const executionLogger = new ExecutionLogger();
