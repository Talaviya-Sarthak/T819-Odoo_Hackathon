/**
 * Application-level HTTP error carrying a stable error `code`, an optional
 * human-readable `suggestion` (what the user should do next), and the HTTP
 * status code. Rendered by the centralized error handler.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly suggestion?: string;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: unknown,
    suggestion?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.suggestion = suggestion;
  }

  static badRequest(code: string, message: string, details?: unknown, suggestion?: string): ApiError {
    return new ApiError(400, code, message, details, suggestion);
  }

  static unauthorized(code: string, message: string): ApiError {
    return new ApiError(401, code, message);
  }

  static forbidden(code: string, message: string): ApiError {
    return new ApiError(403, code, message);
  }

  static notFound(code: string, message: string, details?: unknown, suggestion?: string): ApiError {
    return new ApiError(404, code, message, details, suggestion);
  }

  static conflict(code: string, message: string, details?: unknown, suggestion?: string): ApiError {
    return new ApiError(409, code, message, details, suggestion);
  }
}
