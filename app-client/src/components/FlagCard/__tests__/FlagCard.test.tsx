/**
 * FlagCard Component Tests
 * Integration tests for the FlagCard component with API integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { FlagCard } from '../FlagCard';
import { ThemeProvider } from '../../../context/ThemeContext';
import { FlagsProvider } from '../../../context/FlagsContext';
import { ToastProvider } from '../../../context/ToastContext';
import type { Flag } from '../../../types/api.types';
import { FlagType, Environment } from '../../../types/api.types';

// Mock the flags API
vi.mock('../../../services/api/flags.api', () => ({
  flagsApi: {
    getFlags: vi.fn(),
    createFlag: vi.fn(),
    updateFlag: vi.fn(),
    deleteFlag: vi.fn(),
    toggleEnvironment: vi.fn(),
  },
}));

const mockFlag: Flag = {
  id: '1',
  key: 'test-flag',
  name: 'Test Flag',
  description: 'Test description',
  type: FlagType.BOOLEAN,
  enabled: true,
  environments: [
    {
      id: 'env-1',
      flagId: '1',
      environment: Environment.DEVELOPMENT,
      enabled: true,
      rolloutPercentage: 100,
      targetingRules: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'env-2',
      flagId: '1',
      environment: Environment.STAGING,
      enabled: false,
      rolloutPercentage: 50,
      targetingRules: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'env-3',
      flagId: '1',
      environment: Environment.PRODUCTION,
      enabled: false,
      rolloutPercentage: 0,
      targetingRules: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <FlagsProvider>{ui}</FlagsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

describe('FlagCard', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Mock the API calls
    const { flagsApi } = await import('../../../services/api/flags.api');
    vi.mocked(flagsApi.getFlags).mockResolvedValue({
      data: [mockFlag],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
    vi.mocked(flagsApi.toggleEnvironment).mockResolvedValue({
      ...mockFlag.environments[0],
      enabled: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('should render flag information', () => {
      renderWithProviders(<FlagCard flag={mockFlag} />);

      expect(screen.getByText('Test Flag')).toBeInTheDocument();
      expect(screen.getByText('test-flag')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should render flag type badge', () => {
      renderWithProviders(<FlagCard flag={mockFlag} />);

      expect(screen.getByText('boolean')).toBeInTheDocument();
    });

    it('should render environment toggles', () => {
      renderWithProviders(<FlagCard flag={mockFlag} />);

      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('Staging')).toBeInTheDocument();
      expect(screen.getByText('Production')).toBeInTheDocument();
    });

    it('should show enabled status for each environment', () => {
      renderWithProviders(<FlagCard flag={mockFlag} />);

      const devToggle = screen.getByRole('checkbox', { name: /development/i }) as HTMLInputElement;
      const stagingToggle = screen.getByRole('checkbox', { name: /staging/i }) as HTMLInputElement;
      const prodToggle = screen.getByRole('checkbox', { name: /production/i }) as HTMLInputElement;

      expect(devToggle.checked).toBe(true);
      expect(stagingToggle.checked).toBe(false);
      expect(prodToggle.checked).toBe(false);
    });

    it('should render action buttons', () => {
      renderWithProviders(<FlagCard flag={mockFlag} />);

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });
  });

  describe('Toggle Functionality', () => {
    it('should call toggleEnvironment when toggle is clicked', async () => {
      const { flagsApi } = await import('../../../services/api/flags.api');

      renderWithProviders(<FlagCard flag={mockFlag} />);

      const devToggle = screen.getByRole('checkbox', { name: /development/i });
      fireEvent.click(devToggle);

      await waitFor(() => {
        expect(flagsApi.toggleEnvironment).toHaveBeenCalledWith(
          '1',
          Environment.DEVELOPMENT,
          expect.objectContaining({
            enabled: false,
          })
        );
      });
    });

    it('should show loading state during toggle', async () => {
      const { flagsApi } = await import('../../../services/api/flags.api');
      vi.mocked(flagsApi.toggleEnvironment).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ...mockFlag.environments[0],
          enabled: false,
        }), 100))
      );

      renderWithProviders(<FlagCard flag={mockFlag} />);

      const devToggle = screen.getByRole('checkbox', { name: /development/i });
      fireEvent.click(devToggle);

      // Toggle should be disabled during loading
      await waitFor(() => {
        expect(devToggle).toBeDisabled();
      });
    });

    it('should update UI optimistically on toggle', async () => {
      renderWithProviders(<FlagCard flag={mockFlag} />);

      const devToggle = screen.getByRole('checkbox', { name: /development/i }) as HTMLInputElement;
      
      expect(devToggle.checked).toBe(true);

      fireEvent.click(devToggle);

      // UI should update immediately (optimistic update)
      await waitFor(() => {
        expect(devToggle.checked).toBe(false);
      });
    });

    it('should revert UI on toggle error', async () => {
      const { flagsApi } = await import('../../../services/api/flags.api');
      vi.mocked(flagsApi.toggleEnvironment).mockRejectedValue(new Error('Toggle failed'));

      renderWithProviders(<FlagCard flag={mockFlag} />);

      const devToggle = screen.getByRole('checkbox', { name: /development/i }) as HTMLInputElement;
      const originalState = devToggle.checked;

      fireEvent.click(devToggle);

      // UI should revert to original state on error
      await waitFor(() => {
        expect(devToggle.checked).toBe(originalState);
      });
    });

    it('should toggle multiple environments independently', async () => {
      const { flagsApi } = await import('../../../services/api/flags.api');

      renderWithProviders(<FlagCard flag={mockFlag} />);

      const devToggle = screen.getByRole('checkbox', { name: /development/i });
      const stagingToggle = screen.getByRole('checkbox', { name: /staging/i });

      fireEvent.click(devToggle);
      fireEvent.click(stagingToggle);

      await waitFor(() => {
        expect(flagsApi.toggleEnvironment).toHaveBeenCalledWith(
          '1',
          Environment.DEVELOPMENT,
          expect.any(Object)
        );
        expect(flagsApi.toggleEnvironment).toHaveBeenCalledWith(
          '1',
          Environment.STAGING,
          expect.any(Object)
        );
      });
    });
  });

  describe('Edit Functionality', () => {
    it('should open edit modal when edit button is clicked', () => {
      renderWithProviders(<FlagCard flag={mockFlag} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      // Edit modal should be visible
      expect(screen.getByText('Edit Feature Flag')).toBeInTheDocument();
    });

    it('should close edit modal when cancel is clicked', () => {
      renderWithProviders(<FlagCard flag={mockFlag} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      // Edit modal should be closed
      expect(screen.queryByText('Edit Feature Flag')).not.toBeInTheDocument();
    });
  });

  describe('Delete Functionality', () => {
    it('should open delete confirmation when delete button is clicked', () => {
      renderWithProviders(<FlagCard flag={mockFlag} />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      // Delete confirmation should be visible
      expect(screen.getByText('Delete Feature Flag')).toBeInTheDocument();
      expect(screen.getByText('"Test Flag"')).toBeInTheDocument();
    });

    it('should close delete confirmation when cancel is clicked', () => {
      renderWithProviders(<FlagCard flag={mockFlag} />);

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      const cancelButton = screen.getAllByRole('button', { name: /cancel/i })[0];
      fireEvent.click(cancelButton);

      // Delete confirmation should be closed
      expect(screen.queryByText('Delete Feature Flag')).not.toBeInTheDocument();
    });
  });

  describe('Percentage Flags', () => {
    it('should display rollout percentage for percentage flags', () => {
      const percentageFlag: Flag = {
        ...mockFlag,
        type: FlagType.PERCENTAGE,
      };

      renderWithProviders(<FlagCard flag={percentageFlag} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible toggle labels', () => {
      renderWithProviders(<FlagCard flag={mockFlag} />);

      expect(screen.getByLabelText(/toggle development environment/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/toggle staging environment/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/toggle production environment/i)).toBeInTheDocument();
    });

    it('should have accessible action buttons', () => {
      renderWithProviders(<FlagCard flag={mockFlag} />);

      expect(screen.getByRole('button', { name: /edit flag/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete flag/i })).toBeInTheDocument();
    });

    it('should indicate loading state to screen readers', async () => {
      const { flagsApi } = await import('../../../services/api/flags.api');
      vi.mocked(flagsApi.toggleEnvironment).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ...mockFlag.environments[0],
          enabled: false,
        }), 100))
      );

      renderWithProviders(<FlagCard flag={mockFlag} />);

      const devToggle = screen.getByRole('checkbox', { name: /development/i });
      fireEvent.click(devToggle);

      await waitFor(() => {
        expect(devToggle).toHaveAttribute('aria-busy', 'true');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when toggle fails', async () => {
      const { flagsApi } = await import('../../../services/api/flags.api');
      vi.mocked(flagsApi.toggleEnvironment).mockRejectedValue(new Error('Network error'));

      renderWithProviders(<FlagCard flag={mockFlag} />);

      const devToggle = screen.getByRole('checkbox', { name: /development/i });
      fireEvent.click(devToggle);

      await waitFor(() => {
        expect(screen.getByText(/failed to toggle/i)).toBeInTheDocument();
      });
    });
  });
});
