import { useTheme } from '../../context/ThemeContext';
import { getLoadingSpinnerStyles } from './LoadingSpinner.styles';

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export const LoadingSpinner = ({ size = 'medium', message }: LoadingSpinnerProps) => {
  const { theme } = useTheme();
  const styles = getLoadingSpinnerStyles(theme, size);

  return (
    <div style={styles.container}>
      <div style={styles.spinner}>
        <div style={styles.spinnerCircle} />
      </div>
      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
};
