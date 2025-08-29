// Core Prisma exports
export { prisma } from './client'
export * from '@prisma/client'

// Configuration
export * from './config'

// Error handling
export * from './error-handler'

// Repositories
export * from './repositories'

// Performance monitoring
export * from './performance-monitor'

// Validation
export * from '../validation/schemas'
export * from '../validation/utils'

// Types and utilities
export type { 
  DatabaseConfig,
  RetryConfig,
  PoolConfig
} from './config'

export type {
  QueryMetrics,
  ConnectionMetrics,
  PerformanceSummary,
  ProgressAnalytics
} from './performance-monitor'

// Convenience re-exports for common operations
export {
  validateInput,
  safeValidateInput,
  formatZodError,
  validatePagination
} from '../validation/schemas'

export {
  sanitizeHtml,
  sanitizeSqlString,
  validatePasswordStrength,
  ValidationChain
} from '../validation/utils'