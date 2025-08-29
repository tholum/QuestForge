"use client"

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { useAuth } from '@/hooks/useAuth'

/**
 * Registration page component
 * Features: Redirect if logged in, terms acceptance, login link
 */
export default function RegisterPage() {
  const router = useRouter()
  const { user, register, isLoading, isInitialized } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (isInitialized && user) {
      router.push('/dashboard')
    }
  }, [user, isInitialized, router])

  // Handle registration success
  const handleRegister = async (data: any) => {
    const result = await register(data)
    
    if (result.success) {
      // Redirect to dashboard after successful registration
      router.push('/dashboard')
    }
    
    return result
  }

  // Show loading while checking auth state
  if (!isInitialized) {
    return (
      <AuthLayout title="Create account" subtitle="Loading...">
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
      title="Create your account"
      subtitle="Start your goal achievement journey"
    >
      <div className="space-y-8">
        {/* Registration Form */}
        <RegisterForm
          onSubmit={handleRegister}
          isLoading={isLoading}
        />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted-foreground/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-4 text-muted-foreground">
              Already have an account?
            </span>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <Link 
            href="/auth/login"
            className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline transition-colors"
          >
            Sign in instead
          </Link>
        </div>

        {/* Benefits Section */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-medium text-foreground text-center">
            Why join GoalAssistant?
          </h3>
          <div className="grid gap-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0"></div>
              <p>Track your goals with a gamified experience</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0"></div>
              <p>ADHD-friendly design with clear visual cues</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0"></div>
              <p>Mobile-first interface for goal tracking on-the-go</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0"></div>
              <p>Modular system for fitness, home, work, and learning goals</p>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}