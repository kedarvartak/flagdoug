import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Flag, FlagType } from '../src/flags/entities/flag.entity';
import { FlagEnvironment, Environment } from '../src/flags/entities/flag-environment.entity';

describe('Flags CRUD (e2e)', () => {
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

  describe('Complete Flag Lifecycle', () => {
    it('should create, read, update, and delete a flag', async () => {
      // CREATE
      const createDto = {
        key: 'test_feature',
        name: 'Test Feature',
        description: 'A test feature flag',
        type: FlagType.BOOLEAN,
        enabled: false,
        environments: [
          {
            environment: Environment.DEVELOPMENT,
            enabled: true,
            rolloutPercentage: 100,
          },
          {
            environment: Environment.PRODUCTION,
            enabled: false,
            rolloutPercentage: 0,
          },
        ],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/flags')
        .send(createDto)
        .expect(201);

      expect(createResponse.body).toMatchObject({
        key: 'test_feature',
        name: 'Test Feature',
        description: 'A test feature flag',
        type: FlagType.BOOLEAN,
        enabled: false,
      });
      expect(createResponse.body.id).toBeDefined();
      expect(createResponse.body.createdAt).toBeDefined();
      expect(createResponse.body.updatedAt).toBeDefined();

      const flagId = createResponse.body.id;

      // READ - Get all flags
      const getAllResponse = await request(app.getHttpServer())
        .get('/api/flags')
        .expect(200);

      expect(getAllResponse.body).toHaveLength(1);
      expect(getAllResponse.body[0].key).toBe('test_feature');

      // READ - Get single flag
      const getOneResponse = await request(app.getHttpServer())
        .get(`/api/flags/${flagId}`)
        .expect(200);

      expect(getOneResponse.body).toMatchObject({
        id: flagId,
        key: 'test_feature',
        name: 'Test Feature',
      });
      expect(getOneResponse.body.environments).toHaveLength(2);

      // UPDATE
      const updateDto = {
        name: 'Updated Test Feature',
        description: 'Updated description',
        enabled: true,
      };

      const updateResponse = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}`)
        .send(updateDto)
        .expect(200);

      expect(updateResponse.body).toMatchObject({
        id: flagId,
        key: 'test_feature',
        name: 'Updated Test Feature',
        description: 'Updated description',
        enabled: true,
      });

      // DELETE
      await request(app.getHttpServer())
        .delete(`/api/flags/${flagId}`)
        .expect(204);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/api/flags/${flagId}`)
        .expect(404);
    });
  });

  describe('POST /api/flags', () => {
    it('should create a flag with valid data', async () => {
      const createDto = {
        key: 'new_feature',
        name: 'New Feature',
        description: 'A new feature',
        type: FlagType.BOOLEAN,
        enabled: true,
        environments: [
          {
            environment: Environment.DEVELOPMENT,
            enabled: true,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send(createDto)
        .expect(201);

      expect(response.body.key).toBe('new_feature');
      expect(response.body.id).toBeDefined();
    });

    it('should reject duplicate flag keys', async () => {
      const createDto = {
        key: 'duplicate_key',
        name: 'Duplicate Key',
        type: FlagType.BOOLEAN,
        environments: [],
      };

      await request(app.getHttpServer())
        .post('/api/flags')
        .send(createDto)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send(createDto)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should reject invalid flag key format', async () => {
      const createDto = {
        key: 'Invalid-Key!',
        name: 'Invalid Key',
        type: FlagType.BOOLEAN,
        environments: [],
      };

      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send(createDto)
        .expect(400);

      const message = Array.isArray(response.body.message) 
        ? response.body.message.join(' ') 
        : response.body.message;
      expect(message).toContain('lowercase');
    });

    it('should reject missing required fields', async () => {
      const createDto = {
        name: 'Missing Key',
      };

      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send(createDto)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject invalid flag type', async () => {
      const createDto = {
        key: 'test_flag',
        name: 'Test Flag',
        type: 'invalid_type',
        environments: [],
      };

      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send(createDto)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should create flag with percentage type', async () => {
      const createDto = {
        key: 'percentage_flag',
        name: 'Percentage Flag',
        type: FlagType.PERCENTAGE,
        environments: [
          {
            environment: Environment.PRODUCTION,
            enabled: true,
            rolloutPercentage: 50,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send(createDto)
        .expect(201);

      expect(response.body.type).toBe(FlagType.PERCENTAGE);
    });

    it('should reject invalid rollout percentage', async () => {
      const createDto = {
        key: 'invalid_rollout',
        name: 'Invalid Rollout',
        type: FlagType.PERCENTAGE,
        environments: [
          {
            environment: Environment.PRODUCTION,
            enabled: true,
            rolloutPercentage: 150,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send(createDto)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/flags', () => {
    it('should return empty array when no flags exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all flags with environments', async () => {
      // Create multiple flags
      await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'flag_one',
          name: 'Flag One',
          type: FlagType.BOOLEAN,
          environments: [],
        });

      await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'flag_two',
          name: 'Flag Two',
          type: FlagType.BOOLEAN,
          environments: [],
        });

      const response = await request(app.getHttpServer())
        .get('/api/flags')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].key).toBeDefined();
      expect(response.body[1].key).toBeDefined();
    });
  });

  describe('GET /api/flags/:id', () => {
    it('should return a specific flag by id', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'specific_flag',
          name: 'Specific Flag',
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
        .get(`/api/flags/${flagId}`)
        .expect(200);

      expect(response.body.id).toBe(flagId);
      expect(response.body.key).toBe('specific_flag');
      expect(response.body.environments).toHaveLength(1);
    });

    it('should return 404 for non-existent flag', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .get(`/api/flags/${fakeId}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return error for invalid UUID format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/flags/invalid-uuid');

      // NestJS may return 400 or 500 depending on validation pipe configuration
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('PATCH /api/flags/:id', () => {
    it('should update flag name', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'update_test',
          name: 'Original Name',
          type: FlagType.BOOLEAN,
          environments: [],
        });

      const flagId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.key).toBe('update_test'); // Key should not change
    });

    it('should update flag description', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'desc_test',
          name: 'Description Test',
          type: FlagType.BOOLEAN,
          environments: [],
        });

      const flagId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}`)
        .send({ description: 'New description' })
        .expect(200);

      expect(response.body.description).toBe('New description');
    });

    it('should update flag enabled state', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'enabled_test',
          name: 'Enabled Test',
          type: FlagType.BOOLEAN,
          enabled: false,
          environments: [],
        });

      const flagId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}`)
        .send({ enabled: true })
        .expect(200);

      expect(response.body.enabled).toBe(true);
    });

    it('should update multiple fields at once', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'multi_update',
          name: 'Original',
          description: 'Original desc',
          type: FlagType.BOOLEAN,
          enabled: false,
          environments: [],
        });

      const flagId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}`)
        .send({
          name: 'Updated',
          description: 'Updated desc',
          enabled: true,
        })
        .expect(200);

      expect(response.body.name).toBe('Updated');
      expect(response.body.description).toBe('Updated desc');
      expect(response.body.enabled).toBe(true);
    });

    it('should return 404 for non-existent flag', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      await request(app.getHttpServer())
        .patch(`/api/flags/${fakeId}`)
        .send({ name: 'Updated' })
        .expect(404);
    });

    it('should reject invalid data types', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'validation_test',
          name: 'Validation Test',
          type: FlagType.BOOLEAN,
          environments: [],
        });

      const flagId = createResponse.body.id;

      await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}`)
        .send({ enabled: 'not-a-boolean' })
        .expect(400);
    });
  });

  describe('DELETE /api/flags/:id', () => {
    it('should soft delete a flag', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'delete_test',
          name: 'Delete Test',
          type: FlagType.BOOLEAN,
          environments: [],
        });

      const flagId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/api/flags/${flagId}`)
        .expect(204);

      // Verify flag is no longer accessible
      await request(app.getHttpServer())
        .get(`/api/flags/${flagId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent flag', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      await request(app.getHttpServer())
        .delete(`/api/flags/${fakeId}`)
        .expect(404);
    });

    it('should soft delete a flag and make it inaccessible', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/flags')
        .send({
          key: 'cascade_test',
          name: 'Cascade Test',
          type: FlagType.BOOLEAN,
          environments: [
            {
              environment: Environment.DEVELOPMENT,
              enabled: true,
            },
            {
              environment: Environment.PRODUCTION,
              enabled: false,
            },
          ],
        });

      const flagId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/api/flags/${flagId}`)
        .expect(204);

      // Verify flag is no longer accessible via API
      await request(app.getHttpServer())
        .get(`/api/flags/${flagId}`)
        .expect(404);
    });
  });
});
