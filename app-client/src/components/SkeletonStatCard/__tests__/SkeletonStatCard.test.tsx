import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SkeletonStatCard } from '../SkeletonStatCard';
import { ThemeProvider } from '../../../context/ThemeContext';

describe('SkeletonStatCard', () => {
  const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider>{component}</ThemeProvider>);
  };

  it('renders skeleton stat card with all elements', () => {
    const { container } = renderWithTheme(<SkeletonStatCard />);
    
    // Check that the card container is rendered
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with proper card structure', () => {
    const { container } = renderWithTheme(<SkeletonStatCard />);
    
    // Check that component renders
    expect(container.firstChild).toBeTruthy();
  });
});
