import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlagsController } from './flags.controller';
import { FlagsService } from './flags.service';
import { Flag, FlagType } from './entities/flag.entity';
import { FlagEnvironment, Environment } from './entities/flag-environment.entity';

describe('FlagsController', () => {
  let app: INestApplication;
  let flagsService: FlagsService;

  const mockFlagsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggleEnvironment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlagsController],
      providers: [
        {
          provide: FlagsService,
          useValue: mockFlagsService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    flagsService = module.get<FlagsService>(FlagsService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('POST /api/flags', () => {
    it('should create a new flag and return 201', async () => {
      const createFlagDto = {
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
        ],
      };

      const createdFlag = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...createFlagDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        environments: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            flagId: '123e4567-e89b-12d3-a456-426614174000',
            environment: Environment.DEVELOPMENT,
            enabled: true,
            rolloutPercentage: 100,
            targetingRules: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      mockFlagsService.create.mockResolvedValue(createdFlag);

      const response = await request(app.getHttpServer())
        .post('/api/flags')
        .send(createFlagDto)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        key: createFlagDto.key,
        name: createFlagDto.name,
        description: createFlagDto.description,
        type: createFlagDto.type,
        enabled: createFlagDto.enabled,
      });
      expect(mockFlagsService.create).toHaveBeenCalledWith(createFlagDto);
    });

    it('should return 400 for invalid flag key format', async () => {
      const invalidDto = {
        key: 'Invalid-Key!',
        name: 'Test Feature',
        type: FlagType.BOOLEAN,
        environments: [],
      };

      await request(app.getHttpServer())
        .post('/api/flags')
        .send(invalidDto)
        .expect(400);

      expect(mockFlagsService.create).not.toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const invalidDto = {
        name: 'Test Feature',
      };

      await request(app.getHttpServer())
        .post('/api/flags')
        .send(invalidDto)
        .expect(400);

      expect(mockFlagsService.create).not.toHaveBeenCalled();
    });

    it('should return 409 for duplicate flag key', async () => {
      const createFlagDto = {
        key: 'existing_feature',
        name: 'Existing Feature',
        type: FlagType.BOOLEAN,
        environments: [],
      };

      const { ConflictException } = require('@nestjs/common');
      mockFlagsService.create.mockRejectedValue(
        new ConflictException("Flag with key 'existing_feature' already exists"),
      );

      await request(app.getHttpServer())
        .post('/api/flags')
        .send(createFlagDto)
        .expect(409);
    });

    it('should validate nested environment DTOs', async () => {
      const invalidDto = {
        key: 'test_feature',
        name: 'Test Feature',
        type: FlagType.BOOLEAN,
        environments: [
          {
            environment: 'invalid_env',
            enabled: true,
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/api/flags')
        .send(invalidDto)
        .expect(400);

      expect(mockFlagsService.create).not.toHaveBeenCalled();
    });

    it('should accept optional fields', async () => {
      const minimalDto = {
        key: 'minimal_feature',
        name: 'Minimal Feature',
        type: FlagType.BOOLEAN,
        environments: [],
      };

      const createdFlag = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...minimalDto,
        description: null,
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        environments: [],
      };

      mockFlagsService.create.mockResolvedValue(createdFlag);

      await request(app.getHttpServer())
        .post('/api/flags')
        .send(minimalDto)
        .expect(201);

      expect(mockFlagsService.create).toHaveBeenCalledWith(minimalDto);
    });
  });

  describe('GET /api/flags', () => {
    it('should return all flags', async () => {
      const flags = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          key: 'feature_one',
          name: 'Feature One',
          description: 'First feature',
          type: FlagType.BOOLEAN,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          environments: [],
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          key: 'feature_two',
          name: 'Feature Two',
          description: 'Second feature',
          type: FlagType.PERCENTAGE,
          enabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          environments: [],
        },
      ];

      mockFlagsService.findAll.mockResolvedValue(flags);

      const response = await request(app.getHttpServer())
        .get('/api/flags')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].key).toBe('feature_one');
      expect(response.body[1].key).toBe('feature_two');
      expect(mockFlagsService.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no flags exist', async () => {
      mockFlagsService.findAll.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/flags')
        .expect(200);

      expect(response.body).toEqual([]);
      expect(mockFlagsService.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /api/flags/:id', () => {
    it('should return a flag by id', async () => {
      const flagId = '123e4567-e89b-12d3-a456-426614174000';
      const flag = {
        id: flagId,
        key: 'test_feature',
        name: 'Test Feature',
        description: 'A test feature',
        type: FlagType.BOOLEAN,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        environments: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            flagId: flagId,
            environment: Environment.DEVELOPMENT,
            enabled: true,
            rolloutPercentage: 100,
            targetingRules: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      mockFlagsService.findOne.mockResolvedValue(flag);

      const response = await request(app.getHttpServer())
        .get(`/api/flags/${flagId}`)
        .expect(200);

      expect(response.body.id).toBe(flagId);
      expect(response.body.key).toBe('test_feature');
      expect(response.body.environments).toHaveLength(1);
      expect(mockFlagsService.findOne).toHaveBeenCalledWith(flagId);
    });

    it('should return 404 when flag not found', async () => {
      const flagId = '123e4567-e89b-12d3-a456-426614174000';
      const { NotFoundException } = require('@nestjs/common');

      mockFlagsService.findOne.mockRejectedValue(
        new NotFoundException(`Flag with ID '${flagId}' not found`),
      );

      await request(app.getHttpServer())
        .get(`/api/flags/${flagId}`)
        .expect(404);

      expect(mockFlagsService.findOne).toHaveBeenCalledWith(flagId);
    });
  });

  describe('PATCH /api/flags/:id', () => {
    it('should update a flag', async () => {
      const flagId = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto = {
        name: 'Updated Feature Name',
        description: 'Updated description',
        enabled: true,
      };

      const updatedFlag = {
        id: flagId,
        key: 'test_feature',
        name: updateDto.name,
        description: updateDto.description,
        type: FlagType.BOOLEAN,
        enabled: updateDto.enabled,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        environments: [],
      };

      mockFlagsService.update.mockResolvedValue(updatedFlag);

      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
      expect(response.body.description).toBe(updateDto.description);
      expect(response.body.enabled).toBe(updateDto.enabled);
      expect(mockFlagsService.update).toHaveBeenCalledWith(flagId, updateDto);
    });

    it('should update only provided fields', async () => {
      const flagId = '123e4567-e89b-12d3-a456-426614174000';
      const partialUpdateDto = {
        enabled: false,
      };

      const updatedFlag = {
        id: flagId,
        key: 'test_feature',
        name: 'Original Name',
        description: 'Original description',
        type: FlagType.BOOLEAN,
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        environments: [],
      };

      mockFlagsService.update.mockResolvedValue(updatedFlag);

      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}`)
        .send(partialUpdateDto)
        .expect(200);

      expect(response.body.enabled).toBe(false);
      expect(mockFlagsService.update).toHaveBeenCalledWith(flagId, partialUpdateDto);
    });

    it('should return 404 when updating non-existent flag', async () => {
      const flagId = '123e4567-e89b-12d3-a456-426614174000';
      const updateDto = { name: 'Updated Name' };
      const { NotFoundException } = require('@nestjs/common');

      mockFlagsService.update.mockRejectedValue(
        new NotFoundException(`Flag with ID '${flagId}' not found`),
      );

      await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}`)
        .send(updateDto)
        .expect(404);

      expect(mockFlagsService.update).toHaveBeenCalledWith(flagId, updateDto);
    });

    it('should return 400 for invalid update data', async () => {
      const flagId = '123e4567-e89b-12d3-a456-426614174000';
      const invalidDto = {
        enabled: 'not-a-boolean',
      };

      await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}`)
        .send(invalidDto)
        .expect(400);

      expect(mockFlagsService.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/flags/:id', () => {
    it('should delete a flag and return 204', async () => {
      const flagId = '123e4567-e89b-12d3-a456-426614174000';

      mockFlagsService.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/api/flags/${flagId}`)
        .expect(204);

      expect(mockFlagsService.remove).toHaveBeenCalledWith(flagId);
    });

    it('should return 404 when deleting non-existent flag', async () => {
      const flagId = '123e4567-e89b-12d3-a456-426614174000';
      const { NotFoundException } = require('@nestjs/common');

      mockFlagsService.remove.mockRejectedValue(
        new NotFoundException(`Flag with ID '${flagId}' not found`),
      );

      await request(app.getHttpServer())
        .delete(`/api/flags/${flagId}`)
        .expect(404);

      expect(mockFlagsService.remove).toHaveBeenCalledWith(flagId);
    });
  });

  describe('PATCH /api/flags/:id/environments/:env', () => {
    it('should toggle flag for environment', async () => {
      const flagId = '123e4567-e89b-12d3-a456-426614174000';
      const environment = Environment.DEVELOPMENT;
      const toggleDto = {
        enabled: true,
        rolloutPercentage: 75,
      };

      const updatedFlagEnv = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        flagId: flagId,
        environment: environment,
        enabled: true,
        rolloutPercentage: 75,
        targetingRules: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFlagsService.toggleEnvironment.mockResolvedValue(updatedFlagEnv);

      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${environment}`)
        .send(toggleDto)
        .expect(200);

      expect(response.body.enabled).toBe(true);
      expect(response.body.rolloutPercentage).toBe(75);
      expect(response.body.environment).toBe(environment);
      expect(mockFlagsService.toggleEnvironment).toHaveBeenCalledWith(
        flagId,
        environment,
        toggleDto,
      );
    });

    it('should toggle flag without rollout percentage', async () => {
      const flagId = '123e4567-e89b-12d3-a456-426614174000';
      const environment = Environment.PRODUCTION;
      const toggleDto = {
        enabled: false,
      };

      const updatedFlagEnv = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        flagId: flagId,
        environment: environment,
        enabled: false,
        rolloutPercentage: null,
        targetingRules: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFlagsService.toggleEnvironment.mockResolvedValue(updatedFlagEnv);

      const response = await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${environment}`)
        .send(toggleDto)
        .expect(200);

      expect(response.body.enabled).toBe(false);
      expect(mockFlagsService.toggleEnvironment).toHaveBeenCalledWith(
        flagId,
        environment,
        toggleDto,
      );
    });

    it('should return 404 when flag not found', async () => {
      const flagId = '123e4567-e89b-12d3-a456-426614174000';
      const environment = Environment.STAGING;
      const toggleDto = { enabled: true };
      const { NotFoundException } = require('@nestjs/common');

      mockFlagsService.toggleEnvironment.mockRejectedValue(
        new NotFoundException(`Flag with ID '${flagId}' not found`),
      );

      await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${environment}`)
        .send(toggleDto)
        .expect(404);

      expect(mockFlagsService.toggleEnvironment).toHaveBeenCalledWith(
        flagId,
        environment,
        toggleDto,
      );
    });

    it('should return 404 when environment not found for flag', async () => {
      const flagId = '123e4567-e89b-12d3-a456-426614174000';
      const environment = Environment.PRODUCTION;
      const toggleDto = { enabled: true };
      const { NotFoundException } = require('@nestjs/common');

      mockFlagsService.toggleEnvironment.mockRejectedValue(
        new NotFoundException(
          `Environment '${environment}' not found for flag with ID '${flagId}'`,
        ),
      );

      await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${environment}`)
        .send(toggleDto)
        .expect(404);
    });

    it('should return 400 for invalid rollout percentage', async () => {
      const flagId = '123e4567-e89b-12d3-a456-426614174000';
      const environment = Environment.DEVELOPMENT;
      const invalidDto = {
        enabled: true,
        rolloutPercentage: 150, // Invalid: > 100
      };

      await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${environment}`)
        .send(invalidDto)
        .expect(400);

      expect(mockFlagsService.toggleEnvironment).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid environment', async () => {
      const flagId = '123e4567-e89b-12d3-a456-426614174000';
      const invalidEnv = 'invalid_environment';
      const toggleDto = { enabled: true };

      await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${invalidEnv}`)
        .send(toggleDto)
        .expect(400);

      expect(mockFlagsService.toggleEnvironment).not.toHaveBeenCalled();
    });

    it('should return 400 for missing enabled field', async () => {
      const flagId = '123e4567-e89b-12d3-a456-426614174000';
      const environment = Environment.DEVELOPMENT;
      const invalidDto = {
        rolloutPercentage: 50,
      };

      await request(app.getHttpServer())
        .patch(`/api/flags/${flagId}/environments/${environment}`)
        .send(invalidDto)
        .expect(400);

      expect(mockFlagsService.toggleEnvironment).not.toHaveBeenCalled();
    });
  });
});
