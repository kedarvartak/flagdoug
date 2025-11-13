import { useState } from 'react';
import { Filter, ChevronDown, X } from 'lucide-react';
import { getFilterButtonStyles } from './FilterButton.styles';
import { useTheme } from '../../context/ThemeContext';

export type FilterType = 'boolean' | 'percentage' | 'multivariate';
export type FilterEnvironment = 'development' | 'staging' | 'production';
export type FilterStatus = 'enabled' | 'disabled';

export interface FilterOptions {
  types?: FilterType[];
  environments?: FilterEnvironment[];
  status?: FilterStatus[];
}

interface FilterButtonProps {
  currentFilters?: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

const filterCategories = {
  types: {
    label: 'Type',
    options: [
      { value: 'boolean' as FilterType, label: 'Boolean' },
      { value: 'percentage' as FilterType, label: 'Percentage' },
      { value: 'multivariate' as FilterType, label: 'Multivariate' },
    ],
  },
  environments: {
    label: 'Environment',
    options: [
      { value: 'development' as FilterEnvironment, label: 'Development' },
      { value: 'staging' as FilterEnvironment, label: 'Staging' },
      { value: 'production' as FilterEnvironment, label: 'Production' },
    ],
  },
  status: {
    label: 'Status',
    options: [
      { value: 'enabled' as FilterStatus, label: 'Enabled' },
      { value: 'disabled' as FilterStatus, label: 'Disabled' },
    ],
  },
};

export const FilterButton = ({ currentFilters = {}, onFiltersChange }: FilterButtonProps) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const styles = getFilterButtonStyles(theme);

  const getActiveFilterCount = () => {
    return (currentFilters.types?.length || 0) + 
           (currentFilters.environments?.length || 0) + 
           (currentFilters.status?.length || 0);
  };

  const activeCount = getActiveFilterCount();

  const handleFilterToggle = (category: keyof FilterOptions, value: string) => {
    const currentValues = currentFilters[category] || [];
    const newValues = currentValues.includes(value as any)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value as any];

    onFiltersChange({
      ...currentFilters,
      [category]: newValues.length > 0 ? newValues : undefined,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    setIsOpen(false);
  };

  return (
    <div style={styles.container}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          ...styles.button,
          ...(isHovered ? styles.buttonHover : {}),
          ...(isOpen ? styles.buttonActive : {}),
          ...(activeCount > 0 ? styles.buttonWithFilters : {}),
        }}
      >
        <Filter size={16} />
        <span>Filter</span>
        {activeCount > 0 && (
          <span style={styles.badge}>{activeCount}</span>
        )}
        <ChevronDown 
          size={14} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </button>

      {isOpen && (
        <>
          <div 
            style={styles.overlay} 
            onClick={() => setIsOpen(false)}
          />
          <div style={styles.dropdown}>
            <div style={styles.header}>
              <span style={styles.headerTitle}>Filter Flags</span>
              {activeCount > 0 && (
                <button onClick={clearAllFilters} style={styles.clearButton}>
                  <X size={14} />
                  Clear All
                </button>
              )}
            </div>

            {Object.entries(filterCategories).map(([categoryKey, category]) => (
              <div key={categoryKey} style={styles.section}>
                <div style={styles.sectionTitle}>{category.label}</div>
                {category.options.map((option) => {
                  const isSelected = currentFilters[categoryKey as keyof FilterOptions]?.includes(option.value as any) || false;
                  return (
                    <label key={option.value} style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleFilterToggle(categoryKey as keyof FilterOptions, option.value)}
                        style={styles.checkbox}
                      />
                      <span style={styles.checkboxText}>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};