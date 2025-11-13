// Core configuration interfaces
export interface ClientConfig {
  apiKey: string;
  baseUrl?: string;
  environment?: string;
  cacheConfig?: CacheConfig;
  realTimeConfig?: RealTimeConfig;
  offlineConfig?: OfflineConfig;
}

export interface ServerConfig extends ClientConfig {
  redis?: RedisConfig;
  bulkEvaluation?: boolean;
  contextProvider?: (req: any) => UserContext;
}

export interface CacheConfig {
  ttl: number; // milliseconds
  maxSize: number; // number of entries
  strategy: 'lru' | 'fifo';
}

export interface RealTimeConfig {
  enabled: boolean;
  transport: 'websocket' | 'sse';
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export interface OfflineConfig {
  enabled: boolean;
  storage: 'localStorage' | 'sessionStorage' | 'memory';
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
}

// User context for flag evaluation
export interface UserContext {
  userId?: string;
  attributes: Record<string, any>;
  environment?: string;
  timestamp?: number;
}

// Flag evaluation result
export interface EvaluationResult<T = any> {
  value: T;
  variant?: string;
  reason: EvaluationReason;
  ruleId?: string;
}

export type EvaluationReason = 
  | 'DEFAULT'
  | 'TARGETING_MATCH'
  | 'ROLLOUT'
  | 'CACHED'
  | 'ERROR';

// Generic flag value type
export type FlagValue = string | number | boolean | object | null;

// Event types for client
export type ClientEvent = 'flagsChanged' | 'ready' | 'error' | 'connectionStateChanged';

export interface ClientEventHandler {
  (event: ClientEvent, data?: any): void;
}