/**
 * Visualization Service Type Definitions
 * PS-05 Enterprise Intelligence Platform
 */

export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'kpi' | 'table';

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
}

export interface VisualizationResult {
  id: string;
  chartType: ChartType;
  title: string;
  description?: string;
  chartData: {
    labels: string[];
    datasets: ChartDataset[];
  };
  chartOptions?: Record<string, any>;
  metadata?: Record<string, any>;
}
