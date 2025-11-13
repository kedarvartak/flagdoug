import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getErrorMessageStyles } from './ErrorMessage.styles';
import type { ErrorType } from './ErrorMessage.styles';

export interface ErrorMessageProps {
  error: Error | string;
  onRetry?: () => void;
  type?: ErrorType;
}

const getErrorType = (error: Error | string): ErrorType => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('network') || lowerMessage.includes('connection') || lowerMessage.includes('fetch')) {
    return 'network';
  }
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return 'validation';
  }
  if (lowerMessage.includes('server') || lowerMessage.includes('500') || lowerMessage.includes('503')) {
    return 'server';
  }
  return 'default';
};

const getErrorTitle = (errorType: ErrorType): string => {
  switch (errorType) {
    case 'network':
      return 'Connection Error';
    case 'validation':
      return 'Validation Error';
    case 'server':
      return 'Server Error';
    default:
      return 'Error';
  }
};

const getErrorIcon = (errorType: ErrorType): string => {
  switch (errorType) {
    case 'network':
      return '⚠️';
    case 'validation':
      return '❌';
    case 'server':
      return '🔧';
    default:
      return '⚠️';
  }
};

export const ErrorMessage = ({ error, onRetry, type }: ErrorMessageProps) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const errorType = type || getErrorType(error);
  const styles = getErrorMessageStyles(theme, errorType);
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorTitle = getErrorTitle(errorType);
  const errorIcon = getErrorIcon(errorType);

  return (
    <div style={styles.container} role="alert" aria-live="assertive">
      <div style={styles.header}>
        <span style={styles.icon} aria-hidden="true">
          {errorIcon}
        </span>
        <h3 style={styles.title}>{errorTitle}</h3>
      </div>
      <p style={styles.message}>{errorMessage}</p>
      {onRetry && (
        <button
          style={{
            ...styles.retryButton,
            ...(isHovered ? styles.retryButtonHover : {}),
          }}
          onClick={onRetry}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          aria-label="Retry operation"
        >
          Retry
        </button>
      )}
    </div>
  );
};
