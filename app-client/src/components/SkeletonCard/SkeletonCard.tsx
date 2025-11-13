import { useTheme } from '../../context/ThemeContext';
import { getSkeletonCardStyles } from './SkeletonCard.styles';

interface SkeletonCardProps {
  showDescription?: boolean;
}

export const SkeletonCard = ({ showDescription = true }: SkeletonCardProps) => {
  const { theme } = useTheme();
  const styles = getSkeletonCardStyles(theme);

  const SkeletonElement = ({ style }: { style: React.CSSProperties }) => (
    <div style={{ ...styles.skeleton, ...style }}>
      <div style={styles.skeletonShimmer} />
    </div>
  );

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.info}>
          <SkeletonElement style={styles.name} />
          <SkeletonElement style={styles.key} />
        </div>
        
        <div style={styles.actions}>
          <SkeletonElement style={styles.toggle} />
          <SkeletonElement style={styles.iconButton} />
          <SkeletonElement style={styles.iconButton} />
        </div>
      </div>

      {showDescription && (
        <SkeletonElement style={styles.description} />
      )}

      <div style={styles.meta}>
        <SkeletonElement style={styles.badge} />
        <SkeletonElement style={styles.date} />
      </div>
    </div>
  );
};
