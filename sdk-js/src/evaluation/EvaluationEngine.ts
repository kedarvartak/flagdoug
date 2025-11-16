import { UserContext, EvaluationResult, EvaluationReason, FlagValue } from '../types';
import { CachedFlag } from '../cache';

export interface EvaluationContext extends UserContext {
  flagKey: string;
  defaultValue: any;
}

export interface TargetingRule {
  id: string;
  name: string;
  conditions: TargetingCondition[];
  operator: 'AND' | 'OR';
  enabled: boolean;
  priority: number;
  value?: any;
}

export interface TargetingCondition {
  attribute: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'in' | 'gt' | 'lt' | 'regex' | 'exists';
  value: any;
  type: 'string' | 'number' | 'boolean' | 'array';
}

export interface RolloutConfig {
  type: 'percentage' | 'scheduled';
  percentage?: number;
  schedule?: {
    startTime: string;
    endTime: string;
  };
  bucketing: {
    algorithm: 'hash' | 'random';
    seed: string;
    sticky: boolean;
  };
}

/**
 * Flag evaluation engine that handles targeting rules and rollout logic
 */
export class EvaluationEngine {
  /**
   * Evaluate a flag with the given context
   */
  evaluate<T extends FlagValue>(
    flag: CachedFlag,
    context: EvaluationContext,
    defaultValue: T
  ): EvaluationResult<T> {
    try {
      // If flag is disabled, return default value
      if (!flag.enabled) {
        return {
          value: defaultValue,
          reason: 'DEFAULT'
        };
      }

      // Check targeting rules if they exist
      if (flag.targeting && Array.isArray(flag.targeting)) {
        const targetingResult = this.evaluateTargeting(flag.targeting, context);
        if (targetingResult.matched) {
          return {
            value: targetingResult.value !== undefined ? targetingResult.value : flag.value,
            reason: 'TARGETING_MATCH',
            ruleId: targetingResult.ruleId
          };
        }
      }

      // Check rollout configuration
      if (flag.metadata?.rollout) {
        const rolloutResult = this.evaluateRollout(flag.metadata.rollout, context);
        if (rolloutResult.included) {
          return {
            value: flag.value as T,
            reason: 'ROLLOUT'
          };
        } else {
          return {
            value: defaultValue,
            reason: 'DEFAULT'
          };
        }
      }

      // Return flag value if no targeting or rollout rules
      return {
        value: flag.value as T,
        reason: 'DEFAULT'
      };
    } catch (error) {
      console.warn(`Error evaluating flag ${flag.key}:`, error);
      return {
        value: defaultValue,
        reason: 'ERROR'
      };
    }
  }

  /**
   * Evaluate multiple flags in bulk
   */
  evaluateBulk(
    flags: Record<string, CachedFlag>,
    context: UserContext
  ): Record<string, EvaluationResult> {
    const results: Record<string, EvaluationResult> = {};

    for (const [key, flag] of Object.entries(flags)) {
      const evaluationContext: EvaluationContext = {
        ...context,
        flagKey: key,
        defaultValue: null
      };

      results[key] = this.evaluate(flag, evaluationContext, null);
    }

    return results;
  }

  private evaluateTargeting(
    rules: TargetingRule[],
    context: EvaluationContext
  ): { matched: boolean; value?: any; ruleId?: string } {
    // Sort rules by priority (higher priority first)
    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (!rule.enabled) {
        continue;
      }

      const ruleMatched = this.evaluateRule(rule, context);
      if (ruleMatched) {
        return {
          matched: true,
          value: rule.value,
          ruleId: rule.id
        };
      }
    }

    return { matched: false };
  }

  private evaluateRule(rule: TargetingRule, context: EvaluationContext): boolean {
    if (rule.conditions.length === 0) {
      return false;
    }

    const conditionResults = rule.conditions.map(condition =>
      this.evaluateCondition(condition, context)
    );

    if (rule.operator === 'AND') {
      return conditionResults.every(result => result);
    } else {
      return conditionResults.some(result => result);
    }
  }

  private evaluateCondition(condition: TargetingCondition, context: EvaluationContext): boolean {
    const attributeValue = this.getAttributeValue(condition.attribute, context);

    if (condition.operator === 'exists') {
      return attributeValue !== undefined && attributeValue !== null;
    }

    if (attributeValue === undefined || attributeValue === null) {
      return false;
    }

    try {
      switch (condition.operator) {
        case 'equals':
          return this.compareValues(attributeValue, condition.value, 'equals');

        case 'contains':
          if (typeof attributeValue === 'string' && typeof condition.value === 'string') {
            return attributeValue.includes(condition.value);
          }
          if (Array.isArray(attributeValue)) {
            return attributeValue.includes(condition.value);
          }
          return false;

        case 'startsWith':
          if (typeof attributeValue === 'string' && typeof condition.value === 'string') {
            return attributeValue.startsWith(condition.value);
          }
          return false;

        case 'in':
          if (Array.isArray(condition.value)) {
            return condition.value.includes(attributeValue);
          }
          return false;

        case 'gt':
          return this.compareValues(attributeValue, condition.value, 'gt');

        case 'lt':
          return this.compareValues(attributeValue, condition.value, 'lt');

        case 'regex':
          if (typeof attributeValue === 'string' && typeof condition.value === 'string') {
            const regex = new RegExp(condition.value);
            return regex.test(attributeValue);
          }
          return false;

        default:
          console.warn(`Unknown condition operator: ${condition.operator}`);
          return false;
      }
    } catch (error) {
      console.warn(`Error evaluating condition:`, error);
      return false;
    }
  }

  private getAttributeValue(attribute: string, context: EvaluationContext): any {
    // Handle nested attributes with dot notation
    const parts = attribute.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private compareValues(a: any, b: any, operator: 'equals' | 'gt' | 'lt'): boolean {
    // Type coercion for comparison
    if (typeof a === 'string' && typeof b === 'number') {
      const numA = parseFloat(a);
      if (!isNaN(numA)) {
        a = numA;
      }
    } else if (typeof a === 'number' && typeof b === 'string') {
      const numB = parseFloat(b);
      if (!isNaN(numB)) {
        b = numB;
      }
    }

    switch (operator) {
      case 'equals':
        return a === b;
      case 'gt':
        return a > b;
      case 'lt':
        return a < b;
      default:
        return false;
    }
  }

  private evaluateRollout(
    rollout: RolloutConfig,
    context: EvaluationContext
  ): { included: boolean } {
    try {
      if (rollout.type === 'percentage' && rollout.percentage !== undefined) {
        return this.evaluatePercentageRollout(rollout, context);
      }

      if (rollout.type === 'scheduled' && rollout.schedule) {
        return this.evaluateScheduledRollout(rollout, context);
      }

      return { included: false };
    } catch (error) {
      console.warn('Error evaluating rollout:', error);
      return { included: false };
    }
  }

  private evaluatePercentageRollout(
    rollout: RolloutConfig,
    context: EvaluationContext
  ): { included: boolean } {
    if (rollout.percentage === undefined || rollout.percentage < 0 || rollout.percentage > 100) {
      return { included: false };
    }

    // If percentage is 0, exclude everyone
    if (rollout.percentage === 0) {
      return { included: false };
    }

    // If percentage is 100, include everyone
    if (rollout.percentage === 100) {
      return { included: true };
    }

    // Calculate bucket based on user ID and flag key
    const bucketKey = this.getBucketKey(context, rollout.bucketing);
    const bucket = this.calculateBucket(bucketKey, rollout.bucketing);

    return { included: bucket < rollout.percentage };
  }

  private evaluateScheduledRollout(
    rollout: RolloutConfig,
    _context: EvaluationContext
  ): { included: boolean } {
    if (!rollout.schedule) {
      return { included: false };
    }

    const now = new Date();
    const startTime = new Date(rollout.schedule.startTime);
    const endTime = new Date(rollout.schedule.endTime);

    return {
      included: now >= startTime && now <= endTime
    };
  }

  private getBucketKey(context: EvaluationContext, bucketing: RolloutConfig['bucketing']): string {
    const userId = context.userId || 'anonymous';
    const flagKey = context.flagKey;
    const seed = bucketing.seed || 'default';

    return `${userId}:${flagKey}:${seed}`;
  }

  private calculateBucket(key: string, bucketing: RolloutConfig['bucketing']): number {
    if (bucketing.algorithm === 'random') {
      // For random bucketing, use a simple hash of the key
      return this.simpleHash(key) % 100;
    }

    // Default to hash-based bucketing for consistency
    return this.consistentHash(key) % 100;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private consistentHash(str: string): number {
    // Simple consistent hash implementation
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash);
  }
}