import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="card max-w-md w-full text-center p-8 animate-fade-in shadow-xl border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-6 text-sm">
              We encountered an unexpected error loading this page. Our team has been notified.
            </p>
            {this.state.error && (
              <div className="bg-gray-100 p-3 rounded text-left mb-6 overflow-x-auto">
                <code className="text-xs text-red-600 font-mono break-all">
                  {this.state.error.toString()}
                </code>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <RefreshCw className="w-4 h-4" /> Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
