/**
 * Example usage of ErrorMessage component
 * This file demonstrates various use cases
 */

import { ErrorMessage } from './ErrorMessage';

export const ErrorMessageExamples = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
      <h2>ErrorMessage Component Examples</h2>

      <div>
        <h3>Network Error with Retry</h3>
        <ErrorMessage
          error="Failed to connect to the server. Please check your internet connection."
          onRetry={() => console.log('Retrying...')}
        />
      </div>

      <div>
        <h3>Validation Error</h3>
        <ErrorMessage error="Invalid email format. Please enter a valid email address." />
      </div>

      <div>
        <h3>Server Error with Retry</h3>
        <ErrorMessage
          error="Server error 500: Internal server error occurred."
          onRetry={() => console.log('Retrying...')}
        />
      </div>

      <div>
        <h3>Generic Error</h3>
        <ErrorMessage error="Something went wrong. Please try again later." />
      </div>

      <div>
        <h3>Error Object</h3>
        <ErrorMessage error={new Error('Failed to fetch data from API')} />
      </div>

      <div>
        <h3>Explicit Type Override</h3>
        <ErrorMessage error="Custom error message" type="validation" />
      </div>
    </div>
  );
};
