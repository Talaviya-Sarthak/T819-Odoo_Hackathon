/**
 * Upload System Type Definitions
 * PS-05 Enterprise Intelligence Platform
 */

import type { SupportedDocumentFormat } from '../ai/knowledge/knowledge.types';

export interface UploadRecord {
  fileId: string;
  filename: string;
  originalName: string;
  fileType: SupportedDocumentFormat | 'csv' | 'xlsx' | string;
  sizeBytes: number;
  uploadedAt: string;
  indexed: boolean;
  chunkCount: number;
  pageCount: number;
  status: 'READY' | 'PROCESSING' | 'FAILED' | string;
}

export interface IngestionUploadResponse {
  success: boolean;
  fileId: string;
  filename: string;
  chunkCount: number;
  message: string;
}
