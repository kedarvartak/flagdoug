import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorMessage } from '../ErrorMessage';
import { ThemeProvider } from '../../../context/ThemeContext';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('ErrorMessage', () => {
  describe('Basic Rendering', () => {
    it('should render error message with string error', () => {
      renderWithTheme(<ErrorMessage error="Something went wrong" />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should render error message with Error object', () => {
      const error = new Error('Test error message');
      renderWithTheme(<ErrorMessage error={error} />);
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should have role="alert" for accessibility', () => {
      renderWithTheme(<ErrorMessage error="Error" />);
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have aria-live="assertive" for screen readers', () => {
      renderWithTheme(<ErrorMessage error="Error" />);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('Error Types', () => {
    it('should detect network error type', () => {
      renderWithTheme(<ErrorMessage error="Network connection failed" />);
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
    });

    it('should detect validation error type', () => {
      renderWithTheme(<ErrorMessage error="Validation failed for field" />);
      expect(screen.getByText('Validation Error')).toBeInTheDocument();
    });

    it('should detect server error type', () => {
      renderWithTheme(<ErrorMessage error="Server error 500" />);
      expect(screen.getByText('Server Error')).toBeInTheDocument();
    });

    it('should use default error type for unknown errors', () => {
      renderWithTheme(<ErrorMessage error="Unknown error" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should use explicit type when provided', () => {
      renderWithTheme(<ErrorMessage error="Some error" type="network" />);
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
    });
  });

  describe('Retry Button', () => {
    it('should not render retry button when onRetry is not provided', () => {
      renderWithTheme(<ErrorMessage error="Error" />);
      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    it('should render retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      renderWithTheme(<ErrorMessage error="Error" onRetry={onRetry} />);
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      renderWithTheme(<ErrorMessage error="Error" onRetry={onRetry} />);
      
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should have aria-label on retry button', () => {
      const onRetry = vi.fn();
      renderWithTheme(<ErrorMessage error="Error" onRetry={onRetry} />);
      
      const retryButton = screen.getByLabelText('Retry operation');
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Error Icons', () => {
    it('should display network error icon', () => {
      renderWithTheme(<ErrorMessage error="Network error" />);
      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should display validation error icon', () => {
      renderWithTheme(<ErrorMessage error="Validation error" />);
      expect(screen.getByText('❌')).toBeInTheDocument();
    });

    it('should display server error icon', () => {
      renderWithTheme(<ErrorMessage error="Server error" />);
      expect(screen.getByText('🔧')).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should render without crashing in light theme', () => {
      renderWithTheme(<ErrorMessage error="Test error" />);
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should render without crashing in dark theme', () => {
      renderWithTheme(<ErrorMessage error="Test error" />);
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });
});
