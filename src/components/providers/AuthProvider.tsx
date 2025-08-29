"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth, type User } from '@/hooks/useAuth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  login: (data: any) => Promise<{ success: boolean; error?: string }>
  register: (data: any) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  forgotPassword: (data: any) => Promise<{ success: boolean; error?: string }>
  resetPassword: (data: any) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register', 
  '/auth/forgot-password',
  '/auth/reset-password'
]

/**
 * AuthProvider component that manages authentication state
 * and handles route protection throughout the application
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [shouldRedirect, setShouldRedirect] = useState(false)

  // Handle authentication state changes and redirects
  useEffect(() => {
    // Don't redirect until auth is initialized
    if (!auth.isInitialized) {
      return
    }

    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
    
    if (!auth.user && !isPublicRoute) {
      // User is not authenticated and trying to access protected route
      setShouldRedirect(true)
      const redirectUrl = pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : ''
      router.push(`/auth/login${redirectUrl}`)
    } else if (auth.user && isPublicRoute) {
      // User is authenticated but on auth page - redirect to dashboard
      router.push('/dashboard')
    } else {
      setShouldRedirect(false)
    }
  }, [auth.user, auth.isInitialized, pathname, router])

  // Show loading screen during initial auth check
  if (!auth.isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading screen during redirects to prevent flash
  if (shouldRedirect) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}