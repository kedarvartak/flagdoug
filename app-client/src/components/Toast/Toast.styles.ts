import type { CSSProperties } from 'react';
import type { Theme } from '../../theme.config';

const getBackgroundColor = (type: 'success' | 'error' | 'info' | 'warning'): string => {
  switch (type) {
    case 'success':
      return '#10b981';
    case 'error':
      return '#ef4444';
    case 'warning':
      return '#f59e0b';
    case 'info':
      return '#3b82f6';
    default:
      return '#10b981';
  }
};

export const getToastStyles = (
  _theme: Theme,
  type: 'success' | 'error' | 'info' | 'warning'
): Record<string, CSSProperties> => {
  return {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 20px',
      background: getBackgroundColor(type),
      color: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      minWidth: '300px',
      maxWidth: '500px',
      animation: 'slideIn 0.3s ease-out',
      pointerEvents: 'auto',
    },
    icon: {
      fontSize: '20px',
      fontWeight: 'bold',
      flexShrink: 0,
    },
    message: {
      flex: 1,
      fontSize: '14px',
      lineHeight: 1.5,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: 'white',
      fontSize: '18px',
      cursor: 'pointer',
      padding: '4px',
      marginLeft: 'auto',
      opacity: 0.8,
      flexShrink: 0,
    },
  };
};
