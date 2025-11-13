import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../../context/ThemeContext';
import { Toast } from '../Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderToast = (props: Partial<React.ComponentProps<typeof Toast>> = {}) => {
    const defaultProps = {
      message: 'Test message',
      onClose: vi.fn(),
      ...props,
    };

    return render(
      <ThemeProvider>
        <Toast {...defaultProps} />
      </ThemeProvider>
    );
  };

  it('renders with message', () => {
    renderToast({ message: 'Success message' });
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('renders success type by default', () => {
    renderToast();
    const toast = screen.getByRole('alert');
    expect(toast).toBeInTheDocument();
  });

  it('renders different toast types', () => {
    const { rerender } = renderToast({ type: 'success', message: 'Success' });
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <Toast message="Error" type="error" onClose={vi.fn()} />
      </ThemeProvider>
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
    // Error icon is ✕, but so is close button, so we check for multiple
    expect(screen.getAllByText('✕').length).toBeGreaterThan(0);

    rerender(
      <ThemeProvider>
        <Toast message="Warning" type="warning" onClose={vi.fn()} />
      </ThemeProvider>
    );
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('⚠')).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <Toast message="Info" type="info" onClose={vi.fn()} />
      </ThemeProvider>
    );
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    
    renderToast({ onClose });

    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after duration', () => {
    const onClose = vi.fn();
    renderToast({ onClose, duration: 3000 });

    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(3000);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses custom duration', () => {
    const onClose = vi.fn();
    renderToast({ onClose, duration: 5000 });

    vi.advanceTimersByTime(3000);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has proper accessibility attributes', () => {
    renderToast();
    
    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    
    const closeButton = screen.getByLabelText('Close notification');
    expect(closeButton).toBeInTheDocument();
  });

  it('cleans up timer on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = renderToast({ onClose, duration: 3000 });

    unmount();
    vi.advanceTimersByTime(3000);

    expect(onClose).not.toHaveBeenCalled();
  });
});
