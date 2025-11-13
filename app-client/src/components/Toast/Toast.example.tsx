/**
 * Toast Component Example
 * 
 * This file demonstrates how to use the Toast notification system
 */

import React from 'react';
import { useToastContext } from '../../context';

export const ToastExample: React.FC = () => {
  const { showSuccess, showError, showInfo, showWarning } = useToastContext();

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <h2 style={{ width: '100%' }}>Toast Notification Examples</h2>
      
      <button
        onClick={() => showSuccess('Operation completed successfully!')}
        style={{
          padding: '10px 20px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Show Success Toast
      </button>

      <button
        onClick={() => showError('An error occurred. Please try again.')}
        style={{
          padding: '10px 20px',
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Show Error Toast
      </button>

      <button
        onClick={() => showInfo('Here is some helpful information.')}
        style={{
          padding: '10px 20px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Show Info Toast
      </button>

      <button
        onClick={() => showWarning('Warning: This action cannot be undone.')}
        style={{
          padding: '10px 20px',
          background: '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Show Warning Toast
      </button>

      <button
        onClick={() => {
          showSuccess('First notification');
          setTimeout(() => showInfo('Second notification'), 500);
          setTimeout(() => showWarning('Third notification'), 1000);
        }}
        style={{
          padding: '10px 20px',
          background: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Show Multiple Toasts
      </button>

      <button
        onClick={() => showSuccess('This toast will stay for 10 seconds', 10000)}
        style={{
          padding: '10px 20px',
          background: '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Show Long Duration Toast (10s)
      </button>
    </div>
  );
};
