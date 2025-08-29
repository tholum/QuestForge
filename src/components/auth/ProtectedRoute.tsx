"use client"

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

/**
 * Protected route wrapper component
 * Redirects unauthenticated users to login page
 */

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  fallback 
}: ProtectedRouteProps) {
  const { user, isInitialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isInitialized && !user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(pathname)
      router.push(`/auth/login?redirect=${returnUrl}`)
    }
  }, [user, isInitialized, router, pathname])

  // Show loading while checking auth state
  if (!isInitialized) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      )
    )
  }

  // Don't render children if user is not authenticated
  if (!user) {
    return null
  }

  // Render children if user is authenticated
  return <>{children}</>
}

export default ProtectedRoute