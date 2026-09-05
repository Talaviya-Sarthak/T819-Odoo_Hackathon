import { beforeEach, describe, expect, test } from 'vitest';
import type { ToolResult } from '../../tools/tool.types';
import { visualizationService, VisualizationService } from '../visualization.generator';

describe('Phase 8: Visualization Service Unit Tests', () => {
  let service: VisualizationService;

  beforeEach(() => {
    service = new VisualizationService();
  });

  test('1. Generates dataset bar chart from datasets array', () => {
    const toolResult: ToolResult = {
      success: true,
      toolId: 'analytics_tool',
      data: {
        datasets: [{ name: 'sales_2025', rowCount: 1000 }],
      },
      metadata: { executionTimeMs: 10, intent: 'analytics', timestamp: '' },
    };

    const charts = service.generateVisualizations(toolResult);

    expect(charts.length).toBe(1);
    expect(charts[0]?.chartType).toBe('bar');
    expect(charts[0]?.title).toContain('Dataset Volume');
  });

  test('2. Creates custom chart via createCustomChart', () => {
    const chart = service.createCustomChart('line', 'Revenue Trend', ['Q1', 'Q2'], [100, 200]);

    expect(chart).toBeDefined();
    expect(chart.chartType).toBe('line');
    expect(chart.chartData.labels).toEqual(['Q1', 'Q2']);
  });

  test('3. Singleton visualizationService is defined', () => {
    expect(visualizationService).toBeDefined();
  });
});
