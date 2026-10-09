import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4 p-8 text-center">
          <AlertCircle size={64} className="text-red-500" />
          <h1 className="text-2xl font-bold text-white">Something went wrong.</h1>
          <p className="text-slate-400 max-w-md">
            An unexpected error occurred in this component. Try navigating to another page.
          </p>
          <pre className="mt-4 p-4 bg-navy-950 border border-navy-700 rounded-lg text-left text-xs text-red-400 overflow-auto max-w-2xl w-full">
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-6 px-6 py-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
