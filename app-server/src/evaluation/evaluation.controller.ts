import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EvaluationService } from './evaluation.service';
import { Environment } from '../flags/entities/flag-environment.entity';
import { EvaluationResult } from './interfaces/evaluation.interface';

@Controller('api/evaluate')
@ApiTags('evaluation')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Get(':key')
  @ApiOperation({ 
    summary: 'Evaluate flag',
    description: 'Evaluates a feature flag for a given environment and optional user context. Returns whether the flag is enabled based on environment configuration, targeting rules, and rollout percentage.'
  })
  @ApiParam({
    name: 'key',
    description: 'The unique key of the feature flag to evaluate',
    example: 'new_checkout_flow'
  })
  @ApiQuery({
    name: 'environment',
    enum: Environment,
    description: 'The environment to evaluate the flag in',
    required: true,
    example: Environment.PRODUCTION
  })
  @ApiQuery({
    name: 'userId',
    description: 'Optional user ID for consistent rollout calculation',
    required: false,
    example: 'user_12345'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Flag evaluation result',
    schema: {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          description: 'Whether the flag is enabled for this evaluation',
          example: true
        },
        key: {
          type: 'string',
          description: 'The flag key that was evaluated',
          example: 'new_checkout_flow'
        },
        variant: {
          type: 'string',
          description: 'Optional variant value for multivariate flags',
          example: 'variant_a',
          nullable: true
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid environment parameter'
  })
  async evaluate(
    @Param('key') key: string,
    @Query('environment') environment: string,
    @Query('userId') userId?: string,
  ): Promise<EvaluationResult> {
    console.log(`\n🔍 [EVAL] ========== Evaluation Request ==========`);
    console.log(`🔍 [EVAL] Flag Key: ${key}`);
    console.log(`🔍 [EVAL] Environment: ${environment}`);
    console.log(`🔍 [EVAL] User ID: ${userId || 'none'}`);
    
    // Validate environment parameter
    if (!Object.values(Environment).includes(environment as Environment)) {
      console.error(`❌ [EVAL] Invalid environment: ${environment}`);
      throw new BadRequestException(
        `Invalid environment. Must be one of: ${Object.values(Environment).join(', ')}`
      );
    }

    const context = userId ? { userId } : undefined;

    const result = await this.evaluationService.evaluate(
      key,
      environment as Environment,
      context,
    );
    
    console.log(`✅ [EVAL] Evaluation Result:`, result);
    console.log(`✅ [EVAL] Flag ${key} is ${result.enabled ? 'ENABLED' : 'DISABLED'} for ${environment}`);
    console.log(`🔍 [EVAL] ========================================\n`);
    
    return result;
  }
}
