import { useState } from 'react';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import type { Flag } from '../../types/api.types';

/**
 * Example usage of DeleteConfirmDialog component
 * 
 * This example demonstrates:
 * - Opening the dialog when delete button is clicked
 * - Handling successful deletion
 * - Handling cancellation
 * - Managing dialog state
 */
export const DeleteConfirmDialogExample = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<Flag | null>(null);
  const [message, setMessage] = useState<string>('');

  // Mock flag data
  const mockFlag: Flag = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    key: 'new-checkout-flow',
    name: 'New Checkout Flow',
    description: 'Enable the redesigned checkout experience',
    type: 'boolean',
    enabled: true,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    environments: [],
  };

  const handleDeleteClick = () => {
    setSelectedFlag(mockFlag);
    setIsDialogOpen(true);
    setMessage('');
  };

  const handleConfirm = () => {
    setMessage(`Flag "${selectedFlag?.name}" was successfully deleted!`);
    setSelectedFlag(null);
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setSelectedFlag(null);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>DeleteConfirmDialog Example</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={handleDeleteClick}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#e53e3e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Delete Flag
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#48bb78',
            color: 'white',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          {message}
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h3>Current Flag:</h3>
        <pre style={{ backgroundColor: '#f7fafc', padding: '1rem', borderRadius: '4px' }}>
          {JSON.stringify(mockFlag, null, 2)}
        </pre>
      </div>

      <DeleteConfirmDialog
        isOpen={isDialogOpen}
        flagName={selectedFlag?.name || ''}
        flagId={selectedFlag?.id || ''}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};
