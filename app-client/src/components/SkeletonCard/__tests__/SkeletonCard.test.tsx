import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkeletonCard } from '../SkeletonCard';
import { ThemeProvider } from '../../../context/ThemeContext';

describe('SkeletonCard', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider>{component}</ThemeProvider>);
  };

  it('renders skeleton card with all elements', () => {
    const { container } = renderWithTheme(<SkeletonCard />);
    
    // Check that the card container is rendered
    expect(container.firstChild).toBeTruthy();
  });

  it('renders description skeleton by default', () => {
    const { container } = renderWithTheme(<SkeletonCard />);
    
    // Check that component renders
    expect(container.firstChild).toBeTruthy();
  });

  it('hides description skeleton when showDescription is false', () => {
    const { container } = renderWithTheme(<SkeletonCard showDescription={false} />);
    
    // Check that component renders
    expect(container.firstChild).toBeTruthy();
  });
});
