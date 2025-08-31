"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
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
  
  // Redirect throttling to prevent loops
  const [lastRedirect, setLastRedirect] = useState<number>(0)
  const REDIRECT_COOLDOWN = 1000 // 1 second
  
  // Track redirect intent to detect loops
  const [redirectIntent, setRedirectIntent] = useState<{
    from: string
    to: string
    timestamp: number
  } | null>(null)
  
  // Track consecutive redirects
  const redirectCountRef = useRef(0)
  const MAX_REDIRECTS = 3

  // Check if redirect would create a loop
  const wouldCreateLoop = (from: string, to: string) => {
    return redirectIntent && 
           redirectIntent.to === from && 
           redirectIntent.from === to &&
           Date.now() - redirectIntent.timestamp < 5000
  }
  
  // Handle authentication state changes and redirects
  useEffect(() => {
    // Don't redirect until auth is initialized
    if (!auth.isInitialized) {
      return
    }

    const now = Date.now()
    
    // Prevent rapid consecutive redirects
    if (now - lastRedirect < REDIRECT_COOLDOWN) {
      return
    }
    
    // Reset redirect count if enough time has passed
    if (now - lastRedirect > 10000) {
      redirectCountRef.current = 0
    }
    
    // Block if too many redirects
    if (redirectCountRef.current >= MAX_REDIRECTS) {
      console.warn('Too many redirects blocked - potential loop detected')
      setShouldRedirect(false)
      return
    }

    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
    
    if (!auth.user && !isPublicRoute) {
      // User is not authenticated and trying to access protected route
      const targetUrl = `/auth/login${pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : ''}`
      
      // Check for potential loop
      if (wouldCreateLoop(pathname, targetUrl)) {
        console.warn('Redirect loop prevented:', { from: pathname, to: targetUrl })
        return
      }
      
      setLastRedirect(now)
      redirectCountRef.current++
      setRedirectIntent({ from: pathname, to: targetUrl, timestamp: now })
      setShouldRedirect(true)
      
      router.push(targetUrl)
    } else if (auth.user && isPublicRoute && !auth.isLoading) {
      // User is authenticated but on auth page - redirect to dashboard
      // Only redirect if not currently loading (prevents interrupting login process)
      const targetUrl = '/dashboard'
      
      // Check for potential loop
      if (wouldCreateLoop(pathname, targetUrl)) {
        console.warn('Redirect loop prevented:', { from: pathname, to: targetUrl })
        return
      }
      
      // Special handling for login page - allow time for login process to complete
      if (pathname === '/auth/login') {
        // Small delay to allow login process to handle redirect
        setTimeout(() => {
          if (auth.user && pathname === '/auth/login') {
            setLastRedirect(Date.now())
            redirectCountRef.current++
            setRedirectIntent({ from: pathname, to: targetUrl, timestamp: Date.now() })
            router.push(targetUrl)
          }
        }, 100)
        return
      }
      
      setLastRedirect(now)
      redirectCountRef.current++
      setRedirectIntent({ from: pathname, to: targetUrl, timestamp: now })
      
      router.push(targetUrl)
    } else {
      setShouldRedirect(false)
      // Reset redirect tracking on successful page load
      if (redirectCountRef.current > 0) {
        setTimeout(() => {
          redirectCountRef.current = 0
          setRedirectIntent(null)
        }, 2000)
      }
    }
  }, [auth.user, auth.isInitialized, auth.isLoading, pathname, router, lastRedirect, redirectIntent])

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