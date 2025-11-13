import type { CSSProperties } from 'react';
import type { Theme } from '../../theme.config';

export const getHeaderStyles = (theme: Theme): Record<string, CSSProperties> => ({
  header: {
    backgroundColor: theme.colors.bgCard,
    borderBottom: `1px solid ${theme.colors.borderColor}`,
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: theme.colors.textPrimary,
    margin: 0,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  searchContainer: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  searchInput: {
    padding: '8px 12px 8px 40px',
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.borderColor}`,
    backgroundColor: theme.colors.bgSecondary,
    color: theme.colors.textPrimary,
    fontSize: '14px',
    outline: 'none',
    width: '300px',
    transition: 'all 0.2s ease',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '12px',
    color: theme.colors.textMuted,
  },

  notificationButton: {
    padding: '8px',
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.borderColor}`,
    backgroundColor: theme.colors.bgSecondary,
    color: theme.colors.textSecondary,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#8B5CF6',
    backgroundImage: 'url("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    cursor: 'pointer',
  },
});
