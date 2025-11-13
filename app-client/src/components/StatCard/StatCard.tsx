import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { getStatCardStyles } from './StatCard.styles';
import { useTheme } from '../../context/ThemeContext';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatCard = ({ title, value, subtitle, icon: Icon, trend }: StatCardProps) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const styles = getStatCardStyles(theme, isHovered);
  
  return (
    <div 
      style={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {Icon && (
        <div style={styles.iconContainer}>
          <Icon size={20} color={theme.colors.accentPrimary} strokeWidth={2} />
        </div>
      )}
      <span style={styles.title}>{title}</span>
      <div style={styles.value}>{value}</div>
      
      {(subtitle || trend) && (
        <div style={styles.footer}>
          {subtitle && <span style={styles.subtitle}>{subtitle}</span>}
          {trend && (
            <span style={styles.trend}>
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
