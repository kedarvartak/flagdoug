/**
 * useApi Hook Tests
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useApi } from '../useApi';

describe('useApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const mockApiFunction = vi.fn();
    const { result } = renderHook(() => useApi(mockApiFunction));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set loading state when executing', async () => {
    const mockApiFunction = vi.fn(() => new Promise(() => {})); // Never resolves
    const { result } = renderHook(() => useApi(mockApiFunction));

    act(() => {
      result.current.execute();
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should set data on successful execution', async () => {
    const mockData = { id: '1', name: 'Test' };
    const mockApiFunction = vi.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });
  });

  it('should set error on failed execution', async () => {
    const mockError = new Error('API Error');
    const mockApiFunction = vi.fn().mockRejectedValue(mockError);
    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toEqual(mockError);
    });
  });

  it('should pass arguments to API function', async () => {
    const mockApiFunction = vi.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      await result.current.execute('arg1', 'arg2', 123);
    });

    await waitFor(() => {
      expect(mockApiFunction).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });
  });

  it('should reset state when reset is called', async () => {
    const mockData = { id: '1', name: 'Test' };
    const mockApiFunction = vi.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should return data from execute function', async () => {
    const mockData = { id: '1', name: 'Test' };
    const mockApiFunction = vi.fn().mockResolvedValue(mockData);
    const { result } = renderHook(() => useApi(mockApiFunction));

    let returnedData;
    await act(async () => {
      returnedData = await result.current.execute();
    });

    expect(returnedData).toEqual(mockData);
  });

  it('should return null from execute function on error', async () => {
    const mockError = new Error('API Error');
    const mockApiFunction = vi.fn().mockRejectedValue(mockError);
    const { result } = renderHook(() => useApi(mockApiFunction));

    let returnedData;
    await act(async () => {
      returnedData = await result.current.execute();
    });

    expect(returnedData).toBeNull();
  });

  it('should handle non-Error exceptions', async () => {
    const mockApiFunction = vi.fn().mockRejectedValue('String error');
    const { result } = renderHook(() => useApi(mockApiFunction));

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Unknown error');
    });
  });
});
