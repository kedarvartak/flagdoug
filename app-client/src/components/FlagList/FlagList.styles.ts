import type { CSSProperties } from 'react';
import type { Theme } from '../../theme.config';

export const getFlagListStyles = (theme: Theme): Record<string, CSSProperties> => ({
  list: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
    marginTop: '24px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4rem 2rem',
    minHeight: '300px',
  },
  errorContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
    minHeight: '300px',
  },
  empty: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: theme.colors.textSecondary,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    gridColumn: '1 / -1',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: theme.colors.textPrimary,
    marginBottom: '0.5rem',
  },
  emptyDescription: {
    fontSize: '0.95rem',
    color: theme.colors.textSecondary,
    maxWidth: '400px',
    lineHeight: 1.5,
  },
});
