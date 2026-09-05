import crypto from 'crypto';
import { logger } from '../../config/logger';
import { knowledgeIngestionService } from '../knowledge/knowledge.ingestion';
import type { KnowledgeChunk } from '../knowledge/knowledge.types';
import { knowledgeVectorStore } from '../knowledge/knowledge.vectorstore';

export interface AdminPDFDocument {
  id: string;
  filename: string;
  originalName: string;
  fileHash: string;
  sizeBytes: number;
  pageCount: number;
  chunkCount: number;
  ocrApplied: boolean;
  status: 'Uploading' | 'Extracting Text' | 'OCR' | 'Cleaning' | 'Chunking' | 'Embedding' | 'Saving' | 'Completed' | 'Failed';
  uploadedBy: string;
  uploadedAt: string;
  chunks?: KnowledgeChunk[];
}

export class AdminService {
  private readonly pdfs = new Map<string, AdminPDFDocument>();
  private readonly chunks = new Map<string, KnowledgeChunk>();

  public calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  public findPDFByHash(hash: string): AdminPDFDocument | undefined {
    for (const pdf of this.pdfs.values()) {
      if (pdf.fileHash === hash) return pdf;
    }
    return undefined;
  }

  /**
   * Processes an uploaded PDF document using full multi-page PDF parsing,
   * 500-character chunking with 100-character overlap, MiniLM embeddings,
   * and permanent Supabase pgvector database storage.
   */
  public async processPDFDocument(
    filename: string,
    fileBuffer: Buffer,
    uploadedBy = 'admin',
  ): Promise<AdminPDFDocument> {
    const fileHash = this.calculateFileHash(fileBuffer);
    const existing = this.findPDFByHash(fileHash);
    if (existing) {
      logger.warn({ filename, id: existing.id }, 'Duplicate PDF upload prevented via SHA-256 hash match');
      return existing;
    }

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const docRecord: AdminPDFDocument = {
      id: documentId,
      filename,
      originalName: filename,
      fileHash,
      sizeBytes: fileBuffer.length,
      pageCount: 1,
      chunkCount: 0,
      ocrApplied: false,
      status: 'Uploading',
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      chunks: [],
    };

    this.pdfs.set(documentId, docRecord);
    logger.info({ filename, byteLength: fileBuffer.length }, 'Processing uploaded PDF document...');

    try {
      docRecord.status = 'Extracting Text';
      
      // Execute 10-step full PDF ingestion & Supabase pgvector insertion
      const resultChunks = await knowledgeIngestionService.ingestDocument({
        documentId,
        filename,
        fileContent: fileBuffer,
        fileType: 'pdf',
        source: filename,
      });

      const diagnostics = resultChunks.diagnostics;
      docRecord.pageCount = diagnostics?.totalPages || 1;
      docRecord.chunkCount = resultChunks.length;
      docRecord.ocrApplied = (diagnostics?.ocrPages || 0) > 0;
      docRecord.status = 'Completed';
      docRecord.chunks = resultChunks;

      // Store in local lookup map
      for (const chk of resultChunks) {
        this.chunks.set(chk.id, chk);
      }

      logger.info(
        { documentId, filename, pages: docRecord.pageCount, chunkCount: resultChunks.length },
        'PDF Ingestion & Supabase pgvector storage complete',
      );

      return docRecord;
    } catch (error: any) {
      docRecord.status = 'Failed';
      logger.error({ err: error?.message || error, filename }, 'PDF Ingestion failed');
      throw error;
    }
  }

  public getPDFs(): AdminPDFDocument[] {
    return Array.from(this.pdfs.values());
  }

  public deletePDF(pdfId: string): boolean {
    const pdf = this.pdfs.get(pdfId);
    if (!pdf) return false;
    this.pdfs.delete(pdfId);

    for (const [chkId, chunk] of this.chunks.entries()) {
      if (chunk.metadata.documentId === pdfId) {
        this.chunks.delete(chkId);
      }
    }
    void knowledgeVectorStore.delete(pdfId);
    logger.info({ pdfId, filename: pdf.filename }, 'Deleted PDF and cascading vector embeddings');
    return true;
  }

  public getChunks(): KnowledgeChunk[] {
    const memoryChunks = knowledgeVectorStore.getAllChunks();
    if (memoryChunks.length > 0) return memoryChunks;
    return Array.from(this.chunks.values());
  }

  public getStats() {
    return {
      pdfCount: this.pdfs.size,
      chunkCount: this.getChunks().length,
      status: 'healthy',
    };
  }

  public getLogs() {
    return [];
  }

  public async editChunk(chunkId: string, text: string) {
    const chunk = this.chunks.get(chunkId);
    if (!chunk) return undefined;
    chunk.text = text;
    return chunk;
  }

  public async addManualKnowledge(title: string, content: string, source: string) {
    const chunks = await knowledgeIngestionService.ingestDocument({
      filename: title,
      fileContent: content,
      fileType: 'pdf',
      source,
    });
    return { chunksCount: chunks.length };
  }

  public async testRAGPipeline(question: string) {
    const results = await knowledgeVectorStore.search([], 3);
    return { question, matches: results };
  }
}

export const adminService = new AdminService();
