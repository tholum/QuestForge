import { describe, it, expect } from 'vitest'
import { 
  hashPassword, 
  comparePassword, 
  validatePasswordStrength,
  generatePasswordResetToken,
  isPasswordResetTokenExpired,
  getPasswordResetExpiration
} from './password'

describe('Password utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash).toMatch(/^\$2[aby]\$\d{1,2}\$/)
    })

    it('should throw error for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password is required')
    })
  })

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      const isValid = await comparePassword(password, hash)
      
      expect(isValid).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const password = 'TestPassword123!'
      const wrongPassword = 'WrongPassword123!'
      const hash = await hashPassword(password)
      const isValid = await comparePassword(wrongPassword, hash)
      
      expect(isValid).toBe(false)
    })

    it('should return false for empty inputs', async () => {
      const hash = await hashPassword('test123')
      
      expect(await comparePassword('', hash)).toBe(false)
      expect(await comparePassword('test123', '')).toBe(false)
    })
  })

  describe('validatePasswordStrength', () => {
    it('should validate a strong password', () => {
      const result = validatePasswordStrength('StrongPassword123!')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.score).toBeGreaterThan(70)
    })

    it('should reject a weak password', () => {
      const result = validatePasswordStrength('weak')
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.score).toBeLessThan(40)
    })

    it('should require minimum length', () => {
      const result = validatePasswordStrength('short')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    it('should require lowercase letters', () => {
      const result = validatePasswordStrength('NOLOWERCASE123')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one lowercase letter')
    })

    it('should require uppercase letters', () => {
      const result = validatePasswordStrength('nouppercase123')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one uppercase letter')
    })

    it('should require numbers', () => {
      const result = validatePasswordStrength('NoNumbersHere')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must contain at least one number')
    })

    it('should return error for empty password', () => {
      const result = validatePasswordStrength('')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password is required')
      expect(result.score).toBe(0)
    })
  })

  describe('generatePasswordResetToken', () => {
    it('should generate a token', () => {
      const token = generatePasswordResetToken()
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64) // 32 bytes as hex = 64 chars
    })

    it('should generate unique tokens', () => {
      const token1 = generatePasswordResetToken()
      const token2 = generatePasswordResetToken()
      
      expect(token1).not.toBe(token2)
    })
  })

  describe('isPasswordResetTokenExpired', () => {
    it('should return false for future date', () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 1)
      
      expect(isPasswordResetTokenExpired(futureDate)).toBe(false)
    })

    it('should return true for past date', () => {
      const pastDate = new Date()
      pastDate.setHours(pastDate.getHours() - 1)
      
      expect(isPasswordResetTokenExpired(pastDate)).toBe(true)
    })
  })

  describe('getPasswordResetExpiration', () => {
    it('should return date 15 minutes in the future', () => {
      const now = new Date()
      const expiration = getPasswordResetExpiration()
      const expectedTime = now.getTime() + (15 * 60 * 1000)
      
      // Allow for small time difference in test execution
      expect(Math.abs(expiration.getTime() - expectedTime)).toBeLessThan(1000)
    })
  })
})