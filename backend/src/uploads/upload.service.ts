import { logger } from '../config/logger';
import { knowledgeIngestionService, KnowledgeIngestionService } from '../ai/knowledge/knowledge.ingestion';
import { knowledgeVectorStore, KnowledgeVectorStore } from '../ai/knowledge/knowledge.vectorstore';
import type { SupportedDocumentFormat } from '../ai/knowledge/knowledge.types';
import type { IngestionUploadResponse, UploadRecord } from './upload.types';

export class UploadService {
  private readonly records = new Map<string, UploadRecord>();

  constructor(
    private readonly ingestionService: KnowledgeIngestionService = knowledgeIngestionService,
    private readonly vectorStore: KnowledgeVectorStore = knowledgeVectorStore,
  ) {}

  /**
   * Processes uploaded file and automatically triggers page-by-page RAG chunking,
   * semantic validation, and vector indexing.
   */
  public async processUpload(
    filename: string,
    content: string | Buffer,
    fileTypeHint?: string,
  ): Promise<IngestionUploadResponse> {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const inferredType = this.mapFileType(filename, fileTypeHint);
    let pageCount = 1;

    logger.info({ fileId, filename, inferredType }, 'Processing uploaded file for production RAG ingestion');

    let chunkCount = 0;
    if (['pdf', 'docx', 'txt', 'markdown'].includes(inferredType)) {
      const chunks = await this.ingestionService.ingestDocument({
        documentId: fileId,
        filename,
        fileContent: content,
        fileType: inferredType as SupportedDocumentFormat,
      });
      chunkCount = chunks.length;

      if (chunks.diagnostics) {
        pageCount = chunks.diagnostics.totalPages || 1;
        if (chunks.diagnostics.status === 'Failed') {
          logger.error({ diagnostics: chunks.diagnostics }, 'Document upload validation failed');
        }
      }
    }

    const record: UploadRecord = {
      fileId,
      filename,
      originalName: filename,
      fileType: inferredType,
      sizeBytes: typeof content === 'string' ? Buffer.byteLength(content) : content.length,
      uploadedAt: new Date().toISOString(),
      indexed: chunkCount > 0,
      chunkCount,
      pageCount,
      status: chunkCount > 0 ? 'READY' : 'FAILED',
    };

    this.records.set(fileId, record);

    return {
      success: chunkCount > 0,
      fileId,
      filename,
      chunkCount,
      message: chunkCount > 0
        ? `File "${filename}" successfully ingested and indexed into RAG vector store (${chunkCount} semantic chunks).`
        : `I couldn't fully process this PDF because parts of the document couldn't be extracted. Please re-upload the document or use a searchable PDF.`,
    };
  }

  public getRecord(fileId: string): UploadRecord | undefined {
    return this.records.get(fileId);
  }

  public async listUploads(): Promise<UploadRecord[]> {
    const dbUploads = await this.vectorStore.listStoredDocuments();
    if (dbUploads && dbUploads.length > 0) {
      return dbUploads;
    }
    return Array.from(this.records.values());
  }

  public async deleteUpload(fileId: string): Promise<boolean> {
    this.records.delete(fileId);
    await this.vectorStore.delete(fileId);
    return true;
  }

  public async getChunks(fileId: string): Promise<any[]> {
    return this.vectorStore.getDocumentChunks(fileId);
  }

  private mapFileType(filename: string, hint?: string): SupportedDocumentFormat | 'csv' | 'xlsx' {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (ext === 'docx' || ext === 'doc') return 'docx';
    if (ext === 'md' || ext === 'markdown') return 'markdown';
    if (ext === 'csv') return 'csv';
    if (ext === 'xls' || ext === 'xlsx') return 'xlsx';
    return 'txt';
  }
}

export const uploadService = new UploadService();
