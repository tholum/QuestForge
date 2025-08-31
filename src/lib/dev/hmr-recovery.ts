'use client'

import React from 'react'

/**
 * HMR Error Recovery Utilities
 * Handles Turbopack HMR module loading issues in development
 * 
 * This utility automatically detects and recovers from the known 
 * "module factory is not available" errors that occur with Next.js 15
 * and Turbopack during HMR updates.
 */

export class HMRRecovery {
  private static instance: HMRRecovery
  private errorCount = 0
  private maxErrors = 3
  private errorHistoryWindow = 60000 // 1 minute
  private errorHistory: number[] = []
  
  static getInstance() {
    if (!HMRRecovery.instance) {
      HMRRecovery.instance = new HMRRecovery()
    }
    return HMRRecovery.instance
  }
  
  setupErrorHandler() {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
      return
    }
    
    // Handle runtime errors
    window.addEventListener('error', (event) => {
      if (this.isHMRModuleError(event.error)) {
        this.handleHMRError(event.error)
        event.preventDefault()
      }
    })
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isHMRModuleError(event.reason)) {
        this.handleHMRError(event.reason)
        event.preventDefault()
      }
    })
    
    // Setup periodic cleanup of error history
    setInterval(() => {
      this.cleanupErrorHistory()
    }, this.errorHistoryWindow / 2)
  }
  
  private isHMRModuleError(error: any): boolean {
    if (!error?.message) return false
    
    const errorMessage = error.message.toLowerCase()
    return errorMessage.includes('module factory is not available') ||
           errorMessage.includes('deleted in an hmr update') ||
           errorMessage.includes('module') && errorMessage.includes('instantiated') ||
           errorMessage.includes('react-server-dom-turbopack')
  }
  
  private handleHMRError(error: any) {
    const now = Date.now()
    this.errorHistory.push(now)
    this.errorCount++
    
    console.warn(`🔥 HMR Module Error detected (${this.errorCount}):`, error.message)
    
    // Clean old errors from history
    this.cleanupErrorHistory()
    
    // Count recent errors
    const recentErrors = this.errorHistory.filter(
      time => now - time < this.errorHistoryWindow
    ).length
    
    if (recentErrors >= this.maxErrors) {
      console.warn(`🔄 Too many HMR errors (${recentErrors}) in the last minute. Showing recovery modal...`)
      this.showRecoveryModal()
    } else {
      // Try to recover silently with a brief delay
      console.log('🔧 Attempting silent HMR recovery...')
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          // Force a soft reload to clear module cache
          window.location.reload()
        }
      }, 1500)
    }
  }
  
  private cleanupErrorHistory() {
    const now = Date.now()
    this.errorHistory = this.errorHistory.filter(
      time => now - time < this.errorHistoryWindow
    )
  }
  
  private showRecoveryModal() {
    // Prevent multiple modals
    if (document.getElementById('hmr-recovery-modal')) {
      return
    }
    
    const modal = document.createElement('div')
    modal.id = 'hmr-recovery-modal'
    modal.innerHTML = `
      <div style="
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      ">
        <div style="
          background: white; padding: 2rem; border-radius: 12px;
          max-width: 480px; margin: 1rem; text-align: center;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        ">
          <div style="
            width: 64px; height: 64px; margin: 0 auto 1rem;
            background: #ef4444; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 24px; color: white;
          ">⚠️</div>
          
          <h3 style="
            margin: 0 0 1rem; font-size: 1.25rem; font-weight: 600;
            color: #1f2937;
          ">Development HMR Error</h3>
          
          <p style="
            margin: 0 0 1.5rem; color: #6b7280; line-height: 1.5;
          ">
            Multiple HMR module loading issues detected. This is a known issue with 
            Next.js 15 + Turbopack affecting fitness module components.
          </p>
          
          <div style="display: flex; gap: 0.5rem; justify-content: center;">
            <button onclick="window.location.reload(true)" style="
              background: #ef4444; color: white; border: none;
              padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;
              font-weight: 500; font-size: 14px;
              transition: background-color 0.2s;
            " onmouseover="this.style.background='#dc2626'" 
               onmouseout="this.style.background='#ef4444'">
              Hard Refresh
            </button>
            
            <button onclick="
              fetch('/api/dev/restart-webpack', { method: 'POST' })
                .then(() => window.location.reload())
                .catch(() => window.location.reload())
            " style="
              background: #6b7280; color: white; border: none;
              padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer;
              font-weight: 500; font-size: 14px;
              transition: background-color 0.2s;
            " onmouseover="this.style.background='#4b5563'" 
               onmouseout="this.style.background='#6b7280'">
              Try Webpack Mode
            </button>
          </div>
          
          <p style="
            margin: 1rem 0 0; font-size: 12px; color: #9ca3af;
          ">
            Press Ctrl+Shift+R or Cmd+Shift+R for hard refresh
          </p>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Auto-close after 30 seconds
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal)
      }
    }, 30000)
  }
  
  // Public method to manually trigger recovery
  public triggerRecovery() {
    if (typeof window !== 'undefined') {
      console.log('🔄 Manual HMR recovery triggered')
      window.location.reload()
    }
  }
  
  // Get current error statistics
  public getErrorStats() {
    const now = Date.now()
    const recentErrors = this.errorHistory.filter(
      time => now - time < this.errorHistoryWindow
    ).length
    
    return {
      totalErrors: this.errorCount,
      recentErrors,
      timeWindow: this.errorHistoryWindow / 1000 + 's'
    }
  }
}

// Error boundary hook for React components
export const useHMRErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null)
  
  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const hmrRecovery = HMRRecovery.getInstance()
      if (hmrRecovery['isHMRModuleError'](event.error)) {
        setError(event.error)
      }
    }
    
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])
  
  const resetError = () => setError(null)
  
  return { error, resetError }
}

// Auto-initialize in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Small delay to ensure DOM is ready
  setTimeout(() => {
    HMRRecovery.getInstance().setupErrorHandler()
    
    // Add global debug function
    ;(window as any).hmrRecovery = HMRRecovery.getInstance()
    
    console.log('🛡️ HMR Recovery initialized for Turbopack module loading issues')
  }, 100)
}

// Export for manual initialization
export default HMRRecovery