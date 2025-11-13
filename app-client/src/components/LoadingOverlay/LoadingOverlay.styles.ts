import type { CSSProperties } from 'react';
import type { Theme } from '../../theme.config';

export const getLoadingOverlayStyles = (theme: Theme, isFullScreen: boolean) => {
  const overlay: CSSProperties = {
    position: isFullScreen ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    backgroundColor: theme.name === 'dark' 
      ? 'rgba(10, 14, 26, 0.85)' 
      : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(4px)',
    zIndex: isFullScreen ? 9999 : 10,
    pointerEvents: 'all',
  };

  const content: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    padding: '24px',
    backgroundColor: theme.colors.bgSecondary,
    borderRadius: '12px',
    border: `1px solid ${theme.colors.borderColor}`,
    boxShadow: theme.name === 'dark'
      ? '0 10px 40px rgba(0, 0, 0, 0.5)'
      : '0 10px 40px rgba(0, 0, 0, 0.1)',
  };

  const message: CSSProperties = {
    margin: 0,
    fontSize: '16px',
    fontWeight: 500,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  };

  return {
    overlay,
    content,
    message,
  };
};
