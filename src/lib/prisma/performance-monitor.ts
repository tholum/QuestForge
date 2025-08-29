/**
 * Database Performance Monitor
 * 
 * Utilities for monitoring database performance, query optimization,
 * and connection health.
 */

import { PrismaClient } from '@prisma/client'
import { prisma } from './client'

/**
 * Query performance metrics
 */
export interface QueryMetrics {
  query: string
  duration: number
  timestamp: Date
  params?: string
  target?: string
}

/**
 * Connection metrics
 */
export interface ConnectionMetrics {
  activeConnections: number
  idleConnections: number
  totalConnections: number
  connectionPoolSize: number
  waitingQueries: number
  timestamp: Date
}

/**
 * Performance summary
 */
export interface PerformanceSummary {
  totalQueries: number
  averageQueryTime: number
  slowQueries: number
  fastQueries: number
  errorRate: number
  connectionHealth: 'healthy' | 'warning' | 'critical'
  recommendations: string[]
}

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
  private queryMetrics: QueryMetrics[] = []
  private connectionMetrics: ConnectionMetrics[] = []
  private errors: Array<{ error: any; timestamp: Date }> = []
  private maxMetricsHistory = 1000
  private slowQueryThreshold = 1000 // 1 second
  private isMonitoring = false

  constructor(
    private client: any = prisma,
    private options: {
      slowQueryThreshold?: number
      maxMetricsHistory?: number
      enableQueryLogging?: boolean
      enableConnectionMonitoring?: boolean
    } = {}
  ) {
    this.slowQueryThreshold = options.slowQueryThreshold || 1000
    this.maxMetricsHistory = options.maxMetricsHistory || 1000
    
    if (options.enableQueryLogging !== false) {
      this.setupQueryMonitoring()
    }
    
    if (options.enableConnectionMonitoring) {
      this.setupConnectionMonitoring()
    }
  }

  /**
   * Setup query monitoring
   */
  private setupQueryMonitoring(): void {
    if (!this.client.$on) return

    this.client.$on('query', (event: any) => {
      const metric: QueryMetrics = {
        query: event.query,
        duration: event.duration,
        timestamp: event.timestamp,
        params: event.params,
        target: event.target
      }

      this.addQueryMetric(metric)

      // Log slow queries
      if (event.duration > this.slowQueryThreshold) {
        this.logSlowQuery(metric)
      }
    })

    this.client.$on('error', (error: any) => {
      this.errors.push({
        error,
        timestamp: new Date()
      })

      // Keep only recent errors
      if (this.errors.length > 100) {
        this.errors.shift()
      }
    })
  }

  /**
   * Setup connection monitoring
   */
  private setupConnectionMonitoring(): void {
    // Monitor connection pool periodically
    setInterval(async () => {
      try {
        const metrics = await this.getConnectionMetrics()
        this.addConnectionMetric(metrics)
      } catch (error) {
        console.error('Error monitoring connections:', error)
      }
    }, 30000) // Every 30 seconds
  }

  /**
   * Add query metric
   */
  private addQueryMetric(metric: QueryMetrics): void {
    this.queryMetrics.push(metric)
    
    // Keep only recent metrics
    if (this.queryMetrics.length > this.maxMetricsHistory) {
      this.queryMetrics.shift()
    }
  }

  /**
   * Add connection metric
   */
  private addConnectionMetric(metric: ConnectionMetrics): void {
    this.connectionMetrics.push(metric)
    
    // Keep only recent metrics
    if (this.connectionMetrics.length > this.maxMetricsHistory) {
      this.connectionMetrics.shift()
    }
  }

  /**
   * Log slow query
   */
  private logSlowQuery(metric: QueryMetrics): void {
    console.warn(`🐌 Slow query detected (${metric.duration}ms):`, {
      query: metric.query.substring(0, 200) + (metric.query.length > 200 ? '...' : ''),
      duration: metric.duration,
      timestamp: metric.timestamp,
      target: metric.target
    })
  }

  /**
   * Get current connection metrics
   */
  private async getConnectionMetrics(): Promise<ConnectionMetrics> {
    // This is a simplified implementation
    // In production, you'd want to get actual connection pool metrics
    return {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      connectionPoolSize: 10, // Default pool size
      waitingQueries: 0,
      timestamp: new Date()
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeWindowMinutes = 60): PerformanceSummary {
    const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000)
    const recentMetrics = this.queryMetrics.filter(m => m.timestamp >= cutoff)
    const recentErrors = this.errors.filter(e => e.timestamp >= cutoff)

    const totalQueries = recentMetrics.length
    const averageQueryTime = totalQueries > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries 
      : 0

    const slowQueries = recentMetrics.filter(m => m.duration > this.slowQueryThreshold).length
    const fastQueries = totalQueries - slowQueries
    const errorRate = totalQueries > 0 ? (recentErrors.length / totalQueries) * 100 : 0

    const connectionHealth = this.assessConnectionHealth()
    const recommendations = this.generateRecommendations(recentMetrics, recentErrors)

    return {
      totalQueries,
      averageQueryTime: Math.round(averageQueryTime * 100) / 100,
      slowQueries,
      fastQueries,
      errorRate: Math.round(errorRate * 100) / 100,
      connectionHealth,
      recommendations
    }
  }

  /**
   * Assess connection health
   */
  private assessConnectionHealth(): 'healthy' | 'warning' | 'critical' {
    const recentConnectionMetrics = this.connectionMetrics.slice(-5)
    if (recentConnectionMetrics.length === 0) return 'healthy'

    const latestMetric = recentConnectionMetrics[recentConnectionMetrics.length - 1]
    const connectionUtilization = latestMetric.totalConnections / latestMetric.connectionPoolSize

    if (connectionUtilization > 0.9) return 'critical'
    if (connectionUtilization > 0.7) return 'warning'
    return 'healthy'
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: QueryMetrics[], errors: any[]): string[] {
    const recommendations: string[] = []
    const slowQueries = metrics.filter(m => m.duration > this.slowQueryThreshold)

    if (slowQueries.length > metrics.length * 0.1) {
      recommendations.push('Consider adding database indexes for frequently queried columns')
      recommendations.push('Review and optimize queries that take longer than 1 second')
    }

    if (errors.length > 0) {
      recommendations.push('Investigate and fix database errors to improve stability')
    }

    const avgQueryTime = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
    if (avgQueryTime > 500) {
      recommendations.push('Average query time is high - consider query optimization')
    }

    // Analyze query patterns
    const queryTypes = new Map<string, number>()
    metrics.forEach(m => {
      const type = this.getQueryType(m.query)
      queryTypes.set(type, (queryTypes.get(type) || 0) + 1)
    })

    const selectQueries = queryTypes.get('SELECT') || 0
    const writeQueries = (queryTypes.get('INSERT') || 0) + (queryTypes.get('UPDATE') || 0) + (queryTypes.get('DELETE') || 0)

    if (writeQueries > selectQueries * 0.3) {
      recommendations.push('High write-to-read ratio detected - consider read replicas if needed')
    }

    if (recommendations.length === 0) {
      recommendations.push('Database performance looks good!')
    }

    return recommendations
  }

  /**
   * Get query type from SQL
   */
  private getQueryType(query: string): string {
    const trimmed = query.trim().toUpperCase()
    if (trimmed.startsWith('SELECT')) return 'SELECT'
    if (trimmed.startsWith('INSERT')) return 'INSERT'
    if (trimmed.startsWith('UPDATE')) return 'UPDATE'
    if (trimmed.startsWith('DELETE')) return 'DELETE'
    return 'OTHER'
  }

  /**
   * Get slow queries
   */
  getSlowQueries(limit = 10): QueryMetrics[] {
    return this.queryMetrics
      .filter(m => m.duration > this.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }

  /**
   * Get query patterns
   */
  getQueryPatterns(): Array<{
    pattern: string
    count: number
    averageDuration: number
    totalDuration: number
  }> {
    const patterns = new Map<string, QueryMetrics[]>()

    this.queryMetrics.forEach(metric => {
      const pattern = this.normalizeQuery(metric.query)
      if (!patterns.has(pattern)) {
        patterns.set(pattern, [])
      }
      patterns.get(pattern)!.push(metric)
    })

    return Array.from(patterns.entries()).map(([pattern, metrics]) => ({
      pattern,
      count: metrics.length,
      averageDuration: metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length,
      totalDuration: metrics.reduce((sum, m) => sum + m.duration, 0)
    })).sort((a, b) => b.totalDuration - a.totalDuration)
  }

  /**
   * Normalize query for pattern matching
   */
  private normalizeQuery(query: string): string {
    return query
      .replace(/\$\d+/g, '?') // Replace parameter placeholders
      .replace(/\b\d+\b/g, '?') // Replace numeric literals
      .replace(/'[^']*'/g, '?') // Replace string literals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * Get database health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    latency: number
    canConnect: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    let canConnect = false
    let latency = 0

    try {
      const start = Date.now()
      await this.client.$queryRaw`SELECT 1`
      latency = Date.now() - start
      canConnect = true
    } catch (error) {
      errors.push(`Connection failed: ${error}`)
    }

    const recentErrors = this.errors.filter(e => 
      e.timestamp >= new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    )

    if (recentErrors.length > 0) {
      errors.push(`${recentErrors.length} recent database errors`)
    }

    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (!canConnect) {
      status = 'unhealthy'
    } else if (latency > 1000 || recentErrors.length > 5) {
      status = 'degraded'
    } else {
      status = 'healthy'
    }

    return { status, latency, canConnect, errors }
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.queryMetrics = []
    this.connectionMetrics = []
    this.errors = []
  }

  /**
   * Get current metrics count
   */
  getMetricsCount(): {
    queries: number
    connections: number
    errors: number
  } {
    return {
      queries: this.queryMetrics.length,
      connections: this.connectionMetrics.length,
      errors: this.errors.length
    }
  }
}

/**
 * Default performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor(prisma, {
  enableQueryLogging: process.env.NODE_ENV !== 'test',
  enableConnectionMonitoring: process.env.NODE_ENV === 'production'
})

/**
 * Query optimization utilities
 */
export class QueryOptimizer {
  /**
   * Suggest indexes for slow queries
   */
  static suggestIndexes(slowQueries: QueryMetrics[]): Array<{
    table: string
    columns: string[]
    reasoning: string
  }> {
    const suggestions: Array<{
      table: string
      columns: string[]
      reasoning: string
    }> = []

    slowQueries.forEach(query => {
      const analysis = this.analyzeQuery(query.query)
      if (analysis.suggestedIndexes.length > 0) {
        suggestions.push(...analysis.suggestedIndexes)
      }
    })

    // Deduplicate suggestions
    const uniqueSuggestions = new Map<string, any>()
    suggestions.forEach(suggestion => {
      const key = `${suggestion.table}_${suggestion.columns.join('_')}`
      uniqueSuggestions.set(key, suggestion)
    })

    return Array.from(uniqueSuggestions.values())
  }

  /**
   * Analyze a query for optimization opportunities
   */
  private static analyzeQuery(query: string): {
    suggestedIndexes: Array<{
      table: string
      columns: string[]
      reasoning: string
    }>
    optimizationTips: string[]
  } {
    const suggestedIndexes: any[] = []
    const optimizationTips: string[] = []

    // Simple query analysis (in production, you'd want more sophisticated analysis)
    if (query.includes('WHERE') && !query.includes('INDEX')) {
      // Extract table and WHERE conditions
      const whereMatch = query.match(/FROM\s+(\w+).*WHERE\s+(.+?)(?:\s+ORDER|\s+GROUP|\s+LIMIT|$)/i)
      if (whereMatch) {
        const table = whereMatch[1]
        const whereClause = whereMatch[2]
        
        // Extract column names from WHERE clause
        const columnMatches = whereClause.match(/(\w+)\s*[=<>]/g)
        if (columnMatches) {
          const columns = columnMatches.map(match => match.replace(/\s*[=<>].*/, ''))
          suggestedIndexes.push({
            table,
            columns,
            reasoning: 'Optimize WHERE clause filtering'
          })
        }
      }
    }

    if (query.includes('ORDER BY')) {
      optimizationTips.push('Consider adding an index on ORDER BY columns')
    }

    if (query.includes('GROUP BY')) {
      optimizationTips.push('Consider adding an index on GROUP BY columns')
    }

    return { suggestedIndexes, optimizationTips }
  }
}

/**
 * Connection pool monitor
 */
export class ConnectionPoolMonitor {
  /**
   * Monitor connection pool health
   */
  static async getPoolStatus(): Promise<{
    totalConnections: number
    activeConnections: number
    idleConnections: number
    pendingConnections: number
    poolUtilization: number
    recommendations: string[]
  }> {
    // This is a placeholder implementation
    // In production, you'd interface with the actual connection pool
    const totalConnections = 10
    const activeConnections = 3
    const idleConnections = 5
    const pendingConnections = 0
    const poolUtilization = activeConnections / totalConnections

    const recommendations: string[] = []
    if (poolUtilization > 0.8) {
      recommendations.push('Consider increasing connection pool size')
    }
    if (pendingConnections > 0) {
      recommendations.push('Queries are waiting for connections - pool may be undersized')
    }
    if (poolUtilization < 0.2) {
      recommendations.push('Connection pool may be oversized for current load')
    }

    return {
      totalConnections,
      activeConnections,
      idleConnections,
      pendingConnections,
      poolUtilization,
      recommendations
    }
  }
}