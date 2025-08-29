import { describe, it, expect } from 'vitest'
import { 
  emailSchema,
  passwordSchema,
  nameSchema,
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  validateRequestBody,
  sanitizeString,
  sanitizeEmail,
  isEmailDomainAllowed,
  isRateLimited,
  isAccountLocked,
  calculateLockoutDuration
} from './validation'

describe('Validation utilities', () => {
  describe('emailSchema', () => {
    it('should validate correct email', async () => {
      const email = 'test@example.com'
      const result = await emailSchema.parseAsync(email)
      expect(result).toBe('test@example.com')
    })

    it('should transform email to lowercase and trim', async () => {
      const email = 'TEST@EXAMPLE.COM'
      const result = await emailSchema.parseAsync(email)
      expect(result).toBe('test@example.com')
    })

    it('should reject invalid email', async () => {
      await expect(emailSchema.parseAsync('invalid-email')).rejects.toThrow()
    })

    it('should reject empty email', async () => {
      await expect(emailSchema.parseAsync('')).rejects.toThrow()
    })
  })

  describe('passwordSchema', () => {
    it('should validate strong password', async () => {
      const password = 'StrongPassword123'
      const result = await passwordSchema.parseAsync(password)
      expect(result).toBe(password)
    })

    it('should reject password without lowercase', async () => {
      await expect(passwordSchema.parseAsync('PASSWORD123')).rejects.toThrow()
    })

    it('should reject password without uppercase', async () => {
      await expect(passwordSchema.parseAsync('password123')).rejects.toThrow()
    })

    it('should reject password without numbers', async () => {
      await expect(passwordSchema.parseAsync('Password')).rejects.toThrow()
    })

    it('should reject short password', async () => {
      await expect(passwordSchema.parseAsync('Pass1')).rejects.toThrow()
    })
  })

  describe('nameSchema', () => {
    it('should validate name with letters and spaces', async () => {
      const name = 'John Doe'
      const result = await nameSchema.parseAsync(name)
      expect(result).toBe(name)
    })

    it('should trim whitespace', async () => {
      const name = '  John Doe  '
      const result = await nameSchema.parseAsync(name)
      expect(result).toBe('John Doe')
    })

    it('should reject name with numbers', async () => {
      await expect(nameSchema.parseAsync('John123')).rejects.toThrow()
    })

    it('should reject empty name', async () => {
      await expect(nameSchema.parseAsync('')).rejects.toThrow()
    })
  })

  describe('registerSchema', () => {
    const validRegisterData = {
      email: 'test@example.com',
      name: 'John Doe',
      password: 'StrongPassword123',
      confirmPassword: 'StrongPassword123'
    }

    it('should validate correct registration data', async () => {
      const result = await registerSchema.parseAsync(validRegisterData)
      expect(result.email).toBe('test@example.com')
      expect(result.name).toBe('John Doe')
    })

    it('should reject mismatched passwords', async () => {
      const data = {
        ...validRegisterData,
        confirmPassword: 'DifferentPassword123'
      }
      await expect(registerSchema.parseAsync(data)).rejects.toThrow()
    })
  })

  describe('loginSchema', () => {
    it('should validate login data', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      }
      const result = await loginSchema.parseAsync(data)
      expect(result.email).toBe('test@example.com')
      expect(result.rememberMe).toBe(true)
    })

    it('should work without rememberMe field', async () => {
      const data = {
        email: 'test@example.com',
        password: 'password123'
      }
      const result = await loginSchema.parseAsync(data)
      expect(result.rememberMe).toBeUndefined()
    })
  })

  describe('validateRequestBody', () => {
    it('should validate correct data', async () => {
      const schema = emailSchema
      const data = 'test@example.com'
      
      const result = await validateRequestBody(schema, data)
      expect(result.data).toBe('test@example.com')
      expect(result.error).toBe(null)
    })

    it('should return error for invalid data', async () => {
      const schema = emailSchema
      const data = 'invalid-email'
      
      const result = await validateRequestBody(schema, data)
      expect(result.data).toBe(null)
      expect(result.error).toBeDefined()
    })
  })

  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello'
      const result = sanitizeString(input)
      expect(result).toBe('scriptalert("xss")/scriptHello')
    })

    it('should trim whitespace', () => {
      const input = '  hello world  '
      const result = sanitizeString(input)
      expect(result).toBe('hello world')
    })
  })

  describe('sanitizeEmail', () => {
    it('should convert to lowercase and trim', () => {
      const email = '  TEST@EXAMPLE.COM  '
      const result = sanitizeEmail(email)
      expect(result).toBe('test@example.com')
    })
  })

  describe('isEmailDomainAllowed', () => {
    it('should allow all domains by default', () => {
      expect(isEmailDomainAllowed('test@example.com')).toBe(true)
      expect(isEmailDomainAllowed('user@gmail.com')).toBe(true)
    })
  })

  describe('isRateLimited', () => {
    it('should return false for low attempts', () => {
      expect(isRateLimited(3, 5)).toBe(false)
    })

    it('should return true for high attempts', () => {
      expect(isRateLimited(6, 5)).toBe(true)
    })
  })

  describe('isAccountLocked', () => {
    it('should return false for null lockout date', () => {
      expect(isAccountLocked(null)).toBe(false)
    })

    it('should return false for past lockout date', () => {
      const pastDate = new Date()
      pastDate.setHours(pastDate.getHours() - 1)
      expect(isAccountLocked(pastDate)).toBe(false)
    })

    it('should return true for future lockout date', () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 1)
      expect(isAccountLocked(futureDate)).toBe(true)
    })
  })

  describe('calculateLockoutDuration', () => {
    it('should return increasing lockout times', () => {
      const lockout1 = calculateLockoutDuration(5)
      const lockout2 = calculateLockoutDuration(6)
      
      expect(lockout2.getTime()).toBeGreaterThan(lockout1.getTime())
    })

    it('should cap at maximum duration', () => {
      const lockout = calculateLockoutDuration(10)
      const now = new Date()
      const maxDuration = 60 * 60 * 1000 // 1 hour in milliseconds
      
      expect(lockout.getTime() - now.getTime()).toBeLessThanOrEqual(maxDuration + 1000) // Allow 1s margin
    })
  })
})