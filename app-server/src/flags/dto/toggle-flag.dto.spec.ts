import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ToggleFlagDto } from './toggle-flag.dto';

describe('ToggleFlagDto', () => {
  it('should validate a valid toggle DTO', async () => {
    const dto = plainToInstance(ToggleFlagDto, {
      enabled: true,
      rolloutPercentage: 50,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate without rolloutPercentage', async () => {
    const dto = plainToInstance(ToggleFlagDto, {
      enabled: false,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation for rolloutPercentage below 0', async () => {
    const dto = plainToInstance(ToggleFlagDto, {
      enabled: true,
      rolloutPercentage: -1,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('rolloutPercentage');
  });

  it('should fail validation for rolloutPercentage above 100', async () => {
    const dto = plainToInstance(ToggleFlagDto, {
      enabled: true,
      rolloutPercentage: 101,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('rolloutPercentage');
  });

  it('should fail validation for missing enabled field', async () => {
    const dto = plainToInstance(ToggleFlagDto, {
      rolloutPercentage: 50,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('enabled');
  });

  it('should fail validation for non-integer rolloutPercentage', async () => {
    const dto = plainToInstance(ToggleFlagDto, {
      enabled: true,
      rolloutPercentage: 50.5,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
