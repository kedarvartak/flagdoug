import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useFlagsContext } from '../../context/FlagsContext';
import { getEditFlagModalStyles } from './EditFlagModal.styles';
import type { Flag, UpdateFlagDto } from '../../types/api.types';

export interface EditFlagModalProps {
  isOpen: boolean;
  flag: Flag | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  description: string;
  enabled: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
}

export const EditFlagModal = ({ isOpen, flag, onClose, onSuccess }: EditFlagModalProps) => {
  const { theme } = useTheme();
  const { updateFlag } = useFlagsContext();
  const styles = getEditFlagModalStyles(theme);
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    enabled: false,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});

  // Pre-fill form when flag changes or modal opens
  useEffect(() => {
    if (isOpen && flag) {
      setFormData({
        name: flag.name,
        description: flag.description || '',
        enabled: flag.enabled,
      });
      setErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, flag]);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!flag) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Transform form data to UpdateFlagDto
      const updateFlagDto: UpdateFlagDto = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        enabled: formData.enabled,
      };

      // Call API to update flag
      const result = await updateFlag(flag.id, updateFlagDto);

      if (result) {
        // Success - close modal and call onSuccess callback
        onSuccess?.();
        onClose();
      } else {
        setSubmitError('Failed to update flag. Please try again.');
      }
    } catch (error) {
      // Handle validation errors from backend
      if (error && typeof error === 'object' && 'errors' in error) {
        const apiError = error as { errors?: Array<{ field: string; message: string }> };
        if (apiError.errors && Array.isArray(apiError.errors)) {
          const newErrors: FormErrors = {};
          apiError.errors.forEach((err) => {
            if (err.field && err.message) {
              // Handle top-level fields
              if (err.field === 'name' || err.field === 'description') {
                newErrors[err.field] = err.message;
              }
            }
          });
          setErrors(newErrors);
          setSubmitError('Please fix the validation errors below.');
        } else {
          setSubmitError(error instanceof Error ? error.message : 'An error occurred while updating the flag.');
        }
      } else {
        setSubmitError(error instanceof Error ? error.message : 'An error occurred while updating the flag.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    onClose();
  };

  if (!isOpen || !flag) {
    return null;
  }

  return (
    <div
      style={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-flag-modal-title"
    >
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 id="edit-flag-modal-title" style={styles.title}>
            Edit Feature Flag
          </h2>
          <button
            style={{
              ...styles.closeButton,
              ...(isCloseHovered ? styles.closeButtonHover : {}),
            }}
            onClick={onClose}
            onMouseEnter={() => setIsCloseHovered(true)}
            onMouseLeave={() => setIsCloseHovered(false)}
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={styles.content}>
            {submitError && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: `${theme.colors.danger}20`,
                  border: `1px solid ${theme.colors.danger}`,
                  borderRadius: '6px',
                  marginBottom: '1rem',
                }}
                role="alert"
              >
                <span style={{ color: theme.colors.danger, fontSize: '0.875rem' }}>
                  {submitError}
                </span>
              </div>
            )}

            {/* Read-only flag information */}
            <div style={styles.infoSection}>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={styles.infoLabel}>Flag Key</div>
                <div style={styles.infoValue}>{flag.key}</div>
              </div>
              <div>
                <div style={styles.infoLabel}>Flag Type</div>
                <div style={styles.infoValue}>{flag.type}</div>
              </div>
            </div>

            <div style={styles.form}>
              {/* Name Field */}
              <div style={styles.formGroup}>
                <label htmlFor="flag-name" style={styles.label}>
                  Name<span style={styles.requiredMark}>*</span>
                </label>
                <input
                  id="flag-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  style={{
                    ...styles.input,
                    ...(errors.name ? styles.inputError : {}),
                  }}
                  placeholder="e.g., New Feature Toggle"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <span id="name-error" style={styles.error} role="alert">
                    {errors.name}
                  </span>
                )}
              </div>

              {/* Description Field */}
              <div style={styles.formGroup}>
                <label htmlFor="flag-description" style={styles.label}>
                  Description
                </label>
                <textarea
                  id="flag-description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  style={styles.textarea}
                  placeholder="Describe what this flag controls..."
                />
              </div>

              {/* Enabled Checkbox */}
              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => handleInputChange('enabled', e.target.checked)}
                    style={styles.checkbox}
                  />
                  Enable flag globally
                </label>
              </div>
            </div>
          </div>

          <div style={styles.footer}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              style={{
                ...styles.button,
                ...styles.buttonSecondary,
                ...(isSubmitting ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  Object.assign(e.currentTarget.style, styles.buttonSecondaryHover);
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  Object.assign(e.currentTarget.style, styles.buttonSecondary);
                }
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                ...(isSubmitting ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  Object.assign(e.currentTarget.style, styles.buttonPrimaryHover);
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  Object.assign(e.currentTarget.style, styles.buttonPrimary);
                }
              }}
            >
              {isSubmitting ? 'Updating...' : 'Update Flag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
