import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';

export const SWAGGER_BEARER_AUTH = 'access-token';

const SWAGGER_PATHS = ['/api/docs', '/api/docs-json'] as const;

export function setupSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const enabled = configService.get<boolean>('swagger.enabled', true);

  if (!enabled) {
    Logger.log('Swagger UI disabled (SWAGGER_ENABLED=false)', 'Swagger');
    return;
  }

  const user = configService.getOrThrow<string>('swagger.user');
  const password = configService.getOrThrow<string>('swagger.password');

  app.use(
    [...SWAGGER_PATHS],
    basicAuth({
      challenge: true,
      users: { [user]: password },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('EMR System API')
    .setDescription(
      'NestJS EMR backend with JWT authentication and CASL role-based access control.\n\n' +
        '**Swagger UI** is protected with HTTP Basic Auth (browser login).\n\n' +
        '**API calls** use JWT: login via `POST /api/auth/login`, then **Authorize** with the access token.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT from POST /api/auth/login',
      },
      SWAGGER_BEARER_AUTH,
    )
    .addTag('health', 'Service health checks')
    .addTag('auth', 'Authentication')
    .addTag('patients', 'Patient records')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  Logger.log(`Swagger UI at /api/docs (Basic Auth: user "${user}")`, 'Swagger');
}
