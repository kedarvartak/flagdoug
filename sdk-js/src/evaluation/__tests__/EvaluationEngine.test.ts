import { EvaluationEngine, EvaluationContext, TargetingRule } from '../EvaluationEngine';
import { CachedFlag } from '../../cache';

describe('EvaluationEngine', () => {
  let engine: EvaluationEngine;
  let mockFlag: CachedFlag;
  let mockContext: EvaluationContext;

  beforeEach(() => {
    engine = new EvaluationEngine();
    
    mockFlag = {
      key: 'test-flag',
      value: 'flag-value',
      enabled: true,
      version: '1.0'
    };

    mockContext = {
      userId: 'user-123',
      attributes: {
        email: 'test@example.com',
        plan: 'premium',
        age: 25,
        country: 'US'
      },
      environment: 'production',
      timestamp: Date.now(),
      flagKey: 'test-flag',
      defaultValue: 'default-value'
    };
  });

  describe('basic evaluation', () => {
    it('should return flag value when flag is enabled', () => {
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('flag-value');
      expect(result.reason).toBe('DEFAULT');
    });

    it('should return default value when flag is disabled', () => {
      mockFlag.enabled = false;
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('default');
      expect(result.reason).toBe('DEFAULT');
    });

    it('should handle evaluation errors gracefully', () => {
      // Create a flag with invalid targeting that will cause an error
      mockFlag.targeting = 'invalid-targeting' as any;
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      // Should fall back to flag value when targeting is invalid
      expect(result.value).toBe('flag-value');
      expect(result.reason).toBe('DEFAULT');
    });
  });

  describe('targeting evaluation', () => {
    it('should match simple equals condition', () => {
      const rule: TargetingRule = {
        id: 'rule-1',
        name: 'Premium users',
        conditions: [{
          attribute: 'attributes.plan',
          operator: 'equals',
          value: 'premium',
          type: 'string'
        }],
        operator: 'AND',
        enabled: true,
        priority: 1,
        value: 'targeted-value'
      };

      mockFlag.targeting = [rule];
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('targeted-value');
      expect(result.reason).toBe('TARGETING_MATCH');
      expect(result.ruleId).toBe('rule-1');
    });

    it('should not match when condition fails', () => {
      const rule: TargetingRule = {
        id: 'rule-1',
        name: 'Basic users',
        conditions: [{
          attribute: 'attributes.plan',
          operator: 'equals',
          value: 'basic',
          type: 'string'
        }],
        operator: 'AND',
        enabled: true,
        priority: 1,
        value: 'targeted-value'
      };

      mockFlag.targeting = [rule];
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('flag-value');
      expect(result.reason).toBe('DEFAULT');
    });

    it('should handle multiple conditions with AND operator', () => {
      const rule: TargetingRule = {
        id: 'rule-1',
        name: 'Premium US users',
        conditions: [
          {
            attribute: 'attributes.plan',
            operator: 'equals',
            value: 'premium',
            type: 'string'
          },
          {
            attribute: 'attributes.country',
            operator: 'equals',
            value: 'US',
            type: 'string'
          }
        ],
        operator: 'AND',
        enabled: true,
        priority: 1,
        value: 'targeted-value'
      };

      mockFlag.targeting = [rule];
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('targeted-value');
      expect(result.reason).toBe('TARGETING_MATCH');
    });

    it('should handle multiple conditions with OR operator', () => {
      const rule: TargetingRule = {
        id: 'rule-1',
        name: 'Premium or Enterprise users',
        conditions: [
          {
            attribute: 'attributes.plan',
            operator: 'equals',
            value: 'premium',
            type: 'string'
          },
          {
            attribute: 'attributes.plan',
            operator: 'equals',
            value: 'enterprise',
            type: 'string'
          }
        ],
        operator: 'OR',
        enabled: true,
        priority: 1,
        value: 'targeted-value'
      };

      mockFlag.targeting = [rule];
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('targeted-value');
      expect(result.reason).toBe('TARGETING_MATCH');
    });

    it('should respect rule priority', () => {
      const lowPriorityRule: TargetingRule = {
        id: 'rule-low',
        name: 'Low priority',
        conditions: [{
          attribute: 'attributes.plan',
          operator: 'equals',
          value: 'premium',
          type: 'string'
        }],
        operator: 'AND',
        enabled: true,
        priority: 1,
        value: 'low-priority-value'
      };

      const highPriorityRule: TargetingRule = {
        id: 'rule-high',
        name: 'High priority',
        conditions: [{
          attribute: 'attributes.plan',
          operator: 'equals',
          value: 'premium',
          type: 'string'
        }],
        operator: 'AND',
        enabled: true,
        priority: 10,
        value: 'high-priority-value'
      };

      mockFlag.targeting = [lowPriorityRule, highPriorityRule];
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('high-priority-value');
      expect(result.ruleId).toBe('rule-high');
    });

    it('should skip disabled rules', () => {
      const rule: TargetingRule = {
        id: 'rule-1',
        name: 'Disabled rule',
        conditions: [{
          attribute: 'attributes.plan',
          operator: 'equals',
          value: 'premium',
          type: 'string'
        }],
        operator: 'AND',
        enabled: false,
        priority: 1,
        value: 'targeted-value'
      };

      mockFlag.targeting = [rule];
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('flag-value');
      expect(result.reason).toBe('DEFAULT');
    });
  });

  describe('condition operators', () => {
    it('should handle contains operator', () => {
      const rule: TargetingRule = {
        id: 'rule-1',
        name: 'Email contains example',
        conditions: [{
          attribute: 'attributes.email',
          operator: 'contains',
          value: 'example',
          type: 'string'
        }],
        operator: 'AND',
        enabled: true,
        priority: 1,
        value: 'targeted-value'
      };

      mockFlag.targeting = [rule];
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('targeted-value');
    });

    it('should handle startsWith operator', () => {
      const rule: TargetingRule = {
        id: 'rule-1',
        name: 'Email starts with test',
        conditions: [{
          attribute: 'attributes.email',
          operator: 'startsWith',
          value: 'test',
          type: 'string'
        }],
        operator: 'AND',
        enabled: true,
        priority: 1,
        value: 'targeted-value'
      };

      mockFlag.targeting = [rule];
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('targeted-value');
    });

    it('should handle in operator', () => {
      const rule: TargetingRule = {
        id: 'rule-1',
        name: 'Plan in list',
        conditions: [{
          attribute: 'attributes.plan',
          operator: 'in',
          value: ['premium', 'enterprise'],
          type: 'array'
        }],
        operator: 'AND',
        enabled: true,
        priority: 1,
        value: 'targeted-value'
      };

      mockFlag.targeting = [rule];
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('targeted-value');
    });

    it('should handle gt (greater than) operator', () => {
      const rule: TargetingRule = {
        id: 'rule-1',
        name: 'Age greater than 18',
        conditions: [{
          attribute: 'attributes.age',
          operator: 'gt',
          value: 18,
          type: 'number'
        }],
        operator: 'AND',
        enabled: true,
        priority: 1,
        value: 'targeted-value'
      };

      mockFlag.targeting = [rule];
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('targeted-value');
    });

    it('should handle lt (less than) operator', () => {
      const rule: TargetingRule = {
        id: 'rule-1',
        name: 'Age less than 30',
        conditions: [{
          attribute: 'attributes.age',
          operator: 'lt',
          value: 30,
          type: 'number'
        }],
        operator: 'AND',
        enabled: true,
        priority: 1,
        value: 'targeted-value'
      };

      mockFlag.targeting = [rule];
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('targeted-value');
    });

    it('should handle exists operator', () => {
      const rule: TargetingRule = {
        id: 'rule-1',
        name: 'Has email',
        conditions: [{
          attribute: 'attributes.email',
          operator: 'exists',
          value: null,
          type: 'string'
        }],
        operator: 'AND',
        enabled: true,
        priority: 1,
        value: 'targeted-value'
      };

      mockFlag.targeting = [rule];
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('targeted-value');
    });

    it('should handle regex operator', () => {
      const rule: TargetingRule = {
        id: 'rule-1',
        name: 'Email matches pattern',
        conditions: [{
          attribute: 'attributes.email',
          operator: 'regex',
          value: '^test.*@example\\.com$',
          type: 'string'
        }],
        operator: 'AND',
        enabled: true,
        priority: 1,
        value: 'targeted-value'
      };

      mockFlag.targeting = [rule];
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('targeted-value');
    });
  });

  describe('rollout evaluation', () => {
    it('should include user in 100% rollout', () => {
      mockFlag.metadata = {
        rollout: {
          type: 'percentage',
          percentage: 100,
          bucketing: {
            algorithm: 'hash',
            seed: 'test-seed',
            sticky: true
          }
        }
      };

      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('flag-value');
      expect(result.reason).toBe('ROLLOUT');
    });

    it('should exclude user from 0% rollout', () => {
      mockFlag.metadata = {
        rollout: {
          type: 'percentage',
          percentage: 0,
          bucketing: {
            algorithm: 'hash',
            seed: 'test-seed',
            sticky: true
          }
        }
      };

      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('default');
      expect(result.reason).toBe('DEFAULT');
    });

    it('should handle scheduled rollout within time window', () => {
      const now = new Date();
      const startTime = new Date(now.getTime() - 60000); // 1 minute ago
      const endTime = new Date(now.getTime() + 60000);   // 1 minute from now

      mockFlag.metadata = {
        rollout: {
          type: 'scheduled',
          schedule: {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString()
          },
          bucketing: {
            algorithm: 'hash',
            seed: 'test-seed',
            sticky: true
          }
        }
      };

      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('flag-value');
      expect(result.reason).toBe('ROLLOUT');
    });

    it('should handle scheduled rollout outside time window', () => {
      const now = new Date();
      const startTime = new Date(now.getTime() + 60000);  // 1 minute from now
      const endTime = new Date(now.getTime() + 120000);   // 2 minutes from now

      mockFlag.metadata = {
        rollout: {
          type: 'scheduled',
          schedule: {
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString()
          },
          bucketing: {
            algorithm: 'hash',
            seed: 'test-seed',
            sticky: true
          }
        }
      };

      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('default');
      expect(result.reason).toBe('DEFAULT');
    });
  });

  describe('bulk evaluation', () => {
    it('should evaluate multiple flags', () => {
      const flags = {
        'flag1': {
          key: 'flag1',
          value: 'value1',
          enabled: true,
          version: '1.0'
        },
        'flag2': {
          key: 'flag2',
          value: 'value2',
          enabled: false,
          version: '1.0'
        },
        'flag3': {
          key: 'flag3',
          value: 'value3',
          enabled: true,
          version: '1.0'
        }
      };

      const results = engine.evaluateBulk(flags, mockContext);
      
      expect(results).toHaveProperty('flag1');
      expect(results).toHaveProperty('flag2');
      expect(results).toHaveProperty('flag3');
      
      expect(results.flag1.value).toBe('value1');
      expect(results.flag1.reason).toBe('DEFAULT');
      
      expect(results.flag2.value).toBeNull();
      expect(results.flag2.reason).toBe('DEFAULT');
      
      expect(results.flag3.value).toBe('value3');
      expect(results.flag3.reason).toBe('DEFAULT');
    });
  });

  describe('edge cases', () => {
    it('should handle missing attributes gracefully', () => {
      const rule: TargetingRule = {
        id: 'rule-1',
        name: 'Missing attribute',
        conditions: [{
          attribute: 'attributes.nonexistent',
          operator: 'equals',
          value: 'test',
          type: 'string'
        }],
        operator: 'AND',
        enabled: true,
        priority: 1,
        value: 'targeted-value'
      };

      mockFlag.targeting = [rule];
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('flag-value');
      expect(result.reason).toBe('DEFAULT');
    });

    it('should handle nested attribute access', () => {
      mockContext.attributes = {
        user: {
          profile: {
            plan: 'premium'
          }
        }
      };

      const rule: TargetingRule = {
        id: 'rule-1',
        name: 'Nested attribute',
        conditions: [{
          attribute: 'attributes.user.profile.plan',
          operator: 'equals',
          value: 'premium',
          type: 'string'
        }],
        operator: 'AND',
        enabled: true,
        priority: 1,
        value: 'targeted-value'
      };

      mockFlag.targeting = [rule];
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('targeted-value');
      expect(result.reason).toBe('TARGETING_MATCH');
    });

    it('should handle type coercion in comparisons', () => {
      mockContext.attributes = {
        stringNumber: '25'
      };

      const rule: TargetingRule = {
        id: 'rule-1',
        name: 'Type coercion',
        conditions: [{
          attribute: 'attributes.stringNumber',
          operator: 'gt',
          value: 20,
          type: 'number'
        }],
        operator: 'AND',
        enabled: true,
        priority: 1,
        value: 'targeted-value'
      };

      mockFlag.targeting = [rule];
      
      const result = engine.evaluate(mockFlag, mockContext, 'default');
      
      expect(result.value).toBe('targeted-value');
      expect(result.reason).toBe('TARGETING_MATCH');
    });
  });
});