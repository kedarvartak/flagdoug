import type { CSSProperties } from 'react';
import type { Theme } from '../../theme.config';

export const getDropdownStyles = (theme: Theme): Record<string, CSSProperties> => {
  // Encode the arrow color for the SVG
  const arrowColor = encodeURIComponent(theme.colors.textSecondary);
  
  return {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    label: {
      fontSize: '13px',
      color: theme.colors.textSecondary,
      fontWeight: 500,
      whiteSpace: 'nowrap',
    },
    select: {
      padding: '6px 32px 6px 12px',
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.borderColor}`,
      backgroundColor: theme.colors.bgSecondary,
      color: theme.colors.textPrimary,
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 500,
      outline: 'none',
      transition: 'all 0.2s',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='${arrowColor}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 10px center',
      minWidth: '140px',
    },
  };
};
