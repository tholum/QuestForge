/**
 * Database Configuration
 * 
 * Environment-specific database configuration with connection pooling,
 * retry logic, and performance optimization.
 */

import { PrismaClientOptions } from '@prisma/client/runtime/library'

export interface DatabaseConfig extends PrismaClientOptions {
  // Connection settings
  connectionRetries: number
  connectionTimeout: number
  queryTimeout: number
  
  // Pool settings
  connectionPoolTimeout: number
  connectionPoolSize: number
  
  // Performance settings
  enableStatementTimeout: boolean
  statementTimeout: number
  
  // Monitoring settings
  enablePerformanceMonitoring: boolean
  slowQueryThreshold: number
  
  // Environment settings
  environment: 'development' | 'test' | 'production'
}

/**
 * Get database configuration for the current environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const environment = (process.env.NODE_ENV as DatabaseConfig['environment']) || 'development'
  const isDevelopment = environment === 'development'
  const isTest = environment === 'test'
  const isProduction = environment === 'production'

  // Base configuration
  const baseConfig: DatabaseConfig = {
    environment,
    
    // Connection settings
    connectionRetries: isProduction ? 5 : 3,
    connectionTimeout: isProduction ? 10000 : 5000,
    queryTimeout: isProduction ? 30000 : 15000,
    
    // Pool settings
    connectionPoolTimeout: isProduction ? 30000 : 15000,
    connectionPoolSize: isProduction ? 20 : 5,
    
    // Performance settings
    enableStatementTimeout: isProduction,
    statementTimeout: isProduction ? 60000 : 30000,
    
    // Monitoring settings
    enablePerformanceMonitoring: !isTest,
    slowQueryThreshold: isProduction ? 2000 : 5000,
    
    // Prisma client options
    errorFormat: isProduction ? 'minimal' : 'pretty',
    log: getLogConfig(environment),
  }

  return baseConfig
}

/**
 * Get logging configuration based on environment
 */
function getLogConfig(environment: string): PrismaClientOptions['log'] {
  switch (environment) {
    case 'production':
      return [
        { level: 'error' },
        { level: 'warn' },
        {
          level: 'query',
          emit: 'event'
        }
      ]
    
    case 'test':
      return [{ level: 'error' }]
    
    case 'development':
    default:
      return [
        { level: 'query' },
        { level: 'info' },
        { level: 'warn' },
        { level: 'error' }
      ]
  }
}

/**
 * Get database URL based on environment
 */
export function getDatabaseUrl(): string {
  const environment = process.env.NODE_ENV || 'development'
  
  // Environment-specific database URLs
  switch (environment) {
    case 'test':
      return process.env.TEST_DATABASE_URL || 'file:./test.db'
    
    case 'production':
      const prodUrl = process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URL
      if (!prodUrl) {
        throw new Error('DATABASE_URL or PRODUCTION_DATABASE_URL must be set in production')
      }
      return prodUrl
    
    case 'development':
    default:
      return process.env.DATABASE_URL || 'file:./dev.db'
  }
}

/**
 * Validate database configuration
 */
export function validateDatabaseConfig(config: DatabaseConfig): void {
  if (config.connectionTimeout <= 0) {
    throw new Error('Connection timeout must be positive')
  }
  
  if (config.queryTimeout <= 0) {
    throw new Error('Query timeout must be positive')
  }
  
  if (config.connectionPoolSize <= 0) {
    throw new Error('Connection pool size must be positive')
  }
  
  if (config.slowQueryThreshold < 0) {
    throw new Error('Slow query threshold cannot be negative')
  }
}

/**
 * Connection retry configuration with exponential backoff
 */
export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

export function getRetryConfig(): RetryConfig {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    maxAttempts: isProduction ? 5 : 3,
    baseDelay: 1000,
    maxDelay: isProduction ? 30000 : 10000,
    backoffFactor: 2
  }
}

/**
 * Get connection pool configuration
 */
export interface PoolConfig {
  min: number
  max: number
  acquireTimeoutMillis: number
  createTimeoutMillis: number
  destroyTimeoutMillis: number
  idleTimeoutMillis: number
  reapIntervalMillis: number
  createRetryIntervalMillis: number
}

export function getPoolConfig(): PoolConfig {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    min: isProduction ? 2 : 1,
    max: isProduction ? 20 : 5,
    acquireTimeoutMillis: isProduction ? 30000 : 15000,
    createTimeoutMillis: 10000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: isProduction ? 300000 : 30000, // 5 min in prod, 30s in dev
    reapIntervalMillis: 10000,
    createRetryIntervalMillis: 2000
  }
}