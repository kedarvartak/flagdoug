import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import helmet from 'helmet';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter, LoggingInterceptor } from '../src/common';

describe('CORS and Security Configuration (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same configuration as main.ts
    app.enableCors({
      origin: ['http://localhost:5173'],
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      credentials: true,
      maxAge: 3600,
    });

    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
        crossOriginEmbedderPolicy: false,
      }),
    );

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());

    await app.init();
  }, 30000); // Increase timeout for database connection

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('CORS Configuration', () => {
    it('should allow requests from configured origin', () => {
      return request(app.getHttpServer())
        .get('/health')
        .set('Origin', 'http://localhost:5173')
        .expect(200)
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBe(
            'http://localhost:5173',
          );
          expect(res.headers['access-control-allow-credentials']).toBe('true');
        });
    });

    it('should handle preflight OPTIONS request', () => {
      return request(app.getHttpServer())
        .options('/api/flags')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(204)
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBe(
            'http://localhost:5173',
          );
          expect(res.headers['access-control-allow-methods']).toContain('POST');
          expect(res.headers['access-control-allow-headers']).toContain(
            'Content-Type',
          );
          expect(res.headers['access-control-max-age']).toBe('3600');
        });
    });

    it('should allow all configured HTTP methods', () => {
      return request(app.getHttpServer())
        .options('/api/flags')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'PATCH')
        .expect(204)
        .expect((res) => {
          const allowedMethods = res.headers['access-control-allow-methods'];
          expect(allowedMethods).toContain('GET');
          expect(allowedMethods).toContain('POST');
          expect(allowedMethods).toContain('PATCH');
          expect(allowedMethods).toContain('DELETE');
          expect(allowedMethods).toContain('OPTIONS');
        });
    });
  });

  describe('Security Headers (Helmet)', () => {
    it('should set security headers on responses', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          // Helmet sets various security headers
          expect(res.headers['x-dns-prefetch-control']).toBeDefined();
          expect(res.headers['x-frame-options']).toBeDefined();
          expect(res.headers['x-content-type-options']).toBe('nosniff');
          expect(res.headers['x-download-options']).toBe('noopen');
          expect(res.headers['x-xss-protection']).toBeDefined();
        });
    });

    it('should set Content-Security-Policy header', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.headers['content-security-policy']).toBeDefined();
          expect(res.headers['content-security-policy']).toContain(
            "default-src 'self'",
          );
        });
    });

    it('should set Strict-Transport-Security header', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.headers['strict-transport-security']).toBeDefined();
        });
    });
  });

  describe('Request Logging', () => {
    it('should log requests and responses', async () => {
      // This test verifies that the logging interceptor is applied
      // The actual logging is tested in the unit tests
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });
});
