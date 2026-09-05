import type { IntentCategory } from '../../router/intent.types';
import type { AITool } from '../tool.interface';
import type { ToolContext, ToolResult } from '../tool.types';

export class BacktestingTool implements AITool {
  public readonly id = 'backtesting_tool';
  public readonly name = 'Quantitative Backtesting Engine Adapter';
  public readonly description = 'Adapts queries to existing trading backtest strategy and metrics services.';
  public readonly supportedIntent: IntentCategory = 'backtesting';

  public async execute(context: ToolContext): Promise<ToolResult> {
    const startTime = Date.now();

    return {
      success: true,
      toolId: this.id,
      data: {
        availableStrategies: [],
        userBacktestCount: 0,
        recentBacktests: [],
      },
      metadata: {
        executionTimeMs: Date.now() - startTime,
        intent: this.supportedIntent,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
