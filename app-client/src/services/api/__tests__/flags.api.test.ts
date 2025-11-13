/**
 * Flags API Tests
 * Unit tests for the flags API service layer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flagsApi } from '../flags.api';
import { apiClient } from '../apiClient';
import type {
  Flag,
  FlagEnvironment,
  CreateFlagDto,
  UpdateFlagDto,
  ToggleEnvironmentDto,
  PaginatedResponse,
} from '../../../types/api.types';
import { Environment, FlagType } from '../../../types/api.types';

// Mock the apiClient
vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('flagsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFlags', () => {
    it('should fetch flags with default pagination', async () => {
      const mockResponse: PaginatedResponse<Flag> = {
        data: [
          {
            id: '1',
            key: 'test-flag',
            name: 'Test Flag',
            description: 'Test description',
            type: FlagType.BOOLEAN,
            enabled: true,
            environments: [],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await flagsApi.getFlags();

      expect(apiClient.get).toHaveBeenCalledWith('/api/flags?page=1&limit=10');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch flags with custom pagination', async () => {
      const mockResponse: PaginatedResponse<Flag> = {
        data: [],
        meta: {
          total: 0,
          page: 2,
          limit: 20,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: true,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await flagsApi.getFlags({ page: 2, limit: 20 });

      expect(apiClient.get).toHaveBeenCalledWith('/api/flags?page=2&limit=20');
      expect(result).toEqual(mockResponse);
    });

    it('should throw error if response format is invalid', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: null, meta: {} });

      await expect(flagsApi.getFlags()).rejects.toThrow(
        'Invalid response format: expected data array',
      );
    });
  });

  describe('createFlag', () => {
    it('should create a new flag', async () => {
      const createData: CreateFlagDto = {
        key: 'new-flag',
        name: 'New Flag',
        description: 'New flag description',
        type: FlagType.BOOLEAN,
        enabled: true,
        environments: [
          {
            environment: Environment.DEVELOPMENT,
            enabled: true,
          },
        ],
      };

      const mockResponse: Flag = {
        id: '1',
        key: 'new-flag',
        name: 'New Flag',
        description: 'New flag description',
        type: FlagType.BOOLEAN,
        enabled: true,
        environments: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await flagsApi.createFlag(createData);

      expect(apiClient.post).toHaveBeenCalledWith('/api/flags', createData);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error if required fields are missing', async () => {
      const invalidData = {
        name: 'Test',
      } as CreateFlagDto;

      await expect(flagsApi.createFlag(invalidData)).rejects.toThrow(
        'Missing required fields',
      );
    });

    it('should throw error if environments are missing', async () => {
      const invalidData: CreateFlagDto = {
        key: 'test',
        name: 'Test',
        type: FlagType.BOOLEAN,
        environments: [],
      };

      await expect(flagsApi.createFlag(invalidData)).rejects.toThrow(
        'At least one environment configuration is required',
      );
    });
  });

  describe('updateFlag', () => {
    it('should update a flag', async () => {
      const updateData: UpdateFlagDto = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      const mockResponse: Flag = {
        id: '1',
        key: 'test-flag',
        name: 'Updated Name',
        description: 'Updated description',
        type: FlagType.BOOLEAN,
        enabled: true,
        environments: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      const result = await flagsApi.updateFlag('1', updateData);

      expect(apiClient.patch).toHaveBeenCalledWith('/api/flags/1', updateData);
      expect(result).toEqual(mockResponse);
    });

    it('should throw error if ID is missing', async () => {
      await expect(flagsApi.updateFlag('', { name: 'Test' })).rejects.toThrow(
        'Flag ID is required',
      );
    });

    it('should throw error if no fields are provided', async () => {
      await expect(flagsApi.updateFlag('1', {})).rejects.toThrow(
        'At least one field must be provided for update',
      );
    });
  });

  describe('deleteFlag', () => {
    it('should delete a flag', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      await flagsApi.deleteFlag('1');

      expect(apiClient.delete).toHaveBeenCalledWith('/api/flags/1');
    });

    it('should throw error if ID is missing', async () => {
      await expect(flagsApi.deleteFlag('')).rejects.toThrow(
        'Flag ID is required',
      );
    });
  });

  describe('toggleEnvironment', () => {
    it('should toggle environment configuration', async () => {
      const toggleData: ToggleEnvironmentDto = {
        enabled: true,
        rolloutPercentage: 50,
      };

      const mockResponse: FlagEnvironment = {
        id: '1',
        flagId: '1',
        environment: Environment.PRODUCTION,
        enabled: true,
        rolloutPercentage: 50,
        targetingRules: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

      const result = await flagsApi.toggleEnvironment(
        '1',
        Environment.PRODUCTION,
        toggleData,
      );

      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/flags/1/environments/production',
        toggleData,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error if ID is missing', async () => {
      await expect(
        flagsApi.toggleEnvironment('', Environment.PRODUCTION, {
          enabled: true,
        }),
      ).rejects.toThrow('Flag ID is required');
    });

    it('should throw error if environment is missing', async () => {
      await expect(
        flagsApi.toggleEnvironment('1', '' as Environment, { enabled: true }),
      ).rejects.toThrow('Environment is required');
    });

    it('should throw error if enabled field is missing', async () => {
      await expect(
        flagsApi.toggleEnvironment('1', Environment.PRODUCTION, {} as ToggleEnvironmentDto),
      ).rejects.toThrow('Enabled field is required');
    });

    it('should throw error if rollout percentage is invalid', async () => {
      await expect(
        flagsApi.toggleEnvironment('1', Environment.PRODUCTION, {
          enabled: true,
          rolloutPercentage: 150,
        }),
      ).rejects.toThrow('Rollout percentage must be between 0 and 100');
    });
  });
});
