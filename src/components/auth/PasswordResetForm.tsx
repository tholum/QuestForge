"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, ArrowLeft } from 'lucide-react'
import { passwordResetRequestSchema, type PasswordResetRequestInput } from '@/lib/auth/validation'
import { Button } from '@/components/base/Button'
import { Input } from '@/components/ui/input'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from '@/components/ui/form'
import { cn } from '@/lib/utils'

/**
 * Password reset request form component
 * Features: Clear instructions, success state, back navigation
 */

interface PasswordResetFormProps {
  onSubmit: (data: PasswordResetRequestInput) => Promise<{ success: boolean; error?: string }>
  onBackToLogin?: () => void
  className?: string
  isLoading?: boolean
}

export function PasswordResetForm({ 
  onSubmit, 
  onBackToLogin,
  className,
  isLoading = false 
}: PasswordResetFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: ''
    }
  })

  const handleSubmit = async (data: PasswordResetRequestInput) => {
    setSubmitError(null)
    
    try {
      const result = await onSubmit(data)
      
      if (result.success) {
        setIsSuccess(true)
      } else {
        setSubmitError(result.error || 'Failed to send reset instructions')
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred')
    }
  }

  if (isSuccess) {
    return (
      <div className={cn("w-full max-w-md mx-auto text-center space-y-6", className)}>
        <div className="space-y-2">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Check your email
          </h2>
          <p className="text-muted-foreground">
            If an account with that email exists, you&apos;ll receive password reset instructions shortly.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive an email? Check your spam folder or try again in a few minutes.
          </p>
          
          {onBackToLogin && (
            <Button
              variant="outline"
              onClick={onBackToLogin}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="w-full"
            >
              Back to Sign In
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Reset your password
          </h2>
          <p className="text-muted-foreground">
            Enter your email address and we&apos;ll send you instructions to reset your password.
          </p>
        </div>

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
            noValidate
          >
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Email Address
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10 h-12 text-base"
                        autoComplete="email"
                        autoFocus
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    We&apos;ll send password reset instructions to this email address.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Error */}
            {submitError && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">
                  {submitError}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isLoading}
              loadingText="Sending instructions..."
              disabled={isLoading}
              className="h-12 text-base font-medium"
            >
              Send Reset Instructions
            </Button>

            {/* Back to Login */}
            {onBackToLogin && (
              <Button
                type="button"
                variant="ghost"
                onClick={onBackToLogin}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                disabled={isLoading}
                className="w-full"
              >
                Back to Sign In
              </Button>
            )}
          </form>
        </Form>
      </div>
    </div>
  )
}

export default PasswordResetForm