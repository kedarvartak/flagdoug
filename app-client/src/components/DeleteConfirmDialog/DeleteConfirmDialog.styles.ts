import type { CSSProperties } from 'react';
import type { Theme } from '../../theme.config';

export const getDeleteConfirmDialogStyles = (theme: Theme) => {
  const styles: Record<string, CSSProperties> = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    },
    dialog: {
      backgroundColor: theme.colors.bgSecondary,
      borderRadius: '8px',
      border: `1px solid ${theme.colors.borderColor}`,
      width: '100%',
      maxWidth: '480px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1.5rem',
      borderBottom: `1px solid ${theme.colors.borderColor}`,
    },
    title: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: theme.colors.danger,
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: theme.colors.textSecondary,
      fontSize: '1.5rem',
      cursor: 'pointer',
      padding: '0.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      transition: 'all 0.2s',
      width: '32px',
      height: '32px',
    },
    closeButtonHover: {
      backgroundColor: theme.colors.bgTertiary,
      color: theme.colors.textPrimary,
    },
    content: {
      padding: '1.5rem',
    },
    message: {
      fontSize: '0.9375rem',
      color: theme.colors.textPrimary,
      lineHeight: 1.6,
      margin: 0,
      marginBottom: '1rem',
    },
    flagName: {
      fontWeight: 600,
      color: theme.colors.accentPrimary,
    },
    warningBox: {
      padding: '0.75rem',
      backgroundColor: `${theme.colors.danger}15`,
      border: `1px solid ${theme.colors.danger}40`,
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.5rem',
    },
    warningIcon: {
      fontSize: '1.25rem',
      flexShrink: 0,
    },
    warningText: {
      fontSize: '0.875rem',
      color: theme.colors.textSecondary,
      lineHeight: 1.5,
      margin: 0,
    },
    errorBox: {
      padding: '0.75rem',
      backgroundColor: `${theme.colors.danger}20`,
      border: `1px solid ${theme.colors.danger}`,
      borderRadius: '6px',
      marginTop: '1rem',
    },
    errorText: {
      color: theme.colors.danger,
      fontSize: '0.875rem',
      margin: 0,
    },
    footer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '0.75rem',
      padding: '1.5rem',
      borderTop: `1px solid ${theme.colors.borderColor}`,
    },
    button: {
      padding: '0.625rem 1.25rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      outline: 'none',
    },
    buttonCancel: {
      backgroundColor: 'transparent',
      color: theme.colors.textSecondary,
      border: `1px solid ${theme.colors.borderColor}`,
    },
    buttonCancelHover: {
      backgroundColor: theme.colors.bgTertiary,
      color: theme.colors.textPrimary,
    },
    buttonDelete: {
      backgroundColor: theme.colors.danger,
      color: '#ffffff',
    },
    buttonDeleteHover: {
      backgroundColor: '#c53030',
    },
  };

  return styles;
};
