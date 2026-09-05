import { AcademicTool } from './adapters/academic.tool';
import { AnalyticsTool } from './adapters/analytics.tool';
import { BacktestingTool } from './adapters/backtesting.tool';
import { GeneralTool } from './adapters/general.tool';
import { KnowledgeTool } from './adapters/knowledge.tool';
import { RetailTool } from './adapters/retail.tool';
import { StudentRecordsTool } from './adapters/student.tool';
import { toolRegistry, ToolRegistry } from './tool.registry';

/**
 * Initializes and registers default system tool adapters.
 */
export function initializeDefaultTools(registry: ToolRegistry = toolRegistry): ToolRegistry {
  const tools = [
    new AcademicTool(),
    new StudentRecordsTool(),
    new AnalyticsTool(),
    new BacktestingTool(),
    new RetailTool(),
    new KnowledgeTool(),
    new GeneralTool(),
  ];

  for (const tool of tools) {
    if (!registry.find(tool.id)) {
      registry.register(tool);
    }
  }

  return registry;
}
