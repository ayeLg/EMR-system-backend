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

  it('POST /api/auth/login returns a token for the seeded admin', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'ChangeMe123!' })
      .expect(201)
      .expect((res) => {
        const body = res.body as {
          success: boolean;
          data: {
            accessToken: string;
            refreshToken: string;
            user: { email: string; role: string };
          };
        };
        expect(body.success).toBe(true);
        expect(body.data.accessToken).toBeDefined();
        expect(body.data.refreshToken).toBeDefined();
        expect(body.data.user.email).toBe('admin@example.com');
        expect(body.data.user.role).toBe('super_admin');
      });
  });

  it('POST /api/auth/refresh issues a new access token', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'ChangeMe123!' })
      .expect(201);

    const loginBody = loginRes.body as {
      data: { accessToken: string; refreshToken: string };
    };

    const refreshRes = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: loginBody.data.refreshToken })
      .expect(201);

    const refreshBody = refreshRes.body as {
      data: { accessToken: string; refreshToken: string };
    };
    expect(refreshBody.data.accessToken).toBeDefined();
    expect(refreshBody.data.refreshToken).toBeDefined();
    expect(refreshBody.data.accessToken).not.toBe(loginBody.data.accessToken);
  });

  it('POST /api/auth/login rejects an invalid password', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'WrongPass123!' })
      .expect(401)
      .expect((res) => {
        const body = res.body as { success: boolean; message: string };
        expect(body.success).toBe(false);
        expect(body.message).toBe('Invalid credentials');
      });
  });
});
