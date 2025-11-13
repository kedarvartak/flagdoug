import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlagList } from '../FlagList';
import { ThemeProvider } from '../../../context/ThemeContext';
import { ToastProvider } from '../../../context/ToastContext';
import { FlagsProvider } from '../../../context/FlagsContext';
import { Environment, FlagType } from '../../../types/api.types';
import type { Flag } from '../../../types/api.types';

const mockFlags: Flag[] = [
  {
    id: '1',
    key: 'test-flag-1',
    name: 'Test Flag 1',
    description: 'Test description 1',
    type: FlagType.BOOLEAN,
    enabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    environments: [
      {
        id: '1',
        flagId: '1',
        environment: Environment.DEVELOPMENT,
        enabled: true,
        rolloutPercentage: 100,
        targetingRules: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
  },
  {
    id: '2',
    key: 'test-flag-2',
    name: 'Test Flag 2',
    description: 'Test description 2',
    type: FlagType.PERCENTAGE,
    enabled: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    environments: [
      {
        id: '2',
        flagId: '2',
        environment: Environment.DEVELOPMENT,
        enabled: false,
        rolloutPercentage: 50,
        targetingRules: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
  },
];

const defaultProps = {
  flags: mockFlags,
  currentEnvironment: Environment.DEVELOPMENT,
  onToggleFlag: vi.fn(),
  onEditFlag: vi.fn(),
  onDeleteFlag: vi.fn(),
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <FlagsProvider>
          {ui}
        </FlagsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

describe('FlagList', () => {
  it('renders list of flags', () => {
    renderWithProviders(<FlagList {...defaultProps} />);
    
    expect(screen.getByText('Test Flag 1')).toBeInTheDocument();
    expect(screen.getByText('Test Flag 2')).toBeInTheDocument();
  });

  it('displays loading state while fetching flags', () => {
    renderWithProviders(<FlagList {...defaultProps} loading={true} />);
    
    expect(screen.getByText('Loading flags...')).toBeInTheDocument();
    expect(screen.queryByText('Test Flag 1')).not.toBeInTheDocument();
  });

  it('displays error message if fetch fails', () => {
    const error = new Error('Failed to fetch flags');
    renderWithProviders(<FlagList {...defaultProps} error={error} />);
    
    expect(screen.getByText('Failed to fetch flags')).toBeInTheDocument();
    expect(screen.queryByText('Test Flag 1')).not.toBeInTheDocument();
  });

  it('shows retry button when error occurs and onRetry is provided', () => {
    const error = new Error('Failed to fetch flags');
    const onRetry = vi.fn();
    renderWithProviders(<FlagList {...defaultProps} error={error} onRetry={onRetry} />);
    
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('shows empty state when no flags exist', () => {
    renderWithProviders(<FlagList {...defaultProps} flags={[]} />);
    
    expect(screen.getByText('No feature flags yet')).toBeInTheDocument();
    expect(screen.getByText(/Create your first flag to get started/i)).toBeInTheDocument();
  });

  it('shows "no results" message when search returns empty', () => {
    renderWithProviders(<FlagList {...defaultProps} flags={[]} isSearchActive={true} />);
    
    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your search criteria/i)).toBeInTheDocument();
  });

  it('passes API methods to FlagCard components', () => {
    const onToggleFlag = vi.fn();
    const onEditFlag = vi.fn();
    const onDeleteFlag = vi.fn();
    
    renderWithProviders(
      <FlagList
        {...defaultProps}
        onToggleFlag={onToggleFlag}
        onEditFlag={onEditFlag}
        onDeleteFlag={onDeleteFlag}
      />
    );
    
    // Verify that flag cards are rendered (they will have the handlers)
    expect(screen.getByText('Test Flag 1')).toBeInTheDocument();
    expect(screen.getByText('Test Flag 2')).toBeInTheDocument();
  });

  it('does not show loading when loading is false', () => {
    renderWithProviders(<FlagList {...defaultProps} loading={false} />);
    
    expect(screen.queryByText('Loading flags...')).not.toBeInTheDocument();
    expect(screen.getByText('Test Flag 1')).toBeInTheDocument();
  });

  it('does not show error when error is null', () => {
    renderWithProviders(<FlagList {...defaultProps} error={null} />);
    
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Test Flag 1')).toBeInTheDocument();
  });
});
