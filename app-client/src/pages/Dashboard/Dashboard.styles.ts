import type { CSSProperties } from 'react';
import type { Theme } from '../../theme.config';

export const getDashboardStyles = (theme: Theme): Record<string, CSSProperties> => ({
  container: {
    minHeight: '100vh',
    backgroundColor: theme.colors.bgPrimary,
    color: theme.colors.textPrimary,
    display: 'flex',
    flexDirection: 'column',
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mainContent: {
    flex: 1,
    padding: '24px 32px',
    overflowY: 'auto',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '32px',
  },
  placeholder: {
    textAlign: 'center',
    padding: '64px 32px',
    color: theme.colors.textSecondary,
  },
});
