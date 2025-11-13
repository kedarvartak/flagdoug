import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Flag, FlagType } from '../src/flags/entities/flag.entity';
import { FlagEnvironment, Environment } from '../src/flags/entities/flag-environment.entity';

describe('Flag Environment Toggling (e2e)', () => {
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
    // Clean up database before each test (delete child records first)
    await dataSource.query('DELETE FROM flag_environments');
    await dataSource.query('DELETE FROM flags');
  });

  describe('Complete Environment Toggle Workflow', () => {
    it('should toggle flag across multiple environments', async () => {
      // Create a flag with multiple environments
      const createResponse = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'multi_env_flag',
          name: 'Multi Environment Flag',
          type: FlagType.BOOLEAN,
          environments: [
            {
              environment: Environment.DEVELOPMENT,
              enabled: true,
              rolloutPercentage: 100,
            },
            {
              environment: Environment.STAGING,
              enabled: false,
              rolloutPercentage: 0,
            },
            {
              environment: Environment.PRODUCTION,
              enabled: false,
              rolloutPercentage: 0,
            },
          ],
        })
        .expect(201);

      const flagId = createResponse.body.id;

      // Toggle staging environment
      const stagingToggle = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.STAGING}`)
        .send({
          enabled: true,
          rolloutPercentage: 50,
        })
        .expect(200);

      expect(stagingToggle.body.enabled).toBe(true);
      expect(stagingToggle.body.rolloutPercentage).toBe(50);
      expect(stagingToggle.body.environment).toBe(Environment.STAGING);

      // Toggle production environment
      const prodToggle = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.PRODUCTION}`)
        .send({
          enabled: true,
          rolloutPercentage: 10,
        })
        .expect(200);

      expect(prodToggle.body.enabled).toBe(true);
      expect(prodToggle.body.rolloutPercentage).toBe(10);

      // Verify all environments are correctly set
      const flagResponse = await request(app.getHttpServer())
        .get(`/api/flags/${flagId}`)
        .expect(200);

      const environments = flagResponse.body.environments;
      expect(environments).toHaveLength(3);

      const devEnv = environments.find((e: any) => e.environment === Environment.DEVELOPMENT);
      const stagingEnv = environments.find((e: any) => e.environment === Environment.STAGING);
      const prodEnv = environments.find((e: any) => e.environment === Environment.PRODUCTION);

      expect(devEnv.enabled).toBe(true);
      expect(devEnv.rolloutPercentage).toBe(100);

      expect(stagingEnv.enabled).toBe(true);
      expect(stagingEnv.rolloutPercentage).toBe(50);

      expect(prodEnv.enabled).toBe(true);
      expect(prodEnv.rolloutPercentage).toBe(10);
    });
  });

  describe('PATCH /api/flags/:id/environments/:env', () => {
    let flagId: string;

    beforeEach(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'toggle_test_flag',
          name: 'Toggle Test Flag',
          type: FlagType.BOOLEAN,
          environments: [
            {
              environment: Environment.DEVELOPMENT,
              enabled: false,
              rolloutPercentage: 0,
            },
          ],
        });

      flagId = createResponse.body.id;
    });

    it('should enable a flag in an environment', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.DEVELOPMENT}`)
        .send({
          enabled: true,
        })
        .expect(200);

      expect(response.body.enabled).toBe(true);
      expect(response.body.environment).toBe(Environment.DEVELOPMENT);
    });

    it('should disable a flag in an environment', async () => {
      // First enable it
      await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.DEVELOPMENT}`)
        .send({ enabled: true })
        .expect(200);

      // Then disable it
      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.DEVELOPMENT}`)
        .send({ enabled: false })
        .expect(200);

      expect(response.body.enabled).toBe(false);
    });

    it('should update rollout percentage', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.DEVELOPMENT}`)
        .send({
          enabled: true,
          rolloutPercentage: 75,
        })
        .expect(200);

      expect(response.body.enabled).toBe(true);
      expect(response.body.rolloutPercentage).toBe(75);
    });

    it('should update enabled state and rollout percentage together', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.DEVELOPMENT}`)
        .send({
          enabled: true,
          rolloutPercentage: 25,
        })
        .expect(200);

      expect(response.body.enabled).toBe(true);
      expect(response.body.rolloutPercentage).toBe(25);
    });

    it('should update timestamp when toggling', async () => {
      const initialResponse = await request(app.getHttpServer())
        .get(`/api/flags/${flagId}`)
        .expect(200);

      const initialEnv = initialResponse.body.environments[0];
      const initialUpdatedAt = new Date(initialEnv.updatedAt);

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.DEVELOPMENT}`)
        .send({ enabled: true })
        .expect(200);

      const updatedResponse = await request(app.getHttpServer())
        .get(`/api/flags/${flagId}`)
        .expect(200);

      const updatedEnv = updatedResponse.body.environments[0];
      const newUpdatedAt = new Date(updatedEnv.updatedAt);

      expect(newUpdatedAt.getTime()).toBeGreaterThan(initialUpdatedAt.getTime());
    });

    it('should return 404 for non-existent flag', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      await request(app.getHttpServer())
        .patch(`/api/flags/${fakeId}/environments/${Environment.DEVELOPMENT}`)
        .send({ enabled: true })
        .expect(404);
    });

    it('should return 400 for invalid environment', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/invalid_env`)
        .send({ enabled: true })
        .expect(400);

      expect(response.body.message).toContain('must be one of the following values');
    });

    it('should return 404 for non-existent environment configuration', async () => {
      // Try to toggle an environment that wasn't created with the flag
      await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.PRODUCTION}`)
        .send({ enabled: true })
        .expect(404);
    });

    it('should reject rollout percentage below 0', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.DEVELOPMENT}`)
        .send({
          enabled: true,
          rolloutPercentage: -10,
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject rollout percentage above 100', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.DEVELOPMENT}`)
        .send({
          enabled: true,
          rolloutPercentage: 150,
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should accept rollout percentage of 0', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.DEVELOPMENT}`)
        .send({
          enabled: true,
          rolloutPercentage: 0,
        })
        .expect(200);

      expect(response.body.rolloutPercentage).toBe(0);
    });

    it('should accept rollout percentage of 100', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.DEVELOPMENT}`)
        .send({
          enabled: true,
          rolloutPercentage: 100,
        })
        .expect(200);

      expect(response.body.rolloutPercentage).toBe(100);
    });

    it('should reject non-integer rollout percentage', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.DEVELOPMENT}`)
        .send({
          enabled: true,
          rolloutPercentage: 50.5,
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject missing enabled field', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.DEVELOPMENT}`)
        .send({
          rolloutPercentage: 50,
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject invalid enabled type', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.DEVELOPMENT}`)
        .send({
          enabled: 'yes',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('Environment Independence', () => {
    it('should toggle environments independently', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'independent_flag',
          name: 'Independent Flag',
          type: FlagType.BOOLEAN,
          environments: [
            {
              environment: Environment.DEVELOPMENT,
              enabled: false,
            },
            {
              environment: Environment.STAGING,
              enabled: false,
            },
            {
              environment: Environment.PRODUCTION,
              enabled: false,
            },
          ],
        });

      const flagId = createResponse.body.id;

      // Enable only development
      await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.DEVELOPMENT}`)
        .send({ enabled: true })
        .expect(200);

      // Verify other environments remain disabled
      const flagResponse = await request(app.getHttpServer())
        .get(`/api/flags/${flagId}`)
        .expect(200);

      const environments = flagResponse.body.environments;
      const devEnv = environments.find((e: any) => e.environment === Environment.DEVELOPMENT);
      const stagingEnv = environments.find((e: any) => e.environment === Environment.STAGING);
      const prodEnv = environments.find((e: any) => e.environment === Environment.PRODUCTION);

      expect(devEnv.enabled).toBe(true);
      expect(stagingEnv.enabled).toBe(false);
      expect(prodEnv.enabled).toBe(false);
    });

    it('should allow different rollout percentages per environment', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'rollout_flag',
          name: 'Rollout Flag',
          type: FlagType.PERCENTAGE,
          environments: [
            {
              environment: Environment.DEVELOPMENT,
              enabled: true,
              rolloutPercentage: 100,
            },
            {
              environment: Environment.STAGING,
              enabled: true,
              rolloutPercentage: 50,
            },
            {
              environment: Environment.PRODUCTION,
              enabled: true,
              rolloutPercentage: 10,
            },
          ],
        });

      const flagId = createResponse.body.id;

      // Update staging to 75%
      await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.STAGING}`)
        .send({
          enabled: true,
          rolloutPercentage: 75,
        })
        .expect(200);

      // Verify percentages are independent
      const flagResponse = await request(app.getHttpServer())
        .get(`/api/flags/${flagId}`)
        .expect(200);

      const environments = flagResponse.body.environments;
      const devEnv = environments.find((e: any) => e.environment === Environment.DEVELOPMENT);
      const stagingEnv = environments.find((e: any) => e.environment === Environment.STAGING);
      const prodEnv = environments.find((e: any) => e.environment === Environment.PRODUCTION);

      expect(devEnv.rolloutPercentage).toBe(100);
      expect(stagingEnv.rolloutPercentage).toBe(75);
      expect(prodEnv.rolloutPercentage).toBe(10);
    });
  });
});
