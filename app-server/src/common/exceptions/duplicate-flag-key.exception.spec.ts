import { DuplicateFlagKeyException } from './duplicate-flag-key.exception';
import { HttpStatus } from '@nestjs/common';

describe('DuplicateFlagKeyException', () => {
  it('should create exception with correct message', () => {
    const flagKey = 'test_feature_flag';
    const exception = new DuplicateFlagKeyException(flagKey);

    expect(exception.message).toBe(`Flag with key '${flagKey}' already exists`);
    expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
  });

  it('should be instance of ConflictException', () => {
    const exception = new DuplicateFlagKeyException('test_key');

    expect(exception.name).toBe('DuplicateFlagKeyException');
  });
});
