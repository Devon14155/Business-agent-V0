import React, { ErrorInfo, ReactNode } from 'react';
import { observabilityService } from '../services/observabilityService';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    observabilityService.logError(error, { componentStack: errorInfo.componentStack });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
            <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-red-600 dark:text-red-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
                <p className="mb-8 text-gray-500 dark:text-gray-400 leading-relaxed">
                    We've encountered an unexpected issue. Don't worry, your data is safe. Please try reloading the page.
                </p>
                <button
                    onClick={this.handleReload}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                >
                    Reload Application
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;