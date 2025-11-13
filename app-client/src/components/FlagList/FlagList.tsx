import type { Flag, Environment } from '../../types/api.types';
import { FlagCard } from '../FlagCard';
import { SkeletonCard } from '../SkeletonCard';
import { LoadingSpinner } from '../LoadingSpinner';
import { ErrorMessage } from '../ErrorMessage';
import { getFlagListStyles } from './FlagList.styles';
import { useTheme } from '../../context/ThemeContext';

interface FlagListProps {
  flags: Flag[];
  currentEnvironment: Environment;
  onToggleFlag: (flagId: string) => void;
  onEditFlag: (flagId: string) => void;
  onDeleteFlag: (flagId: string) => void;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  isSearchActive?: boolean;
  isInitialLoad?: boolean;
}

export const FlagList = ({ 
  flags, 
  currentEnvironment, 
  onToggleFlag, 
  onEditFlag, 
  onDeleteFlag,
  loading = false,
  error = null,
  onRetry,
  isSearchActive = false,
  isInitialLoad = false,
}: FlagListProps) => {
  const { theme } = useTheme();
  const styles = getFlagListStyles(theme);
  
  // Display skeleton cards during initial load
  if (loading && isInitialLoad) {
    return (
      <div style={styles.list}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard showDescription={false} />
        <SkeletonCard />
      </div>
    );
  }

  // Display loading spinner for subsequent loads (pagination, refresh)
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <LoadingSpinner size="large" message="Loading flags..." />
      </div>
    );
  }

  // Display error message if fetch fails
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <ErrorMessage error={error} onRetry={onRetry} />
      </div>
    );
  }

  // Show "no results" message when search returns empty
  if (flags.length === 0 && isSearchActive) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyIcon}>🔍</p>
        <p style={styles.emptyTitle}>No results found</p>
        <p style={styles.emptyDescription}>
          Try adjusting your search criteria or clear the search to see all flags.
        </p>
      </div>
    );
  }

  // Show empty state when no flags exist
  if (flags.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyIcon}>🚩</p>
        <p style={styles.emptyTitle}>No feature flags yet</p>
        <p style={styles.emptyDescription}>
          Create your first flag to get started with feature management.
        </p>
      </div>
    );
  }

  // Pass API methods to FlagCard components
  return (
    <div style={styles.list}>
      {flags.map((flag) => (
        <FlagCard
          key={flag.id}
          flag={flag}
          currentEnvironment={currentEnvironment}
          onToggle={() => onToggleFlag(flag.id)}
          onEdit={() => onEditFlag(flag.id)}
          onDelete={() => onDeleteFlag(flag.id)}
        />
      ))}
    </div>
  );
};
