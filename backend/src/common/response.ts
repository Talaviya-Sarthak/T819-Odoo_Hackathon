import { Response } from 'express';

export function sendSuccess(res: Response, statusCode: number, message: string, data?: any) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined && { data }),
  });
}

export function sendError(res: Response, statusCode: number, error: string) {
  return res.status(statusCode).json({
    success: false,
    error,
  });
}
