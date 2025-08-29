"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dashboard } from "@/components/pages/Dashboard"
import { useAuthContext } from "@/components/providers/AuthProvider"

export default function Home() {
  const { user, isInitialized } = useAuthContext()
  const router = useRouter()

  // Redirect to dashboard route for consistency
  useEffect(() => {
    if (isInitialized) {
      router.push('/dashboard')
    }
  }, [isInitialized, router])

  // Show loading while redirecting
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // This component will redirect, but render nothing while doing so
  return null
}
