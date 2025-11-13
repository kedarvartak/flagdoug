import { NotFoundException } from '@nestjs/common';

export class FlagNotFoundException extends NotFoundException {
  constructor(id: string) {
    super(`Flag with ID ${id} not found`);
  }
}
