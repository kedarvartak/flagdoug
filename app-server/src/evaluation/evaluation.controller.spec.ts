import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { Environment } from '../flags/entities/flag-environment.entity';
import { BadRequestException } from '@nestjs/common';

describe('EvaluationController', () => {
  let controller: EvaluationController;
  let service: jest.Mocked<EvaluationService>;

  beforeEach(async () => {
    const mockEvaluationService = {
      evaluate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluationController],
      providers: [
        {
          provide: EvaluationService,
          useValue: mockEvaluationService,
        },
      ],
    }).compile();

    controller = module.get<EvaluationController>(EvaluationController);
    service = module.get(EvaluationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('evaluate', () => {
    it('should evaluate flag with valid environment', async () => {
      const mockResult = {
        enabled: true,
        key: 'test_flag',
      };

      service.evaluate.mockResolvedValue(mockResult);

      const result = await controller.evaluate(
        'test_flag',
        Environment.PRODUCTION,
      );

      expect(result).toEqual(mockResult);
      expect(service.evaluate).toHaveBeenCalledWith(
        'test_flag',
        Environment.PRODUCTION,
        undefined,
      );
    });

    it('should evaluate flag with userId', async () => {
      const mockResult = {
        enabled: true,
        key: 'test_flag',
      };

      service.evaluate.mockResolvedValue(mockResult);

      const result = await controller.evaluate(
        'test_flag',
        Environment.PRODUCTION,
        'user123',
      );

      expect(result).toEqual(mockResult);
      expect(service.evaluate).toHaveBeenCalledWith(
        'test_flag',
        Environment.PRODUCTION,
        { userId: 'user123' },
      );
    });

    it('should throw BadRequestException for invalid environment', async () => {
      await expect(
        controller.evaluate('test_flag', 'invalid_env'),
      ).rejects.toThrow(BadRequestException);

      expect(service.evaluate).not.toHaveBeenCalled();
    });

    it('should accept all valid environment values', async () => {
      const mockResult = {
        enabled: true,
        key: 'test_flag',
      };

      service.evaluate.mockResolvedValue(mockResult);

      // Test development
      await controller.evaluate('test_flag', Environment.DEVELOPMENT);
      expect(service.evaluate).toHaveBeenCalledWith(
        'test_flag',
        Environment.DEVELOPMENT,
        undefined,
      );

      // Test staging
      await controller.evaluate('test_flag', Environment.STAGING);
      expect(service.evaluate).toHaveBeenCalledWith(
        'test_flag',
        Environment.STAGING,
        undefined,
      );

      // Test production
      await controller.evaluate('test_flag', Environment.PRODUCTION);
      expect(service.evaluate).toHaveBeenCalledWith(
        'test_flag',
        Environment.PRODUCTION,
        undefined,
      );
    });

    it('should return disabled for non-existent flag', async () => {
      const mockResult = {
        enabled: false,
        key: 'non_existent',
      };

      service.evaluate.mockResolvedValue(mockResult);

      const result = await controller.evaluate(
        'non_existent',
        Environment.PRODUCTION,
      );

      expect(result).toEqual(mockResult);
      expect(result.enabled).toBe(false);
    });
  });

  describe('performance', () => {
    it('should respond quickly for evaluation requests', async () => {
      const mockResult = {
        enabled: true,
        key: 'test_flag',
      };

      service.evaluate.mockResolvedValue(mockResult);

      const startTime = Date.now();
      await controller.evaluate('test_flag', Environment.PRODUCTION, 'user123');
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      
      // Should respond in under 50ms (requirement 5.5)
      // In unit tests this should be nearly instant
      expect(responseTime).toBeLessThan(50);
    });

    it('should handle multiple concurrent evaluations', async () => {
      const mockResult = {
        enabled: true,
        key: 'test_flag',
      };

      service.evaluate.mockResolvedValue(mockResult);

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          controller.evaluate('test_flag', Environment.PRODUCTION, `user${i}`),
        );
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(service.evaluate).toHaveBeenCalledTimes(10);
    });
  });
});
