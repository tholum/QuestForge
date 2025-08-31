"use client"

import React from 'react'

interface AuthBoundaryState {
  hasError: boolean
  redirectLoop: boolean
  errorMessage?: string
}

interface AuthBoundaryProps {
  children: React.ReactNode
}

/**
 * Error boundary specifically for authentication-related errors
 * Provides recovery mechanisms for redirect loops and auth failures
 */
class AuthBoundary extends React.Component<AuthBoundaryProps, AuthBoundaryState> {
  constructor(props: AuthBoundaryProps) {
    super(props)
    this.state = { hasError: false, redirectLoop: false }
  }

  static getDerivedStateFromError(error: Error): AuthBoundaryState {
    // Detect redirect loops and navigation errors
    if (
      error.message.includes('redirect') || 
      error.message.includes('navigation') ||
      error.message.includes('Router') ||
      error.stack?.includes('router')
    ) {
      return { 
        hasError: true, 
        redirectLoop: true,
        errorMessage: 'Navigation error detected - possible redirect loop'
      }
    }

    // Detect auth-related errors
    if (
      error.message.includes('auth') ||
      error.message.includes('login') ||
      error.message.includes('unauthorized')
    ) {
      return { 
        hasError: true, 
        redirectLoop: false,
        errorMessage: 'Authentication error occurred'
      }
    }

    return { 
      hasError: true, 
      redirectLoop: false,
      errorMessage: 'An unexpected error occurred'
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Boundary Error:', error, errorInfo)
    
    // Log additional context for debugging
    console.error('Current URL:', window.location.href)
    console.error('User Agent:', navigator.userAgent)
    console.error('Timestamp:', new Date().toISOString())
  }

  private handleRefresh = () => {
    window.location.reload()
  }

  private handleGoToLogin = () => {
    // Clear any existing auth state and redirect to login
    window.localStorage.removeItem('authToken')
    window.sessionStorage.clear()
    window.location.href = '/auth/login'
  }

  private handleGoToHome = () => {
    window.location.href = '/'
  }

  private handleTryAgain = () => {
    this.setState({ hasError: false, redirectLoop: false, errorMessage: undefined })
  }

  render() {
    if (this.state.redirectLoop) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-destructive"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Authentication Issue</h2>
              <p className="text-muted-foreground">
                A redirect loop was detected. This usually happens when there's a conflict 
                in the authentication flow.
              </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={this.handleGoToLogin}
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Go to Login
              </button>
              <button 
                onClick={this.handleRefresh}
                className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
              >
                Refresh Page
              </button>
              <button 
                onClick={this.handleTryAgain}
                className="w-full bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/90 transition-colors"
              >
                Try Again
              </button>
            </div>

            <div className="text-xs text-muted-foreground">
              If this problem persists, try clearing your browser cache or using an incognito window.
            </div>
          </div>
        </div>
      )
    }

    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-destructive"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
              <p className="text-muted-foreground">
                {this.state.errorMessage || 'An unexpected error occurred while processing your request.'}
              </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={this.handleTryAgain}
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={this.handleGoToHome}
                className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 transition-colors"
              >
                Go to Home
              </button>
              <button 
                onClick={this.handleRefresh}
                className="w-full bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/90 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AuthBoundary