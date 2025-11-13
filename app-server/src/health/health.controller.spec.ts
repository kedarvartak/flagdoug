import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let typeOrmHealthIndicator: TypeOrmHealthIndicator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn(),
          },
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: {
            pingCheck: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    typeOrmHealthIndicator = module.get<TypeOrmHealthIndicator>(
      TypeOrmHealthIndicator,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return healthy status when database is up', async () => {
      const mockHealthResult = {
        status: 'ok',
        info: {
          database: {
            status: 'up',
          },
        },
        error: {},
        details: {
          database: {
            status: 'up',
          },
        },
      };

      jest.spyOn(healthCheckService, 'check').mockResolvedValue(mockHealthResult as any);

      const result = await controller.check();

      expect(result).toEqual(mockHealthResult);
      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
      ]);
    });

    it('should return unhealthy status when database is down', async () => {
      const mockHealthResult = {
        status: 'error',
        info: {},
        error: {
          database: {
            status: 'down',
            message: 'Connection failed',
          },
        },
        details: {
          database: {
            status: 'down',
            message: 'Connection failed',
          },
        },
      };

      jest.spyOn(healthCheckService, 'check').mockResolvedValue(mockHealthResult as any);

      const result = await controller.check();

      expect(result).toEqual(mockHealthResult);
      expect(result.status).toBe('error');
    });

    it('should use database ping check with 1 second timeout', async () => {
      const mockHealthResult = {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      };

      let capturedHealthCheckFn: any;
      jest.spyOn(healthCheckService, 'check').mockImplementation(async (checks) => {
        capturedHealthCheckFn = checks[0];
        return mockHealthResult as any;
      });

      jest.spyOn(typeOrmHealthIndicator, 'pingCheck').mockResolvedValue({
        database: { status: 'up' },
      } as any);

      await controller.check();

      // Execute the captured health check function
      if (capturedHealthCheckFn) {
        await capturedHealthCheckFn();
        expect(typeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith('database', {
          timeout: 1000,
        });
      }
    });
  });
});
