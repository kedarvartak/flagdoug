import type { CSSProperties } from 'react';
import type { Theme } from '../../theme.config';

export const getStatCardStyles = (theme: Theme, isHovered: boolean): Record<string, CSSProperties> => ({
  card: {
    backgroundColor: theme.colors.bgCard,
    border: `1px solid ${theme.colors.borderColor}`,
    borderRadius: theme.radius.lg,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'all 0.2s ease',
    cursor: 'default',
    boxShadow: isHovered ? theme.shadows.md : theme.shadows.sm,
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
  },
  iconContainer: {
    width: '40px',
    height: '40px',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '13px',
    color: theme.colors.textSecondary,
    fontWeight: 500,
    letterSpacing: '0',
  },
  value: {
    fontSize: '28px',
    fontWeight: 600,
    color: theme.colors.textPrimary,
    lineHeight: 1.2,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    marginTop: '4px',
  },
  subtitle: {
    fontSize: '12px',
    color: theme.colors.textMuted,
    fontWeight: 400,
  },
  trend: {
    fontSize: '12px',
    fontWeight: 500,
    color: theme.colors.success,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
});
