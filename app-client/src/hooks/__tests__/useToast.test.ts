import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../useToast';

describe('useToast', () => {
  it('initializes with empty toasts array', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('adds a toast with showToast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast({
        message: 'Test message',
        type: 'success',
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test message');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('adds a success toast with showSuccess', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Success message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Success message');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('adds an error toast with showError', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showError('Error message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Error message');
    expect(result.current.toasts[0].type).toBe('error');
  });

  it('adds an info toast with showInfo', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showInfo('Info message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Info message');
    expect(result.current.toasts[0].type).toBe('info');
  });

  it('adds a warning toast with showWarning', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showWarning('Warning message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Warning message');
    expect(result.current.toasts[0].type).toBe('warning');
  });

  it('adds multiple toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('First message');
      result.current.showError('Second message');
      result.current.showInfo('Third message');
    });

    expect(result.current.toasts).toHaveLength(3);
  });

  it('removes a toast by id', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('First message');
      result.current.showSuccess('Second message');
    });

    expect(result.current.toasts).toHaveLength(2);
    const firstToastId = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(firstToastId);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Second message');
  });

  it('generates unique ids for each toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Message 1');
      result.current.showSuccess('Message 2');
      result.current.showSuccess('Message 3');
    });

    const ids = result.current.toasts.map((toast) => toast.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });

  it('uses default duration of 3000ms', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Test message');
    });

    expect(result.current.toasts[0].duration).toBe(3000);
  });

  it('uses custom duration when provided', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Test message', 5000);
    });

    expect(result.current.toasts[0].duration).toBe(5000);
  });
});
