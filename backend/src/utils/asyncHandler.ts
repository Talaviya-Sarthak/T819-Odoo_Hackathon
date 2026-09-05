import type { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

/**
 * Wraps an async route handler so rejected promises are forwarded to the
 * centralized error handler instead of crashing the process.
 */
export const asyncHandler = (fn: AsyncHandler): RequestHandler => {
  return (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
};
