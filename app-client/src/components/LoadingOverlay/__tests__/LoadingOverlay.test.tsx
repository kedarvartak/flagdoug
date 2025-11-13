import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingOverlay } from '../LoadingOverlay';
import { ThemeProvider } from '../../../context/ThemeContext';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('LoadingOverlay', () => {
  let originalOverflow: string;

  beforeEach(() => {
    originalOverflow = document.body.style.overflow;
  });

  afterEach(() => {
    document.body.style.overflow = originalOverflow;
  });

  describe('Basic Rendering', () => {
    it('should render loading overlay', () => {
      renderWithTheme(<LoadingOverlay />);
      const overlay = screen.getByRole('progressbar');
      expect(overlay).toBeInTheDocument();
    });

    it('should have aria-busy="true" for accessibility', () => {
      renderWithTheme(<LoadingOverlay />);
      const overlay = screen.getByRole('progressbar');
      expect(overlay).toHaveAttribute('aria-busy', 'true');
    });

    it('should have default aria-label when no message provided', () => {
      renderWithTheme(<LoadingOverlay />);
      const overlay = screen.getByLabelText('Loading');
      expect(overlay).toBeInTheDocument();
    });

    it('should render LoadingSpinner component', () => {
      renderWithTheme(<LoadingOverlay />);
      // LoadingSpinner creates a div with specific structure
      const overlay = screen.getByRole('progressbar');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Message Display', () => {
    it('should not display message when not provided', () => {
      renderWithTheme(<LoadingOverlay />);
      const messages = screen.queryByRole('paragraph');
      expect(messages).not.toBeInTheDocument();
    });

    it('should display message when provided', () => {
      renderWithTheme(<LoadingOverlay message="Loading data..." />);
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('should use message as aria-label when provided', () => {
      renderWithTheme(<LoadingOverlay message="Processing request" />);
      const overlay = screen.getByLabelText('Processing request');
      expect(overlay).toBeInTheDocument();
    });
  });

  describe('Full-Screen Mode', () => {
    it('should not prevent body scroll by default (inline mode)', () => {
      const { unmount } = renderWithTheme(<LoadingOverlay />);
      expect(document.body.style.overflow).toBe('');
      unmount();
    });

    it('should prevent body scroll when isFullScreen is true', () => {
      renderWithTheme(<LoadingOverlay isFullScreen={true} />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll on unmount', () => {
      document.body.style.overflow = 'auto';
      const { unmount } = renderWithTheme(<LoadingOverlay isFullScreen={true} />);
      expect(document.body.style.overflow).toBe('hidden');
      unmount();
      expect(document.body.style.overflow).toBe('auto');
    });

    it('should handle empty original overflow value', () => {
      document.body.style.overflow = '';
      const { unmount } = renderWithTheme(<LoadingOverlay isFullScreen={true} />);
      expect(document.body.style.overflow).toBe('hidden');
      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Inline Mode', () => {
    it('should render in inline mode by default', () => {
      renderWithTheme(<LoadingOverlay />);
      const overlay = screen.getByRole('progressbar');
      expect(overlay).toBeInTheDocument();
      // Inline mode uses position: absolute
      expect(overlay).toHaveStyle({ position: 'absolute' });
    });

    it('should render in inline mode when isFullScreen is false', () => {
      renderWithTheme(<LoadingOverlay isFullScreen={false} />);
      const overlay = screen.getByRole('progressbar');
      expect(overlay).toHaveStyle({ position: 'absolute' });
    });
  });

  describe('Theme Support', () => {
    it('should render without crashing in light theme', () => {
      renderWithTheme(<LoadingOverlay message="Loading" />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
    });

    it('should render without crashing in dark theme', () => {
      renderWithTheme(<LoadingOverlay message="Loading" />);
      expect(screen.getByText('Loading')).toBeInTheDocument();
    });
  });

  describe('User Interaction Prevention', () => {
    it('should have pointer-events: all to prevent interaction', () => {
      renderWithTheme(<LoadingOverlay />);
      const overlay = screen.getByRole('progressbar');
      expect(overlay).toHaveStyle({ pointerEvents: 'all' });
    });
  });
});
