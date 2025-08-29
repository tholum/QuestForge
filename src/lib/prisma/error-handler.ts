/**
 * Comprehensive Prisma Error Handling
 * 
 * Custom error classes and utilities for handling Prisma errors
 * with proper error codes, messages, and logging.
 */

import { Prisma } from '@prisma/client'

/**
 * Custom database error class
 */
export class DatabaseError extends Error {
  public readonly code: string
  public readonly field?: string
  public readonly value?: unknown
  public readonly originalError: unknown

  constructor(
    message: string,
    code: string,
    originalError?: unknown,
    field?: string,
    value?: unknown
  ) {
    super(message)
    this.name = 'DatabaseError'
    this.code = code
    this.field = field
    this.value = value
    this.originalError = originalError

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError)
    }
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      field: this.field,
      value: this.field ? this.value : undefined,
    }
  }
}

/**
 * Connection error
 */
export class ConnectionError extends DatabaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'CONNECTION_ERROR', originalError)
    this.name = 'ConnectionError'
  }
}

/**
 * Validation error
 */
export class ValidationError extends DatabaseError {
  constructor(message: string, field?: string, value?: unknown, originalError?: unknown) {
    super(message, 'VALIDATION_ERROR', originalError, field, value)
    this.name = 'ValidationError'
  }
}

/**
 * Constraint error (unique, foreign key, etc.)
 */
export class ConstraintError extends DatabaseError {
  constructor(message: string, field?: string, value?: unknown, originalError?: unknown) {
    super(message, 'CONSTRAINT_ERROR', originalError, field, value)
    this.name = 'ConstraintError'
  }
}

/**
 * Record not found error
 */
export class NotFoundError extends DatabaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'NOT_FOUND', originalError)
    this.name = 'NotFoundError'
  }
}

/**
 * Transaction error
 */
export class TransactionError extends DatabaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'TRANSACTION_ERROR', originalError)
    this.name = 'TransactionError'
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends DatabaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'TIMEOUT_ERROR', originalError)
    this.name = 'TimeoutError'
  }
}

/**
 * Map Prisma error codes to human-readable messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Common unique constraint errors
  'P2002': 'A record with this value already exists',
  
  // Foreign key constraint errors
  'P2003': 'Invalid reference - the related record does not exist',
  'P2004': 'Constraint violation - operation would violate database constraints',
  
  // Record not found errors
  'P2025': 'Record not found or operation failed',
  
  // Connection errors
  'P1001': 'Cannot connect to database server',
  'P1002': 'Database server connection timed out',
  'P1008': 'Database operation timed out',
  'P1017': 'Database server closed the connection',
  
  // Schema/migration errors
  'P3006': 'Migration failed to apply cleanly',
  'P3009': 'Migration failed - data would be lost',
  'P3014': 'Prisma schema validation error',
  
  // Query errors
  'P2021': 'Table does not exist in the database',
  'P2022': 'Column does not exist in the database',
  'P2023': 'Invalid column data type',
  
  // Transaction errors
  'P2034': 'Transaction failed due to write conflict or deadlock',
  
  // Data validation errors
  'P2006': 'Invalid value provided for field',
  'P2007': 'Data validation error',
  'P2011': 'Null constraint violation',
  'P2012': 'Missing required value',
  'P2013': 'Missing required argument for field',
  'P2014': 'Required relation constraint violation',
}

/**
 * Get field name from Prisma error target
 */
function extractFieldName(target: string | string[] | undefined): string | undefined {
  if (!target) return undefined
  
  if (Array.isArray(target)) {
    return target[0]
  }
  
  if (typeof target === 'string') {
    // Handle compound index names like "User_email_key"
    if (target.includes('_')) {
      const parts = target.split('_')
      // Remove table name and "_key" suffix
      if (parts.length > 2) {
        return parts[1]
      }
    }
    return target
  }
  
  return undefined
}

/**
 * Extract field value from meta object
 */
function extractFieldValue(meta: any): unknown {
  if (!meta) return undefined
  
  // Handle different meta structures
  if (meta.target && Array.isArray(meta.target)) {
    return meta.target.join(', ')
  }
  
  if (meta.field_value) {
    return meta.field_value
  }
  
  if (meta.argument_value) {
    return meta.argument_value
  }
  
  return undefined
}

/**
 * Handle Prisma known request errors
 */
function handleKnownRequestError(error: Prisma.PrismaClientKnownRequestError): DatabaseError {
  const message = ERROR_MESSAGES[error.code] || error.message
  const field = extractFieldName(error.meta?.target as string | string[] | undefined)
  const value = extractFieldValue(error.meta)

  switch (error.code) {
    // Unique constraint violations
    case 'P2002':
      return new ConstraintError(
        field ? `${field} already exists` : message,
        field,
        value,
        error
      )

    // Foreign key constraint violations
    case 'P2003':
    case 'P2004':
    case 'P2014':
      return new ConstraintError(message, field, value, error)

    // Record not found
    case 'P2025':
      return new NotFoundError(message, error)

    // Connection errors
    case 'P1001':
    case 'P1002':
    case 'P1008':
    case 'P1017':
      return new ConnectionError(message, error)

    // This case is already handled above in connection errors

    // Validation errors
    case 'P2006':
    case 'P2007':
    case 'P2011':
    case 'P2012':
    case 'P2013':
      return new ValidationError(message, field, value, error)

    // Transaction errors
    case 'P2034':
      return new TransactionError(message, error)

    // Default to generic database error
    default:
      return new DatabaseError(message, error.code, error, field, value)
  }
}

/**
 * Handle Prisma validation errors
 */
function handleValidationError(error: Prisma.PrismaClientValidationError): ValidationError {
  const message = error.message
  
  // Try to extract field name from validation error message
  const fieldMatch = message.match(/Argument `(\w+)` is missing/)
  const field = fieldMatch ? fieldMatch[1] : undefined
  
  return new ValidationError(
    message.includes('Argument') 
      ? `Missing or invalid field: ${field || 'unknown'}`
      : 'Data validation failed',
    field,
    undefined,
    error
  )
}

/**
 * Handle unknown request errors (network issues, etc.)
 */
function handleUnknownRequestError(error: Prisma.PrismaClientUnknownRequestError): ConnectionError {
  return new ConnectionError(
    'Database connection or network error occurred',
    error
  )
}

/**
 * Handle Prisma initialization errors
 */
function handleInitializationError(error: Prisma.PrismaClientInitializationError): DatabaseError {
  const message = error.message.includes('connect')
    ? 'Failed to connect to database - check your connection settings'
    : 'Database initialization failed'

  return new ConnectionError(message, error)
}

/**
 * Handle Rust panic errors
 */
function handleRustPanicError(error: Prisma.PrismaClientRustPanicError): DatabaseError {
  return new DatabaseError(
    'Internal database engine error occurred',
    'INTERNAL_ERROR',
    error
  )
}

/**
 * Main error handler function
 */
export function handlePrismaError(error: unknown): DatabaseError {
  // Log the original error for debugging
  console.error('🔥 Prisma error:', error)

  // Handle Prisma-specific errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handleKnownRequestError(error)
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return handleValidationError(error)
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return handleUnknownRequestError(error)
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return handleInitializationError(error)
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return handleRustPanicError(error)
  }

  // Handle standard JavaScript errors
  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('timeout')) {
      return new TimeoutError(error.message, error)
    }

    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      return new ConnectionError(error.message, error)
    }

    return new DatabaseError(error.message, 'UNKNOWN_ERROR', error)
  }

  // Handle unknown error types
  return new DatabaseError(
    'An unknown database error occurred',
    'UNKNOWN_ERROR',
    error
  )
}

/**
 * Utility to wrap Prisma operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const dbError = handlePrismaError(error)
    
    // Add context if provided
    if (context) {
      dbError.message = `${context}: ${dbError.message}`
    }
    
    throw dbError
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: DatabaseError): boolean {
  const retryableCodes = [
    'P1001', // Can't reach database server
    'P1002', // Connection timed out
    'P1008', // Operations timed out
    'P1017', // Server closed connection
    'P2034', // Transaction conflict/deadlock
    'CONNECTION_ERROR',
    'TIMEOUT_ERROR',
    'TRANSACTION_ERROR'
  ]

  return retryableCodes.includes(error.code)
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: DatabaseError): object {
  return {
    name: error.name,
    message: error.message,
    code: error.code,
    field: error.field,
    value: error.value,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Format error for API response
 */
export function formatErrorForAPI(error: DatabaseError): object {
  return {
    error: {
      type: error.name,
      message: error.message,
      code: error.code,
      field: error.field,
      // Only include value in development
      ...(process.env.NODE_ENV === 'development' && error.value && {
        value: error.value
      })
    }
  }
}

// Export error types for easy importing
export {
  Prisma
}