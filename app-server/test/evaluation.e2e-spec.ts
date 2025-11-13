import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Flag } from '../src/flags/entities/flag.entity';
import { FlagEnvironment, Environment } from '../src/flags/entities/flag-environment.entity';
import { FlagType } from '../src/flags/entities/flag.entity';

describe('Evaluation (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test (delete child records first)
    await dataSource.query('DELETE FROM flag_environments');
    await dataSource.query('DELETE FROM flags');
  });

  describe('GET /api/evaluate/:key', () => {
    it('should return disabled for non-existent flag', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/evaluate/non_existent_flag')
        .query({ environment: Environment.PRODUCTION })
        .expect(200);

      expect(response.body).toEqual({
        enabled: false,
        key: 'non_existent_flag',
      });
    });

    it('should return enabled for enabled flag', async () => {
      // Create a flag
      const flag = await dataSource.getRepository(Flag).save({
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.BOOLEAN,
        enabled: true,
      });

      await dataSource.getRepository(FlagEnvironment).save({
        flagId: flag.id,
        environment: Environment.PRODUCTION,
        enabled: true,
        rolloutPercentage: null,
        targetingRules: [],
      });

      const response = await request(app.getHttpServer())
        .get('/api/evaluate/test_flag')
        .query({ environment: Environment.PRODUCTION })
        .expect(200);

      expect(response.body).toEqual({
        enabled: true,
        key: 'test_flag',
      });
    });

    it('should return disabled for disabled flag', async () => {
      const flag = await dataSource.getRepository(Flag).save({
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.BOOLEAN,
        enabled: true,
      });

      await dataSource.getRepository(FlagEnvironment).save({
        flagId: flag.id,
        environment: Environment.PRODUCTION,
        enabled: false,
        rolloutPercentage: null,
        targetingRules: [],
      });

      const response = await request(app.getHttpServer())
        .get('/api/evaluate/test_flag')
        .query({ environment: Environment.PRODUCTION })
        .expect(200);

      expect(response.body).toEqual({
        enabled: false,
        key: 'test_flag',
      });
    });

    it('should return 400 for invalid environment', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/evaluate/test_flag')
        .query({ environment: 'invalid_env' })
        .expect(400);

      expect(response.body.message).toContain('Invalid environment');
    });

    it('should handle rollout percentage with userId', async () => {
      const flag = await dataSource.getRepository(Flag).save({
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.PERCENTAGE,
        enabled: true,
      });

      await dataSource.getRepository(FlagEnvironment).save({
        flagId: flag.id,
        environment: Environment.PRODUCTION,
        enabled: true,
        rolloutPercentage: 100,
        targetingRules: [],
      });

      const response = await request(app.getHttpServer())
        .get('/api/evaluate/test_flag')
        .query({ 
          environment: Environment.PRODUCTION,
          userId: 'user123'
        })
        .expect(200);

      expect(response.body.enabled).toBe(true);
      expect(response.body.key).toBe('test_flag');
    });

    it('should return consistent results for same userId', async () => {
      const flag = await dataSource.getRepository(Flag).save({
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.PERCENTAGE,
        enabled: true,
      });

      await dataSource.getRepository(FlagEnvironment).save({
        flagId: flag.id,
        environment: Environment.PRODUCTION,
        enabled: true,
        rolloutPercentage: 50,
        targetingRules: [],
      });

      const response1 = await request(app.getHttpServer())
        .get('/api/evaluate/test_flag')
        .query({ 
          environment: Environment.PRODUCTION,
          userId: 'user123'
        })
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/api/evaluate/test_flag')
        .query({ 
          environment: Environment.PRODUCTION,
          userId: 'user123'
        })
        .expect(200);

      expect(response1.body.enabled).toBe(response2.body.enabled);
    });

    it('should handle targeting rules', async () => {
      const flag = await dataSource.getRepository(Flag).save({
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.BOOLEAN,
        enabled: true,
      });

      await dataSource.getRepository(FlagEnvironment).save({
        flagId: flag.id,
        environment: Environment.PRODUCTION,
        enabled: true,
        rolloutPercentage: null,
        targetingRules: [
          {
            attribute: 'country',
            operator: 'equals',
            value: 'US',
          },
        ],
      });

      // Note: The current implementation doesn't support passing attributes via query params
      // This test verifies the endpoint works, but targeting rules would need context
      const response = await request(app.getHttpServer())
        .get('/api/evaluate/test_flag')
        .query({ 
          environment: Environment.PRODUCTION,
          userId: 'user123'
        })
        .expect(200);

      // Without attributes, targeting rules will fail
      expect(response.body.enabled).toBe(false);
    });

    it('should respond within 50ms (performance requirement)', async () => {
      const flag = await dataSource.getRepository(Flag).save({
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.BOOLEAN,
        enabled: true,
      });

      await dataSource.getRepository(FlagEnvironment).save({
        flagId: flag.id,
        environment: Environment.PRODUCTION,
        enabled: true,
        rolloutPercentage: null,
        targetingRules: [],
      });

      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/api/evaluate/test_flag')
        .query({ 
          environment: Environment.PRODUCTION,
          userId: 'user123'
        })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should respond within 50ms as per requirement 5.5
      expect(responseTime).toBeLessThan(50);
    });

    it('should handle multiple environments correctly', async () => {
      const flag = await dataSource.getRepository(Flag).save({
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.BOOLEAN,
        enabled: true,
      });

      // Enable in production, disable in development
      await dataSource.getRepository(FlagEnvironment).save([
        {
          flagId: flag.id,
          environment: Environment.PRODUCTION,
          enabled: true,
          rolloutPercentage: null,
          targetingRules: [],
        },
        {
          flagId: flag.id,
          environment: Environment.DEVELOPMENT,
          enabled: false,
          rolloutPercentage: null,
          targetingRules: [],
        },
      ]);

      const prodResponse = await request(app.getHttpServer())
        .get('/api/evaluate/test_flag')
        .query({ environment: Environment.PRODUCTION })
        .expect(200);

      const devResponse = await request(app.getHttpServer())
        .get('/api/evaluate/test_flag')
        .query({ environment: Environment.DEVELOPMENT })
        .expect(200);

      expect(prodResponse.body.enabled).toBe(true);
      expect(devResponse.body.enabled).toBe(false);
    });
  });
});
