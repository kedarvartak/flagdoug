/**
 * CreateFlagModal Component Tests
 * Integration tests for the CreateFlagModal component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { CreateFlagModal } from '../CreateFlagModal';
import { ThemeProvider } from '../../../context/ThemeContext';
import { FlagsProvider } from '../../../context/FlagsContext';
import { ToastProvider } from '../../../context/ToastContext';
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

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <FlagsProvider>{ui}</FlagsProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

describe('CreateFlagModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    // Mock the API calls to prevent actual network requests
    const { flagsApi } = await import('../../../services/api/flags.api');
    vi.mocked(flagsApi.getFlags).mockResolvedValue({
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
    vi.mocked(flagsApi.createFlag).mockResolvedValue({
      id: '1',
      key: 'new-flag',
      name: 'New Flag',
      description: 'New flag description',
      type: FlagType.BOOLEAN,
      enabled: true,
      environments: [],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Create Feature Flag')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByLabelText(/flag key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/flag type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/enable flag globally/i)).toBeInTheDocument();
    });

    it('should have create and cancel buttons', () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByRole('button', { name: /create flag/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should update form fields when user types', () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const keyInput = screen.getByLabelText(/flag key/i) as HTMLInputElement;
      const nameInput = screen.getByLabelText(/^name/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;

      fireEvent.change(keyInput, { target: { value: 'test-flag' } });
      fireEvent.change(nameInput, { target: { value: 'Test Flag' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

      expect(keyInput.value).toBe('test-flag');
      expect(nameInput.value).toBe('Test Flag');
      expect(descriptionInput.value).toBe('Test description');
    });

    it('should toggle enabled checkbox', () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const enabledCheckbox = screen.getByLabelText(/enable flag globally/i) as HTMLInputElement;

      expect(enabledCheckbox.checked).toBe(true);

      fireEvent.click(enabledCheckbox);

      expect(enabledCheckbox.checked).toBe(false);
    });

    it('should change flag type', () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const typeSelect = screen.getByLabelText(/flag type/i) as HTMLSelectElement;

      fireEvent.change(typeSelect, { target: { value: FlagType.PERCENTAGE } });

      expect(typeSelect.value).toBe(FlagType.PERCENTAGE);
    });
  });

  describe('Form Validation', () => {
    it('should validate required key field', async () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create flag/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/key is required/i)).toBeInTheDocument();
      });
    });

    it('should validate required name field', async () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const keyInput = screen.getByLabelText(/flag key/i);
      fireEvent.change(keyInput, { target: { value: 'test-flag' } });

      const submitButton = screen.getByRole('button', { name: /create flag/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate key format', async () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const keyInput = screen.getByLabelText(/flag key/i);
      fireEvent.change(keyInput, { target: { value: 'Invalid Key!' } });

      const submitButton = screen.getByRole('button', { name: /create flag/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/key must contain only lowercase letters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const { flagsApi } = await import('../../../services/api/flags.api');

      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const keyInput = screen.getByLabelText(/flag key/i);
      const nameInput = screen.getByLabelText(/^name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      fireEvent.change(keyInput, { target: { value: 'test-flag' } });
      fireEvent.change(nameInput, { target: { value: 'Test Flag' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

      const submitButton = screen.getByRole('button', { name: /create flag/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(flagsApi.createFlag).toHaveBeenCalledWith(
          expect.objectContaining({
            key: 'test-flag',
            name: 'Test Flag',
            description: 'Test description',
            type: FlagType.BOOLEAN,
            enabled: true,
          })
        );
      });
    });

    it('should show loading state during submission', async () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const keyInput = screen.getByLabelText(/flag key/i);
      const nameInput = screen.getByLabelText(/^name/i);

      fireEvent.change(keyInput, { target: { value: 'test-flag' } });
      fireEvent.change(nameInput, { target: { value: 'Test Flag' } });

      const submitButton = screen.getByRole('button', { name: /create flag/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/creating\.\.\./i)).toBeInTheDocument();
      });
    });

    it('should disable buttons during submission', async () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const keyInput = screen.getByLabelText(/flag key/i);
      const nameInput = screen.getByLabelText(/^name/i);

      fireEvent.change(keyInput, { target: { value: 'test-flag' } });
      fireEvent.change(nameInput, { target: { value: 'Test Flag' } });

      const submitButton = screen.getByRole('button', { name: /create flag/i }) as HTMLButtonElement;
      const cancelButton = screen.getByRole('button', { name: /cancel/i }) as HTMLButtonElement;

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton.disabled).toBe(true);
        expect(cancelButton.disabled).toBe(true);
      });
    });

    it('should call onSuccess and onClose on successful submission', async () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const keyInput = screen.getByLabelText(/flag key/i);
      const nameInput = screen.getByLabelText(/^name/i);

      fireEvent.change(keyInput, { target: { value: 'test-flag' } });
      fireEvent.change(nameInput, { target: { value: 'Test Flag' } });

      const submitButton = screen.getByRole('button', { name: /create flag/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should display error message on submission failure', async () => {
      const { flagsApi } = await import('../../../services/api/flags.api');
      const errorMessage = 'Failed to create flag';
      vi.mocked(flagsApi.createFlag).mockRejectedValue(new Error(errorMessage));

      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const keyInput = screen.getByLabelText(/flag key/i);
      const nameInput = screen.getByLabelText(/^name/i);

      fireEvent.change(keyInput, { target: { value: 'test-flag' } });
      fireEvent.change(nameInput, { target: { value: 'Test Flag' } });

      const submitButton = screen.getByRole('button', { name: /create flag/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Modal Controls', () => {
    it('should close modal when close button is clicked', () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const closeButton = screen.getByLabelText(/close modal/i);
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when cancel button is clicked', () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when escape key is pressed', () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should close modal when overlay is clicked', () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const overlay = screen.getByRole('dialog');
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Environment Configuration', () => {
    it('should include environment configurations in submission', async () => {
      const { flagsApi } = await import('../../../services/api/flags.api');

      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const keyInput = screen.getByLabelText(/flag key/i);
      const nameInput = screen.getByLabelText(/^name/i);

      fireEvent.change(keyInput, { target: { value: 'test-flag' } });
      fireEvent.change(nameInput, { target: { value: 'Test Flag' } });

      const submitButton = screen.getByRole('button', { name: /create flag/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(flagsApi.createFlag).toHaveBeenCalledWith(
          expect.objectContaining({
            environments: expect.arrayContaining([
              expect.objectContaining({
                environment: expect.any(String),
                enabled: expect.any(Boolean),
              }),
            ]),
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should announce errors to screen readers', async () => {
      renderWithProviders(
        <CreateFlagModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create flag/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorElements = screen.getAllByRole('alert');
        expect(errorElements.length).toBeGreaterThan(0);
      });
    });
  });
});
