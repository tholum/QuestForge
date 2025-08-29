"use client"

import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/base/Button'
import { cn } from '@/lib/utils'

/**
 * Shared layout for authentication pages
 * Features: Responsive design, clear branding, navigation
 */

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  showBackButton?: boolean
  backButtonText?: string
  backButtonHref?: string
  onBack?: () => void
  className?: string
}

export function AuthLayout({
  children,
  title,
  subtitle,
  showBackButton = false,
  backButtonText = "Back",
  backButtonHref = "/",
  onBack,
  className
}: AuthLayoutProps) {
  return (
    <div className={cn(
      "min-h-screen bg-background flex flex-col",
      className
    )}>
      {/* Header */}
      <header className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {showBackButton && (
            <div className="mb-6">
              {onBack ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  className="p-0 h-auto"
                >
                  {backButtonText}
                </Button>
              ) : (
                <Link href={backButtonHref}>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    className="p-0 h-auto"
                  >
                    {backButtonText}
                  </Button>
                </Link>
              )}
            </div>
          )}
          
          {/* Logo / Branding */}
          <div className="text-center mb-8">
            <Link 
              href="/" 
              className="inline-block mb-4 hover:opacity-80 transition-opacity"
            >
              <div className="text-2xl font-bold text-primary">
                GoalAssistant
              </div>
            </Link>
            
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {title}
            </h1>
            
            {subtitle && (
              <p className="text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center space-y-4">
            {/* Help Links */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link 
                href="/help"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Help Center
              </Link>
              <Link 
                href="/privacy"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link 
                href="/terms"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </Link>
            </div>
            
            {/* Copyright */}
            <p className="text-xs text-muted-foreground">
              © 2025 GoalAssistant. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AuthLayout