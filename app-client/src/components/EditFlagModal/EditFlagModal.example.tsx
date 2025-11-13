import { useState } from 'react';
import { EditFlagModal } from './EditFlagModal';
import type { Flag } from '../../types/api.types';
import { FlagType, Environment } from '../../types/api.types';

/**
 * Example usage of EditFlagModal component
 */
export const EditFlagModalExample = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Example flag data
  const exampleFlag: Flag = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    key: 'new-checkout-flow',
    name: 'New Checkout Flow',
    description: 'Enable the redesigned checkout experience',
    type: FlagType.BOOLEAN,
    enabled: true,
    environments: [
      {
        id: 'env-1',
        flagId: '123e4567-e89b-12d3-a456-426614174000',
        environment: Environment.DEVELOPMENT,
        enabled: true,
        rolloutPercentage: 100,
        targetingRules: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'env-2',
        flagId: '123e4567-e89b-12d3-a456-426614174000',
        environment: Environment.STAGING,
        enabled: true,
        rolloutPercentage: 50,
        targetingRules: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'env-3',
        flagId: '123e4567-e89b-12d3-a456-426614174000',
        environment: Environment.PRODUCTION,
        enabled: false,
        rolloutPercentage: 0,
        targetingRules: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const handleSuccess = () => {
    console.log('Flag updated successfully!');
    alert('Flag updated successfully!');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>EditFlagModal Example</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Current Flag</h2>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '1rem', 
          borderRadius: '4px',
          overflow: 'auto'
        }}>
          {JSON.stringify(exampleFlag, null, 2)}
        </pre>
      </div>

      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          backgroundColor: '#4F46E5',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Edit Flag
      </button>

      <EditFlagModal
        isOpen={isOpen}
        flag={exampleFlag}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />

      <div style={{ marginTop: '2rem' }}>
        <h2>Usage</h2>
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '1rem', 
          borderRadius: '4px',
          overflow: 'auto'
        }}>
{`import { EditFlagModal } from './components/EditFlagModal';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<Flag | null>(null);

  const handleEdit = (flag: Flag) => {
    setSelectedFlag(flag);
    setIsOpen(true);
  };

  const handleSuccess = () => {
    console.log('Flag updated successfully!');
  };

  return (
    <>
      <button onClick={() => handleEdit(someFlag)}>
        Edit Flag
      </button>
      
      <EditFlagModal
        isOpen={isOpen}
        flag={selectedFlag}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}`}
        </pre>
      </div>
    </div>
  );
};
