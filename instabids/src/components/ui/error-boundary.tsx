'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch JavaScript errors anywhere in child component tree
 * and display a fallback UI instead of crashing the whole app
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-4">
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              {this.state.error?.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>
          
          <div className="mt-4">
            <Button onClick={this.resetError} variant="outline">
              Try Again
            </Button>
          </div>
          
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md overflow-auto text-xs">
              <p className="font-medium mb-2">Error Details:</p>
              <pre>{this.state.error.toString()}</pre>
              {this.state.errorInfo && (
                <>
                  <p className="font-medium mt-4 mb-2">Component Stack:</p>
                  <pre>{this.state.errorInfo.componentStack}</pre>
                </>
              )}
            </div>
          )}
        </div>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}
