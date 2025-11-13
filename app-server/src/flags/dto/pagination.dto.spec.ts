import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PaginationDto } from './pagination.dto';

describe('PaginationDto', () => {
  it('should use default values when not provided', () => {
    const dto = plainToInstance(PaginationDto, {});
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });

  it('should accept valid page and limit', async () => {
    const dto = plainToInstance(PaginationDto, {
      page: 2,
      limit: 20,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(20);
  });

  it('should reject page less than 1', async () => {
    const dto = plainToInstance(PaginationDto, {
      page: 0,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
  });

  it('should reject negative page', async () => {
    const dto = plainToInstance(PaginationDto, {
      page: -1,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
  });

  it('should reject limit less than 1', async () => {
    const dto = plainToInstance(PaginationDto, {
      limit: 0,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });

  it('should reject limit greater than 100', async () => {
    const dto = plainToInstance(PaginationDto, {
      limit: 101,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });

  it('should accept limit of 100', async () => {
    const dto = plainToInstance(PaginationDto, {
      limit: 100,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.limit).toBe(100);
  });

  it('should transform string values to numbers', () => {
    const dto = plainToInstance(PaginationDto, {
      page: '3',
      limit: '25',
    });

    expect(typeof dto.page).toBe('number');
    expect(typeof dto.limit).toBe('number');
    expect(dto.page).toBe(3);
    expect(dto.limit).toBe(25);
  });
});
