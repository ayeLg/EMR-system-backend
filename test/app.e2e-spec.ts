import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
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
        const body = res.body as { status: string };
        expect(body.status).toBe('ok');
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
          accessToken: string;
          user: { role: string };
        };
        expect(body.accessToken).toBeDefined();
        expect(body.user.role).toBe('doctor');
      });
  });
});
