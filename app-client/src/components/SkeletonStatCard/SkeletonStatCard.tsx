import { useTheme } from '../../context/ThemeContext';
import { getSkeletonStatCardStyles } from './SkeletonStatCard.styles';

export const SkeletonStatCard = () => {
  const { theme } = useTheme();
  const styles = getSkeletonStatCardStyles(theme);

  const SkeletonElement = ({ style }: { style: React.CSSProperties }) => (
    <div style={{ ...styles.skeleton, ...style }}>
      <div style={styles.skeletonShimmer} />
    </div>
  );

  return (
    <div style={styles.card}>
      <SkeletonElement style={styles.title} />
      <SkeletonElement style={styles.value} />
      
      <div style={styles.footer}>
        <SkeletonElement style={styles.subtitle} />
      </div>
    </div>
  );
};
