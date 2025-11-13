/**
 * useFlags Hook
 * Custom hook for managing feature flags with optimistic updates
 */

import { useState, useCallback } from 'react';
import { flagsApi } from '../services/api/flags.api';
import type {
  Flag,
  FlagEnvironment,
  CreateFlagDto,
  UpdateFlagDto,
  ToggleEnvironmentDto,
  PaginationMeta,
  Environment,
} from '../types/api.types';

/**
 * Hook state interface
 */
interface UseFlagsState {
  flags: Flag[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationMeta | null;
}

/**
 * Individual operation loading states
 */
interface OperationLoadingStates {
  fetching: boolean;
  creating: boolean;
  updating: Record<string, boolean>;
  deleting: Record<string, boolean>;
  toggling: Record<string, boolean>;
}

/**
 * Hook return interface
 */
interface UseFlagsReturn {
  flags: Flag[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationMeta | null;
  operationLoading: OperationLoadingStates;
  
  fetchFlags: (page?: number, limit?: number) => Promise<void>;
  createFlag: (data: CreateFlagDto) => Promise<Flag | null>;
  updateFlag: (id: string, data: UpdateFlagDto) => Promise<Flag | null>;
  deleteFlag: (id: string) => Promise<boolean>;
  toggleEnvironment: (
    id: string,
    environment: Environment,
    data: ToggleEnvironmentDto,
  ) => Promise<FlagEnvironment | null>;
  reset: () => void;
}

/**
 * Custom hook for managing feature flags
 * Provides CRUD operations with optimistic updates and loading states
 * 
 * @returns Object containing flags data and operation methods
 * 
 * @example
 * ```typescript
 * const { flags, loading, fetchFlags, createFlag } = useFlags();
 * 
 * useEffect(() => {
 *   fetchFlags(1, 10);
 * }, []);
 * ```
 */
export function useFlags(): UseFlagsReturn {
  const [state, setState] = useState<UseFlagsState>({
    flags: [],
    loading: false,
    error: null,
    pagination: null,
  });

  const [operationLoading, setOperationLoading] = useState<OperationLoadingStates>({
    fetching: false,
    creating: false,
    updating: {},
    deleting: {},
    toggling: {},
  });

  /**
   * Fetch flags with pagination
   */
  const fetchFlags = useCallback(async (page = 1, limit = 10): Promise<void> => {
    setOperationLoading((prev) => ({ ...prev, fetching: true }));
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await flagsApi.getFlags({ page, limit });

      setState({
        flags: response.data,
        loading: false,
        error: null,
        pagination: response.meta,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch flags'),
      }));
    } finally {
      setOperationLoading((prev) => ({ ...prev, fetching: false }));
    }
  }, []);

  /**
   * Create a new flag with optimistic update
   */
  const createFlag = useCallback(async (data: CreateFlagDto): Promise<Flag | null> => {
    setOperationLoading((prev) => ({ ...prev, creating: true }));
    setState((prev) => ({ ...prev, error: null }));

    try {
      const newFlag = await flagsApi.createFlag(data);

      // Optimistically add the new flag to the list
      setState((prev) => ({
        ...prev,
        flags: [newFlag, ...prev.flags],
        pagination: prev.pagination
          ? { ...prev.pagination, total: prev.pagination.total + 1 }
          : null,
      }));

      return newFlag;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to create flag'),
      }));
      return null;
    } finally {
      setOperationLoading((prev) => ({ ...prev, creating: false }));
    }
  }, []);

  /**
   * Update a flag with optimistic update
   */
  const updateFlag = useCallback(
    async (id: string, data: UpdateFlagDto): Promise<Flag | null> => {
      setOperationLoading((prev) => ({
        ...prev,
        updating: { ...prev.updating, [id]: true },
      }));
      setState((prev) => ({ ...prev, error: null }));

      // Store original flag for rollback
      const originalFlags = state.flags;
      const flagIndex = originalFlags.findIndex((f) => f.id === id);

      if (flagIndex === -1) {
        setOperationLoading((prev) => ({
          ...prev,
          updating: { ...prev.updating, [id]: false },
        }));
        return null;
      }

      // Optimistically update the flag
      const optimisticFlags = [...originalFlags];
      optimisticFlags[flagIndex] = {
        ...optimisticFlags[flagIndex],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      setState((prev) => ({
        ...prev,
        flags: optimisticFlags,
      }));

      try {
        const updatedFlag = await flagsApi.updateFlag(id, data);

        // Update with actual server response
        setState((prev) => ({
          ...prev,
          flags: prev.flags.map((f) => (f.id === id ? updatedFlag : f)),
        }));

        return updatedFlag;
      } catch (error) {
        // Rollback on error
        setState((prev) => ({
          ...prev,
          flags: originalFlags,
          error: error instanceof Error ? error : new Error('Failed to update flag'),
        }));
        return null;
      } finally {
        setOperationLoading((prev) => ({
          ...prev,
          updating: { ...prev.updating, [id]: false },
        }));
      }
    },
    [state.flags],
  );

  /**
   * Delete a flag with optimistic update
   */
  const deleteFlag = useCallback(
    async (id: string): Promise<boolean> => {
      setOperationLoading((prev) => ({
        ...prev,
        deleting: { ...prev.deleting, [id]: true },
      }));
      setState((prev) => ({ ...prev, error: null }));

      // Store original flags for rollback
      const originalFlags = state.flags;

      // Optimistically remove the flag
      setState((prev) => ({
        ...prev,
        flags: prev.flags.filter((f) => f.id !== id),
        pagination: prev.pagination
          ? { ...prev.pagination, total: prev.pagination.total - 1 }
          : null,
      }));

      try {
        await flagsApi.deleteFlag(id);
        return true;
      } catch (error) {
        // Rollback on error
        setState((prev) => ({
          ...prev,
          flags: originalFlags,
          pagination: prev.pagination
            ? { ...prev.pagination, total: prev.pagination.total + 1 }
            : null,
          error: error instanceof Error ? error : new Error('Failed to delete flag'),
        }));
        return false;
      } finally {
        setOperationLoading((prev) => ({
          ...prev,
          deleting: { ...prev.deleting, [id]: false },
        }));
      }
    },
    [state.flags],
  );

  /**
   * Toggle environment with optimistic update
   */
  const toggleEnvironment = useCallback(
    async (
      id: string,
      environment: Environment,
      data: ToggleEnvironmentDto,
    ): Promise<FlagEnvironment | null> => {
      const toggleKey = `${id}-${environment}`;
      setOperationLoading((prev) => ({
        ...prev,
        toggling: { ...prev.toggling, [toggleKey]: true },
      }));
      setState((prev) => ({ ...prev, error: null }));

      // Store original flags for rollback
      const originalFlags = state.flags;
      const flagIndex = originalFlags.findIndex((f) => f.id === id);

      if (flagIndex === -1) {
        setOperationLoading((prev) => ({
          ...prev,
          toggling: { ...prev.toggling, [toggleKey]: false },
        }));
        return null;
      }

      // Optimistically update the environment
      const optimisticFlags = [...originalFlags];
      const flag = optimisticFlags[flagIndex];
      const envIndex = flag.environments.findIndex((e) => e.environment === environment);

      if (envIndex !== -1) {
        optimisticFlags[flagIndex] = {
          ...flag,
          environments: flag.environments.map((env) =>
            env.environment === environment
              ? {
                  ...env,
                  enabled: data.enabled,
                  rolloutPercentage: data.rolloutPercentage ?? env.rolloutPercentage,
                  updatedAt: new Date().toISOString(),
                }
              : env,
          ),
        };

        setState((prev) => ({
          ...prev,
          flags: optimisticFlags,
        }));
      }

      try {
        const updatedEnvironment = await flagsApi.toggleEnvironment(id, environment, data);

        // Update with actual server response
        setState((prev) => ({
          ...prev,
          flags: prev.flags.map((f) =>
            f.id === id
              ? {
                  ...f,
                  environments: f.environments.map((env) =>
                    env.environment === environment ? updatedEnvironment : env,
                  ),
                }
              : f,
          ),
        }));

        return updatedEnvironment;
      } catch (error) {
        // Rollback on error
        setState((prev) => ({
          ...prev,
          flags: originalFlags,
          error:
            error instanceof Error ? error : new Error('Failed to toggle environment'),
        }));
        return null;
      } finally {
        setOperationLoading((prev) => ({
          ...prev,
          toggling: { ...prev.toggling, [toggleKey]: false },
        }));
      }
    },
    [state.flags],
  );

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    setState({
      flags: [],
      loading: false,
      error: null,
      pagination: null,
    });
    setOperationLoading({
      fetching: false,
      creating: false,
      updating: {},
      deleting: {},
      toggling: {},
    });
  }, []);

  return {
    flags: state.flags,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    operationLoading,
    fetchFlags,
    createFlag,
    updateFlag,
    deleteFlag,
    toggleEnvironment,
    reset,
  };
}
