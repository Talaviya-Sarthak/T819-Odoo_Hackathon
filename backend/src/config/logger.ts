import pino from 'pino';
import { pinoHttp } from 'pino-http';
import { env } from './env';

/**
 * Structured logger. Redacts secrets and sensitive request data before
 * they can ever reach the logs.
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: { service: 'ps05-api' },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'password',
      'password_hash',
      '*.password',
      '*.password_hash',
      'token',
      '*.token',
      'secret',
      '*.secret',
    ],
    censor: '[redacted]',
  },
});

/**
 * Express middleware for per-request access logs with timing.
 */
export const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/api/v1/health',
  },
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
