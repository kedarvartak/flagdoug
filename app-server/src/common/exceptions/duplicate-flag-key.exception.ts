import { ConflictException } from '@nestjs/common';

export class DuplicateFlagKeyException extends ConflictException {
  constructor(key: string) {
    super(`Flag with key '${key}' already exists`);
  }
}
