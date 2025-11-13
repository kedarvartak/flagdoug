/**
 * Example usage of LoadingOverlay component
 * This file demonstrates various use cases
 */

import { useState } from 'react';
import { LoadingOverlay } from './LoadingOverlay';

export const LoadingOverlayExamples = () => {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showInline, setShowInline] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      <h2>LoadingOverlay Component Examples</h2>

      <div>
        <h3>Full-Screen Overlay</h3>
        <button onClick={() => setShowFullScreen(true)}>Show Full-Screen Loading</button>
        {showFullScreen && (
          <LoadingOverlay isFullScreen={true} message="Loading application data..." />
        )}
        <button onClick={() => setShowFullScreen(false)}>Hide</button>
      </div>

      <div>
        <h3>Inline Overlay</h3>
        <button onClick={() => setShowInline(!showInline)}>Toggle Inline Loading</button>
        <div
          style={{
            position: 'relative',
            height: '300px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            marginTop: '16px',
          }}
        >
          <div style={{ padding: '16px' }}>
            <h4>Content Area</h4>
            <p>This is some content that will be covered by the loading overlay.</p>
          </div>
          {showInline && <LoadingOverlay message="Refreshing data..." />}
        </div>
      </div>

      <div>
        <h3>Without Message</h3>
        <div
          style={{
            position: 'relative',
            height: '200px',
            border: '1px solid #ccc',
            borderRadius: '8px',
          }}
        >
          <LoadingOverlay />
        </div>
      </div>
    </div>
  );
};
