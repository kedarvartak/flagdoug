import { FlagNotFoundException } from './flag-not-found.exception';
import { HttpStatus } from '@nestjs/common';

describe('FlagNotFoundException', () => {
  it('should create exception with correct message', () => {
    const flagId = '123e4567-e89b-12d3-a456-426614174000';
    const exception = new FlagNotFoundException(flagId);

    expect(exception.message).toBe(`Flag with ID ${flagId} not found`);
    expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
  });

  it('should be instance of NotFoundException', () => {
    const exception = new FlagNotFoundException('test-id');

    expect(exception.name).toBe('FlagNotFoundException');
  });
});
