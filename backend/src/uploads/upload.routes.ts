import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/httpError';
import { uploadService } from './upload.service';

const router = Router();

import multer from 'multer';

const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

/**
 * POST /api/v1/uploads/ingest
 * Ingest document file directly into RAG Vector Store
 */
router.post(
  '/ingest',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    let filename = req.file ? req.file.originalname : req.body.filename;
    let content = req.file ? req.file.buffer : req.body.content;
    let fileType = req.file ? req.file.mimetype : req.body.fileType;

    if (!filename || !content) {
      throw ApiError.badRequest('MISSING_UPLOAD_DATA', 'filename and content/file parameters are required.');
    }

    const contentBuffer = Buffer.isBuffer(content)
      ? content
      : typeof content === 'string' && content.startsWith('data:')
        ? Buffer.from(content.split(',')[1] || '', 'base64')
        : typeof content === 'string' && /^[A-Za-z0-9+/=\s]+$/.test(content.trim().substring(0, 100))
          ? Buffer.from(content.trim(), 'base64')
          : Buffer.from(content);

    console.log('\n==================================================');
    console.log('STEP 1: UPLOAD ENDPOINT TELEMETRY');
    console.log(`File Name: "${filename}"`);
    console.log(`MIME / File Type Hint: "${fileType || 'pdf'}"`);
    console.log(`Decoded Buffer Length: ${contentBuffer.length} bytes`);
    console.log('==================================================\n');

    const result = await uploadService.processUpload(filename, contentBuffer, fileType);
    res.status(201).json(result);
  }),
);

/**
 * GET /api/v1/uploads
 * List all permanently stored uploaded files from Supabase pgvector
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const uploads = await uploadService.listUploads();
    res.status(200).json({ success: true, uploads, documents: uploads, count: uploads.length });
  }),
);

/**
 * DELETE /api/v1/uploads/:id
 * Permanently delete document metadata, chunks, and embeddings from Supabase
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const fileId = req.params.id;
    if (!fileId) {
      throw ApiError.badRequest('MISSING_FILE_ID', 'File ID parameter is required.');
    }
    await uploadService.deleteUpload(fileId);
    res.status(200).json({ success: true, message: `Document successfully deleted from Supabase RAG store.` });
  }),
);

/**
 * GET /api/v1/uploads/:id/chunks
 * Retrieve all extracted semantic chunks for a document from Supabase
 */
router.get(
  '/:id/chunks',
  asyncHandler(async (req, res) => {
    const fileId = req.params.id;
    if (!fileId) {
      throw ApiError.badRequest('MISSING_FILE_ID', 'File ID parameter is required.');
    }
    const chunks = await uploadService.getChunks(fileId);
    res.status(200).json({ success: true, chunks });
  }),
);

export default router;
