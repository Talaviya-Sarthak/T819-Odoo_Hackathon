import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { requireAdminAuth } from '../admin/admin.auth';

const router = Router();

// Public Admin Auth Login
router.post('/auth/login', adminController.login);

import multer from 'multer';
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

// Protected Admin APIs
router.get('/stats', requireAdminAuth, adminController.getStats);
router.get('/logs', requireAdminAuth, adminController.getLogs);
router.post('/upload-pdf', requireAdminAuth, upload.single('file'), adminController.uploadPDF);
router.get('/pdfs', requireAdminAuth, adminController.getPDFs);
router.delete('/pdf/:id', requireAdminAuth, adminController.deletePDF);
router.get('/chunks', requireAdminAuth, adminController.getChunks);
router.put('/chunk/:id', requireAdminAuth, adminController.editChunk);
router.post('/add-knowledge', requireAdminAuth, adminController.addKnowledge);
router.post('/test-rag', requireAdminAuth, adminController.testRAG);

export default router;
