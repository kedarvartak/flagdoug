import type { CSSProperties } from 'react';
import type { Theme } from '../../theme.config';

export const getPaginationStyles = (theme: Theme): Record<string, CSSProperties> => {
  return {
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      padding: '1.5rem 0',
      flexWrap: 'wrap',
    },
    pageNumbersContainer: {
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center',
    },
    ellipsis: {
      padding: '0 0.25rem',
    },
    pageInfo: {
      fontSize: '0.875rem',
      color: theme.colors.textSecondary,
      marginLeft: '0.5rem',
      whiteSpace: 'nowrap',
    },
  };
};

export const getPaginationButtonStyles = (
  theme: Theme,
  disabled: boolean
): CSSProperties => {
  return {
    padding: '0.5rem 1rem',
    border: `1px solid ${theme.colors.borderColor}`,
    backgroundColor: theme.colors.bgSecondary,
    color: theme.colors.textPrimary,
    borderRadius: '0.375rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
  };
};

export const getPageNumberStyles = (
  theme: Theme,
  isActive: boolean,
  disabled: boolean
): CSSProperties => {
  return {
    minWidth: '2.5rem',
    height: '2.5rem',
    padding: '0.5rem',
    border: `1px solid ${isActive ? theme.colors.accentPrimary : theme.colors.borderColor}`,
    backgroundColor: isActive ? theme.colors.accentPrimary : theme.colors.bgSecondary,
    color: isActive ? 'white' : theme.colors.textPrimary,
    borderRadius: '0.375rem',
    cursor: disabled || isActive ? 'default' : 'pointer',
    fontSize: '0.875rem',
    fontWeight: isActive ? 600 : 500,
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
  };
};
