import type { IntentResult } from '../router/intent.types';
import { FALLBACK_PIPELINE_MAPPING, INTENT_PIPELINE_MAP } from './pipeline.constants';
import type { ExecutionPlan } from './pipeline.types';

/**
 * Builds a strongly-typed ExecutionPlan given an IntentResult.
 *
 * @param intentResult Intent classification output from IntentRouter
 * @returns Fully formatted ExecutionPlan carrying selectedTool ID
 */
export function buildExecutionPlan(intentResult: IntentResult): ExecutionPlan {
  const intent = intentResult?.intent;
  const mapping = (intent && INTENT_PIPELINE_MAP[intent])
    ? INTENT_PIPELINE_MAP[intent]
    : FALLBACK_PIPELINE_MAPPING;

  const validIntent = (intent && INTENT_PIPELINE_MAP[intent]) ? intent : 'general';
  const confidence = typeof intentResult?.confidence === 'number' ? intentResult.confidence : 0.5;
  const reason = intentResult?.reason || mapping.description;

  return {
    intent: validIntent,
    pipeline: mapping.pipeline,
    selectedTool: mapping.selectedTool,
    nextAction: mapping.defaultNextAction,
    confidence,
    reason,
    createdAt: new Date().toISOString(),
  };
}
