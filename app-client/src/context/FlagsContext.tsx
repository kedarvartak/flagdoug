/**
 * FlagsContext
 * Context provider for managing feature flags across the application
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useFlags as useFlagsHook } from '../hooks/useFlags';
import { useToastContext } from './ToastContext';
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
 * Context value interface
 */
interface FlagsContextValue {
  flags: Flag[];
  loading: boolean;
  error: Error | null;
  pagination: PaginationMeta | null;
  currentPage: number;
  operationLoading: OperationLoadingStates;
  
  fetchFlags: (page?: number) => Promise<void>;
  createFlag: (data: CreateFlagDto) => Promise<Flag | null>;
  updateFlag: (id: string, data: UpdateFlagDto) => Promise<Flag | null>;
  deleteFlag: (id: string) => Promise<boolean>;
  toggleEnvironment: (
    id: string,
    environment: Environment,
    data: ToggleEnvironmentDto,
  ) => Promise<FlagEnvironment | null>;
  setCurrentPage: (page: number) => void;
  refreshFlags: () => Promise<void>;
  isOperationLoading: (operation: 'updating' | 'deleting' | 'toggling', id: string, env?: Environment) => boolean;
}

/**
 * Create the context
 */
const FlagsContext = createContext<FlagsContextValue | undefined>(undefined);

/**
 * Provider props
 */
interface FlagsProviderProps {
  children: ReactNode;
  initialPage?: number;
  pageSize?: number;
}

/**
 * FlagsProvider component
 * Wraps the application and provides flags state and operations
 * 
 * @example
 * ```tsx
 * <FlagsProvider initialPage={1} pageSize={10}>
 *   <App />
 * </FlagsProvider>
 * ```
 */
export const FlagsProvider: React.FC<FlagsProviderProps> = ({
  children,
  initialPage = 1,
  pageSize = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const flagsHook = useFlagsHook();
  const { showSuccess } = useToastContext();

  /**
   * Fetch flags for the current page
   */
  const fetchFlags = useCallback(
    async (page?: number) => {
      const pageToFetch = page ?? currentPage;
      await flagsHook.fetchFlags(pageToFetch, pageSize);
      if (page !== undefined) {
        setCurrentPage(page);
      }
    },
    [currentPage, pageSize, flagsHook],
  );

  /**
   * Refresh flags for the current page
   */
  const refreshFlags = useCallback(async () => {
    await flagsHook.fetchFlags(currentPage, pageSize);
  }, [currentPage, pageSize, flagsHook]);

  /**
   * Create flag and refresh the list
   */
  const createFlag = useCallback(
    async (data: CreateFlagDto): Promise<Flag | null> => {
      const result = await flagsHook.createFlag(data);
      if (result) {
        // Optionally refresh to ensure consistency with backend
        await refreshFlags();
        showSuccess(`Flag "${result.name}" created successfully`);
      }
      return result;
    },
    [flagsHook, refreshFlags, showSuccess],
  );

  /**
   * Update flag
   */
  const updateFlag = useCallback(
    async (id: string, data: UpdateFlagDto): Promise<Flag | null> => {
      const result = await flagsHook.updateFlag(id, data);
      if (result) {
        showSuccess(`Flag "${result.name}" updated successfully`);
      }
      return result;
    },
    [flagsHook, showSuccess],
  );

  /**
   * Delete flag
   */
  const deleteFlag = useCallback(
    async (id: string): Promise<boolean> => {
      const result = await flagsHook.deleteFlag(id);
      if (result) {
        showSuccess('Flag deleted successfully');
      }
      return result;
    },
    [flagsHook, showSuccess],
  );

  /**
   * Toggle environment
   */
  const toggleEnvironment = useCallback(
    async (
      id: string,
      environment: Environment,
      data: ToggleEnvironmentDto,
    ): Promise<FlagEnvironment | null> => {
      const result = await flagsHook.toggleEnvironment(id, environment, data);
      if (result) {
        const status = data.enabled ? 'enabled' : 'disabled';
        showSuccess(`Environment "${environment}" ${status} successfully`);
      }
      return result;
    },
    [flagsHook, showSuccess],
  );

  /**
   * Helper to check if a specific operation is loading
   */
  const isOperationLoading = useCallback(
    (operation: 'updating' | 'deleting' | 'toggling', id: string, env?: Environment): boolean => {
      const key = env ? `${id}-${env}` : id;
      return flagsHook.operationLoading[operation][key] ?? false;
    },
    [flagsHook.operationLoading],
  );

  /**
   * Load initial flags on mount
   */
  useEffect(() => {
    fetchFlags(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const value: FlagsContextValue = {
    flags: flagsHook.flags,
    loading: flagsHook.loading,
    error: flagsHook.error,
    pagination: flagsHook.pagination,
    currentPage,
    operationLoading: flagsHook.operationLoading,
    fetchFlags,
    createFlag,
    updateFlag,
    deleteFlag,
    toggleEnvironment,
    setCurrentPage,
    refreshFlags,
    isOperationLoading,
  };

  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
};

/**
 * Hook to use the FlagsContext
 * Must be used within a FlagsProvider
 * 
 * @throws Error if used outside of FlagsProvider
 * 
 * @example
 * ```tsx
 * const { flags, loading, createFlag } = useFlagsContext();
 * ```
 */
export const useFlagsContext = (): FlagsContextValue => {
  const context = useContext(FlagsContext);
  if (!context) {
    throw new Error('useFlagsContext must be used within FlagsProvider');
  }
  return context;
};
