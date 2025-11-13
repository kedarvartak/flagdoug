import type { CSSProperties } from 'react';
import type { Theme } from '../../theme.config';

export type ErrorType = 'network' | 'validation' | 'server' | 'default';

export const getErrorMessageStyles = (theme: Theme, errorType: ErrorType) => {
  const getErrorColor = () => {
    switch (errorType) {
      case 'network':
        return '#f59e0b'; // amber/warning
      case 'validation':
        return '#ef4444'; // red
      case 'server':
        return '#dc2626'; // dark red
      default:
        return theme.colors.danger;
    }
  };

  const errorColor = getErrorColor();

  const container: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: theme.name === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
    border: `1px solid ${errorColor}`,
    borderRadius: '8px',
    color: theme.colors.textPrimary,
  };

  const header: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const icon: CSSProperties = {
    fontSize: '20px',
    color: errorColor,
    flexShrink: 0,
  };

  const title: CSSProperties = {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: errorColor,
  };

  const message: CSSProperties = {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.5',
    color: theme.colors.textSecondary,
  };

  const retryButton: CSSProperties = {
    alignSelf: 'flex-start',
    padding: '8px 16px',
    backgroundColor: errorColor,
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  };

  const retryButtonHover: CSSProperties = {
    opacity: 0.9,
  };

  return {
    container,
    header,
    icon,
    title,
    message,
    retryButton,
    retryButtonHover,
  };
};
