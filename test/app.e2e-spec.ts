import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/bootstrap/configure-app';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Boot through the production bootstrap so the test exercises the real
    // pipe (ZodValidationPipe), TransformInterceptor envelope, and exception
    // filter — not a hand-rolled config that drifts from production.
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/health', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          success: boolean;
          data: { status: string };
          timestamp: string;
        };
        expect(body.success).toBe(true);
        expect(body.timestamp).toBeDefined();
        expect(body.data.status).toBe('ok');
      });
  });

  it('POST /api/auth/login', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'doctor@example.com', password: 'password123' })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      })
      .expect((res) => {
        const body = res.body as {
          success: boolean;
          data: { accessToken: string; user: { role: string } };
        };
        expect(body.success).toBe(true);
        expect(body.data.accessToken).toBeDefined();
        expect(body.data.user.role).toBe('doctor');
      });
  });
});
