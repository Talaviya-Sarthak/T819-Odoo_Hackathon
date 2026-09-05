import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { adminService } from '../admin/admin.service';
import { authenticateAdmin } from '../admin/admin.auth';

/**
 * POST /admin/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const result = authenticateAdmin(username, password);

  if (!result.success) {
    res.status(401).json({ success: false, message: result.error || 'Authentication failed' });
    return;
  }

  res.status(200).json({
    success: true,
    token: result.token,
    user: result.user,
  });
});

/**
 * GET /admin/stats
 */
export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = adminService.getStats();
  res.status(200).json({ success: true, stats });
});

/**
 * GET /admin/logs
 */
export const getLogs = asyncHandler(async (_req: Request, res: Response) => {
  const logs = adminService.getLogs();
  res.status(200).json({ success: true, logs });
});

/**
 * POST /admin/upload-pdf
 */
export const uploadPDF = asyncHandler(async (req: Request, res: Response) => {
  const filename = req.file ? req.file.originalname : req.body.filename;
  const content = req.file ? req.file.buffer : req.body.content;

  if (!filename || !content) {
    res.status(400).json({ success: false, message: 'filename and content (or file) are required' });
    return;
  }

  let buffer: Buffer;
  if (Buffer.isBuffer(content)) {
    buffer = content;
  } else if (typeof content === 'string' && content.startsWith('data:')) {
    buffer = Buffer.from(content.split(',')[1] || '', 'base64');
  } else if (typeof content === 'string' && /^[A-Za-z0-9+/=\s]+$/.test(content.trim().substring(0, 100))) {
    buffer = Buffer.from(content.trim(), 'base64');
  } else if (typeof content === 'string') {
    buffer = Buffer.from(content, 'utf-8');
  } else {
    buffer = Buffer.from(content);
  }

  const pdfDoc = await adminService.processPDFDocument(filename, buffer);

  res.status(200).json({
    success: true,
    message: `PDF "${filename}" uploaded and processed successfully.`,
    pdf: pdfDoc,
  });
});

/**
 * GET /admin/pdfs
 */
export const getPDFs = asyncHandler(async (_req: Request, res: Response) => {
  const pdfs = adminService.getPDFs();
  res.status(200).json({ success: true, pdfs });
});

/**
 * DELETE /admin/pdf/:id
 */
export const deletePDF = asyncHandler(async (req: Request, res: Response) => {
  const pdfId = req.params.id || '';
  const deleted = adminService.deletePDF(pdfId);

  if (!deleted) {
    res.status(404).json({ success: false, message: 'PDF document not found' });
    return;
  }

  res.status(200).json({ success: true, message: `PDF document ${pdfId} deleted successfully.` });
});

/**
 * GET /admin/chunks
 */
export const getChunks = asyncHandler(async (_req: Request, res: Response) => {
  const chunks = adminService.getChunks();
  res.status(200).json({ success: true, chunks, totalCount: chunks.length });
});

/**
 * PUT /admin/chunk/:id
 */
export const editChunk = asyncHandler(async (req: Request, res: Response) => {
  const chunkId = req.params.id || '';
  const { text } = req.body;

  if (!text) {
    res.status(400).json({ success: false, message: 'Updated text content is required' });
    return;
  }

  const updatedChunk = await adminService.editChunk(chunkId, text);

  if (!updatedChunk) {
    res.status(404).json({ success: false, message: 'Chunk not found' });
    return;
  }

  res.status(200).json({ success: true, message: 'Chunk edited and re-embedded successfully.', chunk: updatedChunk });
});

/**
 * POST /admin/add-knowledge
 */
export const addKnowledge = asyncHandler(async (req: Request, res: Response) => {
  const { title, content, source } = req.body;

  if (!title || !content) {
    res.status(400).json({ success: false, message: 'Title and content are required' });
    return;
  }

  const result = await adminService.addManualKnowledge(title, content, source || 'Manual Entry');

  res.status(200).json({
    success: true,
    message: `Manual Knowledge Entry "${title}" auto-chunked and embedded successfully.`,
    ...result,
  });
});

/**
 * POST /admin/test-rag
 */
export const testRAG = asyncHandler(async (req: Request, res: Response) => {
  const { question } = req.body;

  if (!question) {
    res.status(400).json({ success: false, message: 'Question parameter is required' });
    return;
  }

  const result = await adminService.testRAGPipeline(question);

  res.status(200).json({
    success: true,
    result,
  });
});
