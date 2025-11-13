import { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { getFlagToolbarStyles } from './FlagToolbar.styles';
import { useTheme } from '../../context/ThemeContext';
import { SortButton, type SortOption } from '../SortButton';
import { FilterButton, type FilterOptions } from '../FilterButton';

interface FlagToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateFlag: () => void;
  resultCount?: number;
  totalCount?: number;
  currentSort?: SortOption;
  onSortChange: (sort: SortOption) => void;
  currentFilters?: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export const FlagToolbar = ({ 
  searchQuery, 
  onSearchChange, 
  onCreateFlag,
  resultCount,
  totalCount,
  currentSort,
  onSortChange,
  currentFilters,
  onFiltersChange
}: FlagToolbarProps) => {
  const { theme } = useTheme();
  const [isCreateHovered, setIsCreateHovered] = useState(false);
  const styles = getFlagToolbarStyles(theme);
  
  const handleClearSearch = () => {
    onSearchChange('');
  };

  const showClearButton = searchQuery.length > 0;
  const showResultCount = searchQuery.length > 0 && resultCount !== undefined && totalCount !== undefined;
  
  return (
    <div style={styles.toolbar}>
      <div style={styles.searchWrapper}>
        <div style={styles.searchContainer}>
          <div style={styles.searchIcon}>
            <Search size={18} color={theme.colors.textMuted} strokeWidth={2} />
          </div>
          <input
            type="text"
            placeholder="Search flags by name or key..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={styles.search}
            aria-label="Search flags"
          />
          {showClearButton && (
            <button
              onClick={handleClearSearch}
              style={styles.clearButton}
              aria-label="Clear search"
              title="Clear search"
            >
              <X size={16} color={theme.colors.textMuted} strokeWidth={2} />
            </button>
          )}
        </div>
        {showResultCount && (
          <div style={styles.resultCount}>
            Showing {resultCount} of {totalCount} flags
          </div>
        )}
      </div>
      
      <div style={styles.actions}>
        <div style={styles.filterSort}>
          <SortButton 
            currentSort={currentSort}
            onSortChange={onSortChange}
          />
          <FilterButton 
            currentFilters={currentFilters}
            onFiltersChange={onFiltersChange}
          />
        </div>
        
        <button 
          onClick={onCreateFlag} 
          onMouseEnter={() => setIsCreateHovered(true)}
          onMouseLeave={() => setIsCreateHovered(false)}
          style={{
            ...styles.createButton,
            ...(isCreateHovered ? styles.createButtonHover : {}),
          }}
        >
          <Plus size={18} color={styles.createButton.color as string} strokeWidth={2} />
          <span>Create Flag</span>
        </button>
      </div>
    </div>
  );
};
