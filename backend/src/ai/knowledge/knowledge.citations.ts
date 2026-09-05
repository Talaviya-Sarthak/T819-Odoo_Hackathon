import type { ResponseCitation } from '../generator/response.types';
import type { VectorSearchResult } from './knowledge.types';

export class KnowledgeCitations {
  /**
   * Extracts clean, unique ResponseCitation objects from retrieved search result chunks.
   *
   * @param results Array of VectorSearchResult objects
   * @returns Array of non-hallucinated ResponseCitation objects
   */
  public extractCitations(results: VectorSearchResult[]): ResponseCitation[] {
    if (!results || results.length === 0) return [];

    const citationsMap = new Map<string, ResponseCitation>();

    for (const result of results) {
      const meta = result.chunk.metadata;
      const source = meta.filename || meta.source || 'Enterprise Document';
      const pageRef = meta.pageNumber ? `Page ${meta.pageNumber}` : undefined;
      const key = `${source}::${pageRef || ''}`;

      if (!citationsMap.has(key)) {
        citationsMap.set(key, {
          source,
          reference: pageRef,
        });
      }
    }

    return Array.from(citationsMap.values());
  }

  /**
   * Formats citations into a clean Markdown reference block at the bottom of answers.
   */
  public formatCitationsMarkdown(citations: ResponseCitation[]): string {
    if (!citations || citations.length === 0) return '';

    const lines = citations.map(
      (c) => `📄 **${c.source}**${c.reference ? ` (${c.reference})` : ''}`,
    );

    return `\n\n---\n\n### 📚 Sources & Citations:\n${lines.join('\n')}`;
  }
}

export const knowledgeCitations = new KnowledgeCitations();
