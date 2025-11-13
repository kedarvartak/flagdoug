import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getThemeToggleStyles } from './ThemeToggle.styles';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const styles = getThemeToggleStyles(theme);

  return (
    <button
      onClick={toggleTheme}
      style={styles.button}
      aria-label="Toggle theme"
      title={`Switch to ${theme.name === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme.name === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};
