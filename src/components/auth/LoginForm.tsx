"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { loginSchema, type LoginInput } from '@/lib/auth/validation'
import { Button } from '@/components/base/Button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
 * Login form component with ADHD-friendly design
 * Features: Clear labels, immediate validation, loading states
 */

interface LoginFormProps {
  onSubmit: (data: LoginInput) => Promise<{ success: boolean; error?: string }>
  onForgotPassword?: () => void
  className?: string
  isLoading?: boolean
}

export function LoginForm({ 
  onSubmit, 
  onForgotPassword, 
  className,
  isLoading = false 
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  })

  const handleSubmit = async (data: LoginInput) => {
    setSubmitError(null)
    
    try {
      const result = await onSubmit(data)
      
      if (!result.success) {
        setSubmitError(result.error || 'Login failed')
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
                      placeholder="Enter your password"
                      className="pl-10 pr-12 h-12 text-base"
                      autoComplete="current-password"
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
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Remember Me */}
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-2"
                    disabled={isLoading}
                  />
                  <Label 
                    htmlFor="rememberMe" 
                    className="text-sm font-normal cursor-pointer"
                  >
                    Remember me for 7 days
                  </Label>
                </div>
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
            loadingText="Signing in..."
            disabled={isLoading}
            className="h-12 text-base font-medium"
          >
            Sign In
          </Button>

          {/* Forgot Password Link */}
          {onForgotPassword && (
            <div className="text-center">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
                disabled={isLoading}
              >
                Forgot your password?
              </button>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}

export default LoginForm