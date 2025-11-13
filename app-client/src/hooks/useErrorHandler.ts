/**
 * useErrorHandler Hook
 * Custom hook for handling errors with user-friendly messages
 */

import { useState, useCallback } from 'react';
import {
  getUserFriendlyMessage,
  mapValidationErrors,
  classifyError,
  ErrorType,
  createErrorReport,
} from '../utils/errorHandling';

/**
 * Error handler state
 */
interface ErrorHandlerState {
  error: Error | null;
  errorMessage: string | null;
  errorType: ErrorType | null;
  fieldErrors: Record<string, string> | null;
}

/**
 * Error handler return type
 */
interface UseErrorHandlerReturn extends ErrorHandlerState {
  handleError: (error: unknown, context?: string) => void;
  clearError: () => void;
  hasError: boolean;
  isNetworkError: boolean;
  isValidationError: boolean;
  getFieldError: (field: string) => string | undefined;
}

/**
 * Custom hook for handling errors
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [state, setState] = useState<ErrorHandlerState>({
    error: null,
    errorMessage: null,
    errorType: null,
    fieldErrors: null,
  });

  /**
   * Handle an error
   */
  const handleError = useCallback((error: unknown, context?: string) => {
    const errorType = classifyError(error);
    const errorMessage = getUserFriendlyMessage(error);
    const fieldErrors = mapValidationErrors(error);

    // Create error report for debugging
    const report = createErrorReport(error);
    console.error('Error handled:', report, context ? { context } : {});

    setState({
      error: error instanceof Error ? error : new Error(String(error)),
      errorMessage,
      errorType,
      fieldErrors,
    });
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState({
      error: null,
      errorMessage: null,
      errorType: null,
      fieldErrors: null,
    });
  }, []);

  /**
   * Get error message for a specific field
   */
  const getFieldError = useCallback(
    (field: string): string | undefined => {
      return state.fieldErrors?.[field];
    },
    [state.fieldErrors],
  );

  return {
    ...state,
    handleError,
    clearError,
    hasError: state.error !== null,
    isNetworkError: state.errorType === ErrorType.NETWORK,
    isValidationError: state.errorType === ErrorType.VALIDATION,
    getFieldError,
  };
}
