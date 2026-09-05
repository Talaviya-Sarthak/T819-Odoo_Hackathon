import type { ToolResult } from '../tools/tool.types';
import type { ChartType, VisualizationResult } from './visualization.types';

export class VisualizationService {
  /**
   * Generates an array of VisualizationResult objects from ToolResult data.
   */
  public generateVisualizations(toolResult: ToolResult): VisualizationResult[] {
    if (!toolResult || !toolResult.data) return [];

    const results: VisualizationResult[] = [];
    const data = toolResult.data;

    // 1. Generate Category / Dimension Breakdown Chart if topBreakdown exists
    if (data.topBreakdown && Array.isArray(data.topBreakdown.labels) && Array.isArray(data.topBreakdown.values)) {
      results.push({
        id: `chart_breakdown_${Date.now()}`,
        chartType: 'bar',
        title: data.topBreakdown.title || 'Top Performance Breakdown',
        description: `Dimension analysis by ${data.topBreakdown.dimension || 'category'}`,
        chartData: {
          labels: data.topBreakdown.labels,
          datasets: [
            {
              label: 'Revenue ($)',
              data: data.topBreakdown.values,
              backgroundColor: '#fafafa',
            },
          ],
        },
      });
    }

    // 2. Generate Time-Series Line Chart if timeSeries exists
    if (data.timeSeries && Array.isArray(data.timeSeries.labels) && Array.isArray(data.timeSeries.values)) {
      results.push({
        id: `chart_time_${Date.now()}`,
        chartType: 'line',
        title: data.timeSeries.title || 'Performance Trend Over Time',
        description: 'Chronological trend metrics',
        chartData: {
          labels: data.timeSeries.labels,
          datasets: [
            {
              label: 'Sales Revenue ($)',
              data: data.timeSeries.values,
              backgroundColor: '#fafafa',
            },
          ],
        },
      });
    }

    // 3. Generate KPI summary card if kpiSummary exists
    if (data.kpiSummary && typeof data.kpiSummary.totalRevenue === 'number') {
      results.push({
        id: `chart_kpi_${Date.now()}`,
        chartType: 'kpi',
        title: 'Total Revenue YTD',
        description: `Total across ${data.kpiSummary.totalRecords.toLocaleString()} orders`,
        chartData: {
          labels: ['Total Revenue'],
          datasets: [
            {
              label: 'Revenue',
              data: [data.kpiSummary.totalRevenue],
            },
          ],
        },
      });
    }

    // 4. Generate Datasets Bar chart if datasets array is present (and no other breakdown chart added yet)
    if (results.length === 0 && Array.isArray(data.datasets) && data.datasets.length > 0) {
      const labels = data.datasets.map((d: any) => d.name || 'Dataset');
      const rowCounts = data.datasets.map((d: any) => d.rowCount || 0);

      results.push({
        id: `chart_ds_${Date.now()}`,
        chartType: 'bar',
        title: 'Dataset Volume Distribution',
        description: 'Row counts across active enterprise datasets',
        chartData: {
          labels,
          datasets: [
            {
              label: 'Row Count',
              data: rowCounts,
              backgroundColor: '#fafafa',
            },
          ],
        },
      });
    }

    return results;
  }

  /**
   * Explicit helper to build a custom Chart Spec.
   */
  public createCustomChart(
    chartType: ChartType,
    title: string,
    labels: string[],
    dataValues: number[],
    description?: string,
  ): VisualizationResult {
    return {
      id: `chart_custom_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      chartType,
      title,
      description,
      chartData: {
        labels,
        datasets: [
          {
            label: title,
            data: dataValues,
            backgroundColor: '#fafafa',
          },
        ],
      },
    };
  }
}

export const visualizationService = new VisualizationService();
