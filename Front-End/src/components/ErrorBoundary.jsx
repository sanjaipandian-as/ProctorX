import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an uncaught exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          padding: '24px',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{
            maxWidth: '500px',
            backgroundColor: '#1e293b',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#f1f5f9' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '24px', lineHeight: '1.6' }}>
              An unexpected error occurred in the user interface. Don't worry, your progress has been securely processed on the backend.
            </p>
            <div style={{
              textAlign: 'left',
              backgroundColor: '#0f172a',
              borderRadius: '6px',
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#f43f5e',
              overflowX: 'auto',
              marginBottom: '24px',
              maxHeight: '120px'
            }}>
              {this.state.error && this.state.error.toString()}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#4338ca'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#4f46e5'}
            >
              Refresh Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
