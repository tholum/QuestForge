/**
 * Validation Utilities
 * 
 * Additional validation functions and utilities for data sanitization
 * and security checks.
 */

import { z } from 'zod'

/**
 * SQL Injection Prevention
 * Sanitize strings that might be used in raw SQL queries
 */
export function sanitizeSqlString(input: string): string {
  // Remove or escape potentially dangerous characters
  return input
    .replace(/['"`;\\]/g, '') // Remove quotes, semicolons, backslashes
    .replace(/--.*$/gm, '') // Remove SQL comments
    .replace(/\/\*.*?\*\//gs, '') // Remove block comments
    .trim()
}

/**
 * XSS Prevention
 * Sanitize HTML content
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Safe JSON parsing
 */
export function safeJsonParse<T = unknown>(
  jsonString: string,
  defaultValue: T
): T {
  try {
    const parsed = JSON.parse(jsonString)
    return parsed as T
  } catch {
    return defaultValue
  }
}

/**
 * Validate and sanitize email
 */
export function validateAndSanitizeEmail(email: string): string {
  const sanitized = email.toLowerCase().trim()
  const emailSchema = z.string().email()
  
  try {
    return emailSchema.parse(sanitized)
  } catch {
    throw new Error('Invalid email format')
  }
}

/**
 * Validate password strength
 */
export interface PasswordValidation {
  isValid: boolean
  score: number // 0-5 (5 being strongest)
  feedback: string[]
}

export function validatePasswordStrength(password: string): PasswordValidation {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Password should be at least 8 characters long')
  }

  if (password.length >= 12) {
    score += 1
  }

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain lowercase letters')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain uppercase letters')
  }

  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain numbers')
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain special characters')
  }

  // Common password checks
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', '12345678'
  ]

  if (commonPasswords.includes(password.toLowerCase())) {
    score = Math.max(0, score - 2)
    feedback.push('Password is too common, please choose a different one')
  }

  // Sequential characters check
  if (/123|abc|qwe/i.test(password)) {
    score = Math.max(0, score - 1)
    feedback.push('Avoid sequential characters')
  }

  return {
    isValid: score >= 3 && feedback.length === 0,
    score,
    feedback
  }
}

/**
 * Validate CUID format
 */
export function validateCuid(id: string): boolean {
  const cuidRegex = /^c[^\s-]{8,}$/
  return cuidRegex.test(id)
}

/**
 * Validate module ID format
 */
export function validateModuleId(id: string): boolean {
  const moduleIdRegex = /^[a-z][a-z0-9_]*$/
  return moduleIdRegex.test(id) && id.length >= 2 && id.length <= 50
}

/**
 * Validate semantic version
 */
export function validateSemanticVersion(version: string): boolean {
  const semverRegex = /^\d+\.\d+\.\d+$/
  return semverRegex.test(version)
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.\-_]/g, '_') // Replace unsafe characters with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase()
}

/**
 * Validate and normalize phone number
 */
export function validatePhoneNumber(phone: string): string | null {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Check for valid US phone number (10 digits)
  if (digits.length === 10) {
    return `+1${digits}`
  }
  
  // Check for international format
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`
  }
  
  return null
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[<>&"']/g, '') // Remove HTML/XML characters
    .replace(/[%_]/g, '\\$&') // Escape SQL LIKE wildcards
    .substring(0, 100) // Limit length
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: Date, endDate: Date): boolean {
  return startDate <= endDate
}

/**
 * Normalize and validate timezone
 */
export function validateTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

/**
 * Validate JSON schema
 */
export function validateJsonStructure<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { isValid: boolean; data?: T; errors?: string[] } {
  try {
    const validated = schema.parse(data)
    return { isValid: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return { isValid: false, errors: ['Unknown validation error'] }
  }
}

/**
 * Rate limiting validation
 */
export function validateRateLimit(
  attempts: number,
  timeWindow: number,
  maxAttempts: number
): { isAllowed: boolean; resetTime?: Date } {
  if (attempts >= maxAttempts) {
    return {
      isAllowed: false,
      resetTime: new Date(Date.now() + timeWindow)
    }
  }
  return { isAllowed: true }
}

/**
 * Validate hex color
 */
export function validateHexColor(color: string): boolean {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return hexColorRegex.test(color)
}

/**
 * Validate coordinate (latitude/longitude)
 */
export function validateCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

/**
 * Sanitize and validate sort parameters
 */
export function validateSortParams(
  sortBy: string,
  sortOrder: string,
  allowedFields: string[]
): { sortBy: string; sortOrder: 'asc' | 'desc' } {
  const sanitizedSortBy = allowedFields.includes(sortBy) ? sortBy : allowedFields[0]
  const sanitizedSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder as 'asc' | 'desc' : 'desc'
  
  return {
    sortBy: sanitizedSortBy,
    sortOrder: sanitizedSortOrder
  }
}

/**
 * Validate pagination bounds
 */
export function validatePaginationBounds(
  limit: number,
  offset: number,
  maxLimit = 100
): { limit: number; offset: number } {
  const sanitizedLimit = Math.min(Math.max(1, limit), maxLimit)
  const sanitizedOffset = Math.max(0, offset)
  
  return {
    limit: sanitizedLimit,
    offset: sanitizedOffset
  }
}

/**
 * Deep sanitize object (recursive)
 */
export function deepSanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeHtml(value) as T[keyof T]
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = deepSanitizeObject(value) as T[keyof T]
    } else {
      sanitized[key as keyof T] = value
    }
  }
  
  return sanitized
}

/**
 * Validate environment variable
 */
export function validateEnvVar(name: string, value: string | undefined, required = true): string {
  if (required && (!value || value.trim() === '')) {
    throw new Error(`Environment variable ${name} is required but not set`)
  }
  return value || ''
}

/**
 * Create validation chain
 */
export class ValidationChain<T> {
  private data: T
  private errors: string[] = []

  constructor(data: T) {
    this.data = data
  }

  static create<T>(data: T): ValidationChain<T> {
    return new ValidationChain(data)
  }

  validate(predicate: (data: T) => boolean, message: string): this {
    if (!predicate(this.data)) {
      this.errors.push(message)
    }
    return this
  }

  transform<U>(transformer: (data: T) => U): ValidationChain<U> {
    const newChain = new ValidationChain(transformer(this.data))
    newChain.errors = [...this.errors]
    return newChain
  }

  getResult(): { isValid: boolean; data: T; errors: string[] } {
    return {
      isValid: this.errors.length === 0,
      data: this.data,
      errors: this.errors
    }
  }

  throwIfInvalid(): T {
    if (this.errors.length > 0) {
      throw new Error(`Validation failed: ${this.errors.join('; ')}`)
    }
    return this.data
  }
}