import type { Response } from 'express';
import type { SSEEventPayload, SSEStage } from './streaming.types';

export class StreamingService {
  /**
   * Initializes SSE headers on the Express HTTP Response.
   */
  public initSSEHeader(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
  }

  /**
   * Emits an SSE event chunk to the client stream.
   */
  public emitEvent(res: Response, stage: SSEStage, message: string, data?: any): void {
    const payload: SSEEventPayload = {
      stage,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  /**
   * Closes the SSE connection cleanly.
   */
  public closeStream(res: Response): void {
    res.write('event: close\ndata: {}\n\n');
    res.end();
  }
}

export const streamingService = new StreamingService();
