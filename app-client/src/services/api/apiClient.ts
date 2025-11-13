/**
 * API Client
 * Base HTTP client for making API requests with error handling
 */

import { API_CONFIG } from '../../config/api.config';
import { ApiError } from '../../types/api.types';
import {
  retryWithBackoff,
  logError,
  type RetryConfig,
} from '../../utils/errorHandling';

/**
 * HTTP request options
 */
interface RequestOptions extends RequestInit {
  timeout?: number;
  retry?: boolean;
  retryConfig?: Partial<RetryConfig>;
}

/**
 * API Client class
 * Handles all HTTP communication with the backend
 */
class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;
  private defaultHeaders: HeadersInit;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.defaultTimeout = API_CONFIG.timeout;
    this.defaultHeaders = API_CONFIG.headers;
  }

  /**
   * Make an HTTP request with timeout and error handling
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retry = true,
      retryConfig,
      ...fetchOptions
    } = options;

    // Create the request function
    const makeRequest = async (): Promise<T> => {
      // Merge headers
      const headers = {
        ...this.defaultHeaders,
        ...fetchOptions.headers,
      };

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const url = `${this.baseURL}${endpoint}`;

        const response = await fetch(url, {
          ...fetchOptions,
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle different response statuses
        if (!response.ok) {
          await this.handleErrorResponse(response);
        }

        // Handle 204 No Content
        if (response.status === 204) {
          return undefined as T;
        }

        // Parse JSON response
        const data = await response.json();
        return data as T;
      } catch (error) {
        clearTimeout(timeoutId);

        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
          const timeoutError = new ApiError(
            408,
            'Request timeout. Please check your connection and try again.',
          );
          logError(timeoutError, `Request to ${endpoint}`);
          throw timeoutError;
        }

        // Handle network errors
        if (error instanceof TypeError) {
          const networkError = new ApiError(
            0,
            'Network error. Please check your connection and try again.',
          );
          logError(networkError, `Request to ${endpoint}`);
          throw networkError;
        }

        // Log and re-throw ApiError
        if (error instanceof ApiError) {
          logError(error, `Request to ${endpoint}`);
          throw error;
        }

        // Unknown error
        const unknownError = new ApiError(
          500,
          'An unexpected error occurred. Please try again.',
        );
        logError(unknownError, `Request to ${endpoint}`);
        throw unknownError;
      }
    };

    // Apply retry logic if enabled
    if (retry) {
      return retryWithBackoff(makeRequest, retryConfig);
    }

    return makeRequest();
  }

  /**
   * Handle error responses from the API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = this.getDefaultErrorMessage(response.status);
    let validationErrors;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;

      // Extract validation errors if present (NestJS format)
      if (errorData.errors && Array.isArray(errorData.errors)) {
        validationErrors = errorData.errors;
      }
      // Handle class-validator format
      else if (errorData.message && Array.isArray(errorData.message)) {
        validationErrors = errorData.message.map((msg: string) => ({
          field: 'unknown',
          message: msg,
        }));
      }
    } catch {
      // If response body is not JSON, use status text or default message
      errorMessage = response.statusText || errorMessage;
    }

    throw new ApiError(response.status, errorMessage, validationErrors);
  }

  /**
   * Get default error message based on status code
   */
  private getDefaultErrorMessage(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'You are not authorized. Please log in.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'A conflict occurred. The resource may already exist.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'A server error occurred. Please try again later.';
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.';
      case 503:
        return 'Service unavailable. Please try again later.';
      case 504:
        return 'Gateway timeout. The server took too long to respond.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
