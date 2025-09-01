/**
 * Enhanced Prisma Client
 * 
 * Production-ready Prisma client with connection pooling, monitoring,
 * error handling, and performance optimization.
 */

import { PrismaClient, Prisma } from '@prisma/client'
import { getDatabaseConfig, validateDatabaseConfig, getRetryConfig } from './config'

// Global type for Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Performance monitoring
interface QueryMetrics {
  query: string
  duration: number
  timestamp: Date
}

class DatabaseClient {
  private client: PrismaClient
  private config = getDatabaseConfig()
  private retryConfig = getRetryConfig()
  private queryMetrics: QueryMetrics[] = []
  private connectionAttempts = 0
  private isConnected = false

  constructor() {
    // Validate configuration
    validateDatabaseConfig(this.config)
    
    // Extract only Prisma-compatible options
    const prismaOptions: any = {
      errorFormat: this.config.errorFormat,
      log: this.config.log
    }

    // Add datasource URL if provided
    if (process.env.DATABASE_URL) {
      prismaOptions.datasourceUrl = process.env.DATABASE_URL
    }

    // Create Prisma client with compatible configuration
    this.client = new PrismaClient(prismaOptions)

    this.setupEventHandlers()
    this.setupHealthCheck()
  }

  /**
   * Setup event handlers for monitoring and logging
   */
  private setupEventHandlers(): void {
    if (!this.config.enablePerformanceMonitoring) return

    // Query monitoring
    this.client.$on('query', (event) => {
      const duration = event.duration
      
      // Log slow queries
      if (duration > this.config.slowQueryThreshold) {
        console.warn(`🐌 Slow query detected (${duration}ms):`, {
          query: event.query,
          params: event.params,
          duration,
          timestamp: event.timestamp
        })
      }

      // Store metrics (keep last 100 queries)
      this.queryMetrics.push({
        query: event.query,
        duration,
        timestamp: event.timestamp
      })

      if (this.queryMetrics.length > 100) {
        this.queryMetrics.shift()
      }
    })

    // Error monitoring
    this.client.$on('error', (error) => {
      console.error('🔥 Database error:', error)
    })

    // Info logging in development
    if (this.config.environment === 'development') {
      this.client.$on('info', (info) => {
        console.log('ℹ️ Database info:', info)
      })

      this.client.$on('warn', (warn) => {
        console.warn('⚠️ Database warning:', warn)
      })
    }
  }

  /**
   * Setup periodic health check
   */
  private setupHealthCheck(): void {
    if (this.config.environment === 'test') return

    // Health check every 30 seconds in production, 60 seconds in development
    const interval = this.config.environment === 'production' ? 30000 : 60000

    setInterval(async () => {
      try {
        await this.healthCheck()
      } catch (error) {
        console.error('❌ Database health check failed:', error)
        this.isConnected = false
      }
    }, interval)
  }

  /**
   * Perform database health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`
      this.isConnected = true
      return true
    } catch (error) {
      this.isConnected = false
      throw error
    }
  }

  /**
   * Connect to database with retry logic
   */
  async connect(): Promise<void> {
    let lastError: unknown

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        this.connectionAttempts++
        await this.client.$connect()
        this.isConnected = true
        
        if (attempt > 1) {
          console.log(`✅ Database connected on attempt ${attempt}`)
        }
        
        return
      } catch (error) {
        lastError = error
        this.isConnected = false
        
        console.error(`❌ Database connection attempt ${attempt} failed:`, error)

        if (attempt < this.retryConfig.maxAttempts) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1),
            this.retryConfig.maxDelay
          )
          
          console.log(`⏳ Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw new Error(`Failed to connect to database after ${this.retryConfig.maxAttempts} attempts: ${lastError}`)
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.$disconnect()
      this.isConnected = false
    } catch (error) {
      console.error('Error disconnecting from database:', error)
      throw error
    }
  }

  /**
   * Execute with automatic retry on transient errors
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: unknown

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        // Only retry on specific transient errors
        if (this.isRetryableError(error) && attempt < this.retryConfig.maxAttempts) {
          const delay = Math.min(
            this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1),
            this.retryConfig.maxDelay
          )
          
          console.warn(`⏳ Retrying ${context} (attempt ${attempt + 1}) in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        throw error
      }
    }

    throw lastError
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Connection errors that can be retried
      const retryableCodes = [
        'P1001', // Can't reach database server
        'P1008', // Operations timed out
        'P1017', // Server has closed the connection
      ]
      return retryableCodes.includes(error.code)
    }

    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      // Network or connection issues
      return true
    }

    return false
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      environment: this.config.environment,
    }
  }

  /**
   * Get query metrics
   */
  getQueryMetrics() {
    if (!this.config.enablePerformanceMonitoring) {
      return { message: 'Performance monitoring disabled' }
    }

    const recentQueries = this.queryMetrics.slice(-10)
    const averageDuration = this.queryMetrics.length > 0 
      ? this.queryMetrics.reduce((sum, metric) => sum + metric.duration, 0) / this.queryMetrics.length
      : 0

    const slowQueries = this.queryMetrics.filter(metric => 
      metric.duration > this.config.slowQueryThreshold
    ).length

    return {
      totalQueries: this.queryMetrics.length,
      averageDuration: Math.round(averageDuration * 100) / 100,
      slowQueries,
      slowQueryThreshold: this.config.slowQueryThreshold,
      recentQueries,
    }
  }

  /**
   * Get the underlying Prisma client
   */
  get $client(): PrismaClient {
    return this.client
  }

  /**
   * Proxy all Prisma client methods
   */
  get user() { return this.client.user }
  get module() { return this.client.module }
  get goal() { return this.client.goal }
  get progress() { return this.client.progress }
  get achievement() { return this.client.achievement }
  get userAchievement() { return this.client.userAchievement }
  
  // Bible Study Module models
  get bibleReadingPlan() { return this.client.bibleReadingPlan }
  get bibleReading() { return this.client.bibleReading }
  get studySession() { return this.client.studySession }
  get prayerRequest() { return this.client.prayerRequest }
  get scriptureBookmark() { return this.client.scriptureBookmark }
  get bibleReadingPlanPreset() { return this.client.bibleReadingPlanPreset }
  
  // Work Module models
  get workProject() { return this.client.workProject }
  get projectTask() { return this.client.projectTask }
  get timeEntry() { return this.client.timeEntry }
  get careerGoal() { return this.client.careerGoal }
  get performanceMetric() { return this.client.performanceMetric }
  get projectMilestone() { return this.client.projectMilestone }
  
  // Fitness Module models
  get workoutPlan() { return this.client.workoutPlan }
  get workout() { return this.client.workout }
  get exerciseTemplate() { return this.client.exerciseTemplate }
  get workoutExercise() { return this.client.workoutExercise }
  get workoutSet() { return this.client.workoutSet }
  get personalRecord() { return this.client.personalRecord }
  
  // Nutrition Module models
  get food() { return this.client.food }
  get foodLog() { return this.client.foodLog }
  get nutritionGoal() { return this.client.nutritionGoal }
  get waterIntake() { return this.client.waterIntake }
  get meal() { return this.client.meal }
  get mealFood() { return this.client.mealFood }
  
  // User and system models
  get userSetting() { return this.client.userSetting }
  get userModuleConfig() { return this.client.userModuleConfig }
  get analyticsCache() { return this.client.analyticsCache }
  get calendarEvent() { return this.client.calendarEvent }
  
  // Prisma client methods
  get $connect() { return this.client.$connect.bind(this.client) }
  get $disconnect() { return this.client.$disconnect.bind(this.client) }
  get $executeRaw() { return this.client.$executeRaw.bind(this.client) }
  get $executeRawUnsafe() { return this.client.$executeRawUnsafe.bind(this.client) }
  get $queryRaw() { return this.client.$queryRaw.bind(this.client) }
  get $queryRawUnsafe() { return this.client.$queryRawUnsafe.bind(this.client) }
  get $transaction() { return this.client.$transaction.bind(this.client) }
  get $on() { return this.client.$on.bind(this.client) }
  get $extends() { return this.client.$extends.bind(this.client) }
}

// Create singleton instance
export const prisma = globalForPrisma.prisma ?? new DatabaseClient()

// Store in global for hot reload in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma as any
}

// Graceful shutdown handling
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('🔌 Disconnecting from database...')
    await prisma.disconnect()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('🔌 Disconnecting from database...')
    await prisma.disconnect()
    process.exit(0)
  })
}

export type { PrismaClient }
export { Prisma }