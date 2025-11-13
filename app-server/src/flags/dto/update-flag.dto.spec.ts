import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateFlagDto } from './update-flag.dto';

describe('UpdateFlagDto', () => {
  it('should validate a valid update DTO with all fields', async () => {
    const dto = plainToInstance(UpdateFlagDto, {
      name: 'Updated Flag Name',
      description: 'Updated description',
      enabled: true,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a partial update DTO', async () => {
    const dto = plainToInstance(UpdateFlagDto, {
      name: 'Updated Flag Name',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate an empty update DTO', async () => {
    const dto = plainToInstance(UpdateFlagDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation for invalid field types', async () => {
    const dto = plainToInstance(UpdateFlagDto, {
      name: 123,
      enabled: 'not a boolean',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
