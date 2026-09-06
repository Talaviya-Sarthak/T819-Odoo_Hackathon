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

    // 1. Retrieve products directly from DealFlow360 database
    let products: any[] = [];
    try {
      const prisma = require('../../../database/prisma');
      products = await prisma.product.findMany({
        take: 12,
        select: {
          id: true,
          name: true,
          sku: true,
          basePrice: true,
          category: true,
          unit: true,
        },
        orderBy: { name: 'asc' },
      });
    } catch {
      products = [];
    }

    // 2. Query existing datasets if available
    let retailDatasets: any[] = [];
    try {
      const datasets = await datasetRepository.listByUser(context.userId);
      retailDatasets = (datasets || []).filter(
        (d) =>
          d.name.toLowerCase().includes('retail') ||
          d.name.toLowerCase().includes('product') ||
          d.name.toLowerCase().includes('sales'),
      );
    } catch {
      retailDatasets = [];
    }

    return {
      success: true,
      toolId: this.id,
      data: {
        retailDatasetCount: retailDatasets.length,
        query: context.query,
        actionRequired: 'Product search and catalog recommendation tool execution',
        dealflowProducts: products.map((p) => ({
          name: p.name,
          sku: p.sku,
          price: Number(p.basePrice || 0),
          category: p.category,
          unit: p.unit,
        })),
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
