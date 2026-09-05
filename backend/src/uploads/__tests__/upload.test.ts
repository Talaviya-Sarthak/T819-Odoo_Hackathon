import { beforeEach, describe, expect, test } from 'vitest';
import { uploadService, UploadService } from '../upload.service';

describe('Phase 8: Upload System Unit Tests', { timeout: 30000 }, () => {
  let service: UploadService;

  beforeEach(() => {
    service = new UploadService();
  });

  test('1. Process file upload and trigger ingestion', async () => {
    const res = await service.processUpload(
      'company_handbook.pdf',
      'Employees receive 20 paid leave days annually.',
      'pdf',
    );

    expect(res.success).toBe(true);
    expect(res.chunkCount).toBeGreaterThan(0);
    expect(res.fileId).toBeDefined();
  });

  test('2. List uploaded records', async () => {
    await service.processUpload('doc1.txt', 'Text content 1');
    await service.processUpload('doc2.txt', 'Text content 2');

    const uploads = await service.listUploads();
    expect(uploads.length).toBe(2);
  });

  test('3. Singleton uploadService exists', () => {
    expect(uploadService).toBeDefined();
  });
});
