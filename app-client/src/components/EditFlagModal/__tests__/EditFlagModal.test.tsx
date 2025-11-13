import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { EditFlagModal } from '../EditFlagModal';
import { ThemeProvider } from '../../../context/ThemeContext';
import { FlagsProvider } from '../../../context/FlagsContext';
import { ToastProvider } from '../../../context/ToastContext';
import type { Flag } from '../../../types/api.types';
import { FlagType, Environment } from '../../../types/api.types';

// Mock the flags API
vi.mock('../../../services/api/flags.api', () => ({
  flagsApi: {
    getFlags: vi.fn(),
    updateFlag: vi.fn(),
    createFlag: vi.fn(),
    deleteFlag: vi.fn(),
    toggleEnvironment: vi.fn(),
  },
}));

// Mock flag data
const mockFlag: Flag = {
  id: '1',
  key: 'test-flag',
  name: 'Test Flag',
  description: 'Test description',
  type: FlagType.BOOLEAN,
  enabled: true,
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

describe('EditFlagModal', () => {
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
    vi.mocked(flagsApi.updateFlag).mockResolvedValue(mockFlag);
  });

  afterEach(() => {
    cleanup();
  });

  it('should not render when isOpen is false', () => {
    renderWithProviders(
      <EditFlagModal
        isOpen={false}
        flag={mockFlag}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true and flag is provided', () => {
    renderWithProviders(
      <EditFlagModal
        isOpen={true}
        flag={mockFlag}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Edit Feature Flag')).toBeInTheDocument();
  });

  it('should pre-fill form with flag data', () => {
    renderWithProviders(
      <EditFlagModal
        isOpen={true}
        flag={mockFlag}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
    const enabledCheckbox = screen.getByLabelText(/enable flag globally/i) as HTMLInputElement;

    expect(nameInput.value).toBe('Test Flag');
    expect(descriptionInput.value).toBe('Test description');
    expect(enabledCheckbox.checked).toBe(true);
  });

  it('should display read-only flag information', () => {
    renderWithProviders(
      <EditFlagModal
        isOpen={true}
        flag={mockFlag}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('test-flag')).toBeInTheDocument();
    expect(screen.getByText('boolean')).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', () => {
    renderWithProviders(
      <EditFlagModal
        isOpen={true}
        flag={mockFlag}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close modal when cancel button is clicked', () => {
    renderWithProviders(
      <EditFlagModal
        isOpen={true}
        flag={mockFlag}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close modal when escape key is pressed', () => {
    renderWithProviders(
      <EditFlagModal
        isOpen={true}
        flag={mockFlag}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close modal when overlay is clicked', () => {
    renderWithProviders(
      <EditFlagModal
        isOpen={true}
        flag={mockFlag}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should validate required name field', async () => {
    renderWithProviders(
      <EditFlagModal
        isOpen={true}
        flag={mockFlag}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText(/name/i);
    const submitButton = screen.getByText('Update Flag');

    // Clear the name field
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('should update form fields when user types', () => {
    renderWithProviders(
      <EditFlagModal
        isOpen={true}
        flag={mockFlag}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;

    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    fireEvent.change(descriptionInput, { target: { value: 'Updated description' } });

    expect(nameInput.value).toBe('Updated Name');
    expect(descriptionInput.value).toBe('Updated description');
  });

  it('should toggle enabled checkbox', () => {
    renderWithProviders(
      <EditFlagModal
        isOpen={true}
        flag={mockFlag}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const enabledCheckbox = screen.getByLabelText(/enable flag globally/i) as HTMLInputElement;

    expect(enabledCheckbox.checked).toBe(true);

    fireEvent.click(enabledCheckbox);

    expect(enabledCheckbox.checked).toBe(false);
  });

  it('should disable buttons during submission', async () => {
    renderWithProviders(
      <EditFlagModal
        isOpen={true}
        flag={mockFlag}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByText('Update Flag') as HTMLButtonElement;
    const cancelButton = screen.getByText('Cancel') as HTMLButtonElement;

    fireEvent.click(submitButton);

    // Buttons should be disabled during submission
    await waitFor(() => {
      expect(submitButton.disabled).toBe(true);
      expect(cancelButton.disabled).toBe(true);
    });
  });

  it('should show loading text during submission', async () => {
    renderWithProviders(
      <EditFlagModal
        isOpen={true}
        flag={mockFlag}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByText('Update Flag');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Updating...')).toBeInTheDocument();
    });
  });
});
