import { beforeEach, describe, expect, test } from 'vitest';
import type { ToolResult } from '../../tools/tool.types';
import { artifactGenerator, ArtifactGenerator } from '../artifact.generator';

describe('Phase 8: Artifact Generator Unit Tests', () => {
  let generator: ArtifactGenerator;

  beforeEach(() => {
    generator = new ArtifactGenerator();
  });

  test('1. Generates Markdown report artifact', () => {
    const toolResult: ToolResult = {
      success: true,
      toolId: 'analytics_tool',
      data: { datasets: 2 },
      metadata: { executionTimeMs: 10, intent: 'analytics', timestamp: '' },
    };

    const artifact = generator.generateReportArtifact(
      'Sales Report',
      'Sales summary response',
      toolResult,
      [{ source: 'Doc.pdf' }],
      'markdown',
    );

    expect(artifact).toBeDefined();
    expect(artifact.filename).toBe('sales_report.md');
    expect(artifact.format).toBe('markdown');
    expect(artifact.sizeBytes).toBeGreaterThan(0);
  });

  test('2. Generates CSV report artifact', () => {
    const toolResult: ToolResult = {
      success: true,
      toolId: 'analytics_tool',
      data: [{ product: 'Laptop', sales: 500 }],
      metadata: { executionTimeMs: 10, intent: 'analytics', timestamp: '' },
    };

    const artifact = generator.generateReportArtifact(
      'Product Sales',
      'Summary',
      toolResult,
      [],
      'csv',
    );

    expect(artifact.format).toBe('csv');
    expect(artifact.mimeType).toBe('text/csv');
  });

  test('3. Singleton artifactGenerator is defined', () => {
    expect(artifactGenerator).toBeDefined();
  });
});
