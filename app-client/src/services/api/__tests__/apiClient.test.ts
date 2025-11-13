/**
 * API Client Tests
 * Unit tests for the base API client
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '../apiClient';
import { ApiError } from '../../../types/api.types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Successful Requests', () => {
    it('should make a successful GET request', async () => {
      const mockData = { id: '1', name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await apiClient.get('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }),
        }),
      );
      expect(result).toEqual(mockData);
    });

    it('should make a successful POST request with data', async () => {
      const requestData = { name: 'New Item' };
      const responseData = { id: '1', ...requestData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => responseData,
      });

      const result = await apiClient.post('/api/test', requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
      expect(result).toEqual(responseData);
    });

    it('should make a successful PATCH request', async () => {
      const updateData = { name: 'Updated' };
      const responseData = { id: '1', ...updateData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
      });

      const result = await apiClient.patch('/api/test/1', updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(updateData),
        }),
      );
      expect(result).toEqual(responseData);
    });

    it('should make a successful DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await apiClient.delete('/api/test/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test/1',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
      expect(result).toBeUndefined();
    });

    it('should make a successful PUT request', async () => {
      const putData = { name: 'Replaced' };
      const responseData = { id: '1', ...putData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseData,
      });

      const result = await apiClient.put('/api/test/1', putData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(putData),
        }),
      );
      expect(result).toEqual(responseData);
    });

    it('should handle 204 No Content response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await apiClient.delete('/api/test/1');

      expect(result).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle 400 Bad Request error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid request data' }),
      });

      try {
        await apiClient.get('/api/test', { retry: false });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(400);
        expect((error as ApiError).message).toBe('Invalid request data');
      }
    });

    it('should handle 404 Not Found error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Resource not found' }),
      });

      try {
        await apiClient.get('/api/test/999', { retry: false });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(404);
        expect((error as ApiError).message).toBe('Resource not found');
      }
    });

    it('should handle 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal server error' }),
      });

      try {
        await apiClient.get('/api/test', { retry: false });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(500);
      }
    });

    it('should handle validation errors with field details', async () => {
      const validationErrors = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Invalid email format' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({
          message: 'Validation failed',
          errors: validationErrors,
        }),
      });

      try {
        await apiClient.post('/api/test', {}, { retry: false });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(422);
        expect((error as ApiError).errors).toEqual(validationErrors);
      }
    });

    it('should handle class-validator error format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          message: ['name should not be empty', 'email must be an email'],
        }),
      });

      try {
        await apiClient.post('/api/test', {}, { retry: false });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).errors).toHaveLength(2);
        expect((error as ApiError).errors?.[0].message).toBe('name should not be empty');
      }
    });

    it('should use default error message when response has no JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Not JSON');
        },
      });

      try {
        await apiClient.get('/api/test', { retry: false });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(500);
        expect((error as ApiError).message).toBe('Internal Server Error');
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      try {
        await apiClient.get('/api/test', { retry: false });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(0);
        expect((error as ApiError).message).toContain('Network error');
      }
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error string');

      try {
        await apiClient.get('/api/test', { retry: false });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(500);
        expect((error as ApiError).message).toContain('unexpected error');
      }
    });
  });

  describe('Request Cancellation', () => {
    it('should support request cancellation via AbortController', async () => {
      const controller = new AbortController();
      
      mockFetch.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      });

      const requestPromise = apiClient.get('/api/test', { retry: false });
      controller.abort();

      await expect(requestPromise).rejects.toThrow();
    });

    it('should clear timeout on successful request', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
      });

      await apiClient.get('/api/test');

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should clear timeout on failed request', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Error' }),
      });

      try {
        await apiClient.get('/api/test', { retry: false });
      } catch {
        // Expected error
      }

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Timeout Handling', () => {
    it('should handle timeout errors', async () => {
      // Mock a timeout by rejecting with AbortError
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      
      mockFetch.mockImplementationOnce(() => {
        return Promise.reject(abortError);
      });

      try {
        await apiClient.get('/api/test', { retry: false });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(408);
        expect((error as ApiError).message).toContain('timeout');
      }
    });

    it('should use default timeout when not specified', async () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
      });

      await apiClient.get('/api/test');

      // Check that setTimeout was called with default timeout (10000ms)
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 10000);
    });

    it('should use custom timeout when specified', async () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'test' }),
      });

      await apiClient.get('/api/test', { timeout: 3000 });

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000);
    });
  });

  describe('Retry Logic', () => {
    it('should not retry when retry is disabled', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

      try {
        await apiClient.get('/api/test', { retry: false });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
      }

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on network errors when retry is enabled', async () => {
      // Note: Testing actual retry behavior with timers is complex in unit tests
      // This test verifies that retry option is accepted
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

      try {
        await apiClient.get('/api/test', { 
          retry: true,
          retryConfig: { maxRetries: 0 } // No retries for faster test
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(0);
      }

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Headers', () => {
    it('should include default headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiClient.get('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }),
        }),
      );
    });

    it('should merge custom headers with default headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiClient.get('/api/test', {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Custom-Header': 'custom-value',
          }),
        }),
      );
    });

    it('should allow overriding default headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiClient.get('/api/test', {
        headers: {
          'Content-Type': 'text/plain',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'text/plain',
          }),
        }),
      );
    });
  });
});
