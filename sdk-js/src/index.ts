// Main SDK exports
export { FlagClient } from './client/FlagClient';
export { ServerFlagClient } from './client/ServerFlagClient';

// Types and interfaces
export type {
  ClientConfig,
  ServerConfig,
  UserContext,
  CacheConfig,
  RealTimeConfig,
  OfflineConfig,
  RedisConfig,
  EvaluationResult,
  FlagValue
} from './types';

// Evaluation engine and types
export { EvaluationEngine } from './evaluation';
export type {
  EvaluationContext,
  TargetingRule,
  TargetingCondition,
  RolloutConfig
} from './evaluation';

// Cache system
export { CacheManager, LRUCache } from './cache';
export type {
  CachedFlag,
  CacheManagerOptions,
  StorageAdapter
} from './cache';

// Errors
export { FlagError, FlagErrorType } from './errors';

// Version
export const VERSION = '1.0.0';