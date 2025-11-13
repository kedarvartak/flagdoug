import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import { ThemeProvider } from '../../../context/ThemeContext';
import { FlagsProvider } from '../../../context/FlagsContext';
import { ToastProvider } from '../../../context/ToastContext';

// Mock the FlagsContext
const mockDeleteFlag = vi.fn();

vi.mock('../../../context/FlagsContext', async () => {
  const actual = await vi.importActual('../../../context/FlagsContext');
  return {
    ...actual,
    useFlagsContext: () => ({
      deleteFlag: mockDeleteFlag,
      flags: [],
      loading: false,
      error: null,
      pagination: null,
      currentPage: 1,
      fetchFlags: vi.fn(),
      createFlag: vi.fn(),
      updateFlag: vi.fn(),
      toggleEnvironment: vi.fn(),
      setCurrentPage: vi.fn(),
    }),
  };
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <FlagsProvider>{ui}</FlagsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

describe('DeleteConfirmDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();
  const flagName = 'Test Feature Flag';
  const flagId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={false}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete Feature Flag')).toBeInTheDocument();
    });

    it('should display the flag name in the confirmation message', () => {
      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(`"${flagName}"`)).toBeInTheDocument();
    });

    it('should display warning message', () => {
      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      expect(
        screen.getByText(/This action cannot be undone/i)
      ).toBeInTheDocument();
    });

    it('should have confirm and cancel buttons', () => {
      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /delete flag/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should have close button', () => {
      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /close dialog/i })).toBeInTheDocument();
    });
  });

  describe('Cancellation', () => {
    it('should call onCancel when cancel button is clicked', () => {
      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when close button is clicked', () => {
      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      fireEvent.click(closeButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when escape key is pressed', () => {
      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when overlay is clicked', () => {
      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      const overlay = screen.getByRole('dialog');
      fireEvent.click(overlay);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Deletion', () => {
    it('should call deleteFlag when confirm button is clicked', async () => {
      mockDeleteFlag.mockResolvedValue(true);

      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete flag/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteFlag).toHaveBeenCalledWith(flagId);
      });
    });

    it('should show loading state during deletion', async () => {
      mockDeleteFlag.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
      );

      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete flag/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/deleting\.\.\./i)).toBeInTheDocument();
      });

      const deletingButton = screen.getByRole('button', { name: /deleting\.\.\./i });
      expect(deletingButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    it('should call onConfirm and onCancel on successful deletion', async () => {
      mockDeleteFlag.mockResolvedValue(true);

      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete flag/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
      });
    });

    it('should display error message on deletion failure', async () => {
      const errorMessage = 'Failed to delete flag';
      mockDeleteFlag.mockRejectedValue(new Error(errorMessage));

      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete flag/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display generic error message when deleteFlag returns false', async () => {
      mockDeleteFlag.mockResolvedValue(false);

      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete flag/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to delete flag/i)).toBeInTheDocument();
      });
    });

    it('should not call onConfirm if deletion fails', async () => {
      mockDeleteFlag.mockRejectedValue(new Error('Deletion failed'));

      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete flag/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/deletion failed/i)).toBeInTheDocument();
      });

      expect(mockOnConfirm).not.toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'delete-confirm-dialog-title');
    });

    it('should announce errors to screen readers', async () => {
      mockDeleteFlag.mockRejectedValue(new Error('Test error'));

      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete flag/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveTextContent('Test error');
      });
    });
  });

  describe('State Management', () => {
    it('should reset error state when dialog opens', () => {
      const { rerender } = renderWithProviders(
        <DeleteConfirmDialog
          isOpen={false}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      rerender(
        <ThemeProvider>
          <FlagsProvider>
            <DeleteConfirmDialog
              isOpen={true}
              flagName={flagName}
              flagId={flagId}
              onCancel={mockOnCancel}
            />
          </FlagsProvider>
        </ThemeProvider>
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should disable interactions during deletion', async () => {
      mockDeleteFlag.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 100))
      );

      renderWithProviders(
        <DeleteConfirmDialog
          isOpen={true}
          flagName={flagName}
          flagId={flagId}
          onCancel={mockOnCancel}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete flag/i });
      fireEvent.click(deleteButton);

      // All buttons should be disabled
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /deleting\.\.\./i })).toBeDisabled();
      });
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /close dialog/i })).toBeDisabled();

      // Escape key should not work
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });
});
