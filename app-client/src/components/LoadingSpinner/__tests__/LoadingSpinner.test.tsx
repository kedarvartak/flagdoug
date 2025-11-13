import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';
import { ThemeProvider } from '../../../context/ThemeContext';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    renderWithTheme(<LoadingSpinner />);
    expect(document.querySelector('[style*="animation"]')).toBeInTheDocument();
  });

  it('renders with default medium size', () => {
    const { container } = renderWithTheme(<LoadingSpinner />);
    const spinner = container.querySelector('[style*="width"]');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with small size', () => {
    const { container } = renderWithTheme(<LoadingSpinner size="small" />);
    const spinner = container.querySelector('[style*="width"]');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with large size', () => {
    const { container } = renderWithTheme(<LoadingSpinner size="large" />);
    const spinner = container.querySelector('[style*="width"]');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with optional message', () => {
    renderWithTheme(<LoadingSpinner message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('does not render message when not provided', () => {
    const { container } = renderWithTheme(<LoadingSpinner />);
    const message = container.querySelector('p');
    expect(message).not.toBeInTheDocument();
  });

  it('applies theme colors correctly', () => {
    const { container } = renderWithTheme(<LoadingSpinner />);
    const spinnerCircle = container.querySelector('[style*="border"]');
    expect(spinnerCircle).toBeInTheDocument();
  });
});
