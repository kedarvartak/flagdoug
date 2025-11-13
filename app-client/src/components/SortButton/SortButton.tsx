import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { getSortButtonStyles } from './SortButton.styles';
import { useTheme } from '../../context/ThemeContext';

export type SortField = 'name' | 'key' | 'created' | 'updated';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  direction: SortDirection;
}

interface SortButtonProps {
  currentSort?: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const sortOptions: { label: string; field: SortField; direction: SortDirection }[] = [
  { label: 'Name A-Z', field: 'name', direction: 'asc' },
  { label: 'Name Z-A', field: 'name', direction: 'desc' },
  { label: 'Key A-Z', field: 'key', direction: 'asc' },
  { label: 'Key Z-A', field: 'key', direction: 'desc' },
  { label: 'Newest First', field: 'created', direction: 'desc' },
  { label: 'Oldest First', field: 'created', direction: 'asc' },
  { label: 'Recently Updated', field: 'updated', direction: 'desc' },
];

export const SortButton = ({ currentSort, onSortChange }: SortButtonProps) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const styles = getSortButtonStyles(theme);

  const currentOption = sortOptions.find(
    option => option.field === currentSort?.field && option.direction === currentSort?.direction
  );

  const getSortIcon = () => {
    if (!currentSort) return <ArrowUpDown size={16} />;
    return currentSort.direction === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
  };

  const handleOptionClick = (option: { field: SortField; direction: SortDirection }) => {
    onSortChange(option);
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
        }}
      >
        {getSortIcon()}
        <span>Sort</span>
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
            {sortOptions.map((option, index) => (
              <button
                key={`${option.field}-${option.direction}`}
                onClick={() => handleOptionClick(option)}
                style={{
                  ...styles.option,
                  ...(currentOption === option ? styles.optionActive : {}),
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};