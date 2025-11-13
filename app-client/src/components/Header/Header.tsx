import { Search, Bell } from 'lucide-react';
import { getHeaderStyles } from './Header.styles';
import { useTheme } from '../../context/ThemeContext';
import { ThemeToggle } from '../ThemeToggle';

interface HeaderProps {
  title?: string;
}

export const Header = ({ title = 'Dashboard' }: HeaderProps) => {
  const { theme } = useTheme();
  const styles = getHeaderStyles(theme);
  
  return (
    <header style={styles.header}>
      <div style={styles.leftSection}>
        <h1 style={styles.title}>{title}</h1>
      </div>
      
      <div style={styles.rightSection}>
        <div style={styles.searchContainer}>
          <Search size={16} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search..."
            style={styles.searchInput}
          />
        </div>
        
        <button style={styles.notificationButton}>
          <Bell size={16} />
        </button>
        
        <ThemeToggle />
        
        <div style={styles.userAvatar} />
      </div>
    </header>
  );
};
