import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Health (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    await app.init();
  }, 30000); // Increase timeout for database connection

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('/health (GET)', () => {
    it('should return 200 status when application is healthy', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('database');
      expect(response.body.details.database).toHaveProperty('status', 'up');
      
      // Ensure response time is under 1 second
      expect(responseTime).toBeLessThan(1000);
    });

    it('should include database health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body.details.database).toBeDefined();
      expect(response.body.details.database.status).toBe('up');
    });

    it('should respond within 1 second', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000);
    });

    it('should return 503 when database is down', async () => {
      // Close the database connection to simulate database being down
      if (dataSource && dataSource.isInitialized) {
        await dataSource.destroy();
      }

      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(503);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('database');
      expect(response.body.error.database.status).toBe('down');

      // Reconnect for cleanup
      if (dataSource && !dataSource.isInitialized) {
        await dataSource.initialize();
      }
    });
  });
});
