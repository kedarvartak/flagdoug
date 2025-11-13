/**
 * FlagsContext Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { FlagsProvider, useFlagsContext } from '../FlagsContext';
import { ToastProvider } from '../ToastContext';
import { ThemeProvider } from '../ThemeContext';
import * as flagsApiModule from '../../services/api/flags.api';
import type { ReactNode } from 'react';

// Mock the flags API
vi.mock('../../services/api/flags.api');

const mockFlagsApi = flagsApiModule.flagsApi as any;

describe('FlagsContext', () => {
  const mockFlags = [
    {
      id: '1',
      key: 'test-flag',
      name: 'Test Flag',
      description: 'A test flag',
      type: 'boolean' as const,
      enabled: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      environments: [
        {
          id: 'env-1',
          environment: 'development' as const,
          enabled: true,
          rolloutPercentage: 100,
          targetingRules: null,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    },
  ];

  const mockPaginatedResponse = {
    data: mockFlags,
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFlagsApi.getFlags.mockResolvedValue(mockPaginatedResponse);
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider>
      <ToastProvider>
        <FlagsProvider initialPage={1} pageSize={10}>
          {children}
        </FlagsProvider>
      </ToastProvider>
    </ThemeProvider>
  );

  describe('Provider', () => {
    it('should provide flags context', async () => {
      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.flags).toEqual(mockFlags);
      });
    });

    it('should fetch flags on mount', async () => {
      renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(mockFlagsApi.getFlags).toHaveBeenCalledWith({ page: 1, limit: 10 });
      });
    });

    it('should provide loading state', async () => {
      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      // Initially loading should be true
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should provide pagination metadata', async () => {
      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.pagination).toEqual({
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        });
      });
    });

    it('should provide current page state', async () => {
      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(1);
      });
    });
  });

  describe('fetchFlags', () => {
    it('should fetch flags for a specific page', async () => {
      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.flags).toEqual(mockFlags);
      });

      act(() => {
        result.current.fetchFlags(2);
      });

      await waitFor(() => {
        expect(mockFlagsApi.getFlags).toHaveBeenCalledWith({ page: 2, limit: 10 });
      });
    });

    it('should update current page when fetching', async () => {
      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.flags).toEqual(mockFlags);
      });

      act(() => {
        result.current.fetchFlags(3);
      });

      await waitFor(() => {
        expect(result.current.currentPage).toBe(3);
      });
    });
  });

  describe('setCurrentPage', () => {
    it('should update current page', async () => {
      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.flags).toEqual(mockFlags);
      });

      act(() => {
        result.current.setCurrentPage(5);
      });

      expect(result.current.currentPage).toBe(5);
    });
  });

  describe('createFlag', () => {
    it('should create a flag and refresh', async () => {
      const newFlag = { ...mockFlags[0], id: '2', key: 'new-flag' };
      mockFlagsApi.createFlag.mockResolvedValue(newFlag);

      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.flags).toEqual(mockFlags);
      });

      let createdFlag: any;
      await act(async () => {
        createdFlag = await result.current.createFlag({
          key: 'new-flag',
          name: 'New Flag',
          type: 'boolean',
          environments: [],
        });
      });

      expect(createdFlag).toEqual(newFlag);
      expect(mockFlagsApi.createFlag).toHaveBeenCalled();
      // Should refresh after creation
      expect(mockFlagsApi.getFlags).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateFlag', () => {
    it('should update a flag', async () => {
      const updatedFlag = { ...mockFlags[0], name: 'Updated Flag' };
      mockFlagsApi.updateFlag.mockResolvedValue(updatedFlag);

      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.flags).toEqual(mockFlags);
      });

      let updated: any;
      await act(async () => {
        updated = await result.current.updateFlag('1', { name: 'Updated Flag' });
      });

      expect(updated).toEqual(updatedFlag);
      expect(mockFlagsApi.updateFlag).toHaveBeenCalledWith('1', { name: 'Updated Flag' });
    });
  });

  describe('deleteFlag', () => {
    it('should delete a flag', async () => {
      mockFlagsApi.deleteFlag.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.flags).toEqual(mockFlags);
      });

      let deleted: boolean = false;
      await act(async () => {
        deleted = await result.current.deleteFlag('1');
      });

      expect(deleted).toBe(true);
      expect(mockFlagsApi.deleteFlag).toHaveBeenCalledWith('1');
    });
  });

  describe('toggleEnvironment', () => {
    it('should toggle environment', async () => {
      const updatedEnv = {
        ...mockFlags[0].environments[0],
        enabled: false,
      };
      mockFlagsApi.toggleEnvironment.mockResolvedValue(updatedEnv);

      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.flags).toEqual(mockFlags);
      });

      let toggledEnv: any;
      await act(async () => {
        toggledEnv = await result.current.toggleEnvironment('1', 'development', {
          enabled: false,
        });
      });

      expect(toggledEnv).toEqual(updatedEnv);
      expect(mockFlagsApi.toggleEnvironment).toHaveBeenCalledWith('1', 'development', {
        enabled: false,
      });
    });
  });

  describe('refreshFlags', () => {
    it('should refresh flags for current page', async () => {
      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.flags).toEqual(mockFlags);
      });

      // Clear previous calls
      mockFlagsApi.getFlags.mockClear();

      await act(async () => {
        await result.current.refreshFlags();
      });

      expect(mockFlagsApi.getFlags).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('operationLoading', () => {
    it('should expose operationLoading states', async () => {
      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.flags).toEqual(mockFlags);
      });

      expect(result.current.operationLoading).toBeDefined();
      expect(result.current.operationLoading.fetching).toBe(false);
      expect(result.current.operationLoading.creating).toBe(false);
      expect(result.current.operationLoading.updating).toEqual({});
      expect(result.current.operationLoading.deleting).toEqual({});
      expect(result.current.operationLoading.toggling).toEqual({});
    });

    it('should provide isOperationLoading helper for updating', async () => {
      mockFlagsApi.updateFlag.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ...mockFlags[0], name: 'Updated' }), 100))
      );

      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.flags).toEqual(mockFlags);
      });

      // Start update
      act(() => {
        result.current.updateFlag('1', { name: 'Updated' });
      });

      // Check loading state
      await waitFor(() => {
        expect(result.current.isOperationLoading('updating', '1')).toBe(true);
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isOperationLoading('updating', '1')).toBe(false);
      }, { timeout: 500 });
    });

    it('should provide isOperationLoading helper for deleting', async () => {
      mockFlagsApi.deleteFlag.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
      );

      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.flags).toEqual(mockFlags);
      });

      // Start delete
      act(() => {
        result.current.deleteFlag('1');
      });

      // Check loading state
      await waitFor(() => {
        expect(result.current.isOperationLoading('deleting', '1')).toBe(true);
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isOperationLoading('deleting', '1')).toBe(false);
      }, { timeout: 500 });
    });

    it('should provide isOperationLoading helper for toggling with environment', async () => {
      mockFlagsApi.toggleEnvironment.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ...mockFlags[0].environments[0], enabled: false }), 100))
      );

      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.flags).toEqual(mockFlags);
      });

      // Start toggle
      act(() => {
        result.current.toggleEnvironment('1', 'development', { enabled: false });
      });

      // Check loading state
      await waitFor(() => {
        expect(result.current.isOperationLoading('toggling', '1', 'development')).toBe(true);
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isOperationLoading('toggling', '1', 'development')).toBe(false);
      }, { timeout: 500 });
    });
  });

  describe('Error handling', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useFlagsContext());
      }).toThrow('useFlagsContext must be used within FlagsProvider');
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Failed to fetch');
      mockFlagsApi.getFlags.mockRejectedValue(error);

      const { result } = renderHook(() => useFlagsContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toContain('Failed to fetch');
      });
    });
  });
});
