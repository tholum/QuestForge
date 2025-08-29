import { NextRequest } from 'next/server'

/**
 * Security utilities for authentication
 * Handles rate limiting, CSRF protection, and security headers
 */

// Rate limiting storage (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxAttempts: number // Maximum attempts per window
}

const defaultRateLimitConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxAttempts: 5 // 5 attempts per minute
}

/**
 * Check if request is rate limited
 */
export function isRateLimited(
  identifier: string, 
  config: RateLimitConfig = defaultRateLimitConfig
): { isLimited: boolean; remainingAttempts: number; resetTime: number } {
  const now = Date.now()
  const key = `rate_limit:${identifier}`
  const record = rateLimitStore.get(key)

  // No previous record or window expired
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    })
    return {
      isLimited: false,
      remainingAttempts: config.maxAttempts - 1,
      resetTime: now + config.windowMs
    }
  }

  // Increment count
  record.count += 1
  rateLimitStore.set(key, record)

  return {
    isLimited: record.count > config.maxAttempts,
    remainingAttempts: Math.max(0, config.maxAttempts - record.count),
    resetTime: record.resetTime
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP.trim()
  }
  
  return request.ip || '127.0.0.1'
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const crypto = require('crypto')
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, expected: string): boolean {
  if (!token || !expected) return false
  
  // Use constant-time comparison to prevent timing attacks
  const crypto = require('crypto')
  const tokenBuffer = Buffer.from(token, 'hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  
  if (tokenBuffer.length !== expectedBuffer.length) {
    return false
  }
  
  return crypto.timingSafeEqual(tokenBuffer, expectedBuffer)
}

/**
 * Security headers for responses
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'",
} as const

/**
 * Cookie configuration for secure sessions
 */
export const secureCookieConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
}

/**
 * Cookie configuration for refresh tokens (longer duration)
 */
export const refreshCookieConfig = {
  ...secureCookieConfig,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

/**
 * Check if request is from a valid origin
 */
export function isValidOrigin(origin: string | null): boolean {
  if (!origin) return false
  
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://goalassistant.vercel.app',
    ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
  ]
  
  return allowedOrigins.includes(origin)
}

/**
 * Sanitize user agent string
 */
export function sanitizeUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'Unknown'
  
  // Remove potentially dangerous characters
  return userAgent
    .replace(/[<>]/g, '')
    .substring(0, 200) // Limit length
}

/**
 * Log security event (in production, send to monitoring service)
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  severity: 'info' | 'warning' | 'error' = 'info'
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    severity,
    details: {
      ...details,
      // Redact sensitive information
      password: details.password ? '[REDACTED]' : undefined,
      token: details.token ? '[REDACTED]' : undefined,
    }
  }
  
  console.log(`[SECURITY-${severity.toUpperCase()}]`, JSON.stringify(logEntry))
  
  // In production, you would send this to your logging service
  // Example: await sendToLoggingService(logEntry)
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Clean up rate limit store every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}