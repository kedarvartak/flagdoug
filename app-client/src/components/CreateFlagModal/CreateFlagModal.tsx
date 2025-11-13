import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useFlagsContext } from '../../context/FlagsContext';
import { getCreateFlagModalStyles } from './CreateFlagModal.styles';
import type { CreateFlagDto, CreateFlagEnvironmentDto } from '../../types/api.types';
import { FlagType, Environment } from '../../types/api.types';

export interface CreateFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  key: string;
  name: string;
  description: string;
  type: FlagType;
  enabled: boolean;
  environments: {
    [Environment.DEVELOPMENT]: { enabled: boolean; rolloutPercentage: number };
    [Environment.STAGING]: { enabled: boolean; rolloutPercentage: number };
    [Environment.PRODUCTION]: { enabled: boolean; rolloutPercentage: number };
  };
}

interface FormErrors {
  key?: string;
  name?: string;
  description?: string;
  type?: string;
  environments?: {
    [key: string]: {
      rolloutPercentage?: string;
    };
  };
}

export const CreateFlagModal = ({ isOpen, onClose, onSuccess }: CreateFlagModalProps) => {
  const { theme } = useTheme();
  const { createFlag } = useFlagsContext();
  const styles = getCreateFlagModalStyles(theme);
  const [isCloseHovered, setIsCloseHovered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    key: '',
    name: '',
    description: '',
    type: FlagType.BOOLEAN,
    enabled: false,
    environments: {
      [Environment.DEVELOPMENT]: { enabled: false, rolloutPercentage: 100 },
      [Environment.STAGING]: { enabled: false, rolloutPercentage: 100 },
      [Environment.PRODUCTION]: { enabled: false, rolloutPercentage: 100 },
    },
  });
  
  const [errors, setErrors] = useState<FormErrors>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        key: '',
        name: '',
        description: '',
        type: FlagType.BOOLEAN,
        enabled: false,
        environments: {
          [Environment.DEVELOPMENT]: { enabled: false, rolloutPercentage: 100 },
          [Environment.STAGING]: { enabled: false, rolloutPercentage: 100 },
          [Environment.PRODUCTION]: { enabled: false, rolloutPercentage: 100 },
        },
      });
      setErrors({});
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

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

    // Validate key
    if (!formData.key.trim()) {
      newErrors.key = 'Key is required';
    } else if (!/^[a-z0-9-_]+$/i.test(formData.key)) {
      newErrors.key = 'Key can only contain letters, numbers, hyphens, and underscores';
    }

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Validate rollout percentages
    const envErrors: FormErrors['environments'] = {};
    Object.entries(formData.environments).forEach(([env, config]) => {
      if (config.rolloutPercentage < 0 || config.rolloutPercentage > 100) {
        if (!envErrors[env]) {
          envErrors[env] = {};
        }
        envErrors[env].rolloutPercentage = 'Rollout percentage must be between 0 and 100';
      }
    });

    if (Object.keys(envErrors).length > 0) {
      newErrors.environments = envErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string | boolean | FlagType) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle environment changes
  const handleEnvironmentChange = (
    env: Environment,
    field: 'enabled' | 'rolloutPercentage',
    value: boolean | number
  ) => {
    setFormData(prev => ({
      ...prev,
      environments: {
        ...prev.environments,
        [env]: {
          ...prev.environments[env],
          [field]: value,
        },
      },
    }));
    // Clear error for this environment field
    if (errors.environments?.[env]?.[field as 'rolloutPercentage']) {
      setErrors(prev => ({
        ...prev,
        environments: {
          ...prev.environments,
          [env]: {
            ...prev.environments?.[env],
            [field]: undefined,
          },
        },
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Transform form data to CreateFlagDto
      const environments: CreateFlagEnvironmentDto[] = Object.entries(formData.environments).map(
        ([env, config]) => ({
          environment: env as Environment,
          enabled: config.enabled,
          rolloutPercentage: config.rolloutPercentage,
        })
      );

      const createFlagDto: CreateFlagDto = {
        key: formData.key.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        enabled: formData.enabled,
        environments,
      };

      // Call API to create flag
      const result = await createFlag(createFlagDto);

      if (result) {
        // Success - close modal and call onSuccess callback
        onSuccess?.();
        onClose();
      } else {
        setSubmitError('Failed to create flag. Please try again.');
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
              if (err.field === 'key' || err.field === 'name' || err.field === 'description' || err.field === 'type') {
                newErrors[err.field] = err.message;
              }
            }
          });
          setErrors(newErrors);
          setSubmitError('Please fix the validation errors below.');
        } else {
          setSubmitError(error instanceof Error ? error.message : 'An error occurred while creating the flag.');
        }
      } else {
        setSubmitError(error instanceof Error ? error.message : 'An error occurred while creating the flag.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    onClose();
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
      aria-labelledby="create-flag-modal-title"
    >
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 id="create-flag-modal-title" style={styles.title}>
            Create Feature Flag
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
            <div style={styles.form}>
              {/* Key Field */}
              <div style={styles.formGroup}>
                <label htmlFor="flag-key" style={styles.label}>
                  Key<span style={styles.requiredMark}>*</span>
                </label>
                <input
                  id="flag-key"
                  type="text"
                  value={formData.key}
                  onChange={(e) => handleInputChange('key', e.target.value)}
                  style={{
                    ...styles.input,
                    ...(errors.key ? styles.inputError : {}),
                  }}
                  placeholder="e.g., new-feature-toggle"
                  aria-invalid={!!errors.key}
                  aria-describedby={errors.key ? 'key-error' : undefined}
                />
                {errors.key && (
                  <span id="key-error" style={styles.error} role="alert">
                    {errors.key}
                  </span>
                )}
              </div>

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

              {/* Type Field */}
              <div style={styles.formGroup}>
                <label htmlFor="flag-type" style={styles.label}>
                  Type<span style={styles.requiredMark}>*</span>
                </label>
                <select
                  id="flag-type"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value as FlagType)}
                  style={styles.select}
                >
                  <option value={FlagType.BOOLEAN}>Boolean</option>
                  <option value={FlagType.PERCENTAGE}>Percentage</option>
                  <option value={FlagType.MULTIVARIATE}>Multivariate</option>
                </select>
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

              {/* Environment Configuration */}
              <div style={styles.environmentSection}>
                <div style={styles.environmentHeader}>Environment Configuration</div>
                {Object.values(Environment).map((env) => (
                  <div key={env} style={styles.environmentItem}>
                    <div style={styles.environmentRow}>
                      <span style={styles.environmentName}>{env}</span>
                      <label style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.environments[env].enabled}
                          onChange={(e) =>
                            handleEnvironmentChange(env, 'enabled', e.target.checked)
                          }
                          style={styles.checkbox}
                        />
                        Enabled
                      </label>
                    </div>
                    <div style={styles.rolloutGroup}>
                      <span style={styles.rolloutLabel}>Rollout:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.environments[env].rolloutPercentage}
                        onChange={(e) =>
                          handleEnvironmentChange(
                            env,
                            'rolloutPercentage',
                            parseInt(e.target.value) || 0
                          )
                        }
                        style={{
                          ...styles.rolloutInput,
                          ...(errors.environments?.[env]?.rolloutPercentage
                            ? styles.inputError
                            : {}),
                        }}
                        disabled={!formData.environments[env].enabled}
                        aria-invalid={!!errors.environments?.[env]?.rolloutPercentage}
                      />
                      <span style={styles.rolloutLabel}>%</span>
                    </div>
                    {errors.environments?.[env]?.rolloutPercentage && (
                      <span style={styles.error} role="alert">
                        {errors.environments[env].rolloutPercentage}
                      </span>
                    )}
                  </div>
                ))}
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
              {isSubmitting ? 'Creating...' : 'Create Flag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
