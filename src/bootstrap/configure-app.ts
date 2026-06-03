import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZodValidationPipe } from 'nestjs-zod';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { requestContextMiddleware } from '@/common/middleware/request-context.middleware';
import { requestLoggerMiddleware } from '@/common/middleware/request-logger.middleware';
import { setupSwagger } from '@/common/swagger/setup-swagger';

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.use(requestContextMiddleware);

  if (config.get<boolean>('logging.requests', true)) {
    app.use(requestLoggerMiddleware);
  }

  app.enableCors({
    origin: parseCorsOrigin(config.get<string>('cors.origin', '*')),
    credentials: config.get<string>('cors.origin', '*') !== '*',
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter(config));
  app.enableShutdownHooks();

  setupSwagger(app);
}

function parseCorsOrigin(origin: string): string | string[] {
  const trimmed = origin.trim();
  if (!trimmed || trimmed === '*') {
    return '*';
  }
  if (!trimmed.includes(',')) {
    return trimmed;
  }
  return trimmed
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
