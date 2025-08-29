import { prisma } from '@/lib/prisma'
import { comparePassword, hashPassword } from './password'
import { generateTokenPair, verifyAccessToken } from './jwt'
import { isAccountLocked, calculateLockoutDuration } from './validation'
import { logSecurityEvent } from './security'

/**
 * Core authentication functions
 * Handles user authentication, registration, and session management
 */

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    name: string | null
    totalXp: number
    currentLevel: number
    streakCount: number
  }
  tokens?: {
    accessToken: string
    refreshToken: string
  }
  error?: string
}

export interface User {
  id: string
  email: string
  name: string | null
  totalXp: number
  currentLevel: number
  streakCount: number
  emailVerified: boolean
  lastLoginAt: Date | null
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string,
  clientIP: string
): Promise<AuthResult> {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        totalXp: true,
        currentLevel: true,
        streakCount: true,
        emailVerified: true,
        lastLoginAt: true,
        loginAttempts: true,
        lockedUntil: true,
      },
    })

    if (!user) {
      logSecurityEvent('login_failed', { 
        email, 
        reason: 'user_not_found',
        clientIP 
      }, 'warning')
      
      return {
        success: false,
        error: 'Invalid email or password',
      }
    }

    // Check if account is locked
    if (isAccountLocked(user.lockedUntil)) {
      logSecurityEvent('login_blocked', { 
        email, 
        reason: 'account_locked',
        lockedUntil: user.lockedUntil,
        clientIP 
      }, 'warning')
      
      return {
        success: false,
        error: 'Account is temporarily locked due to too many failed attempts',
      }
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newAttempts = user.loginAttempts + 1
      const shouldLock = newAttempts >= 5
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: newAttempts,
          lockedUntil: shouldLock ? calculateLockoutDuration(newAttempts) : null,
        },
      })

      logSecurityEvent('login_failed', { 
        email, 
        reason: 'invalid_password',
        attempts: newAttempts,
        locked: shouldLock,
        clientIP 
      }, 'warning')

      return {
        success: false,
        error: shouldLock 
          ? 'Too many failed attempts. Account is temporarily locked.'
          : 'Invalid email or password',
      }
    }

    // Successful login - reset attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    })

    // Generate tokens
    const tokens = generateTokenPair(user.id, user.email)

    logSecurityEvent('login_success', { 
      userId: user.id,
      email: user.email,
      clientIP 
    }, 'info')

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        totalXp: user.totalXp,
        currentLevel: user.currentLevel,
        streakCount: user.streakCount,
      },
      tokens,
    }
  } catch (error) {
    logSecurityEvent('login_error', { 
      email, 
      error: error instanceof Error ? error.message : 'Unknown error',
      clientIP 
    }, 'error')

    return {
      success: false,
      error: 'An error occurred during login',
    }
  }
}

/**
 * Register a new user
 */
export async function registerUser(
  email: string,
  name: string,
  password: string,
  clientIP: string
): Promise<AuthResult> {
  try {
    const normalizedEmail = email.toLowerCase()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      logSecurityEvent('registration_failed', { 
        email: normalizedEmail, 
        reason: 'user_exists',
        clientIP 
      }, 'warning')
      
      return {
        success: false,
        error: 'User with this email already exists',
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        password: hashedPassword,
        emailVerified: false, // In a real app, you'd send verification email
      },
      select: {
        id: true,
        email: true,
        name: true,
        totalXp: true,
        currentLevel: true,
        streakCount: true,
      },
    })

    // Generate tokens
    const tokens = generateTokenPair(user.id, user.email)

    logSecurityEvent('registration_success', { 
      userId: user.id,
      email: user.email,
      clientIP 
    }, 'info')

    return {
      success: true,
      user,
      tokens,
    }
  } catch (error) {
    logSecurityEvent('registration_error', { 
      email, 
      error: error instanceof Error ? error.message : 'Unknown error',
      clientIP 
    }, 'error')

    return {
      success: false,
      error: 'An error occurred during registration',
    }
  }
}

/**
 * Get current user from access token
 */
export async function getCurrentUser(accessToken: string): Promise<User | null> {
  try {
    // Verify and decode token
    const payload = verifyAccessToken(accessToken)
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        totalXp: true,
        currentLevel: true,
        streakCount: true,
        emailVerified: true,
        lastLoginAt: true,
      },
    })

    return user
  } catch (error) {
    return null
  }
}

/**
 * Initiate password reset
 */
export async function initiatePasswordReset(
  email: string,
  clientIP: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      // Don't reveal if user exists or not
      logSecurityEvent('password_reset_attempt', { 
        email, 
        reason: 'user_not_found',
        clientIP 
      }, 'info')
      
      return { success: true }
    }

    // Generate reset token
    const crypto = require('crypto')
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Save reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    })

    logSecurityEvent('password_reset_initiated', { 
      userId: user.id,
      email: user.email,
      clientIP 
    }, 'info')

    // In a real application, you would send an email with the reset token
    console.log(`Password reset token for ${email}: ${resetToken}`)

    return { success: true }
  } catch (error) {
    logSecurityEvent('password_reset_error', { 
      email, 
      error: error instanceof Error ? error.message : 'Unknown error',
      clientIP 
    }, 'error')

    return {
      success: false,
      error: 'An error occurred while processing password reset',
    }
  }
}

/**
 * Complete password reset
 */
export async function completePasswordReset(
  token: string,
  newPassword: string,
  clientIP: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find user by reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    })

    if (!user) {
      logSecurityEvent('password_reset_failed', { 
        reason: 'invalid_token',
        clientIP 
      }, 'warning')
      
      return {
        success: false,
        error: 'Invalid or expired reset token',
      }
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        loginAttempts: 0, // Reset failed attempts
        lockedUntil: null, // Unlock account
      },
    })

    logSecurityEvent('password_reset_completed', { 
      userId: user.id,
      email: user.email,
      clientIP 
    }, 'info')

    return { success: true }
  } catch (error) {
    logSecurityEvent('password_reset_error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      clientIP 
    }, 'error')

    return {
      success: false,
      error: 'An error occurred while resetting password',
    }
  }
}