import React, { useState } from 'react';
import { Pagination } from './Pagination';

/**
 * Example usage of the Pagination component
 */

export const BasicPaginationExample: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Basic Pagination (5 pages)</h2>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        Current page: {currentPage}
      </p>
    </div>
  );
};

export const LargePaginationExample: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(5);
  const totalPages = 20;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Large Pagination (20 pages)</h2>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        Current page: {currentPage} of {totalPages}
      </p>
    </div>
  );
};

export const LoadingPaginationExample: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(2);
  const [loading, setLoading] = useState(false);
  const totalPages = 10;

  const handlePageChange = (page: number) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setCurrentPage(page);
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Pagination with Loading State</h2>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        loading={loading}
      />
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        {loading ? 'Loading...' : `Current page: ${currentPage}`}
      </p>
      <p style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>
        Click a page number to see loading state
      </p>
    </div>
  );
};

export const EdgeCaseExamples: React.FC = () => {
  const [page1, setPage1] = useState(1);
  const [page2, setPage2] = useState(1);
  const [page3, setPage3] = useState(3);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Edge Cases</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>Single Page (should not render)</h3>
        <Pagination
          currentPage={1}
          totalPages={1}
          onPageChange={() => {}}
        />
        <p style={{ marginTop: '1rem', textAlign: 'center', fontStyle: 'italic' }}>
          No pagination shown for single page
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>First Page (Previous disabled)</h3>
        <Pagination
          currentPage={page1}
          totalPages={5}
          onPageChange={setPage1}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3>Last Page (Next disabled)</h3>
        <Pagination
          currentPage={page2}
          totalPages={1}
          onPageChange={setPage2}
        />
      </div>

      <div>
        <h3>Middle Page</h3>
        <Pagination
          currentPage={page3}
          totalPages={5}
          onPageChange={setPage3}
        />
      </div>
    </div>
  );
};

export const KeyboardNavigationExample: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(3);
  const totalPages = 10;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Keyboard Navigation</h2>
      <p style={{ marginBottom: '1rem', textAlign: 'center' }}>
        Use Arrow Left/Right keys to navigate
      </p>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        Current page: {currentPage}
      </p>
      <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
        <p style={{ fontSize: '0.875rem', margin: 0 }}>
          <strong>Keyboard shortcuts:</strong>
        </p>
        <ul style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          <li>← Arrow Left: Previous page</li>
          <li>→ Arrow Right: Next page</li>
        </ul>
      </div>
    </div>
  );
};

export const WithDataExample: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalItems = 47;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Simulate data
  const allItems = Array.from({ length: totalItems }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }));

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = allItems.slice(startIndex, endIndex);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Pagination with Data</h2>
      <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
        Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} items
      </p>
      
      <div style={{ marginBottom: '1rem' }}>
        {currentItems.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '0.75rem',
              marginBottom: '0.5rem',
              backgroundColor: '#f9fafb',
              borderRadius: '0.375rem',
              border: '1px solid #e5e7eb',
            }}
          >
            {item.name}
          </div>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
