import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { 
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  isTokenExpired,
  decodeTokenUnsafe
} from './jwt'

describe('JWT utilities', () => {
  const mockUserId = 'user123'
  const mockEmail = 'test@example.com'

  // Set test environment variables
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret-key-for-jwt-testing-minimum-32-characters'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-minimum-32-characters'
  })

  afterEach(() => {
    delete process.env.JWT_SECRET
    delete process.env.JWT_REFRESH_SECRET
  })

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockUserId, mockEmail)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockUserId, mockEmail)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })
  })

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokenPair(mockUserId, mockEmail)
      
      expect(tokens.accessToken).toBeDefined()
      expect(tokens.refreshToken).toBeDefined()
      expect(tokens.accessToken).not.toBe(tokens.refreshToken)
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(mockUserId, mockEmail)
      const payload = verifyAccessToken(token)
      
      expect(payload.userId).toBe(mockUserId)
      expect(payload.email).toBe(mockEmail)
      expect(payload.type).toBe('access')
    })

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid.token.here')).toThrow()
    })

    it('should throw error for refresh token used as access token', () => {
      const refreshToken = generateRefreshToken(mockUserId, mockEmail)
      expect(() => verifyAccessToken(refreshToken)).toThrow()
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(mockUserId, mockEmail)
      const payload = verifyRefreshToken(token)
      
      expect(payload.userId).toBe(mockUserId)
      expect(payload.email).toBe(mockEmail)
      expect(payload.type).toBe('refresh')
    })

    it('should throw error for access token used as refresh token', () => {
      const accessToken = generateAccessToken(mockUserId, mockEmail)
      expect(() => verifyRefreshToken(accessToken)).toThrow()
    })
  })

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const token = 'test.jwt.token'
      const authHeader = `Bearer ${token}`
      
      expect(extractTokenFromHeader(authHeader)).toBe(token)
    })

    it('should return null for invalid header format', () => {
      expect(extractTokenFromHeader('InvalidHeader')).toBe(null)
      expect(extractTokenFromHeader('Basic token123')).toBe(null)
      expect(extractTokenFromHeader('')).toBe(null)
    })

    it('should return null for undefined header', () => {
      expect(extractTokenFromHeader(undefined)).toBe(null)
    })
  })

  describe('decodeTokenUnsafe', () => {
    it('should decode token without verification', () => {
      const token = generateAccessToken(mockUserId, mockEmail)
      const payload = decodeTokenUnsafe(token)
      
      expect(payload).toBeDefined()
      expect(payload?.userId).toBe(mockUserId)
      expect(payload?.email).toBe(mockEmail)
      expect(payload?.type).toBe('access')
    })

    it('should return null for invalid token', () => {
      expect(decodeTokenUnsafe('invalid')).toBe(null)
    })
  })

  describe('token expiration', () => {
    it('should detect invalid token as expired', async () => {
      // Invalid tokens are treated as expired
      expect(isTokenExpired('invalid.token.here')).toBe(true)
    })

    it('should detect valid token as not expired', () => {
      const token = generateAccessToken(mockUserId, mockEmail)
      expect(isTokenExpired(token)).toBe(false)
    })
  })
})