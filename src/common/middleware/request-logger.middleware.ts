import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('HTTP');

export function requestLoggerMiddleware(
  request: Request & { requestId?: string },
  response: Response,
  next: NextFunction,
): void {
  const startedAt = Date.now();

  response.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const path = request.originalUrl ?? request.url;
    const requestId = request.requestId ?? '-';
    const message = `${request.method} ${path} ${response.statusCode} ${durationMs}ms requestId=${requestId}`;

    if (response.statusCode >= 500) {
      logger.error(message);
      return;
    }
    if (response.statusCode >= 400) {
      logger.warn(message);
      return;
    }
    logger.log(message);
  });

  next();
}
