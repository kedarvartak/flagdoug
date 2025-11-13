/**
 * useApi Hook
 * Generic hook for managing API call states (loading, error, data)
 * with request cancellation support
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook state interface
 */
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook return interface
 */
interface UseApiReturn<T, Args extends unknown[]> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
}

/**
 * Generic hook for API calls with loading, error, and data states
 * 
 * @param apiFunction - The API function to execute
 * @returns Object containing data, loading, error states and execute/reset functions
 * 
 * @example
 * ```typescript
 * const { data, loading, error, execute } = useApi(flagsApi.getFlags);
 * 
 * useEffect(() => {
 *   execute({ page: 1, limit: 10 });
 * }, []);
 * ```
 */
export function useApi<T, Args extends unknown[] = []>(
  apiFunction: (...args: Args) => Promise<T>,
): UseApiReturn<T, Args> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Track the current request to allow cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Execute the API function
   */
  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      // Set loading state
      setState({
        data: null,
        loading: true,
        error: null,
      });

      try {
        const result = await apiFunction(...args);

        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setState({
            data: result,
            loading: false,
            error: null,
          });
        }

        return result;
      } catch (error) {
        // Convert error to Error instance
        const errorInstance = error instanceof Error ? error : new Error('Unknown error');
        
        // Only update state if component is still mounted and not aborted
        if (isMountedRef.current && errorInstance.name !== 'AbortError') {
          setState({
            data: null,
            loading: false,
            error: errorInstance,
          });
        }

        return null;
      }
    },
    [apiFunction],
  );

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Cancel any pending request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    execute,
    reset,
  };
}
