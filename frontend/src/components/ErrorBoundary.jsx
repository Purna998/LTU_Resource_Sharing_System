import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    // Log to a service like Sentry here in production
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '50vh', textAlign: 'center', padding: '2rem'
        }}>
          <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
            Oops! Something went wrong.
          </h2>
          <p style={{ color: '#4b5563', marginBottom: '2rem', maxWidth: '500px' }}>
            We're sorry, but the application encountered an unexpected error.
            Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.replace('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1.5rem', backgroundColor: '#3b82f6', color: 'white',
              border: 'none', borderRadius: '0.5rem', cursor: 'pointer',
              fontWeight: '600', transition: 'background-color 0.2s'
            }}
          >
            <RefreshCw size={20} />
            Return to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
