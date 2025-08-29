"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react'
import { passwordResetSchema, type PasswordResetInput } from '@/lib/auth/validation'
import { validatePasswordStrength } from '@/lib/auth/password'
import { Button } from '@/components/base/Button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from '@/components/ui/form'
import { cn } from '@/lib/utils'

/**
 * Password reset completion form component
 * Features: Password strength validation, success state
 */

interface ResetPasswordFormProps {
  token: string
  onSubmit: (data: PasswordResetInput) => Promise<{ success: boolean; error?: string }>
  onSuccess?: () => void
  className?: string
  isLoading?: boolean
}

export function ResetPasswordForm({ 
  token,
  onSubmit, 
  onSuccess,
  className,
  isLoading = false 
}: ResetPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<PasswordResetInput>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      token,
      password: '',
      confirmPassword: ''
    }
  })

  const password = form.watch('password')
  const passwordStrength = password ? validatePasswordStrength(password) : null

  const getPasswordStrengthColor = (score: number) => {
    if (score < 40) return 'bg-red-500'
    if (score < 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = (score: number) => {
    if (score < 40) return 'Weak'
    if (score < 70) return 'Fair'
    return 'Strong'
  }

  const handleSubmit = async (data: PasswordResetInput) => {
    setSubmitError(null)
    
    try {
      const result = await onSubmit(data)
      
      if (result.success) {
        setIsSuccess(true)
        setTimeout(() => {
          onSuccess?.()
        }, 2000)
      } else {
        setSubmitError(result.error || 'Failed to reset password')
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
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Password reset successful
          </h2>
          <p className="text-muted-foreground">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Redirecting you to the sign-in page...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Set new password
          </h2>
          <p className="text-muted-foreground">
            Enter a strong password for your account.
          </p>
        </div>

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
            noValidate
          >
            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    New Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        className="pl-10 pr-12 h-12 text-base"
                        autoComplete="new-password"
                        autoFocus
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  
                  {/* Password Strength Indicator */}
                  {passwordStrength && (
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          Password strength: {getPasswordStrengthText(passwordStrength.score)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {passwordStrength.score}%
                        </span>
                      </div>
                      <Progress 
                        value={passwordStrength.score} 
                        className="h-2"
                      />
                      {passwordStrength.errors.length > 0 && (
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {passwordStrength.errors.map((error, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-1 h-1 bg-muted-foreground rounded-full mr-2" />
                              {error}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password Field */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Confirm New Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                      <Input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your new password"
                        className="pl-10 pr-12 h-12 text-base"
                        autoComplete="new-password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
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
              loadingText="Updating password..."
              disabled={isLoading}
              className="h-12 text-base font-medium"
            >
              Reset Password
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default ResetPasswordForm