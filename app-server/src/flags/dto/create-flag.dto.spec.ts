import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateFlagDto } from './create-flag.dto';
import { FlagType } from '../entities/flag.entity';
import { Environment } from '../entities/flag-environment.entity';

describe('CreateFlagDto', () => {
  it('should validate a valid flag DTO', async () => {
    const dto = plainToInstance(CreateFlagDto, {
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
      ],
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation for invalid flag key format', async () => {
    const dto = plainToInstance(CreateFlagDto, {
      key: 'Test-Flag!',
      name: 'Test Flag',
      type: FlagType.BOOLEAN,
      environments: [],
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('key');
  });

  it('should fail validation for missing required fields', async () => {
    const dto = plainToInstance(CreateFlagDto, {
      key: 'test_flag',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should allow optional description field', async () => {
    const dto = plainToInstance(CreateFlagDto, {
      key: 'test_flag',
      name: 'Test Flag',
      type: FlagType.BOOLEAN,
      environments: [],
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate nested environment DTOs', async () => {
    const dto = plainToInstance(CreateFlagDto, {
      key: 'test_flag',
      name: 'Test Flag',
      type: FlagType.BOOLEAN,
      environments: [
        {
          environment: 'invalid_env',
          enabled: true,
        },
      ],
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
