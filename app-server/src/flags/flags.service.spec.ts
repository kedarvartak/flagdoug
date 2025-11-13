import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlagsService } from './flags.service';
import { Flag, FlagType } from './entities/flag.entity';
import { FlagEnvironment, Environment } from './entities/flag-environment.entity';
import { CreateFlagDto } from './dto/create-flag.dto';
import { UpdateFlagDto } from './dto/update-flag.dto';
import { ToggleFlagDto } from './dto/toggle-flag.dto';

describe('FlagsService', () => {
  let service: FlagsService;
  let flagsRepository: jest.Mocked<Repository<Flag>>;
  let flagEnvRepository: jest.Mocked<Repository<FlagEnvironment>>;

  const mockFlagsRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    softDelete: jest.fn(),
    count: jest.fn(),
  };

  const mockFlagEnvRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FlagsService,
        {
          provide: getRepositoryToken(Flag),
          useValue: mockFlagsRepository,
        },
        {
          provide: getRepositoryToken(FlagEnvironment),
          useValue: mockFlagEnvRepository,
        },
      ],
    }).compile();

    service = module.get<FlagsService>(FlagsService);
    flagsRepository = module.get(getRepositoryToken(Flag));
    flagEnvRepository = module.get(getRepositoryToken(FlagEnvironment));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createFlagDto: CreateFlagDto = {
      key: 'test_flag',
      name: 'Test Flag',
      description: 'A test flag',
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

    it('should create a new flag successfully', async () => {
      const expectedFlag = {
        id: '123',
        ...createFlagDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsRepository.findOne.mockResolvedValue(null);
      flagsRepository.create.mockReturnValue(expectedFlag as any);
      flagsRepository.save.mockResolvedValue(expectedFlag as any);

      const result = await service.create(createFlagDto);

      expect(flagsRepository.findOne).toHaveBeenCalledWith({
        where: { key: createFlagDto.key },
      });
      expect(flagsRepository.create).toHaveBeenCalledWith({
        key: createFlagDto.key,
        name: createFlagDto.name,
        description: createFlagDto.description,
        type: createFlagDto.type,
        enabled: createFlagDto.enabled,
        environments: expect.arrayContaining([
          expect.objectContaining({
            environment: Environment.DEVELOPMENT,
            enabled: true,
            rolloutPercentage: 100,
          }),
          expect.objectContaining({
            environment: Environment.PRODUCTION,
            enabled: false,
            rolloutPercentage: 0,
          }),
        ]),
      });
      expect(flagsRepository.save).toHaveBeenCalledWith(expectedFlag);
      expect(result).toEqual(expectedFlag);
    });

    it('should throw ConflictException when flag key already exists', async () => {
      const existingFlag = {
        id: '456',
        key: 'test_flag',
        name: 'Existing Flag',
      };

      flagsRepository.findOne.mockResolvedValue(existingFlag as any);

      await expect(service.create(createFlagDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createFlagDto)).rejects.toThrow(
        "Flag with key 'test_flag' already exists",
      );

      expect(flagsRepository.findOne).toHaveBeenCalledWith({
        where: { key: createFlagDto.key },
      });
      expect(flagsRepository.create).not.toHaveBeenCalled();
      expect(flagsRepository.save).not.toHaveBeenCalled();
    });

    it('should default enabled to false when not provided', async () => {
      const dtoWithoutEnabled = {
        ...createFlagDto,
        enabled: undefined,
      };

      const expectedFlag = {
        id: '789',
        ...dtoWithoutEnabled,
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      flagsRepository.findOne.mockResolvedValue(null);
      flagsRepository.create.mockReturnValue(expectedFlag as any);
      flagsRepository.save.mockResolvedValue(expectedFlag as any);

      await service.create(dtoWithoutEnabled);

      expect(flagsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        }),
      );
    });

    it('should default environment enabled to false when not provided', async () => {
      const dtoWithoutEnvEnabled = {
        ...createFlagDto,
        environments: [
          {
            environment: Environment.DEVELOPMENT,
            rolloutPercentage: 50,
          },
        ],
      };

      flagsRepository.findOne.mockResolvedValue(null);
      flagsRepository.create.mockReturnValue({} as any);
      flagsRepository.save.mockResolvedValue({} as any);

      await service.create(dtoWithoutEnvEnabled as any);

      expect(flagsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          environments: expect.arrayContaining([
            expect.objectContaining({
              enabled: false,
            }),
          ]),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all flags with environments', async () => {
      const mockFlags = [
        {
          id: '1',
          key: 'flag_1',
          name: 'Flag 1',
          environments: [
            { environment: Environment.DEVELOPMENT, enabled: true },
          ],
        },
        {
          id: '2',
          key: 'flag_2',
          name: 'Flag 2',
          environments: [
            { environment: Environment.PRODUCTION, enabled: false },
          ],
        },
      ];

      flagsRepository.find.mockResolvedValue(mockFlags as any);

      const result = await service.findAll();

      expect(flagsRepository.find).toHaveBeenCalledWith({
        relations: ['environments'],
      });
      expect(result).toEqual(mockFlags);
    });

    it('should return empty array when no flags exist', async () => {
      flagsRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findAllPaginated', () => {
    const mockFlags = [
      {
        id: '1',
        key: 'flag_1',
        name: 'Flag 1',
        createdAt: new Date('2024-01-01'),
        environments: [{ environment: Environment.DEVELOPMENT, enabled: true }],
      },
      {
        id: '2',
        key: 'flag_2',
        name: 'Flag 2',
        createdAt: new Date('2024-01-02'),
        environments: [{ environment: Environment.PRODUCTION, enabled: false }],
      },
    ];

    it('should return paginated flags with default pagination', async () => {
      flagsRepository.count.mockResolvedValue(25);
      flagsRepository.find.mockResolvedValue(mockFlags as any);

      const result = await service.findAllPaginated({ page: 1, limit: 10 });

      expect(flagsRepository.count).toHaveBeenCalled();
      expect(flagsRepository.find).toHaveBeenCalledWith({
        relations: ['environments'],
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result.data).toEqual(mockFlags);
      expect(result.meta).toEqual({
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should return second page of results', async () => {
      flagsRepository.count.mockResolvedValue(25);
      flagsRepository.find.mockResolvedValue(mockFlags as any);

      const result = await service.findAllPaginated({ page: 2, limit: 10 });

      expect(flagsRepository.find).toHaveBeenCalledWith({
        relations: ['environments'],
        skip: 10,
        take: 10,
        order: { createdAt: 'DESC' },
      });
      expect(result.meta).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('should return last page with correct metadata', async () => {
      flagsRepository.count.mockResolvedValue(25);
      flagsRepository.find.mockResolvedValue(mockFlags as any);

      const result = await service.findAllPaginated({ page: 3, limit: 10 });

      expect(result.meta).toEqual({
        total: 25,
        page: 3,
        limit: 10,
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('should handle custom page size', async () => {
      flagsRepository.count.mockResolvedValue(100);
      flagsRepository.find.mockResolvedValue(mockFlags as any);

      const result = await service.findAllPaginated({ page: 1, limit: 25 });

      expect(flagsRepository.find).toHaveBeenCalledWith({
        relations: ['environments'],
        skip: 0,
        take: 25,
        order: { createdAt: 'DESC' },
      });
      expect(result.meta.limit).toBe(25);
      expect(result.meta.totalPages).toBe(4);
    });

    it('should return empty data when no flags exist', async () => {
      flagsRepository.count.mockResolvedValue(0);
      flagsRepository.find.mockResolvedValue([]);

      const result = await service.findAllPaginated({ page: 1, limit: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('should calculate correct skip value for different pages', async () => {
      flagsRepository.count.mockResolvedValue(100);
      flagsRepository.find.mockResolvedValue(mockFlags as any);

      await service.findAllPaginated({ page: 5, limit: 20 });

      expect(flagsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 80, // (5-1) * 20
          take: 20,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a flag by id with environments', async () => {
      const mockFlag = {
        id: '123',
        key: 'test_flag',
        name: 'Test Flag',
        environments: [
          { environment: Environment.DEVELOPMENT, enabled: true },
        ],
      };

      flagsRepository.findOne.mockResolvedValue(mockFlag as any);

      const result = await service.findOne('123');

      expect(flagsRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
        relations: ['environments'],
      });
      expect(result).toEqual(mockFlag);
    });

    it('should throw NotFoundException when flag does not exist', async () => {
      flagsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'Flag with ID nonexistent not found',
      );
    });
  });

  describe('findByKey', () => {
    it('should return a flag by key with environments', async () => {
      const mockFlag = {
        id: '123',
        key: 'test_flag',
        name: 'Test Flag',
        environments: [
          { environment: Environment.DEVELOPMENT, enabled: true },
        ],
      };

      flagsRepository.findOne.mockResolvedValue(mockFlag as any);

      const result = await service.findByKey('test_flag');

      expect(flagsRepository.findOne).toHaveBeenCalledWith({
        where: { key: 'test_flag' },
        relations: ['environments'],
      });
      expect(result).toEqual(mockFlag);
    });

    it('should return null when flag does not exist', async () => {
      flagsRepository.findOne.mockResolvedValue(null);

      const result = await service.findByKey('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const mockFlag = {
      id: '123',
      key: 'test_flag',
      name: 'Test Flag',
      description: 'Original description',
      enabled: false,
      environments: [],
    };

    it('should update flag name', async () => {
      const updateDto: UpdateFlagDto = { name: 'Updated Name' };
      const updatedFlag = { ...mockFlag, name: 'Updated Name' };

      flagsRepository.findOne.mockResolvedValue(mockFlag as any);
      flagsRepository.save.mockResolvedValue(updatedFlag as any);

      const result = await service.update('123', updateDto);

      expect(result.name).toBe('Updated Name');
      expect(flagsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated Name' }),
      );
    });

    it('should update flag description', async () => {
      const updateDto: UpdateFlagDto = { description: 'New description' };
      const updatedFlag = { ...mockFlag, description: 'New description' };

      flagsRepository.findOne.mockResolvedValue(mockFlag as any);
      flagsRepository.save.mockResolvedValue(updatedFlag as any);

      const result = await service.update('123', updateDto);

      expect(result.description).toBe('New description');
    });

    it('should update flag enabled state', async () => {
      const updateDto: UpdateFlagDto = { enabled: true };
      const updatedFlag = { ...mockFlag, enabled: true };

      flagsRepository.findOne.mockResolvedValue(mockFlag as any);
      flagsRepository.save.mockResolvedValue(updatedFlag as any);

      const result = await service.update('123', updateDto);

      expect(result.enabled).toBe(true);
    });

    it('should update multiple fields at once', async () => {
      const updateDto: UpdateFlagDto = {
        name: 'New Name',
        description: 'New description',
        enabled: true,
      };
      const updatedFlag = {
        ...mockFlag,
        name: 'New Name',
        description: 'New description',
        enabled: true,
      };

      flagsRepository.findOne.mockResolvedValue(mockFlag as any);
      flagsRepository.save.mockResolvedValue(updatedFlag as any);

      const result = await service.update('123', updateDto);

      expect(result.name).toBe('New Name');
      expect(result.description).toBe('New description');
      expect(result.enabled).toBe(true);
    });

    it('should throw NotFoundException when flag does not exist', async () => {
      flagsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not modify fields that are not provided', async () => {
      const updateDto: UpdateFlagDto = { name: 'New Name' };
      const originalFlag = {
        id: '999',
        key: 'another_flag',
        name: 'Original Name',
        description: 'Original description',
        enabled: false,
        environments: [],
      };

      flagsRepository.findOne.mockResolvedValue(originalFlag as any);
      flagsRepository.save.mockImplementation((flag) => Promise.resolve(flag));

      await service.update('999', updateDto);

      expect(flagsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Name',
          description: 'Original description',
          enabled: false,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a flag', async () => {
      const mockFlag = {
        id: '123',
        key: 'test_flag',
        name: 'Test Flag',
      };

      flagsRepository.findOne.mockResolvedValue(mockFlag as any);
      flagsRepository.softDelete.mockResolvedValue({ affected: 1 } as any);

      await service.remove('123');

      expect(flagsRepository.findOne).toHaveBeenCalledWith({
        where: { id: '123' },
        relations: ['environments'],
      });
      expect(flagsRepository.softDelete).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundException when flag does not exist', async () => {
      flagsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      expect(flagsRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('toggleEnvironment', () => {
    const mockFlagWithEnvs = {
      id: '123',
      key: 'test_flag',
      name: 'Test Flag',
      environments: [
        {
          id: 'env1',
          environment: Environment.DEVELOPMENT,
          enabled: false,
          rolloutPercentage: 0,
        },
        {
          id: 'env2',
          environment: Environment.PRODUCTION,
          enabled: false,
          rolloutPercentage: 0,
        },
      ],
    };

    it('should toggle environment enabled state', async () => {
      const toggleDto: ToggleFlagDto = { enabled: true };
      const updatedEnv = {
        ...mockFlagWithEnvs.environments[0],
        enabled: true,
      };

      flagsRepository.findOne.mockResolvedValue(mockFlagWithEnvs as any);
      flagEnvRepository.save.mockResolvedValue(updatedEnv as any);

      const result = await service.toggleEnvironment(
        '123',
        Environment.DEVELOPMENT,
        toggleDto,
      );

      expect(result.enabled).toBe(true);
      expect(flagEnvRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: true,
          environment: Environment.DEVELOPMENT,
        }),
      );
    });

    it('should update rollout percentage when provided', async () => {
      const toggleDto: ToggleFlagDto = {
        enabled: true,
        rolloutPercentage: 50,
      };
      const updatedEnv = {
        ...mockFlagWithEnvs.environments[0],
        enabled: true,
        rolloutPercentage: 50,
      };

      flagsRepository.findOne.mockResolvedValue(mockFlagWithEnvs as any);
      flagEnvRepository.save.mockResolvedValue(updatedEnv as any);

      const result = await service.toggleEnvironment(
        '123',
        Environment.DEVELOPMENT,
        toggleDto,
      );

      expect(result.rolloutPercentage).toBe(50);
      expect(flagEnvRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          rolloutPercentage: 50,
        }),
      );
    });

    it('should not update rollout percentage when not provided', async () => {
      const toggleDto: ToggleFlagDto = { enabled: true };
      const mockFlag = {
        ...mockFlagWithEnvs,
        environments: [
          {
            id: 'env1',
            environment: Environment.DEVELOPMENT,
            enabled: false,
            rolloutPercentage: 25,
          },
        ],
      };

      flagsRepository.findOne.mockResolvedValue(mockFlag as any);
      flagEnvRepository.save.mockImplementation((env) => Promise.resolve(env));

      await service.toggleEnvironment(
        '123',
        Environment.DEVELOPMENT,
        toggleDto,
      );

      expect(flagEnvRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          rolloutPercentage: 25,
        }),
      );
    });

    it('should throw NotFoundException when flag does not exist', async () => {
      flagsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.toggleEnvironment('nonexistent', Environment.DEVELOPMENT, {
          enabled: true,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when environment does not exist for flag', async () => {
      const mockFlag = {
        ...mockFlagWithEnvs,
        environments: [
          {
            id: 'env1',
            environment: Environment.DEVELOPMENT,
            enabled: false,
          },
        ],
      };

      flagsRepository.findOne.mockResolvedValue(mockFlag as any);

      await expect(
        service.toggleEnvironment('123', Environment.PRODUCTION, {
          enabled: true,
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.toggleEnvironment('123', Environment.PRODUCTION, {
          enabled: true,
        }),
      ).rejects.toThrow(
        "Environment 'production' not found for flag with ID '123'",
      );
    });

    it('should handle different environments independently', async () => {
      const toggleDto: ToggleFlagDto = { enabled: true };
      const updatedEnv = {
        ...mockFlagWithEnvs.environments[1],
        enabled: true,
      };

      flagsRepository.findOne.mockResolvedValue(mockFlagWithEnvs as any);
      flagEnvRepository.save.mockResolvedValue(updatedEnv as any);

      const result = await service.toggleEnvironment(
        '123',
        Environment.PRODUCTION,
        toggleDto,
      );

      expect(result.environment).toBe(Environment.PRODUCTION);
      expect(flagEnvRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: Environment.PRODUCTION,
        }),
      );
    });
  });
});
