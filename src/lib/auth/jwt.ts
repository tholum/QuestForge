import jwt from 'jsonwebtoken'

/**
 * JWT token management utilities
 * Handles creation, verification, and refresh of JWT tokens
 */

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  type: 'access' | 'refresh'
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

/**
 * Generate an access token
 */
export function generateAccessToken(userId: string, email: string): string {
  const payload: JWTPayload = {
    userId,
    email,
    type: 'access'
  }

  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'goalassistant',
    audience: 'goalassistant-client'
  })
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(userId: string, email: string): string {
  const payload: JWTPayload = {
    userId,
    email,
    type: 'refresh'
  }

  return jwt.sign(payload, JWT_REFRESH_SECRET, { 
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'goalassistant',
    audience: 'goalassistant-client'
  })
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(userId: string, email: string): TokenPair {
  return {
    accessToken: generateAccessToken(userId, email),
    refreshToken: generateRefreshToken(userId, email)
  }
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'goalassistant',
      audience: 'goalassistant-client'
    }) as JWTPayload

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type')
    }

    return decoded
  } catch (error) {
    throw new Error('Invalid or expired access token')
  }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'goalassistant',
      audience: 'goalassistant-client'
    }) as JWTPayload

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type')
    }

    return decoded
  } catch (error) {
    throw new Error('Invalid or expired refresh token')
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

/**
 * Check if token is expired or invalid (without throwing error)
 */
export function isTokenExpired(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET)
    return false
  } catch (error: any) {
    // Return true for any verification error (expired, invalid, malformed, etc.)
    return true
  }
}

/**
 * Decode token without verification (for inspection)
 */
export function decodeTokenUnsafe(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch {
    return null
  }
}