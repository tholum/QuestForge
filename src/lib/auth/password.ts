import bcrypt from 'bcryptjs'

/**
 * Password hashing and validation utilities
 * Uses bcrypt with salt rounds >= 12 for security
 */

// Salt rounds for bcrypt (minimum 12 for security)
const SALT_ROUNDS = 12

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error('Password is required')
  }
  
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(
  plainPassword: string, 
  hashedPassword: string
): Promise<boolean> {
  if (!plainPassword || !hashedPassword) {
    return false
  }
  
  return bcrypt.compare(plainPassword, hashedPassword)
}

/**
 * Password strength validation
 * Requirements: 8+ chars, mixed case, numbers
 */
export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  score: number // 0-100
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = []
  let score = 0

  if (!password) {
    return {
      isValid: false,
      errors: ['Password is required'],
      score: 0
    }
  }

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  } else {
    score += 25
    if (password.length >= 12) score += 10
  }

  // Lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else {
    score += 15
  }

  // Uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else {
    score += 15
  }

  // Number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  } else {
    score += 15
  }

  // Special character (optional but recommended)
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 20
  }

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(score, 100)
  }
}

/**
 * Generate a secure password reset token
 */
export function generatePasswordResetToken(): string {
  const crypto = require('crypto')
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Check if password reset token has expired
 */
export function isPasswordResetTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

/**
 * Generate password reset token expiration (15 minutes from now)
 */
export function getPasswordResetExpiration(): Date {
  const expiration = new Date()
  expiration.setMinutes(expiration.getMinutes() + 15)
  return expiration
}