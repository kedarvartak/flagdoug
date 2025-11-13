import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../../context/ThemeContext';
import { Pagination } from '../Pagination';

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('Pagination', () => {
  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render pagination controls', () => {
      renderWithTheme(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
    });

    it('should not render when totalPages is 1', () => {
      const { container } = renderWithTheme(
        <Pagination
          currentPage={1}
          totalPages={1}
          onPageChange={mockOnPageChange}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render when totalPages is 0', () => {
      const { container } = renderWithTheme(
        <Pagination
          currentPage={1}
          totalPages={0}
          onPageChange={mockOnPageChange}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should display all page numbers when totalPages <= 5', () => {
      renderWithTheme(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 3')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 4')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 5')).toBeInTheDocument();
    });

    it('should display ellipsis for large page counts', () => {
      renderWithTheme(
        <Pagination
          currentPage={5}
          totalPages={10}
          onPageChange={mockOnPageChange}
        />
      );

      const ellipsis = screen.getAllByText('...');
      expect(ellipsis.length).toBeGreaterThan(0);
    });

    it('should highlight current page', () => {
      renderWithTheme(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const currentPageButton = screen.getByLabelText('Page 3');
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Navigation', () => {
    it('should call onPageChange when clicking next button', () => {
      renderWithTheme(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it('should call onPageChange when clicking previous button', () => {
      renderWithTheme(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const prevButton = screen.getByLabelText('Previous page');
      fireEvent.click(prevButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should call onPageChange when clicking page number', () => {
      renderWithTheme(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const page3Button = screen.getByLabelText('Page 3');
      fireEvent.click(page3Button);

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it('should disable previous button on first page', () => {
      renderWithTheme(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const prevButton = screen.getByLabelText('Previous page');
      expect(prevButton).toBeDisabled();
    });

    it('should disable next button on last page', () => {
      renderWithTheme(
        <Pagination
          currentPage={5}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const nextButton = screen.getByLabelText('Next page');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('should disable all controls when loading', () => {
      renderWithTheme(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          loading={true}
        />
      );

      const prevButton = screen.getByLabelText('Previous page');
      const nextButton = screen.getByLabelText('Next page');
      const page3Button = screen.getByLabelText('Page 3');

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
      expect(page3Button).toBeDisabled();
    });

    it('should not call onPageChange when clicking disabled buttons', () => {
      renderWithTheme(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          loading={true}
        />
      );

      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate to previous page with ArrowLeft key', () => {
      renderWithTheme(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should navigate to next page with ArrowRight key', () => {
      renderWithTheme(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it('should not navigate with ArrowLeft on first page', () => {
      renderWithTheme(
        <Pagination
          currentPage={1}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it('should not navigate with ArrowRight on last page', () => {
      renderWithTheme(
        <Pagination
          currentPage={5}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it('should not navigate with keyboard when loading', () => {
      renderWithTheme(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
          loading={true}
        />
      );

      fireEvent.keyDown(window, { key: 'ArrowRight' });
      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Page Number Display', () => {
    it('should show correct page numbers for middle pages', () => {
      renderWithTheme(
        <Pagination
          currentPage={5}
          totalPages={10}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 4')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 5')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 6')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 10')).toBeInTheDocument();
    });

    it('should show correct page numbers for early pages', () => {
      renderWithTheme(
        <Pagination
          currentPage={2}
          totalPages={10}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 3')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 10')).toBeInTheDocument();
    });

    it('should show correct page numbers for late pages', () => {
      renderWithTheme(
        <Pagination
          currentPage={9}
          totalPages={10}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByLabelText('Page 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 8')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 9')).toBeInTheDocument();
      expect(screen.getByLabelText('Page 10')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithTheme(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Pagination');
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    });

    it('should have aria-current on active page', () => {
      renderWithTheme(
        <Pagination
          currentPage={3}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const currentPage = screen.getByLabelText('Page 3');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });

    it('should have aria-live region for page info', () => {
      renderWithTheme(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPageChange={mockOnPageChange}
        />
      );

      const pageInfo = screen.getByText('Page 2 of 5');
      expect(pageInfo).toHaveAttribute('aria-live', 'polite');
    });
  });
});
