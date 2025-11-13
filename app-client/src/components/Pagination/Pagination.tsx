import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  getPaginationStyles,
  getPaginationButtonStyles,
  getPageNumberStyles,
} from './Pagination.styles';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
}) => {
  const { theme } = useTheme();
  const styles = getPaginationStyles(theme);
  const canGoPrevious = currentPage > 1 && !loading;
  const canGoNext = currentPage < totalPages && !loading;

  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [hoveredPage, setHoveredPage] = useState<number | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (loading) return;

      if (event.key === 'ArrowLeft' && canGoPrevious) {
        event.preventDefault();
        onPageChange(currentPage - 1);
      } else if (event.key === 'ArrowRight' && canGoNext) {
        event.preventDefault();
        onPageChange(currentPage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, loading, canGoPrevious, canGoNext, onPageChange]);

  // Generate page numbers to display
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null;
  }

  const getPrevButtonStyle = () => {
    const baseStyle = getPaginationButtonStyles(theme, !canGoPrevious);
    if (hoveredButton === 'prev' && canGoPrevious) {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.accentPrimary,
        color: 'white',
        borderColor: theme.colors.accentPrimary,
      };
    }
    return baseStyle;
  };

  const getNextButtonStyle = () => {
    const baseStyle = getPaginationButtonStyles(theme, !canGoNext);
    if (hoveredButton === 'next' && canGoNext) {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.accentPrimary,
        color: 'white',
        borderColor: theme.colors.accentPrimary,
      };
    }
    return baseStyle;
  };

  const getPageButtonStyle = (pageNum: number, isActive: boolean) => {
    const baseStyle = getPageNumberStyles(theme, isActive, loading);
    if (hoveredPage === pageNum && !isActive && !loading) {
      return {
        ...baseStyle,
        backgroundColor: theme.colors.bgSecondary,
        borderColor: theme.colors.accentPrimary,
        color: theme.colors.accentPrimary,
      };
    }
    return baseStyle;
  };

  return (
    <div style={styles.container} role="navigation" aria-label="Pagination">
      <button
        style={getPrevButtonStyle()}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
        aria-label="Previous page"
        title="Previous page (Arrow Left)"
        onMouseEnter={() => setHoveredButton('prev')}
        onMouseLeave={() => setHoveredButton(null)}
      >
        ← Previous
      </button>

      <div style={styles.pageNumbersContainer}>
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} style={styles.ellipsis}>
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              style={getPageButtonStyle(pageNum, isActive)}
              onClick={() => onPageChange(pageNum)}
              disabled={loading}
              aria-label={`Page ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
              onMouseEnter={() => setHoveredPage(pageNum)}
              onMouseLeave={() => setHoveredPage(null)}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <button
        style={getNextButtonStyle()}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        aria-label="Next page"
        title="Next page (Arrow Right)"
        onMouseEnter={() => setHoveredButton('next')}
        onMouseLeave={() => setHoveredButton(null)}
      >
        Next →
      </button>

      <span style={styles.pageInfo} aria-live="polite">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
};
