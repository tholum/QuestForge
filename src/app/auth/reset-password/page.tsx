"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'
import { useAuth } from '@/hooks/useAuth'

/**
 * Reset password page component
 * Features: Token-based password reset completion
 */
export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { resetPassword, isLoading } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Get token from URL params
  useEffect(() => {
    const tokenParam = searchParams.get('token')
    
    if (!tokenParam) {
      setError('Invalid or missing reset token')
      return
    }

    setToken(tokenParam)
  }, [searchParams])

  // Handle password reset success
  const handleSuccess = () => {
    router.push('/auth/login?message=password-reset-success')
  }

  // Handle invalid token error
  if (error) {
    return (
      <AuthLayout 
        title="Invalid reset link"
        subtitle="This password reset link is invalid or has expired"
        showBackButton
        backButtonText="Back to sign in"
        backButtonHref="/auth/login"
      >
        <div className="text-center space-y-6">
          <div className="p-6 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-destructive font-medium mb-2">
              Reset Link Invalid
            </p>
            <p className="text-sm text-muted-foreground">
              This password reset link is either invalid or has expired. 
              Please request a new password reset.
            </p>
          </div>
          
          <button
            onClick={() => router.push('/auth/forgot-password')}
            className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline transition-colors"
          >
            Request new reset link
          </button>
        </div>
      </AuthLayout>
    )
  }

  // Show loading while getting token
  if (!token) {
    return (
      <AuthLayout title="Reset password" subtitle="Loading...">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout 
      title="Reset your password"
      subtitle="Enter your new password below"
      showBackButton
      backButtonText="Back to sign in"
      backButtonHref="/auth/login"
    >
      <ResetPasswordForm
        token={token}
        onSubmit={resetPassword}
        onSuccess={handleSuccess}
        isLoading={isLoading}
      />
    </AuthLayout>
  )
}