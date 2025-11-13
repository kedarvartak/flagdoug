import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, Min, Max, IsOptional } from 'class-validator';

export class ToggleFlagDto {
  @ApiProperty({
    description: 'Whether the flag is enabled in the specified environment',
    example: true,
  })
  @IsBoolean()
  enabled!: boolean;

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
}
