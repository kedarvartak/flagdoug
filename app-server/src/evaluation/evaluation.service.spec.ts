import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationService } from './evaluation.service';
import { FlagsService } from '../flags/flags.service';
import { Environment } from '../flags/entities/flag-environment.entity';
import { FlagType } from '../flags/entities/flag.entity';

describe('EvaluationService', () => {
  let service: EvaluationService;
  let flagsService: jest.Mocked<FlagsService>;

  beforeEach(async () => {
    const mockFlagsService = {
      findByKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationService,
        {
          provide: FlagsService,
          useValue: mockFlagsService,
        },
      ],
    }).compile();

    service = module.get<EvaluationService>(EvaluationService);
    flagsService = module.get(FlagsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluate - non-existent flags', () => {
    it('should return disabled state for non-existent flag', async () => {
      flagsService.findByKey.mockResolvedValue(null);

      const result = await service.evaluate(
        'non_existent_flag',
        Environment.PRODUCTION,
      );

      expect(result).toEqual({
        enabled: false,
        key: 'non_existent_flag',
      });
      expect(flagsService.findByKey).toHaveBeenCalledWith('non_existent_flag');
    });
  });

  describe('evaluate - environment configuration', () => {
    it('should return disabled if environment not configured', async () => {
      const mockFlag = {
        id: '1',
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.BOOLEAN,
        enabled: true,
        environments: [
          {
            id: '1',
            flagId: '1',
            environment: Environment.DEVELOPMENT,
            enabled: true,
            rolloutPercentage: null,
            targetingRules: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsService.findByKey.mockResolvedValue(mockFlag as any);

      const result = await service.evaluate('test_flag', Environment.PRODUCTION);

      expect(result).toEqual({
        enabled: false,
        key: 'test_flag',
      });
    });

    it('should return disabled if environment is disabled', async () => {
      const mockFlag = {
        id: '1',
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.BOOLEAN,
        enabled: true,
        environments: [
          {
            id: '1',
            flagId: '1',
            environment: Environment.PRODUCTION,
            enabled: false,
            rolloutPercentage: null,
            targetingRules: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsService.findByKey.mockResolvedValue(mockFlag as any);

      const result = await service.evaluate('test_flag', Environment.PRODUCTION);

      expect(result).toEqual({
        enabled: false,
        key: 'test_flag',
      });
    });

    it('should return enabled if environment is enabled with no rollout', async () => {
      const mockFlag = {
        id: '1',
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.BOOLEAN,
        enabled: true,
        environments: [
          {
            id: '1',
            flagId: '1',
            environment: Environment.PRODUCTION,
            enabled: true,
            rolloutPercentage: null,
            targetingRules: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsService.findByKey.mockResolvedValue(mockFlag as any);

      const result = await service.evaluate('test_flag', Environment.PRODUCTION);

      expect(result).toEqual({
        enabled: true,
        key: 'test_flag',
      });
    });
  });

  describe('evaluate - rollout percentage', () => {
    it('should return consistent results for same userId', async () => {
      const mockFlag = {
        id: '1',
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.PERCENTAGE,
        enabled: true,
        environments: [
          {
            id: '1',
            flagId: '1',
            environment: Environment.PRODUCTION,
            enabled: true,
            rolloutPercentage: 50,
            targetingRules: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsService.findByKey.mockResolvedValue(mockFlag as any);

      const result1 = await service.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        { userId: 'user123' },
      );
      const result2 = await service.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        { userId: 'user123' },
      );
      const result3 = await service.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        { userId: 'user123' },
      );

      expect(result1.enabled).toBe(result2.enabled);
      expect(result2.enabled).toBe(result3.enabled);
    });

    it('should respect 0% rollout', async () => {
      const mockFlag = {
        id: '1',
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.PERCENTAGE,
        enabled: true,
        environments: [
          {
            id: '1',
            flagId: '1',
            environment: Environment.PRODUCTION,
            enabled: true,
            rolloutPercentage: 0,
            targetingRules: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsService.findByKey.mockResolvedValue(mockFlag as any);

      const result = await service.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        { userId: 'user123' },
      );

      expect(result.enabled).toBe(false);
    });

    it('should respect 100% rollout', async () => {
      const mockFlag = {
        id: '1',
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.PERCENTAGE,
        enabled: true,
        environments: [
          {
            id: '1',
            flagId: '1',
            environment: Environment.PRODUCTION,
            enabled: true,
            rolloutPercentage: 100,
            targetingRules: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsService.findByKey.mockResolvedValue(mockFlag as any);

      const result = await service.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        { userId: 'user123' },
      );

      expect(result.enabled).toBe(true);
    });

    it('should distribute users across rollout percentage', async () => {
      const mockFlag = {
        id: '1',
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.PERCENTAGE,
        enabled: true,
        environments: [
          {
            id: '1',
            flagId: '1',
            environment: Environment.PRODUCTION,
            enabled: true,
            rolloutPercentage: 50,
            targetingRules: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsService.findByKey.mockResolvedValue(mockFlag as any);

      const results = [];
      for (let i = 0; i < 100; i++) {
        const result = await service.evaluate(
          'test_flag',
          Environment.PRODUCTION,
          { userId: `user${i}` },
        );
        results.push(result.enabled);
      }

      const enabledCount = results.filter((r) => r).length;
      // Should be roughly 50%, allow 20-80% range for statistical variance
      expect(enabledCount).toBeGreaterThan(20);
      expect(enabledCount).toBeLessThan(80);
    });
  });

  describe('evaluate - targeting rules', () => {
    it('should return disabled if targeting rules do not match', async () => {
      const mockFlag = {
        id: '1',
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.BOOLEAN,
        enabled: true,
        environments: [
          {
            id: '1',
            flagId: '1',
            environment: Environment.PRODUCTION,
            enabled: true,
            rolloutPercentage: null,
            targetingRules: [
              {
                attribute: 'country',
                operator: 'equals' as const,
                value: 'US',
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsService.findByKey.mockResolvedValue(mockFlag as any);

      const result = await service.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        {
          userId: 'user123',
          attributes: { country: 'UK' },
        },
      );

      expect(result.enabled).toBe(false);
    });

    it('should return enabled if targeting rules match - equals operator', async () => {
      const mockFlag = {
        id: '1',
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.BOOLEAN,
        enabled: true,
        environments: [
          {
            id: '1',
            flagId: '1',
            environment: Environment.PRODUCTION,
            enabled: true,
            rolloutPercentage: null,
            targetingRules: [
              {
                attribute: 'country',
                operator: 'equals' as const,
                value: 'US',
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsService.findByKey.mockResolvedValue(mockFlag as any);

      const result = await service.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        {
          userId: 'user123',
          attributes: { country: 'US' },
        },
      );

      expect(result.enabled).toBe(true);
    });

    it('should evaluate contains operator correctly', async () => {
      const mockFlag = {
        id: '1',
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.BOOLEAN,
        enabled: true,
        environments: [
          {
            id: '1',
            flagId: '1',
            environment: Environment.PRODUCTION,
            enabled: true,
            rolloutPercentage: null,
            targetingRules: [
              {
                attribute: 'email',
                operator: 'contains' as const,
                value: '@example.com',
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsService.findByKey.mockResolvedValue(mockFlag as any);

      const result = await service.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        {
          userId: 'user123',
          attributes: { email: 'user@example.com' },
        },
      );

      expect(result.enabled).toBe(true);
    });

    it('should evaluate in operator correctly', async () => {
      const mockFlag = {
        id: '1',
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.BOOLEAN,
        enabled: true,
        environments: [
          {
            id: '1',
            flagId: '1',
            environment: Environment.PRODUCTION,
            enabled: true,
            rolloutPercentage: null,
            targetingRules: [
              {
                attribute: 'plan',
                operator: 'in' as const,
                value: ['premium', 'enterprise'],
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsService.findByKey.mockResolvedValue(mockFlag as any);

      const result = await service.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        {
          userId: 'user123',
          attributes: { plan: 'premium' },
        },
      );

      expect(result.enabled).toBe(true);
    });

    it('should evaluate greaterThan operator correctly', async () => {
      const mockFlag = {
        id: '1',
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.BOOLEAN,
        enabled: true,
        environments: [
          {
            id: '1',
            flagId: '1',
            environment: Environment.PRODUCTION,
            enabled: true,
            rolloutPercentage: null,
            targetingRules: [
              {
                attribute: 'age',
                operator: 'greaterThan' as const,
                value: 18,
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsService.findByKey.mockResolvedValue(mockFlag as any);

      const result = await service.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        {
          userId: 'user123',
          attributes: { age: 25 },
        },
      );

      expect(result.enabled).toBe(true);
    });

    it('should evaluate lessThan operator correctly', async () => {
      const mockFlag = {
        id: '1',
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.BOOLEAN,
        enabled: true,
        environments: [
          {
            id: '1',
            flagId: '1',
            environment: Environment.PRODUCTION,
            enabled: true,
            rolloutPercentage: null,
            targetingRules: [
              {
                attribute: 'age',
                operator: 'lessThan' as const,
                value: 65,
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsService.findByKey.mockResolvedValue(mockFlag as any);

      const result = await service.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        {
          userId: 'user123',
          attributes: { age: 30 },
        },
      );

      expect(result.enabled).toBe(true);
    });

    it('should require all targeting rules to match (AND logic)', async () => {
      const mockFlag = {
        id: '1',
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.BOOLEAN,
        enabled: true,
        environments: [
          {
            id: '1',
            flagId: '1',
            environment: Environment.PRODUCTION,
            enabled: true,
            rolloutPercentage: null,
            targetingRules: [
              {
                attribute: 'country',
                operator: 'equals' as const,
                value: 'US',
              },
              {
                attribute: 'plan',
                operator: 'equals' as const,
                value: 'premium',
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsService.findByKey.mockResolvedValue(mockFlag as any);

      // Only one rule matches
      const result1 = await service.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        {
          userId: 'user123',
          attributes: { country: 'US', plan: 'free' },
        },
      );
      expect(result1.enabled).toBe(false);

      // Both rules match
      const result2 = await service.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        {
          userId: 'user123',
          attributes: { country: 'US', plan: 'premium' },
        },
      );
      expect(result2.enabled).toBe(true);
    });

    it('should return disabled if context attributes are missing', async () => {
      const mockFlag = {
        id: '1',
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.BOOLEAN,
        enabled: true,
        environments: [
          {
            id: '1',
            flagId: '1',
            environment: Environment.PRODUCTION,
            enabled: true,
            rolloutPercentage: null,
            targetingRules: [
              {
                attribute: 'country',
                operator: 'equals' as const,
                value: 'US',
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsService.findByKey.mockResolvedValue(mockFlag as any);

      const result = await service.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        { userId: 'user123' },
      );

      expect(result.enabled).toBe(false);
    });
  });

  describe('evaluate - combined scenarios', () => {
    it('should apply rollout after targeting rules match', async () => {
      const mockFlag = {
        id: '1',
        key: 'test_flag',
        name: 'Test Flag',
        description: 'Test',
        type: FlagType.PERCENTAGE,
        enabled: true,
        environments: [
          {
            id: '1',
            flagId: '1',
            environment: Environment.PRODUCTION,
            enabled: true,
            rolloutPercentage: 100,
            targetingRules: [
              {
                attribute: 'country',
                operator: 'equals' as const,
                value: 'US',
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      flagsService.findByKey.mockResolvedValue(mockFlag as any);

      // Targeting rules match, rollout is 100%
      const result1 = await service.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        {
          userId: 'user123',
          attributes: { country: 'US' },
        },
      );
      expect(result1.enabled).toBe(true);

      // Targeting rules don't match
      const result2 = await service.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        {
          userId: 'user123',
          attributes: { country: 'UK' },
        },
      );
      expect(result2.enabled).toBe(false);
    });
  });
});
