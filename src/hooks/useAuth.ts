"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Authentication hook for client-side auth state management
 * Handles login, logout, registration, and user state
 */

export interface User {
  id: string
  email: string
  name: string | null
  totalXp: number
  currentLevel: number
  streakCount: number
  emailVerified: boolean
  lastLoginAt: Date | null
}

export interface LoginData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  name: string
  password: string
  confirmPassword: string
}

export interface PasswordResetRequestData {
  email: string
}

export interface PasswordResetData {
  token: string
  password: string
  confirmPassword: string
}

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  forgotPassword: (data: PasswordResetRequestData) => Promise<{ success: boolean; error?: string }>
  resetPassword: (data: PasswordResetData) => Promise<{ success: boolean; error?: string }>
  refreshUser: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await fetch('/api/v1/auth/me', {
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setUser(data.data.user)
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      } finally {
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [])

  // Login function
  const login = useCallback(async (data: LoginData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        setUser(result.data.user)
        return { success: true }
      } else {
        return { 
          success: false, 
          error: result.error || 'Login failed' 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Network error occurred' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Register function
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        setUser(result.data.user)
        return { success: true }
      } else {
        return { 
          success: false, 
          error: result.error || 'Registration failed' 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Network error occurred' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true)
    
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsLoading(false)
      router.push('/auth/login')
    }
  }, [router])

  // Forgot password function
  const forgotPassword = useCallback(async (data: PasswordResetRequestData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        return { success: true }
      } else {
        return { 
          success: false, 
          error: result.error || 'Failed to send reset instructions' 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Network error occurred' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Reset password function
  const resetPassword = useCallback(async (data: PasswordResetData) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        return { success: true }
      } else {
        return { 
          success: false, 
          error: result.error || 'Failed to reset password' 
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Network error occurred' 
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/auth/me', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.data.user)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
    }
  }, [])

  // Auto-refresh token
  useEffect(() => {
    if (!user || !isInitialized) return

    const refreshToken = async () => {
      try {
        await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include'
        })
      } catch (error) {
        console.error('Token refresh failed:', error)
        setUser(null)
        router.push('/auth/login')
      }
    }

    // Refresh token every 23 hours
    const interval = setInterval(refreshToken, 23 * 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user, isInitialized, router])

  return {
    user,
    isLoading,
    isInitialized,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    refreshUser
  }
}