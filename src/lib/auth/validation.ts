import { z } from 'zod'

/**
 * Validation schemas for authentication forms and API inputs
 * Uses Zod for type-safe validation with detailed error messages
 */

// Email validation schema
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required')
  .max(254, 'Email address is too long')
  .transform(email => email.toLowerCase().trim())

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password is too long')
  .refine(
    (password) => /[a-z]/.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => /[A-Z]/.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => /\d/.test(password),
    'Password must contain at least one number'
  )

// Name validation schema
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name is too long')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
  .transform(name => name.trim())

// Registration form schema
export const registerSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
)

// Login form schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
})

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: emailSchema
})

// Password reset completion schema
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
)

// Change password schema (for authenticated users)
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, 'Please confirm your new password')
}).refine(
  (data) => data.newPassword === data.confirmNewPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmNewPassword']
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'New password must be different from current password',
    path: ['newPassword']
  }
)

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

/**
 * Validation helper for API routes
 */
export async function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    const data = await schema.parseAsync(body)
    return { data, error: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors
        ?.map(err => `${err.path.join('.')}: ${err.message}`)
        ?.join(', ') || 'Validation error'
      return { data: null, error: errorMessage }
    }
    return { data: null, error: 'Invalid input data' }
  }
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

/**
 * Check if email domain is allowed (implement if needed)
 */
export function isEmailDomainAllowed(email: string): boolean {
  // For now, allow all domains
  // You can implement domain restrictions here if needed
  return true
}

/**
 * Rate limiting validation - check if too many attempts
 */
export function isRateLimited(attempts: number, maxAttempts: number = 5): boolean {
  return attempts >= maxAttempts
}

/**
 * Account lockout validation
 */
export function isAccountLocked(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false
  return new Date() < lockedUntil
}

/**
 * Calculate account lockout duration (exponential backoff)
 */
export function calculateLockoutDuration(attempts: number): Date {
  const baseMinutes = Math.min(Math.pow(2, attempts - 5), 60) // Cap at 1 hour
  const lockoutDuration = new Date()
  lockoutDuration.setMinutes(lockoutDuration.getMinutes() + baseMinutes)
  return lockoutDuration
}