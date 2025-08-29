"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { PasswordResetForm } from '@/components/auth/PasswordResetForm'
import { useAuth } from '@/hooks/useAuth'

/**
 * Forgot password page component
 * Features: Email-based password reset initiation
 */
export default function ForgotPasswordPage() {
  const router = useRouter()
  const { forgotPassword, isLoading } = useAuth()

  // Handle back to login navigation
  const handleBackToLogin = () => {
    router.push('/auth/login')
  }

  return (
    <AuthLayout 
      title="Reset your password"
      subtitle="We'll send you instructions to reset your password"
      showBackButton
      backButtonText="Back to sign in"
      onBack={handleBackToLogin}
    >
      <PasswordResetForm
        onSubmit={forgotPassword}
        onBackToLogin={handleBackToLogin}
        isLoading={isLoading}
      />
    </AuthLayout>
  )
}