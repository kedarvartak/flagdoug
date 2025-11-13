import type { CSSProperties } from 'react';
import type { Theme } from '../../theme.config';

export const getSkeletonStatCardStyles = (theme: Theme): Record<string, CSSProperties> => ({
  card: {
    backgroundColor: theme.colors.bgSecondary,
    border: `2px solid ${theme.colors.borderColor}`,
    borderRadius: '8px',
    padding: '1.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  skeleton: {
    backgroundColor: theme.colors.bgTertiary,
    borderRadius: '4px',
    position: 'relative',
    overflow: 'hidden',
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: '-100%',
    height: '100%',
    width: '100%',
    background: `linear-gradient(90deg, transparent, ${theme.colors.borderColor}40, transparent)`,
    animation: 'shimmer 1.5s infinite',
  },
  title: {
    height: '0.8125rem',
    width: '50%',
  },
  value: {
    height: '2.25rem',
    width: '70%',
    marginTop: '0.25rem',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  subtitle: {
    height: '0.8125rem',
    width: '40%',
  },
});
