/**
 * API Types
 * TypeScript types matching backend DTOs and entities
 */

// ============================================================================
// Enums (using const objects for compatibility)
// ============================================================================

export const FlagType = {
  BOOLEAN: 'boolean',
  PERCENTAGE: 'percentage',
  MULTIVARIATE: 'multivariate',
} as const;

export type FlagType = typeof FlagType[keyof typeof FlagType];

export const Environment = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const;

export type Environment = typeof Environment[keyof typeof Environment];

// ============================================================================
// Entities (matching backend entities)
// ============================================================================

/**
 * Targeting rule for conditional flag evaluation
 */
export interface TargetingRule {
  attribute: string;
  operator: 'equals' | 'contains' | 'in' | 'greaterThan' | 'lessThan';
  value: string | string[] | number;
}

/**
 * Flag Environment Configuration
 * Matches backend FlagEnvironment entity
 */
export interface FlagEnvironment {
  id: string;
  flagId: string;
  environment: Environment;
  enabled: boolean;
  rolloutPercentage: number;
  targetingRules: TargetingRule[] | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Feature Flag
 * Matches backend Flag entity
 */
export interface Flag {
  id: string;
  key: string;
  name: string;
  description: string;
  type: FlagType;
  enabled: boolean;
  environments: FlagEnvironment[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// ============================================================================
// DTOs (matching backend DTOs)
// ============================================================================

/**
 * Create Flag Environment DTO
 * Matches backend CreateFlagEnvironmentDto
 */
export interface CreateFlagEnvironmentDto {
  environment: Environment;
  enabled?: boolean;
  rolloutPercentage?: number;
  targetingRules?: TargetingRule[];
}

/**
 * Create Flag DTO
 * Matches backend CreateFlagDto
 */
export interface CreateFlagDto {
  key: string;
  name: string;
  description?: string;
  type: FlagType;
  enabled?: boolean;
  environments: CreateFlagEnvironmentDto[];
}

/**
 * Update Flag DTO
 * Matches backend UpdateFlagDto
 */
export interface UpdateFlagDto {
  name?: string;
  description?: string;
  enabled?: boolean;
}

/**
 * Toggle Environment DTO
 * Matches backend ToggleFlagDto
 */
export interface ToggleEnvironmentDto {
  enabled: boolean;
  rolloutPercentage?: number;
}

// ============================================================================
// Pagination
// ============================================================================

/**
 * Pagination Parameters
 * Matches backend PaginationDto
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Pagination Metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated Response
 * Matches backend PaginatedResult
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Validation Error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * API Error
 */
export class ApiError extends Error {
  statusCode: number;
  errors?: ValidationError[];

  constructor(
    statusCode: number,
    message: string,
    errors?: ValidationError[],
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
