/**
 * Flags API Service
 * Service layer for feature flag CRUD operations
 */

import { apiClient } from './apiClient';
import type {
  Flag,
  FlagEnvironment,
  CreateFlagDto,
  UpdateFlagDto,
  ToggleEnvironmentDto,
  PaginationParams,
  PaginatedResponse,
} from '../../types/api.types';
import { Environment } from '../../types/api.types';

/**
 * Flags API Service
 * Provides methods for interacting with the flags API
 */
export const flagsApi = {
  /**
   * Get all flags with pagination support
   * @param params - Pagination parameters (page, limit)
   * @returns Paginated list of flags
   */
  async getFlags(
    params: PaginationParams = {},
  ): Promise<PaginatedResponse<Flag>> {
    const { page = 1, limit = 10 } = params;

    // Build query string
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await apiClient.get<PaginatedResponse<Flag>>(
      `/api/flags?${queryParams.toString()}`,
    );

    // Validate response structure
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format: expected data array');
    }

    if (!response.meta) {
      throw new Error('Invalid response format: expected meta object');
    }

    return response;
  },

  /**
   * Create a new flag
   * @param data - Flag creation data
   * @returns Created flag
   */
  async createFlag(data: CreateFlagDto): Promise<Flag> {
    // Validate required fields
    if (!data.key || !data.name || !data.type) {
      throw new Error('Missing required fields: key, name, and type are required');
    }

    if (!data.environments || data.environments.length === 0) {
      throw new Error('At least one environment configuration is required');
    }

    const response = await apiClient.post<Flag>('/api/flags', data);

    // Validate response
    if (!response.id || !response.key) {
      throw new Error('Invalid response format: expected flag object with id and key');
    }

    return response;
  },

  /**
   * Update an existing flag
   * @param id - Flag ID
   * @param data - Partial flag update data
   * @returns Updated flag
   */
  async updateFlag(id: string, data: UpdateFlagDto): Promise<Flag> {
    // Validate ID
    if (!id) {
      throw new Error('Flag ID is required');
    }

    // Validate at least one field is being updated
    if (!data.name && !data.description && data.enabled === undefined) {
      throw new Error('At least one field must be provided for update');
    }

    const response = await apiClient.patch<Flag>(`/api/flags/${id}`, data);

    // Validate response
    if (!response.id) {
      throw new Error('Invalid response format: expected flag object with id');
    }

    return response;
  },

  /**
   * Delete a flag
   * @param id - Flag ID
   * @returns void (204 No Content)
   */
  async deleteFlag(id: string): Promise<void> {
    // Validate ID
    if (!id) {
      throw new Error('Flag ID is required');
    }

    // DELETE request returns void (204 No Content)
    await apiClient.delete<void>(`/api/flags/${id}`);
  },

  /**
   * Toggle flag environment configuration
   * @param id - Flag ID
   * @param environment - Environment name (development, staging, production)
   * @param data - Toggle configuration (enabled, rolloutPercentage)
   * @returns Updated flag environment
   */
  async toggleEnvironment(
    id: string,
    environment: Environment,
    data: ToggleEnvironmentDto,
  ): Promise<FlagEnvironment> {
    // Validate ID
    if (!id) {
      throw new Error('Flag ID is required');
    }

    // Validate environment
    if (!environment) {
      throw new Error('Environment is required');
    }

    // Validate enabled field
    if (data.enabled === undefined) {
      throw new Error('Enabled field is required');
    }

    // Validate rollout percentage if provided
    if (
      data.rolloutPercentage !== undefined &&
      (data.rolloutPercentage < 0 || data.rolloutPercentage > 100)
    ) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }

    const response = await apiClient.patch<FlagEnvironment>(
      `/api/flags/${id}/environments/${environment}`,
      data,
    );

    // Validate response
    if (!response.id || !response.environment) {
      throw new Error('Invalid response format: expected flag environment object');
    }

    return response;
  },
};
