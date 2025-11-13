import { Injectable } from '@nestjs/common';
import { FlagsService } from '../flags/flags.service';
import { Environment, TargetingRule } from '../flags/entities/flag-environment.entity';
import { EvaluationContext, EvaluationResult } from './interfaces/evaluation.interface';
import * as crypto from 'crypto';

@Injectable()
export class EvaluationService {
  constructor(private readonly flagsService: FlagsService) {}

  async evaluate(
    key: string,
    environment: Environment,
    context?: EvaluationContext,
  ): Promise<EvaluationResult> {
    console.log(`🔎 [SERVICE] Looking up flag with key: ${key}`);
    
    // Lookup flag by key
    const flag = await this.flagsService.findByKey(key);

    // Return default disabled state for non-existent flags
    if (!flag) {
      console.log(`❌ [SERVICE] Flag not found: ${key}`);
      return {
        enabled: false,
        key,
      };
    }

    console.log(`✅ [SERVICE] Flag found: ${flag.name} (ID: ${flag.id})`);
    console.log(`📋 [SERVICE] Flag has ${flag.environments.length} environment(s)`);
    console.log(`📋 [SERVICE] Environments:`, flag.environments.map(e => `${e.environment}:${e.enabled}`));

    // Find environment configuration
    const flagEnv = flag.environments.find(
      (env) => env.environment === environment,
    );

    // If environment not configured, return disabled
    if (!flagEnv) {
      console.log(`❌ [SERVICE] Environment ${environment} not configured for flag ${key}`);
      return {
        enabled: false,
        key,
      };
    }

    console.log(`✅ [SERVICE] Environment ${environment} found for flag ${key}`);
    console.log(`📊 [SERVICE] Environment config:`, {
      enabled: flagEnv.enabled,
      rolloutPercentage: flagEnv.rolloutPercentage,
      hasTargetingRules: !!flagEnv.targetingRules?.length
    });

    // If flag is disabled at environment level, return disabled
    if (!flagEnv.enabled) {
      console.log(`❌ [SERVICE] Flag ${key} is DISABLED for environment ${environment}`);
      return {
        enabled: false,
        key,
      };
    }

    console.log(`✅ [SERVICE] Flag ${key} is ENABLED for environment ${environment}`);

    // Evaluate targeting rules if present
    if (flagEnv.targetingRules && flagEnv.targetingRules.length > 0) {
      const rulesMatch = this.evaluateTargetingRules(
        flagEnv.targetingRules,
        context,
      );
      if (!rulesMatch) {
        return {
          enabled: false,
          key,
        };
      }
    }

    // Apply rollout percentage if configured
    if (
      flagEnv.rolloutPercentage !== null &&
      flagEnv.rolloutPercentage !== undefined
    ) {
      const userId = context?.userId;
      if (!userId) {
        // If no userId provided, use rollout percentage as probability
        return {
          enabled: Math.random() * 100 < flagEnv.rolloutPercentage,
          key,
        };
      }

      const inRollout = this.calculateRollout(
        userId,
        key,
        flagEnv.rolloutPercentage,
      );
      return {
        enabled: inRollout,
        key,
      };
    }

    // Flag is enabled
    return {
      enabled: true,
      key,
    };
  }

  private calculateRollout(
    userId: string,
    flagKey: string,
    percentage: number,
  ): boolean {
    // Use consistent hash-based rollout calculation
    // Combine userId and flagKey to ensure consistent results per user per flag
    const hash = crypto
      .createHash('sha256')
      .update(`${userId}:${flagKey}`)
      .digest('hex');

    // Convert first 8 characters of hash to integer
    const hashInt = parseInt(hash.substring(0, 8), 16);

    // Calculate percentage bucket (0-100)
    const bucket = hashInt % 100;

    return bucket < percentage;
  }

  private evaluateTargetingRules(
    rules: TargetingRule[],
    context?: EvaluationContext,
  ): boolean {
    if (!context || !context.attributes) {
      return false;
    }

    // All rules must match (AND logic)
    return rules.every((rule) => this.evaluateRule(rule, context.attributes!));
  }

  private evaluateRule(
    rule: TargetingRule,
    attributes: Record<string, any>,
  ): boolean {
    const attributeValue = attributes[rule.attribute];

    if (attributeValue === undefined) {
      return false;
    }

    switch (rule.operator) {
      case 'equals':
        return attributeValue === rule.value;

      case 'contains':
        if (typeof attributeValue === 'string' && typeof rule.value === 'string') {
          return attributeValue.includes(rule.value);
        }
        return false;

      case 'in':
        if (Array.isArray(rule.value)) {
          return rule.value.includes(attributeValue);
        }
        return false;

      case 'greaterThan':
        if (typeof attributeValue === 'number' && typeof rule.value === 'number') {
          return attributeValue > rule.value;
        }
        return false;

      case 'lessThan':
        if (typeof attributeValue === 'number' && typeof rule.value === 'number') {
          return attributeValue < rule.value;
        }
        return false;

      default:
        return false;
    }
  }
}
