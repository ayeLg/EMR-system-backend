import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ZodValidationPipe } from 'nestjs-zod';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { setupSwagger } from '@/common/swagger/setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Security & transport hardening
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
  app.enableCors({
    origin: config.get<string>('cors.origin', '*'),
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ZodValidationPipe());
  app.enableShutdownHooks();

  setupSwagger(app);

  await app.listen(config.get<number>('port', 3000));
}
void bootstrap();
