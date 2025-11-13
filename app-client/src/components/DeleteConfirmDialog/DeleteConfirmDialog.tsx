import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useFlagsContext } from '../../context/FlagsContext';
import { getDeleteConfirmDialogStyles } from './DeleteConfirmDialog.styles';

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  flagName: string;
  flagId: string;
  onConfirm?: () => void;
  onCancel: () => void;
}

export const DeleteConfirmDialog = ({
  isOpen,
  flagName,
  flagId,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) => {
  const { theme } = useTheme();
  const { deleteFlag } = useFlagsContext();
  const styles = getDeleteConfirmDialogStyles(theme);
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [isCancelHovered, setIsCancelHovered] = useState(false);
  const [isDeleteHovered, setIsDeleteHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isDeleting) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isDeleting, onCancel]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDeleteError(null);
      setIsDeleting(false);
    }
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isDeleting) {
      onCancel();
    }
  };

  // Handle confirm deletion
  const handleConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const result = await deleteFlag(flagId);

      if (result) {
        // Success - call onConfirm callback and close dialog
        onConfirm?.();
        onCancel();
      } else {
        setDeleteError('Failed to delete flag. Please try again.');
      }
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'An error occurred while deleting the flag.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (!isDeleting) {
      onCancel();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-dialog-title"
    >
      <div style={styles.dialog}>
        <div style={styles.header}>
          <h2 id="delete-confirm-dialog-title" style={styles.title}>
            <span aria-hidden="true">⚠️</span>
            Delete Feature Flag
          </h2>
          <button
            style={{
              ...styles.closeButton,
              ...(isCloseHovered ? styles.closeButtonHover : {}),
            }}
            onClick={handleCancel}
            onMouseEnter={() => setIsCloseHovered(true)}
            onMouseLeave={() => setIsCloseHovered(false)}
            aria-label="Close dialog"
            type="button"
            disabled={isDeleting}
          >
            ×
          </button>
        </div>

        <div style={styles.content}>
          <p style={styles.message}>
            Are you sure you want to delete the flag{' '}
            <span style={styles.flagName}>"{flagName}"</span>?
          </p>

          <div style={styles.warningBox}>
            <span style={styles.warningIcon} aria-hidden="true">
              ⚠️
            </span>
            <p style={styles.warningText}>
              This action cannot be undone. The flag will be permanently removed from all
              environments.
            </p>
          </div>

          {deleteError && (
            <div style={styles.errorBox} role="alert">
              <p style={styles.errorText}>{deleteError}</p>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isDeleting}
            style={{
              ...styles.button,
              ...styles.buttonCancel,
              ...(isCancelHovered && !isDeleting ? styles.buttonCancelHover : {}),
              ...(isDeleting ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
            }}
            onMouseEnter={() => setIsCancelHovered(true)}
            onMouseLeave={() => setIsCancelHovered(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            style={{
              ...styles.button,
              ...styles.buttonDelete,
              ...(isDeleteHovered && !isDeleting ? styles.buttonDeleteHover : {}),
              ...(isDeleting ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
            }}
            onMouseEnter={() => setIsDeleteHovered(true)}
            onMouseLeave={() => setIsDeleteHovered(false)}
          >
            {isDeleting ? 'Deleting...' : 'Delete Flag'}
          </button>
        </div>
      </div>
    </div>
  );
};
