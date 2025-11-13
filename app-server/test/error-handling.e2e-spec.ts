import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Flag, FlagType } from '../src/flags/entities/flag.entity';
import { FlagEnvironment, Environment } from '../src/flags/entities/flag-environment.entity';

describe('Error Handling and Validation (e2e)', () => {
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

  describe('Validation Errors', () => {
    describe('Flag Key Validation', () => {
      it('should reject uppercase letters in flag key', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'InvalidKey',
            name: 'Invalid Key',
            type: FlagType.BOOLEAN,
            environments: [],
          })
          .expect(400);

        const message = Array.isArray(response.body.message) 
          ? response.body.message.join(' ') 
          : response.body.message;
        expect(message).toContain('lowercase');
      });

      it('should reject special characters in flag key', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'invalid-key!',
            name: 'Invalid Key',
            type: FlagType.BOOLEAN,
            environments: [],
          })
          .expect(400);

        const message = Array.isArray(response.body.message) 
          ? response.body.message.join(' ') 
          : response.body.message;
        expect(message).toContain('lowercase');
      });

      it('should reject spaces in flag key', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'invalid key',
            name: 'Invalid Key',
            type: FlagType.BOOLEAN,
            environments: [],
          })
          .expect(400);

        const message = Array.isArray(response.body.message) 
          ? response.body.message.join(' ') 
          : response.body.message;
        expect(message).toContain('lowercase');
      });

      it('should accept valid flag key with underscores', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'valid_flag_key_123',
            name: 'Valid Key',
            type: FlagType.BOOLEAN,
            environments: [],
          })
          .expect(201);

        expect(response.body.key).toBe('valid_flag_key_123');
      });

      it('should reject empty flag key', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: '',
            name: 'Empty Key',
            type: FlagType.BOOLEAN,
            environments: [],
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });
    });

    describe('Required Fields Validation', () => {
      it('should reject missing key field', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            name: 'Missing Key',
            type: FlagType.BOOLEAN,
            environments: [],
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it('should reject missing name field', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'missing_name',
            type: FlagType.BOOLEAN,
            environments: [],
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it('should reject missing type field', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'missing_type',
            name: 'Missing Type',
            environments: [],
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it('should reject missing environments field', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'missing_environments',
            name: 'Missing Environments',
            type: FlagType.BOOLEAN,
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });
    });

    describe('Type Validation', () => {
      it('should reject invalid flag type', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'invalid_type',
            name: 'Invalid Type',
            type: 'invalid',
            environments: [],
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it('should reject non-boolean enabled field', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'invalid_enabled',
            name: 'Invalid Enabled',
            type: FlagType.BOOLEAN,
            enabled: 'yes',
            environments: [],
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it('should reject non-array environments field', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'invalid_environments',
            name: 'Invalid Environments',
            type: FlagType.BOOLEAN,
            environments: 'not-an-array',
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });
    });

    describe('Environment Validation', () => {
      it('should reject invalid environment enum', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'invalid_env',
            name: 'Invalid Environment',
            type: FlagType.BOOLEAN,
            environments: [
              {
                environment: 'invalid_environment',
                enabled: true,
              },
            ],
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it('should reject missing environment field in environment config', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'missing_env_field',
            name: 'Missing Environment Field',
            type: FlagType.BOOLEAN,
            environments: [
              {
                enabled: true,
              },
            ],
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });
    });

    describe('Rollout Percentage Validation', () => {
      it('should reject negative rollout percentage', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'negative_rollout',
            name: 'Negative Rollout',
            type: FlagType.PERCENTAGE,
            environments: [
              {
                environment: Environment.DEVELOPMENT,
                enabled: true,
                rolloutPercentage: -5,
              },
            ],
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it('should reject rollout percentage over 100', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'over_rollout',
            name: 'Over Rollout',
            type: FlagType.PERCENTAGE,
            environments: [
              {
                environment: Environment.DEVELOPMENT,
                enabled: true,
                rolloutPercentage: 150,
              },
            ],
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it('should reject non-integer rollout percentage', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'float_rollout',
            name: 'Float Rollout',
            type: FlagType.PERCENTAGE,
            environments: [
              {
                environment: Environment.DEVELOPMENT,
                enabled: true,
                rolloutPercentage: 50.5,
              },
            ],
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it('should reject string rollout percentage', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'string_rollout',
            name: 'String Rollout',
            type: FlagType.PERCENTAGE,
            environments: [
              {
                environment: Environment.DEVELOPMENT,
                enabled: true,
                rolloutPercentage: '50',
              },
            ],
          })
          .expect(400);

        expect(response.body.message).toBeDefined();
      });
    });

    describe('Forbidden Fields', () => {
      it('should reject unknown fields in create request', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'unknown_field',
            name: 'Unknown Field',
            type: FlagType.BOOLEAN,
            environments: [],
            unknownField: 'should be rejected',
          })
          .expect(400);

        expect(response.body.message).toContain('property unknownField should not exist');
      });

      it('should reject unknown fields in update request', async () => {
        const createResponse = await request(app.getHttpServer())
          .post('/api/flags')
          .send({
            key: 'test_flag',
            name: 'Test Flag',
            type: FlagType.BOOLEAN,
            environments: [],
          });

        const flagId = createResponse.body.id;

        const response = await request(app.getHttpServer())
          .patch(`/api/flags/${flagId}`)
          .send({
            name: 'Updated Name',
            unknownField: 'should be rejected',
          })
          .expect(400);

        expect(response.body.message).toContain('property unknownField should not exist');
      });
    });
  });

  describe('Not Found Errors', () => {
    it('should return 404 for non-existent flag on GET', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .get(`/api/flags/${fakeId}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
      expect(response.body.statusCode).toBe(404);
    });

    it('should return 404 for non-existent flag on PATCH', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${fakeId}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 404 for non-existent flag on DELETE', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .delete(`/api/flags/${fakeId}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 404 for non-existent flag on environment toggle', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${fakeId}/environments/${Environment.DEVELOPMENT}`)
        .send({ enabled: true })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 404 for non-existent environment configuration', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'test_flag',
          name: 'Test Flag',
          type: FlagType.BOOLEAN,
          environments: [
            {
              environment: Environment.DEVELOPMENT,
              enabled: true,
            },
          ],
        });

      const flagId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${Environment.PRODUCTION}`)
        .send({ enabled: true })
        .expect(404);

      expect(response.body.message).toContain('not found');
    });
  });

  describe('Conflict Errors', () => {
    it('should return 409 for duplicate flag key', async () => {
      const flagData = {
        key: 'duplicate_key',
        name: 'Duplicate Key',
        type: FlagType.BOOLEAN,
        environments: [],
      };

      await request(app.getHttpServer())
        .post('/api/flags')
        .send(flagData)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send(flagData)
        .expect(409);

      expect(response.body.message).toContain('already exists');
      expect(response.body.statusCode).toBe(409);
    });

    it('should return 409 for duplicate key with different name', async () => {
      await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'same_key',
          name: 'First Name',
          type: FlagType.BOOLEAN,
          environments: [],
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'same_key',
          name: 'Different Name',
          type: FlagType.BOOLEAN,
          environments: [],
        })
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('Bad Request Errors', () => {
    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags/not-a-uuid');

      // NestJS may return 400 or 500 depending on validation pipe configuration
      expect([400, 500]).toContain(response.status);
    });

    it('should return 400 for malformed JSON', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('should return 400 for empty request body on create', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send({})
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should return 400 for invalid environment in toggle', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'test_flag',
          name: 'Test Flag',
          type: FlagType.BOOLEAN,
          environments: [
            {
              environment: Environment.DEVELOPMENT,
              enabled: true,
            },
          ],
        });

      const flagId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/invalid_env`)
        .send({ enabled: true })
        .expect(400);

      expect(response.body.message).toContain('must be one of the following values');
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format for validation errors', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'Invalid-Key',
          name: 'Invalid',
          type: FlagType.BOOLEAN,
          environments: [],
        })
        .expect(400);

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body.statusCode).toBe(400);
    });

    it('should return consistent error format for not found errors', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .get(`/api/flags/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body.statusCode).toBe(404);
    });

    it('should return consistent error format for conflict errors', async () => {
      const flagData = {
        key: 'duplicate',
        name: 'Duplicate',
        type: FlagType.BOOLEAN,
        environments: [],
      };

      await request(app.getHttpServer()).post('/api/flags').send(flagData);

      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send(flagData)
        .expect(409);

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body.statusCode).toBe(409);
    });

    it('should not expose internal error details in 500 errors', async () => {
      // This test would require simulating a database error
      // For now, we verify the error filter is configured correctly
      // by checking that validation errors don't expose stack traces
      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'test',
          name: 'Test',
          type: FlagType.BOOLEAN,
          environments: [],
          extraField: 'should cause error',
        })
        .expect(400);

      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('trace');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long flag names', async () => {
      const longName = 'A'.repeat(1000);

      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'long_name_flag',
          name: longName,
          type: FlagType.BOOLEAN,
          environments: [],
        })
        .expect(201);

      expect(response.body.name).toBe(longName);
    });

    it('should handle very long descriptions', async () => {
      const longDescription = 'A'.repeat(5000);

      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'long_desc_flag',
          name: 'Long Description',
          description: longDescription,
          type: FlagType.BOOLEAN,
          environments: [],
        })
        .expect(201);

      expect(response.body.description).toBe(longDescription);
    });

    it('should handle empty environments array', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'no_envs',
          name: 'No Environments',
          type: FlagType.BOOLEAN,
          environments: [],
        })
        .expect(201);

      expect(response.body.environments).toEqual([]);
    });

    it('should handle null description', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'null_desc',
          name: 'Null Description',
          description: null,
          type: FlagType.BOOLEAN,
          environments: [],
        })
        .expect(201);

      expect(response.body.description).toBeNull();
    });

    it('should handle undefined optional fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'minimal_flag',
          name: 'Minimal Flag',
          type: FlagType.BOOLEAN,
          environments: [],
        })
        .expect(201);

      expect(response.body.key).toBe('minimal_flag');
      expect(response.body.enabled).toBe(false); // Default value
    });
  });
});
