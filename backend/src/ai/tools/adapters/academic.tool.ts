import { knowledgeService } from '../../knowledge/knowledge.service';
import type { IntentCategory } from '../../router/intent.types';
import type { AITool } from '../tool.interface';
import type { ToolContext, ToolResult } from '../tool.types';

export class AcademicTool implements AITool {
  public readonly id = 'academic_tool';
  public readonly name = 'CHARUSAT Academic & Syllabus Knowledge Adapter';
  public readonly description = 'Adapter for vector retrieval on CHARUSAT academic handbook, syllabus, exam timetables, and regulations.';
  public readonly supportedIntent: IntentCategory = 'academic_doubt';

  public async execute(context: ToolContext): Promise<ToolResult> {
    const startTime = Date.now();

    const ragResult = await knowledgeService.queryKnowledge(context.query);

    return {
      success: true,
      toolId: this.id,
      data: {
        answer: ragResult.answer,
        retrievedChunkCount: ragResult.chunks.length,
        citations: ragResult.citations,
        query: context.query,
      },
      metadata: {
        executionTimeMs: Date.now() - startTime,
        intent: this.supportedIntent,
        timestamp: new Date().toISOString(),
        citations: ragResult.citations,
      },
    };
  }
}
