/**
 * API Usage Examples
 * This file demonstrates how to use the API client
 * (For documentation purposes - not used in production)
 */

import { apiClient } from './apiClient';
import type {
  Flag,
  CreateFlagDto,
  UpdateFlagDto,
  ToggleEnvironmentDto,
  PaginatedResponse,
  Environment,
} from '../../types/api.types';
import { ApiError } from '../../types/api.types';

/**
 * Example: Fetch all flags with pagination
 */
export async function exampleFetchFlags() {
  try {
    const response = await apiClient.get<PaginatedResponse<Flag>>(
      '/api/flags?page=1&limit=10',
    );

    console.log(`Loaded ${response.data.length} flags`);
    console.log(`Total flags: ${response.meta.total}`);
    console.log(`Page ${response.meta.page} of ${response.meta.totalPages}`);

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`API Error ${error.statusCode}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Example: Create a new flag
 */
export async function exampleCreateFlag() {
  const newFlag: CreateFlagDto = {
    key: 'new_feature_toggle',
    name: 'New Feature Toggle',
    description: 'Enables the new dashboard feature',
    type: 'boolean',
    enabled: false,
    environments: [
      {
        environment: 'development' as Environment,
        enabled: true,
        rolloutPercentage: 100,
      },
      {
        environment: 'staging' as Environment,
        enabled: false,
        rolloutPercentage: 0,
      },
      {
        environment: 'production' as Environment,
        enabled: false,
        rolloutPercentage: 0,
      },
    ],
  };

  try {
    const createdFlag = await apiClient.post<Flag>('/api/flags', newFlag);
    console.log('Flag created:', createdFlag);
    return createdFlag;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`Failed to create flag: ${error.message}`);
      if (error.errors) {
        error.errors.forEach(({ field, message }) => {
          console.error(`  ${field}: ${message}`);
        });
      }
    }
    throw error;
  }
}

/**
 * Example: Update a flag
 */
export async function exampleUpdateFlag(flagId: string) {
  const updates: UpdateFlagDto = {
    name: 'Updated Feature Name',
    description: 'Updated description',
    enabled: true,
  };

  try {
    const updatedFlag = await apiClient.patch<Flag>(
      `/api/flags/${flagId}`,
      updates,
    );
    console.log('Flag updated:', updatedFlag);
    return updatedFlag;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`Failed to update flag: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Example: Toggle flag environment
 */
export async function exampleToggleEnvironment(
  flagId: string,
  environment: Environment,
) {
  const toggleData: ToggleEnvironmentDto = {
    enabled: true,
    rolloutPercentage: 50,
  };

  try {
    const updatedEnv = await apiClient.patch(
      `/api/flags/${flagId}/environments/${environment}`,
      toggleData,
    );
    console.log('Environment toggled:', updatedEnv);
    return updatedEnv;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`Failed to toggle environment: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Example: Delete a flag
 */
export async function exampleDeleteFlag(flagId: string) {
  try {
    await apiClient.delete(`/api/flags/${flagId}`);
    console.log('Flag deleted successfully');
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`Failed to delete flag: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Example: Error handling patterns
 */
export async function exampleErrorHandling() {
  try {
    const flag = await apiClient.get<Flag>('/api/flags/non-existent-id');
    return flag;
  } catch (error) {
    if (error instanceof ApiError) {
      switch (error.statusCode) {
        case 404:
          console.error('Flag not found');
          break;
        case 400:
          console.error('Invalid request:', error.message);
          if (error.errors) {
            console.error('Validation errors:', error.errors);
          }
          break;
        case 500:
          console.error('Server error:', error.message);
          break;
        case 0:
          console.error('Network error - check your connection');
          break;
        case 408:
          console.error('Request timeout - try again');
          break;
        default:
          console.error('Unexpected error:', error.message);
      }
    }
    throw error;
  }
}
