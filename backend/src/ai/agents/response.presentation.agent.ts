import type { ExecutionPlan } from '../orchestrator/pipeline.types';
import type { ToolResult } from '../tools/tool.types';

export interface PresentationInput {
  userQuestion: string;
  rawText: string;
  executionPlan: ExecutionPlan;
  toolResult: ToolResult;
}

export interface FormattedPresentation {
  answer: string;
}

export class ResponsePresentationAgent {
  /**
   * Transforms raw tool execution and LLM outputs into polished, executive-level business presentation text.
   */
  public present(input: PresentationInput): FormattedPresentation {
    const { userQuestion, rawText, executionPlan } = input;
    const intent = executionPlan.intent;
    const q = userQuestion.toLowerCase();

    // 1. Sanitize technical noise, SQL, tool names, DuckDB references
    let text = this.sanitizeOutput(rawText);

    // 2. Knowledge, General Q&A, or text already properly formatted by LLM -> return natural text
    if (
      intent === 'knowledge' ||
      intent === 'general' ||
      text.startsWith('#') ||
      q.includes('what is') ||
      q.includes('how to') ||
      q.includes('can i') ||
      q.includes('policy') ||
      q.includes('dealflow')
    ) {
      text = text.replace(/\n{3,}/g, '\n\n').trim();
      return { answer: text };
    }

    // 3. Analytical Business Query -> Format with dynamic executive title
    const dynamicHeader = this.getDynamicHeader(queryType(q));
    if (dynamicHeader && dynamicHeader !== 'Sales Performance Analysis' && !text.startsWith('#')) {
      text = `# ${dynamicHeader}\n\n${text}`;
    }

    // 4. Clean up paragraph spacing and redundant headers
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    return { answer: text };
  }

  private sanitizeOutput(text: string): string {
    let sanitized = text;

    // Remove SQL blocks (SELECT, DESCRIBE, GROUP BY)
    sanitized = sanitized.replace(/```sql[\s\S]*?```/gi, '');
    sanitized = sanitized.replace(/SELECT\s+[\s\S]*?;/gi, '');
    sanitized = sanitized.replace(/DESCRIBE\s+[\s\S]*?;/gi, '');

    // Remove internal tool and pipeline IDs
    sanitized = sanitized.replace(/analytics_tool|backtesting_tool|retail_tool|knowledge_tool|general_tool/gi, '');
    sanitized = sanitized.replace(/ANALYTICS_PIPELINE|BACKTEST_PIPELINE|RETAIL_PIPELINE|KNOWLEDGE_PIPELINE|GENERAL_PIPELINE/gi, '');
    sanitized = sanitized.replace(/DuckDB|datamartService|toolResult|Tool Payload/gi, '');

    return sanitized;
  }

  private getDynamicHeader(type: string): string {
    switch (type) {
      case 'COLUMNS':
        return 'Dataset Columns';
      case 'ROW_COUNT':
        return 'Dataset Record Volume';
      case 'TOP_PRODUCTS':
        return 'Top Revenue Products';
      case 'REGIONAL':
        return 'Regional Sales Comparison';
      case 'TREND':
        return 'Sales Revenue Trend';
      case 'BACKTEST':
        return 'Backtesting Strategy Results';
      default:
        return 'Sales Performance Analysis';
    }
  }
}

function queryType(q: string): string {
  if (q.includes('column') || q.includes('schema') || q.includes('describe')) return 'COLUMNS';
  if (q.includes('how many rows') || q.includes('how many records') || q.includes('count')) return 'ROW_COUNT';
  if (q.includes('top') || q.includes('product') || q.includes('category')) return 'TOP_PRODUCTS';
  if (q.includes('region') || q.includes('compare')) return 'REGIONAL';
  if (q.includes('month') || q.includes('trend')) return 'TREND';
  if (q.includes('backtest') || q.includes('sma') || q.includes('rsi')) return 'BACKTEST';
  return 'ANALYTICS';
}

export const responsePresentationAgent = new ResponsePresentationAgent();
