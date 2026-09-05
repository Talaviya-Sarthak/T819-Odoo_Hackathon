import type { ResponseCitation } from '../generator/response.types';
import type { ToolResult } from '../tools/tool.types';
import type { ArtifactFormat, GeneratedArtifact } from './artifact.types';

export class ArtifactGenerator {
  /**
   * Generates a downloadable CSV, Markdown, or JSON export artifact from ToolResult or Answer data.
   */
  public generateReportArtifact(
    title: string,
    answer: string,
    toolResult: ToolResult,
    citations: ResponseCitation[] = [],
    format: ArtifactFormat = 'markdown',
  ): GeneratedArtifact {
    const timestamp = new Date().toISOString();
    const id = `art_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cleanTitle = title.toLowerCase().replace(/[^\w]/g, '_');

    let content = '';
    let mimeType = 'text/plain';
    let filename = `${cleanTitle}.${format}`;

    if (format === 'csv') {
      mimeType = 'text/csv';
      filename = `${cleanTitle}.csv`;
      content = this.convertToCsv(toolResult.data);
    } else if (format === 'json') {
      mimeType = 'application/json';
      filename = `${cleanTitle}.json`;
      content = JSON.stringify(
        {
          title,
          timestamp,
          answer,
          toolData: toolResult.data,
          citations,
        },
        null,
        2,
      );
    } else {
      // Default Markdown format
      mimeType = 'text/markdown';
      filename = `${cleanTitle}.md`;
      const citationLines = citations.map((c) => `- ${c.source} (${c.reference || 'N/A'})`).join('\n');
      content = `# ${title}\n\n**Generated**: ${timestamp}\n\n## Summary Answer\n${answer}\n\n## Sources\n${citationLines || 'N/A'}`;
    }

    return {
      id,
      filename,
      format,
      mimeType,
      sizeBytes: Buffer.byteLength(content, 'utf-8'),
      content,
      downloadUrl: `/api/v1/artifacts/${id}/download`,
      createdAt: timestamp,
    };
  }

  private convertToCsv(data: any): string {
    if (!data) return 'Key,Value\n';
    if (Array.isArray(data)) {
      if (data.length === 0) return 'No records\n';
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map((row) => Object.values(row).join(','));
      return [headers, ...rows].join('\n');
    }
    const keys = Object.keys(data);
    const values = Object.values(data).map((v) => (typeof v === 'object' ? JSON.stringify(v) : v));
    return `Metric,Value\n` + keys.map((k, i) => `"${k}","${values[i]}"`).join('\n');
  }
}

export const artifactGenerator = new ArtifactGenerator();
