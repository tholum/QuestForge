"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { registerSchema, type RegisterInput } from '@/lib/auth/validation'
import { validatePasswordStrength } from '@/lib/auth/password'
import { Button } from '@/components/base/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
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
 * Registration form component with ADHD-friendly design
 * Features: Clear labels, immediate validation, password strength indicator
 */

interface RegisterFormProps {
  onSubmit: (data: RegisterInput) => Promise<{ success: boolean; error?: string }>
  className?: string
  isLoading?: boolean
}

export function RegisterForm({ 
  onSubmit, 
  className,
  isLoading = false 
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      name: '',
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

  const handleSubmit = async (data: RegisterInput) => {
    setSubmitError(null)
    
    try {
      const result = await onSubmit(data)
      
      if (!result.success) {
        setSubmitError(result.error || 'Registration failed')
      }
    } catch (error) {
      setSubmitError('An unexpected error occurred')
    }
  }

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
          noValidate
        >
          {/* Name Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">
                  Full Name
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                    <Input
                      {...field}
                      type="text"
                      placeholder="Enter your full name"
                      className="pl-10 h-12 text-base"
                      autoComplete="name"
                      autoFocus
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">
                  Password
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
                  Confirm Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                    <Input
                      {...field}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
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
            loadingText="Creating account..."
            disabled={isLoading}
            className="h-12 text-base font-medium"
          >
            Create Account
          </Button>

          {/* Terms Notice */}
          <p className="text-xs text-muted-foreground text-center">
            By creating an account, you agree to our{' '}
            <a href="/terms" className="text-primary hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </form>
      </Form>
    </div>
  )
}

export default RegisterForm