import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsOptional,
  Matches,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FlagType } from '../entities/flag.entity';
import { CreateFlagEnvironmentDto } from './create-flag-environment.dto';

export class CreateFlagDto {
  @ApiProperty({
    description:
      'Unique key for the flag (lowercase letters, numbers, and underscores only)',
    example: 'new_feature_toggle',
    pattern: '^[a-z0-9_]+$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_]+$/, {
    message:
      'Flag key must contain only lowercase letters, numbers, and underscores',
  })
  key!: string;

  @ApiProperty({
    description: 'Human-readable name for the flag',
    example: 'New Feature Toggle',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Detailed description of what this flag controls',
    example: 'Enables the new dashboard feature for users',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Type of flag',
    enum: FlagType,
    example: FlagType.BOOLEAN,
    default: FlagType.BOOLEAN,
  })
  @IsEnum(FlagType)
  type!: FlagType;

  @ApiProperty({
    description: 'Global enabled state for the flag',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({
    description: 'Environment-specific configurations for this flag',
    type: [CreateFlagEnvironmentDto],
    example: [
      {
        environment: 'development',
        enabled: true,
        rolloutPercentage: 100,
      },
      {
        environment: 'production',
        enabled: false,
        rolloutPercentage: 0,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFlagEnvironmentDto)
  environments!: CreateFlagEnvironmentDto[];
}
