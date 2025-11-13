import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Flag, FlagType } from '../src/flags/entities/flag.entity';
import { Environment } from '../src/flags/entities/flag-environment.entity';

describe('Pagination (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await dataSource.query('DELETE FROM flag_environments');
    await dataSource.query('DELETE FROM flags');
  });

  describe('GET /api/flags with pagination', () => {
    beforeEach(async () => {
      // Create 25 test flags
      for (let i = 1; i <= 25; i++) {
        await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: `test_flag_${i}`,
            name: `Test Flag ${i}`,
            description: `Description for flag ${i}`,
            type: FlagType.BOOLEAN,
            enabled: false,
            environments: [
              {
                environment: Environment.DEVELOPMENT,
                enabled: true,
                rolloutPercentage: 100,
              },
            ],
          });
      }
    });

    it('should return all flags without pagination params', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(25);
    });

    it('should return paginated results with default page size', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags?page=1&limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data.length).toBe(10);
      expect(response.body.meta).toEqual({
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should return second page of results', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags?page=2&limit=10')
        .expect(200);

      expect(response.body.data.length).toBe(10);
      expect(response.body.meta).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('should return last page with remaining items', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags?page=3&limit=10')
        .expect(200);

      expect(response.body.data.length).toBe(5);
      expect(response.body.meta).toEqual({
        total: 25,
        page: 3,
        limit: 10,
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('should handle custom page size', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags?page=1&limit=20')
        .expect(200);

      expect(response.body.data.length).toBe(20);
      expect(response.body.meta).toEqual({
        total: 25,
        page: 1,
        limit: 20,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should reject page less than 1', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags?page=0&limit=10')
        .expect(400);

      expect(response.body.message).toContain('page must not be less than 1');
    });

    it('should reject limit greater than 100', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags?page=1&limit=101')
        .expect(400);

      expect(response.body.message).toContain(
        'limit must not be greater than 100',
      );
    });

    it('should reject negative limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags?page=1&limit=0')
        .expect(400);

      expect(response.body.message).toContain('limit must not be less than 1');
    });

    it('should return flags ordered by creation date (newest first)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags?page=1&limit=5')
        .expect(200);

      const flags = response.body.data;
      expect(flags.length).toBe(5);

      // Verify descending order by createdAt
      for (let i = 0; i < flags.length - 1; i++) {
        const current = new Date(flags[i].createdAt);
        const next = new Date(flags[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    it('should include environment relations in paginated results', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags?page=1&limit=5')
        .expect(200);

      const flags = response.body.data;
      flags.forEach((flag: Flag) => {
        expect(flag).toHaveProperty('environments');
        expect(Array.isArray(flag.environments)).toBe(true);
        expect(flag.environments.length).toBeGreaterThan(0);
      });
    });

    it('should handle empty results on page beyond total', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags?page=100&limit=10')
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body.meta.hasNextPage).toBe(false);
      expect(response.body.meta.hasPreviousPage).toBe(true);
    });

    it('should accept only page parameter and use default limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags?page=1')
        .expect(200);

      expect(response.body.data.length).toBe(10);
      expect(response.body.meta.limit).toBe(10);
    });

    it('should accept only limit parameter and use default page', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags?limit=15')
        .expect(200);

      expect(response.body.data.length).toBe(15);
      expect(response.body.meta.page).toBe(1);
    });

    it('should convert string query params to numbers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags?page=2&limit=5')
        .expect(200);

      expect(response.body.meta.page).toBe(2);
      expect(response.body.meta.limit).toBe(5);
      expect(typeof response.body.meta.page).toBe('number');
      expect(typeof response.body.meta.limit).toBe('number');
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      // Create 50 test flags for performance testing (reduced to avoid connection issues)
      for (let i = 1; i <= 50; i++) {
        await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: `perf_flag_${i}`,
            name: `Performance Flag ${i}`,
            type: FlagType.BOOLEAN,
            enabled: false,
            environments: [
              {
                environment: Environment.DEVELOPMENT,
                enabled: true,
              },
            ],
          });
      }
    });

    it('should respond within acceptable time for paginated query', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/api/flags?page=1&limit=20')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should respond within 1000ms (more realistic for E2E tests)
      expect(responseTime).toBeLessThan(1000);
    });

    it('should handle large page size efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/api/flags?page=1&limit=50')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body.data.length).toBe(50);
      // Should respond within 1500ms
      expect(responseTime).toBeLessThan(1500);
    });
  });
});
