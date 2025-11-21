import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils';

/**
 * Logs incoming requests with method, path, status code, IP, user-agent, and response time.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on('finish', () => {
    const elapsed = Date.now() - start;

    const ip =
      req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const method = req.method;
    const url = req.originalUrl;
    const status = res.statusCode;
    const requestId = (req as any).requestId || '-';
    const userId = (req as any).user?.id || 'anonymous';

    const log = {
      timestamp: new Date().toISOString(),
      requestId,
      userId,
      method,
      url,
      status,
      elapsed,
      ip,
      userAgent,
      headers: req.headers,
      query: req.query,
    };

    // const log = `[${new Date().toISOString()}] [${requestId}] ${method} ${url} ${status} - ${elapsed}ms | IP: ${ip} | UA: ${userAgent}`;

    if (status >= 500) {
      logger.error('Request failed', log);
    } else if (status >= 400) {
      logger.warn('Client error', log);
    } else {
      logger.info('Request completed', log);
    }
  });

  next();
}
