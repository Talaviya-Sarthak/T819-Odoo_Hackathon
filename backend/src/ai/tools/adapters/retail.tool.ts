import * as datasetRepository from '../../../repositories/dataset.repository';
import type { IntentCategory } from '../../router/intent.types';
import type { AITool } from '../tool.interface';
import type { ToolContext, ToolResult } from '../tool.types';

export class RetailTool implements AITool {
  public readonly id = 'retail_tool';
  public readonly name = 'Retail & Product Catalog Adapter';
  public readonly description = 'Adapts queries to enterprise retail product datasets and product search.';
  public readonly supportedIntent: IntentCategory = 'retail';

  public async execute(context: ToolContext): Promise<ToolResult> {
    const startTime = Date.now();

    // Query existing datasets for enterprise retail data source
    const datasets = await datasetRepository.listByUser(context.userId);
    const retailDatasets = datasets.filter(
      (d) => d.name.toLowerCase().includes('retail') || d.name.toLowerCase().includes('product') || d.name.toLowerCase().includes('sales'),
    );

    return {
      success: true,
      toolId: this.id,
      data: {
        retailDatasetCount: retailDatasets.length,
        query: context.query,
        actionRequired: 'Product search and catalog recommendation tool execution',
        availableRetailDatasets: retailDatasets.map((d) => ({
          id: d.id,
          name: d.name,
          rowCount: d.rowCount,
        })),
      },
      metadata: {
        executionTimeMs: Date.now() - startTime,
        intent: this.supportedIntent,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
