import { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { LoadingSpinner } from '../LoadingSpinner';
import { getLoadingOverlayStyles } from './LoadingOverlay.styles';

export interface LoadingOverlayProps {
  message?: string;
  isFullScreen?: boolean;
}

export const LoadingOverlay = ({ message, isFullScreen = false }: LoadingOverlayProps) => {
  const { theme } = useTheme();
  const styles = getLoadingOverlayStyles(theme, isFullScreen);

  // Prevent body scroll when full-screen overlay is active
  useEffect(() => {
    if (isFullScreen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFullScreen]);

  return (
    <div 
      style={styles.overlay} 
      role="progressbar" 
      aria-busy="true"
      aria-label={message || 'Loading'}
    >
      <div style={styles.content}>
        <LoadingSpinner size="large" />
        {message && <p style={styles.message}>{message}</p>}
      </div>
    </div>
  );
};
