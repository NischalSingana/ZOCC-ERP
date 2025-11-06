import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zocc-blue-900 via-zocc-blue-800 to-zocc-blue-900 p-4">
          <div className="bg-zocc-blue-800/30 backdrop-blur-lg rounded-lg p-8 border border-zocc-blue-700/30 max-w-md w-full text-center">
            <AlertTriangle className="mx-auto text-red-400 mb-4" size={48} />
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-zocc-blue-300 mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-zocc-blue-600 to-zocc-blue-500 text-white rounded-lg hover:from-zocc-blue-500 hover:to-zocc-blue-400 transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

