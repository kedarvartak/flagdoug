import type { CSSProperties } from 'react';
import type { Theme } from '../../theme.config';

const sizeMap = {
  small: 20,
  medium: 40,
  large: 60,
};

const borderWidthMap = {
  small: 2,
  medium: 3,
  large: 4,
};

export const getLoadingSpinnerStyles = (
  theme: Theme,
  size: 'small' | 'medium' | 'large'
): Record<string, CSSProperties> => {
  const spinnerSize = sizeMap[size];
  const borderWidth = borderWidthMap[size];

  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
    },
    spinner: {
      display: 'inline-block',
      width: `${spinnerSize}px`,
      height: `${spinnerSize}px`,
    },
    spinnerCircle: {
      width: '100%',
      height: '100%',
      border: `${borderWidth}px solid ${theme.colors.borderColor}`,
      borderTop: `${borderWidth}px solid ${theme.colors.accentPrimary}`,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    message: {
      margin: 0,
      fontSize: size === 'small' ? '0.875rem' : size === 'medium' ? '1rem' : '1.125rem',
      color: theme.colors.textSecondary,
      fontWeight: 500,
    },
  };
};
