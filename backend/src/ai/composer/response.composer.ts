import type { ExecutionPlan } from '../orchestrator/pipeline.types';
import type { ToolResult } from '../tools/tool.types';

export interface ComposerInput {
  userQuestion: string;
  rawAnswer: string;
  executionPlan: ExecutionPlan;
  toolResult: ToolResult;
}

export interface ComposedResponse {
  answer: string;
  suggestedFollowUps: string[];
}

export class ResponseComposer {
  /**
   * Transforms raw execution output into a polished, ChatGPT-quality business response.
   */
  public compose(input: ComposerInput): ComposedResponse {
    const { userQuestion, rawAnswer, executionPlan, toolResult } = input;
    const intent = executionPlan.intent;
    const q = userQuestion.toLowerCase();

    // 1. Sanitize text: Remove internal SQL, tool IDs, pipeline names, and forbidden RAG/parser jargon
    let cleanedText = this.sanitizeOutput(rawAnswer);

    // 2. Knowledge Base & Conversational queries -> Return natural ChatGPT-style answer directly
    if (intent === 'knowledge' || intent === 'general') {
      const followUps = this.generateContextualFollowUps(userQuestion, intent);
      return {
        answer: cleanedText,
        suggestedFollowUps: followUps.slice(0, 3),
      };
    }

    // 3. Short Questions -> Brief Response
    const isShortQuestion =
      q.includes('how many rows') ||
      q.includes('how many records') ||
      q.includes('count') ||
      q.includes('hi') ||
      q.includes('hello') ||
      q.includes('who are you');

    if (isShortQuestion) {
      const followUps = this.generateContextualFollowUps(userQuestion, intent);
      return {
        answer: cleanedText,
        suggestedFollowUps: followUps.slice(0, 3),
      };
    }

    // 4. Data & Analytics / Backtesting Queries -> Apply clean section title
    const structuredText = this.formatExecutiveHierarchy(userQuestion, cleanedText);
    const suggestedFollowUps = this.generateContextualFollowUps(userQuestion, intent);

    return {
      answer: structuredText,
      suggestedFollowUps: suggestedFollowUps.slice(0, 3),
    };
  }

  private sanitizeOutput(text: string): string {
    let sanitized = text;

    // Strip internal SQL blocks unless explicitly requested
    sanitized = sanitized.replace(/```sql[\s\S]*?```/gi, '');
    sanitized = sanitized.replace(/SELECT\s+[\s\S]*?;/gi, '');
    sanitized = sanitized.replace(/DESCRIBE\s+[\s\S]*?;/gi, '');

    // Strip internal tool and pipeline IDs
    sanitized = sanitized.replace(/analytics_tool|backtesting_tool|retail_tool|knowledge_tool|general_tool/gi, '');
    sanitized = sanitized.replace(/ANALYTICS_PIPELINE|BACKTEST_PIPELINE|RETAIL_PIPELINE|KNOWLEDGE_PIPELINE|GENERAL_PIPELINE/gi, '');
    sanitized = sanitized.replace(/DuckDB|datamartService|toolResult|Tool Payload/gi, '');

    // Strip forbidden RAG & parser internal phrases
    sanitized = sanitized.replace(/the current tool result payload does not contain/gi, 'I couldn\'t find information about this in');
    sanitized = sanitized.replace(/tool result payload|tool payload|tool result/gi, '');
    sanitized = sanitized.replace(/vector database|embedding|knowledge chunk|rag pipeline|rag/gi, '');
    sanitized = sanitized.replace(/parser error|encoding issue|failed to retrieve|page index|chunk index/gi, '');
    sanitized = sanitized.replace(/referenced on page \d+/gi, '');
    sanitized = sanitized.replace(/knowledge retrieval output/gi, '');
    sanitized = sanitized.replace(/relevant document excerpts retrieved:/gi, '');

    // Trim excessive blank lines
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n').trim();

    return sanitized;
  }

  private formatExecutiveHierarchy(query: string, bodyText: string): string {
    // If text already contains a Markdown header, return sanitized text directly
    if (bodyText.startsWith('# ') || bodyText.startsWith('## ')) {
      return bodyText;
    }

    const title = this.generateExecutiveTitle(query);
    return `# ${title}\n\n${bodyText}`;
  }

  private generateExecutiveTitle(query: string): string {
    const q = query.toLowerCase();

    if (q.includes('sales') || q.includes('revenue')) {
      return 'Sales Performance & Revenue Analysis';
    }
    if (q.includes('customer') || q.includes('segment')) {
      return 'Customer Segmentation & Account Overview';
    }
    if (q.includes('product') || q.includes('category') || q.includes('top')) {
      return 'Product Performance & Category Ranking';
    }
    if (q.includes('column') || q.includes('schema') || q.includes('describe')) {
      return 'Dataset Schema & Data Structure Overview';
    }
    if (q.includes('backtest') || q.includes('strategy') || q.includes('sma')) {
      return 'Quantitative Backtesting Strategy Report';
    }

    return 'Enterprise Analytics Briefing';
  }

  private generateContextualFollowUps(query: string, intent: string): string[] {
    const q = query.toLowerCase();

    if (q.includes('column') || q.includes('schema') || q.includes('rows')) {
      return [
        'Calculate total revenue and order metrics',
        'Show top product categories by sales',
        'Analyze monthly sales trend for 2025',
      ];
    }

    if (q.includes('top') || q.includes('product') || q.includes('category')) {
      return [
        'Break down sales by geographic region',
        'Identify top enterprise customers by order volume',
        'Export top products analysis to CSV',
      ];
    }

    if (q.includes('month') || q.includes('trend') || q.includes('seasonal')) {
      return [
        'Identify peak sales months and growth rates',
        'Compare Q1 vs Q2 revenue performance',
        'Forecast next quarter sales trend',
      ];
    }

    if (intent === 'backtesting') {
      return [
        'Compare SMA Crossover vs RSI Strategy performance',
        'Calculate max drawdown and Sharpe Ratio',
        'Run backtest on 2025 daily market dataset',
      ];
    }

    if (intent === 'knowledge') {
      return [
        'What is the company refund policy?',
        'Review financial policy guidelines',
        'Summarize employee benefits document',
      ];
    }

    return [
      'Show monthly revenue trend',
      'Identify top enterprise customers',
      'Export analysis report',
    ];
  }
}

export const responseComposer = new ResponseComposer();
