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

// Errors
export { FlagError, FlagErrorType } from './errors';

// Version
export const VERSION = '1.0.0';