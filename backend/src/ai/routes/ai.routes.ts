import path from 'path';
import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';

const router = Router();

// Serve React Web Application UI
router.get('/ui', (_req, res) => {
  res.sendFile(path.join(__dirname, '../ui/index.html'));
});

// Student Doubt Resolution Chatbot routes
router.post('/chat', aiController.chat);
router.get('/stream', aiController.streamChat);
router.post('/ingest', aiController.ingestDocument);
router.post('/seed-dealflow', aiController.seedDealflow);

export default router;
