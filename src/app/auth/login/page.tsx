"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuth } from '@/hooks/useAuth'

/**
 * Login page component
 * Features: Redirect if logged in, social login options, register link
 */
export default function LoginPage() {
  const router = useRouter()
  const { user, login, isLoading, isInitialized } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (isInitialized && user) {
      router.push('/dashboard')
    }
  }, [user, isInitialized, router])

  // Handle forgot password navigation
  const handleForgotPassword = () => {
    router.push('/auth/forgot-password')
  }

  // Handle login success
  const handleLogin = async (data: any) => {
    const result = await login(data)
    
    if (result.success) {
      // Get redirect URL from query params or default to dashboard
      const urlParams = new URLSearchParams(window.location.search)
      const redirectTo = urlParams.get('redirect') || '/dashboard'
      router.push(redirectTo)
    }
    
    return result
  }

  // Show loading while checking auth state
  if (!isInitialized) {
    return (
      <AuthLayout title="Welcome back" subtitle="Loading...">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthLayout>
    )
  }

  // Don't render if user is logged in (will redirect)
  if (user) {
    return null
  }

  return (
    <AuthLayout 
      title="Welcome back"
      subtitle="Sign in to your GoalAssistant account"
    >
      <div className="space-y-8">
        {/* Login Form */}
        <LoginForm
          onSubmit={handleLogin}
          onForgotPassword={handleForgotPassword}
          isLoading={isLoading}
        />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted-foreground/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-4 text-muted-foreground">
              New to GoalAssistant?
            </span>
          </div>
        </div>

        {/* Register Link */}
        <div className="text-center">
          <Link 
            href="/auth/register"
            className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline transition-colors"
          >
            Create an account
          </Link>
        </div>

        {/* Demo Account (Development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 rounded-lg bg-muted/50 border-2 border-dashed border-muted-foreground/20">
            <h3 className="font-medium text-muted-foreground text-sm mb-2">
              Development Demo
            </h3>
            <p className="text-xs text-muted-foreground">
              Email: demo@example.com<br />
              Password: Demo123!
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}