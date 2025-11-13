import type { CSSProperties } from 'react';
import type { Theme } from '../../theme.config';

export const getSkeletonCardStyles = (theme: Theme): Record<string, CSSProperties> => ({
  card: {
    backgroundColor: theme.colors.bgSecondary,
    border: `2px solid transparent`,
    borderRadius: '8px',
    padding: '1.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  meta: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
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
  name: {
    height: '1.0625rem',
    width: '60%',
  },
  key: {
    height: '1.5rem',
    width: '120px',
  },
  description: {
    height: '1rem',
    width: '100%',
    marginBottom: '1rem',
  },
  toggle: {
    height: '2rem',
    width: '64px',
    borderRadius: '6px',
  },
  iconButton: {
    height: '2rem',
    width: '2rem',
    borderRadius: '6px',
  },
  badge: {
    height: '1.375rem',
    width: '80px',
    borderRadius: '12px',
  },
  date: {
    height: '1rem',
    width: '100px',
    marginLeft: 'auto',
  },
});
