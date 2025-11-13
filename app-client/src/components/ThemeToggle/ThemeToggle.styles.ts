import type { CSSProperties } from 'react';
import type { Theme } from '../../theme.config';

export const getThemeToggleStyles = (theme: Theme) => {
  const button: CSSProperties = {
    background: theme.colors.bgSecondary,
    border: `1px solid ${theme.colors.borderColor}`,
    borderRadius: '6px',
    padding: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.colors.textSecondary,
    outline: 'none',
  };

  return { button };
};
