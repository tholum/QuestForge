/**
 * Authentication library exports
 * Centralizes all auth-related utilities and functions
 */

// Password utilities
export {
  hashPassword,
  comparePassword,
  validatePasswordStrength,
  generatePasswordResetToken,
  isPasswordResetTokenExpired,
  getPasswordResetExpiration,
  type PasswordValidationResult
} from './password'

// JWT utilities
export {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  isTokenExpired,
  decodeTokenUnsafe,
  type JWTPayload,
  type TokenPair
} from './jwt'

// Validation schemas and utilities
export {
  emailSchema,
  passwordSchema,
  nameSchema,
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
  validateRequestBody,
  sanitizeString,
  sanitizeEmail,
  isEmailDomainAllowed,
  isRateLimited as isValidationRateLimited,
  isAccountLocked,
  calculateLockoutDuration,
  type RegisterInput,
  type LoginInput,
  type PasswordResetRequestInput,
  type PasswordResetInput,
  type ChangePasswordInput
} from './validation'

// Security utilities
export {
  isRateLimited,
  getClientIP,
  generateCSRFToken,
  validateCSRFToken,
  securityHeaders,
  secureCookieConfig,
  refreshCookieConfig,
  isValidOrigin,
  sanitizeUserAgent,
  logSecurityEvent,
  cleanupRateLimitStore
} from './security'

// Core auth functions
export { 
  authenticateUser, 
  getCurrentUser, 
  registerUser, 
  initiatePasswordReset, 
  completePasswordReset,
  type AuthResult,
  type User
} from './core'