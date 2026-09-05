import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { aiService } from '../ai.service';
import { anonymizeStudentData } from '../knowledge/knowledge.anonymizer';
import { knowledgeIngestionService } from '../knowledge/knowledge.ingestion';
import { seedCharusatKnowledge } from '../knowledge/seed/charusat_seed';
import { streamingService } from '../streaming/streaming.service';
import type { ChatResponse } from '../types';

/**
 * POST /api/v1/ai/chat
 * Student Doubt Resolution Chatbot Endpoint with Anonymization & RAG
 */
export const chat = asyncHandler(async (req: Request, res: Response) => {
  const { message, sessionId } = req.body;
  const userId = req.auth?.userId || 'guest-student-user';

  // Apply Anonymization & PII Redaction to student input
  const anonymization = anonymizeStudentData(message || '');
  const cleanMessage = anonymization.cleanText;

  const result = await aiService.chat(cleanMessage, userId, sessionId);

  const payload = {
    success: true,
    sessionId: result.sessionId,
    answer: result.response.answer,
    message: result.response.answer,
    visualizations: result.visualizations,
    artifacts: result.artifacts,
    citations: result.response.metadata?.citations || [],
    metadata: {
      ...result.response.metadata,
      anonymized: anonymization.redactedCount > 0,
      redactedCount: anonymization.redactedCount,
      detectedPiiTypes: anonymization.detectedTypes,
    },
  };

  res.status(200).json(payload);
});

/**
 * GET /api/v1/ai/stream
 * Server-Sent Events (SSE) progress streaming endpoint
 */
export const streamChat = asyncHandler(async (req: Request, res: Response) => {
  const message = (req.query.message as string) || 'Hello';
  const sessionId = req.query.sessionId as string;
  const userId = req.auth?.userId || 'guest-student-user';

  streamingService.initSSEHeader(res);

  // Apply Anonymization
  const anonymization = anonymizeStudentData(message);
  const cleanMessage = anonymization.cleanText;

  streamingService.emitEvent(res, 'Analyzing', 'Cleansing and anonymizing query data...');
  await new Promise((resolve) => setTimeout(resolve, 30));

  streamingService.emitEvent(res, 'Routing', 'Classifying student doubt intent...');
  await new Promise((resolve) => setTimeout(resolve, 30));

  streamingService.emitEvent(res, 'Retrieving', 'Querying CHARUSAT vector index & academic records...');
  const result = await aiService.chat(cleanMessage, userId, sessionId);

  streamingService.emitEvent(res, 'Synthesizing', 'Generating grounded academic response with citations...');
  streamingService.emitEvent(res, 'Completed', 'Student doubt resolution complete.', {
    sessionId: result.sessionId,
    answer: result.response.answer,
    visualizations: result.visualizations,
    citations: result.response.metadata.citations || [],
    metadata: result.response.metadata,
  });

  streamingService.closeStream(res);
});

/**
 * POST /api/v1/ai/ingest
 * Ingest PDF syllabus, academic handbook, or CSV doubt dataset into vector store
 */
export const ingestDocument = asyncHandler(async (req: Request, res: Response) => {
  const { filename, content, fileType } = req.body;

  if (!filename || !content) {
    res.status(400).json({ success: false, message: 'filename and content are required' });
    return;
  }

  // Preprocess & Anonymize incoming text content
  const anonymization = anonymizeStudentData(content);
  const cleanContent = anonymization.cleanText;

  const chunks = await knowledgeIngestionService.ingestDocument({
    filename,
    fileContent: cleanContent,
    fileType: fileType || 'pdf',
  });

  res.status(200).json({
    success: true,
    filename,
    chunksCreated: chunks.length,
    anonymization: {
      redactedCount: anonymization.redactedCount,
      detectedTypes: anonymization.detectedTypes,
    },
    diagnostics: chunks.diagnostics,
  });
});

import { seedDealflowKnowledge } from '../knowledge/seed/dealflow_seed';

/**
 * POST /api/v1/ai/seed-dealflow
 * Automatically seed DealFlow360 platform guide and customer capabilities into vector store
 */
export const seedDealflow = asyncHandler(async (_req: Request, res: Response) => {
  await seedDealflowKnowledge();
  res.status(200).json({
    success: true,
    message: 'DealFlow360 Platform Guide and Customer Capabilities seeded into RAG vector store.',
  });
});
