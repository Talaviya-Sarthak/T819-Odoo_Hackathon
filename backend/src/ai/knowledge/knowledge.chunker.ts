import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { EMBEDDING_VERSION } from './knowledge.constants';
import type { KnowledgeChunk, KnowledgeDocumentMetadata } from './knowledge.types';
import { estimateTokenCount, normalizeDocumentText } from './knowledge.utils';

export interface PageContent {
  pageNumber: number;
  text: string;
}

export interface ChunkerOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  minChunkLength?: number;
}

export class KnowledgeChunker {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;
  private readonly minChunkLength: number;

  constructor(options: ChunkerOptions = {}) {
    this.chunkSize = options.chunkSize ?? 500;
    this.chunkOverlap = options.chunkOverlap ?? 100;
    this.minChunkLength = options.minChunkLength ?? 30;

    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error('chunkOverlap must be strictly less than chunkSize');
    }
  }

  /**
   * Splits per-page document text into chunks using sentence/paragraph boundaries
   * with chunkSize=500 and chunkOverlap=100.
   *
   * @param pages Extracted array of page contents
   * @param metadata Base document metadata
   * @returns Array of semantic KnowledgeChunk objects
   */
  public async splitPagesAsync(
    pages: PageContent[],
    metadata: KnowledgeDocumentMetadata,
  ): Promise<KnowledgeChunk[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
      separators: ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '],
    });

    const allRawChunks: { text: string; pageNumber: number; sectionHeading: string; startChar: number; endChar: number }[] = [];
    let currentHeading = metadata.title || 'General';
    let globalCharOffset = 0;

    for (const page of pages) {
      const normalizedPageText = normalizeDocumentText(page.text);
      if (!normalizedPageText || !normalizedPageText.trim()) continue;

      // Detect heading or section title if present
      const headingMatch = normalizedPageText.match(/(?:^|\n)(?:#+\s*|SECTION\s+\d+|CHAPTER\s+\d+|[A-Z0-9\s]{4,35}:?\n)([^\n]+)/i);
      if (headingMatch && headingMatch[1]) {
        currentHeading = headingMatch[1].trim();
      }

      // Split page text with 500 max limit and 100 overlap
      const rawPageChunks = await splitter.splitText(normalizedPageText);

      // Quality control: Merge tiny fragments (< minChunkLength) and ignore whitespace chunks
      const cleanChunks: string[] = [];
      let tempBuffer = '';

      for (const cText of rawPageChunks) {
        const trimmed = cText.trim();
        if (!trimmed) continue;

        if (tempBuffer) {
          const merged = tempBuffer + ' ' + trimmed;
          if (merged.length <= this.chunkSize) {
            tempBuffer = merged;
          } else {
            cleanChunks.push(tempBuffer);
            tempBuffer = trimmed;
          }
        } else {
          if (trimmed.length < this.minChunkLength) {
            tempBuffer = trimmed;
          } else {
            cleanChunks.push(trimmed);
          }
        }
      }
      if (tempBuffer) {
        cleanChunks.push(tempBuffer);
      }

      // Track character offsets
      for (const textChunk of cleanChunks) {
        const startChar = globalCharOffset;
        const endChar = startChar + textChunk.length;
        globalCharOffset = endChar + 1;

        allRawChunks.push({
          text: textChunk,
          pageNumber: page.pageNumber,
          sectionHeading: currentHeading,
          startChar,
          endChar,
        });
      }
    }

    const totalChunks = allRawChunks.length;

    return allRawChunks.map((c, index) => {
      const tokenEstimate = estimateTokenCount(c.text);
      return {
        id: `chk_${metadata.documentId}_${index}`,
        text: c.text,
        metadata: {
          ...metadata,
          documentName: metadata.title || metadata.filename,
          chunkIndex: index,
          totalChunks,
          pageNumber: c.pageNumber,
          sectionHeading: c.sectionHeading,
          startCharacter: c.startChar,
          endCharacter: c.endChar,
          tokenEstimate,
          sourcePath: metadata.source || metadata.filename,
          embeddingVersion: EMBEDDING_VERSION,
        },
      };
    });
  }

  public splitPages(pages: PageContent[], metadata: KnowledgeDocumentMetadata): KnowledgeChunk[] {
    const allRawChunks: { text: string; pageNumber: number; sectionHeading: string; startChar: number; endChar: number }[] = [];
    let currentHeading = metadata.title || 'General';
    let globalCharOffset = 0;

    for (const page of pages) {
      const normalizedPageText = normalizeDocumentText(page.text);
      if (!normalizedPageText || !normalizedPageText.trim()) continue;

      const headingMatch = normalizedPageText.match(/(?:^|\n)(?:#+\s*|SECTION\s+\d+|CHAPTER\s+\d+|[A-Z0-9\s]{4,35}:?\n)([^\n]+)/i);
      if (headingMatch && headingMatch[1]) {
        currentHeading = headingMatch[1].trim();
      }

      const rawPageChunks = this.recursiveCharacterSplitSync(normalizedPageText, this.chunkSize, this.chunkOverlap);

      for (const textChunk of rawPageChunks) {
        const trimmed = textChunk.trim();
        if (!trimmed) continue;
        const startChar = globalCharOffset;
        const endChar = startChar + trimmed.length;
        globalCharOffset = endChar + 1;

        allRawChunks.push({
          text: trimmed,
          pageNumber: page.pageNumber,
          sectionHeading: currentHeading,
          startChar,
          endChar,
        });
      }
    }

    const totalChunks = allRawChunks.length;

    return allRawChunks.map((c, index) => {
      const tokenEstimate = estimateTokenCount(c.text);
      return {
        id: `chk_${metadata.documentId}_${index}`,
        text: c.text,
        metadata: {
          ...metadata,
          documentName: metadata.title || metadata.filename,
          chunkIndex: index,
          totalChunks,
          pageNumber: c.pageNumber,
          sectionHeading: c.sectionHeading,
          startCharacter: c.startChar,
          endCharacter: c.endChar,
          tokenEstimate,
          sourcePath: metadata.source || metadata.filename,
          embeddingVersion: EMBEDDING_VERSION,
        },
      };
    });
  }

  public splitDocument(rawText: string, metadata: KnowledgeDocumentMetadata): KnowledgeChunk[] {
    const pages: PageContent[] = [{ pageNumber: 1, text: rawText }];
    return this.splitPages(pages, metadata);
  }

  private recursiveCharacterSplitSync(text: string, chunkSize: number, chunkOverlap: number): string[] {
    if (text.length <= chunkSize) return [text];

    const separators = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '];
    const chunks: string[] = [];

    const split = (str: string, sepIndex: number): string[] => {
      if (str.length <= chunkSize) return [str];
      const sep = separators[sepIndex] ?? ' ';
      const parts = str.split(sep);
      const result: string[] = [];
      let current = '';

      for (const part of parts) {
        const candidate = current ? current + sep + part : part;
        if (candidate.length <= chunkSize) {
          current = candidate;
        } else {
          if (current) result.push(current);
          if (part.length > chunkSize && sepIndex < separators.length - 1) {
            result.push(...split(part, sepIndex + 1));
            current = '';
          } else {
            current = part;
          }
        }
      }
      if (current) result.push(current);
      return result;
    };

    const initialChunks = split(text, 0);

    for (let i = 0; i < initialChunks.length; i++) {
      const chunk = initialChunks[i] || '';
      if (i > 0 && chunkOverlap > 0) {
        const prev = initialChunks[i - 1] || '';
        const overlapStr = prev.slice(-chunkOverlap);
        chunks.push(overlapStr + chunk);
      } else {
        chunks.push(chunk);
      }
    }

    return chunks;
  }
}

export const knowledgeChunker = new KnowledgeChunker();
