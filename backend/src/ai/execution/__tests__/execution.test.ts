import { beforeEach, describe, expect, test } from 'vitest';
import { buildExecutionPlan } from '../../orchestrator/execution-plan';
import type { ToolContext } from '../../tools/tool.types';
import { executionEngine, ExecutionEngine } from '../execution.service';

describe('Phase 8: AI Execution Engine Unit Tests', () => {
  let engine: ExecutionEngine;

  beforeEach(() => {
    engine = new ExecutionEngine();
  });

  test('1. Build graph for single tool execution', () => {
    const plan = buildExecutionPlan({ intent: 'analytics', confidence: 0.9, reason: 'Test' });
    const graph = engine.buildGraph(plan);

    expect(graph).toBeDefined();
    expect(graph.steps.length).toBe(1);
    expect(graph.steps[0]?.toolId).toBe('analytics_tool');
    expect(graph.strategy).toBe('sequential');
  });

  test('2. Build graph for multi-tool parallel execution', () => {
    const plan = buildExecutionPlan({ intent: 'analytics', confidence: 0.9, reason: 'Test' });
    const graph = engine.buildGraph(plan, ['backtesting_tool', 'retail_tool']);

    expect(graph.steps.length).toBe(3);
    expect(graph.strategy).toBe('parallel');
  });

  test('3. Execute single step graph successfully', async () => {
    const plan = buildExecutionPlan({ intent: 'general', confidence: 0.95, reason: 'Test' });
    const graph = engine.buildGraph(plan);

    const context: ToolContext = {
      query: 'Hello world',
      userId: 'user_exec_test',
      executionPlan: plan,
    };

    const res = await engine.executeGraph(graph, context);

    expect(res.success).toBe(true);
    expect(res.stepResults.length).toBe(1);
    expect(res.combinedData['general_tool']).toBeDefined();
  });

  test('4. Singleton executionEngine is defined', () => {
    expect(executionEngine).toBeDefined();
  });
});
