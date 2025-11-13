import type { CSSProperties } from 'react';

export const getToastContainerStyles = (): Record<string, CSSProperties> => {
  return {
    container: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      pointerEvents: 'none',
    },
  };
};
