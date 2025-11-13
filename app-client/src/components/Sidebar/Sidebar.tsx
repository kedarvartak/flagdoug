import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  BookOpen, 
  MessageSquare, 
  Settings, 
  HelpCircle, 
  LogOut 
} from 'lucide-react';
import { getSidebarStyles } from './Sidebar.styles';
import { useTheme } from '../../context/ThemeContext';
import type { LucideIcon } from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar = ({ activeView, onViewChange }: SidebarProps) => {
  const { theme } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = getSidebarStyles(theme, isExpanded);
  
  const menuItems: MenuItem[] = [
    { id: 'flags', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'mentors', label: 'Mentors', icon: Users },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'forum', label: 'Forum', icon: MessageSquare },
  ];

  const bottomItems: MenuItem[] = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'help', label: 'Help Center', icon: HelpCircle },
    { id: 'logout', label: 'Log out', icon: LogOut },
  ];

  const getIconColor = (isActive: boolean, isHovered: boolean) => {
    if (isActive) return theme.colors.bgSecondary;
    if (isHovered) return theme.colors.textPrimary;
    return theme.colors.textSecondary;
  };

  return (
    <aside 
      style={styles.sidebar}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeView === item.id;
          const isHovered = hoveredItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
                ...(isHovered && !isActive ? styles.navItemHover : {}),
              }}
            >
              <IconComponent 
                size={20} 
                color={getIconColor(isActive, isHovered)}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span style={styles.navLabel}>{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div style={styles.bottomSection}>
        {bottomItems.map((item) => {
          const IconComponent = item.icon;
          const isHovered = hoveredItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                ...styles.navItem,
                ...(isHovered ? styles.navItemHover : {}),
              }}
            >
              <IconComponent 
                size={18} 
                color={getIconColor(false, isHovered)}
                strokeWidth={2}
              />
              <span style={styles.navLabel}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
