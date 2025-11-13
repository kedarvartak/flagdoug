/**
 * useFlags Hook Tests
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFlags } from '../useFlags';
import { flagsApi } from '../../services/api/flags.api';
import type { Flag, PaginatedResponse, FlagEnvironment } from '../../types/api.types';

// Mock the flags API
vi.mock('../../services/api/flags.api', () => ({
  flagsApi: {
    getFlags: vi.fn(),
    createFlag: vi.fn(),
    updateFlag: vi.fn(),
    deleteFlag: vi.fn(),
    toggleEnvironment: vi.fn(),
  },
}));

describe('useFlags', () => {
  const mockFlag: Flag = {
    id: '1',
    key: 'test-flag',
    name: 'Test Flag',
    description: 'Test description',
    type: 'boolean',
    enabled: true,
    environments: [
      {
        id: 'env-1',
        flagId: '1',
        environment: 'development',
        enabled: true,
        rolloutPercentage: 100,
        targetingRules: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockPaginatedResponse: PaginatedResponse<Flag> = {
    data: [mockFlag],
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useFlags());

    expect(result.current.flags).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.pagination).toBeNull();
  });

  describe('fetchFlags', () => {
    it('should fetch flags successfully', async () => {
      vi.mocked(flagsApi.getFlags).mockResolvedValue(mockPaginatedResponse);
      const { result } = renderHook(() => useFlags());

      await act(async () => {
        await result.current.fetchFlags(1, 10);
      });

      await waitFor(() => {
        expect(result.current.flags).toEqual([mockFlag]);
        expect(result.current.pagination).toEqual(mockPaginatedResponse.meta);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
      });
    });

    it('should handle fetch error', async () => {
      const mockError = new Error('Fetch failed');
      vi.mocked(flagsApi.getFlags).mockRejectedValue(mockError);
      const { result } = renderHook(() => useFlags());

      await act(async () => {
        await result.current.fetchFlags();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('createFlag', () => {
    it('should create flag with optimistic update', async () => {
      const newFlag = { ...mockFlag, id: '2', key: 'new-flag' };
      vi.mocked(flagsApi.createFlag).mockResolvedValue(newFlag);
      const { result } = renderHook(() => useFlags());

      // Set initial state
      await act(async () => {
        vi.mocked(flagsApi.getFlags).mockResolvedValue(mockPaginatedResponse);
        await result.current.fetchFlags();
      });

      const createData = {
        key: 'new-flag',
        name: 'New Flag',
        type: 'boolean' as const,
        environments: [{ environment: 'development' as const, enabled: true }],
      };

      await act(async () => {
        await result.current.createFlag(createData);
      });

      await waitFor(() => {
        expect(result.current.flags).toHaveLength(2);
        expect(result.current.flags[0]).toEqual(newFlag);
      });
    });

    it('should handle create error', async () => {
      const mockError = new Error('Create failed');
      vi.mocked(flagsApi.createFlag).mockRejectedValue(mockError);
      const { result } = renderHook(() => useFlags());

      const createData = {
        key: 'new-flag',
        name: 'New Flag',
        type: 'boolean' as const,
        environments: [{ environment: 'development' as const, enabled: true }],
      };

      const createdFlag = await act(async () => {
        return await result.current.createFlag(createData);
      });

      await waitFor(() => {
        expect(createdFlag).toBeNull();
        expect(result.current.error).toEqual(mockError);
      });
    });
  });

  describe('updateFlag', () => {
    it('should update flag with optimistic update', async () => {
      const updatedFlag = { ...mockFlag, name: 'Updated Flag' };
      vi.mocked(flagsApi.getFlags).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(flagsApi.updateFlag).mockResolvedValue(updatedFlag);
      const { result } = renderHook(() => useFlags());

      // Set initial state
      await act(async () => {
        await result.current.fetchFlags();
      });

      await act(async () => {
        await result.current.updateFlag('1', { name: 'Updated Flag' });
      });

      await waitFor(() => {
        expect(result.current.flags[0].name).toBe('Updated Flag');
      });
    });

    it('should rollback on update error', async () => {
      const mockError = new Error('Update failed');
      vi.mocked(flagsApi.getFlags).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(flagsApi.updateFlag).mockRejectedValue(mockError);
      const { result } = renderHook(() => useFlags());

      // Set initial state
      await act(async () => {
        await result.current.fetchFlags();
      });

      const originalName = result.current.flags[0].name;

      await act(async () => {
        await result.current.updateFlag('1', { name: 'Updated Flag' });
      });

      await waitFor(() => {
        expect(result.current.flags[0].name).toBe(originalName);
        expect(result.current.error).toEqual(mockError);
      });
    });
  });

  describe('deleteFlag', () => {
    it('should delete flag with optimistic update', async () => {
      vi.mocked(flagsApi.getFlags).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(flagsApi.deleteFlag).mockResolvedValue(undefined);
      const { result } = renderHook(() => useFlags());

      // Set initial state
      await act(async () => {
        await result.current.fetchFlags();
      });

      let deleteResult: boolean;
      await act(async () => {
        deleteResult = await result.current.deleteFlag('1');
      });

      await waitFor(() => {
        expect(deleteResult).toBe(true);
        expect(result.current.flags).toHaveLength(0);
      });
    });

    it('should rollback on delete error', async () => {
      const mockError = new Error('Delete failed');
      vi.mocked(flagsApi.getFlags).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(flagsApi.deleteFlag).mockRejectedValue(mockError);
      const { result } = renderHook(() => useFlags());

      // Set initial state
      await act(async () => {
        await result.current.fetchFlags();
      });

      let deleteResult: boolean;
      await act(async () => {
        deleteResult = await result.current.deleteFlag('1');
      });

      await waitFor(() => {
        expect(deleteResult).toBe(false);
        expect(result.current.flags).toHaveLength(1);
        expect(result.current.error).toEqual(mockError);
      });
    });
  });

  describe('toggleEnvironment', () => {
    it('should toggle environment with optimistic update', async () => {
      const updatedEnv: FlagEnvironment = {
        ...mockFlag.environments[0],
        enabled: false,
      };
      vi.mocked(flagsApi.getFlags).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(flagsApi.toggleEnvironment).mockResolvedValue(updatedEnv);
      const { result } = renderHook(() => useFlags());

      // Set initial state
      await act(async () => {
        await result.current.fetchFlags();
      });

      await act(async () => {
        await result.current.toggleEnvironment('1', 'development', { enabled: false });
      });

      await waitFor(() => {
        expect(result.current.flags[0].environments[0].enabled).toBe(false);
      });
    });

    it('should rollback on toggle error', async () => {
      const mockError = new Error('Toggle failed');
      vi.mocked(flagsApi.getFlags).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(flagsApi.toggleEnvironment).mockRejectedValue(mockError);
      const { result } = renderHook(() => useFlags());

      // Set initial state
      await act(async () => {
        await result.current.fetchFlags();
      });

      const originalEnabled = result.current.flags[0].environments[0].enabled;

      await act(async () => {
        await result.current.toggleEnvironment('1', 'development', { enabled: false });
      });

      await waitFor(() => {
        expect(result.current.flags[0].environments[0].enabled).toBe(originalEnabled);
        expect(result.current.error).toEqual(mockError);
      });
    });
  });

  describe('reset', () => {
    it('should reset state', async () => {
      vi.mocked(flagsApi.getFlags).mockResolvedValue(mockPaginatedResponse);
      const { result } = renderHook(() => useFlags());

      // Set initial state
      await act(async () => {
        await result.current.fetchFlags();
      });

      await waitFor(() => {
        expect(result.current.flags).toHaveLength(1);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.flags).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.pagination).toBeNull();
    });
  });

  describe('operationLoading states', () => {
    it('should track updating loading state', async () => {
      vi.mocked(flagsApi.getFlags).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(flagsApi.updateFlag).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ...mockFlag, name: 'Updated' }), 100))
      );
      const { result } = renderHook(() => useFlags());

      await act(async () => {
        await result.current.fetchFlags();
      });

      // Start update
      act(() => {
        result.current.updateFlag('1', { name: 'Updated' });
      });

      // Check loading state is true
      await waitFor(() => {
        expect(result.current.operationLoading.updating['1']).toBe(true);
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.operationLoading.updating['1']).toBe(false);
      }, { timeout: 200 });
    });

    it('should track deleting loading state', async () => {
      vi.mocked(flagsApi.getFlags).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(flagsApi.deleteFlag).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
      );
      const { result } = renderHook(() => useFlags());

      await act(async () => {
        await result.current.fetchFlags();
      });

      // Start delete
      act(() => {
        result.current.deleteFlag('1');
      });

      // Check loading state is true
      await waitFor(() => {
        expect(result.current.operationLoading.deleting['1']).toBe(true);
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.operationLoading.deleting['1']).toBe(false);
      }, { timeout: 200 });
    });

    it('should track toggling loading state', async () => {
      vi.mocked(flagsApi.getFlags).mockResolvedValue(mockPaginatedResponse);
      vi.mocked(flagsApi.toggleEnvironment).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ...mockFlag.environments[0], enabled: false }), 100))
      );
      const { result } = renderHook(() => useFlags());

      await act(async () => {
        await result.current.fetchFlags();
      });

      // Start toggle
      act(() => {
        result.current.toggleEnvironment('1', 'development', { enabled: false });
      });

      // Check loading state is true
      await waitFor(() => {
        expect(result.current.operationLoading.toggling['1-development']).toBe(true);
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.operationLoading.toggling['1-development']).toBe(false);
      }, { timeout: 200 });
    });
  });
});
