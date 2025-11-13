import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Environment, TargetingRule } from '../entities/flag-environment.entity';

export class CreateFlagEnvironmentDto {
  @ApiProperty({
    description: 'The environment for this flag configuration',
    enum: Environment,
    example: Environment.DEVELOPMENT,
  })
  @IsEnum(Environment)
  environment!: Environment;

  @ApiProperty({
    description: 'Whether the flag is enabled in this environment',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({
    description: 'Percentage rollout (0-100) for gradual feature releases',
    example: 50,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  rolloutPercentage?: number;

  @ApiProperty({
    description: 'Targeting rules for conditional flag evaluation',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        attribute: { type: 'string', example: 'userId' },
        operator: {
          type: 'string',
          enum: ['equals', 'contains', 'in', 'greaterThan', 'lessThan'],
          example: 'equals',
        },
        value: { example: 'user123' },
      },
    },
    required: false,
  })
  @IsArray()
  @IsOptional()
  targetingRules?: TargetingRule[];
}
