/**
 * Fitness Module Performance Monitoring
 * 
 * Monitors and tracks performance metrics for the fitness module
 * to ensure optimal user experience and identify bottlenecks.
 */

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  route?: string
  component?: string
  userId?: string
  sessionId?: string
}

interface PerformanceThresholds {
  routeNavigation: number
  componentMount: number
  authFlow: number
  userInteraction: number
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  routeNavigation: 2000, // 2 seconds
  componentMount: 1000,  // 1 second
  authFlow: 3000,        // 3 seconds
  userInteraction: 500   // 500ms
}

class FitnessPerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 1000
  private thresholds: PerformanceThresholds
  private sessionId: string
  private isEnabled: boolean

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
    this.sessionId = this.generateSessionId()
    this.isEnabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'
  }

  private generateSessionId(): string {
    return `fitness-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Record route navigation performance
   */
  recordRouteNavigation(route: string, duration: number, userId?: string): void {
    if (!this.isEnabled) return

    this.addMetric({
      name: 'route_navigation',
      value: duration,
      timestamp: Date.now(),
      route,
      userId,
      sessionId: this.sessionId
    })

    // Alert on slow navigation
    if (duration > this.thresholds.routeNavigation) {
      this.logPerformanceWarning(
        'Slow route navigation',
        `${route} took ${duration}ms (threshold: ${this.thresholds.routeNavigation}ms)`
      )
    }
  }

  /**
   * Record component mount/load performance
   */
  recordComponentMount(component: string, duration: number, route?: string): void {
    if (!this.isEnabled) return

    this.addMetric({
      name: 'component_mount',
      value: duration,
      timestamp: Date.now(),
      component,
      route,
      sessionId: this.sessionId
    })

    // Alert on slow component loading
    if (duration > this.thresholds.componentMount) {
      this.logPerformanceWarning(
        'Slow component mount',
        `${component} took ${duration}ms (threshold: ${this.thresholds.componentMount}ms)`
      )
    }
  }

  /**
   * Record authentication flow performance
   */
  recordAuthFlow(flow: string, duration: number, success: boolean): void {
    if (!this.isEnabled) return

    this.addMetric({
      name: `auth_${flow}`,
      value: duration,
      timestamp: Date.now(),
      sessionId: this.sessionId
    })

    if (!success) {
      console.error(`🔒 Auth flow failed: ${flow}`)
    } else if (duration > this.thresholds.authFlow) {
      this.logPerformanceWarning(
        'Slow auth flow',
        `${flow} took ${duration}ms (threshold: ${this.thresholds.authFlow}ms)`
      )
    }
  }

  /**
   * Record user interaction performance
   */
  recordUserInteraction(interaction: string, duration: number, component?: string): void {
    if (!this.isEnabled) return

    this.addMetric({
      name: 'user_interaction',
      value: duration,
      timestamp: Date.now(),
      component,
      sessionId: this.sessionId
    })

    if (duration > this.thresholds.userInteraction) {
      this.logPerformanceWarning(
        'Slow user interaction',
        `${interaction} (${component}) took ${duration}ms (threshold: ${this.thresholds.userInteraction}ms)`
      )
    }
  }

  /**
   * Record custom performance metric
   */
  recordCustomMetric(name: string, value: number, metadata?: Record<string, string>): void {
    if (!this.isEnabled) return

    this.addMetric({
      name,
      value,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...metadata
    })
  }

  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric)
    
    // Keep only recent metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Emit metric for external monitoring tools
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'fitness_performance', {
        event_category: 'Performance',
        event_label: metric.name,
        value: Math.round(metric.value)
      })
    }
  }

  private logPerformanceWarning(title: string, message: string): void {
    console.warn(`🐌 ${title}: ${message}`)
    
    // Could integrate with error reporting service here
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.addBreadcrumb({
        message: `${title}: ${message}`,
        category: 'performance',
        level: 'warning'
      })
    }
  }

  /**
   * Get metrics by name
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name)
    }
    return [...this.metrics]
  }

  /**
   * Get average metric value over a time window
   */
  getAverageMetric(name: string, timeWindowMs = 5 * 60 * 1000): number {
    const cutoff = Date.now() - timeWindowMs
    const recentMetrics = this.metrics
      .filter(m => m.name === name && m.timestamp > cutoff)
    
    if (recentMetrics.length === 0) return 0
    
    return recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length
  }

  /**
   * Get performance percentiles
   */
  getMetricPercentiles(name: string, timeWindowMs = 5 * 60 * 1000): {
    p50: number
    p75: number
    p90: number
    p95: number
    p99: number
  } {
    const cutoff = Date.now() - timeWindowMs
    const recentMetrics = this.metrics
      .filter(m => m.name === name && m.timestamp > cutoff)
      .map(m => m.value)
      .sort((a, b) => a - b)
    
    if (recentMetrics.length === 0) {
      return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0 }
    }

    const getPercentile = (percentile: number): number => {
      const index = Math.ceil((percentile / 100) * recentMetrics.length) - 1
      return recentMetrics[Math.max(0, index)]
    }

    return {
      p50: getPercentile(50),
      p75: getPercentile(75),
      p90: getPercentile(90),
      p95: getPercentile(95),
      p99: getPercentile(99)
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeWindowMs = 5 * 60 * 1000): Record<string, any> {
    const cutoff = Date.now() - timeWindowMs
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff)
    
    const summary: Record<string, any> = {
      sessionId: this.sessionId,
      timeWindow: timeWindowMs,
      totalMetrics: recentMetrics.length,
      metricTypes: {}
    }

    // Group by metric name
    const metricsByName = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = []
      acc[metric.name].push(metric.value)
      return acc
    }, {} as Record<string, number[]>)

    // Calculate stats for each metric type
    Object.entries(metricsByName).forEach(([name, values]) => {
      const sorted = values.sort((a, b) => a - b)
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length

      summary.metricTypes[name] = {
        count: values.length,
        average: Math.round(avg),
        min: sorted[0],
        max: sorted[sorted.length - 1],
        median: sorted[Math.floor(sorted.length / 2)],
        exceedsThreshold: this.getThresholdViolations(name, values)
      }
    })

    return summary
  }

  private getThresholdViolations(metricName: string, values: number[]): number {
    let threshold = 0
    
    switch (metricName) {
      case 'route_navigation':
        threshold = this.thresholds.routeNavigation
        break
      case 'component_mount':
        threshold = this.thresholds.componentMount
        break
      case 'user_interaction':
        threshold = this.thresholds.userInteraction
        break
      default:
        if (metricName.startsWith('auth_')) {
          threshold = this.thresholds.authFlow
        }
        break
    }

    return threshold > 0 ? values.filter(val => val > threshold).length : 0
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = []
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): {
    sessionId: string
    timestamp: number
    metrics: PerformanceMetric[]
  } {
    return {
      sessionId: this.sessionId,
      timestamp: Date.now(),
      metrics: [...this.metrics]
    }
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds }
  }
}

// Singleton instance
export const fitnessPerformanceMonitor = new FitnessPerformanceMonitor()

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const startTimer = (label: string) => {
    const start = performance.now()
    return {
      end: (metadata?: Record<string, string>) => {
        const duration = performance.now() - start
        fitnessPerformanceMonitor.recordCustomMetric(label, duration, metadata)
        return duration
      }
    }
  }

  const measureAsync = async <T>(
    label: string, 
    asyncFn: () => Promise<T>, 
    metadata?: Record<string, string>
  ): Promise<{ result: T; duration: number }> => {
    const timer = startTimer(label)
    const result = await asyncFn()
    const duration = timer.end(metadata)
    return { result, duration }
  }

  return {
    startTimer,
    measureAsync,
    recordRouteNavigation: fitnessPerformanceMonitor.recordRouteNavigation.bind(fitnessPerformanceMonitor),
    recordComponentMount: fitnessPerformanceMonitor.recordComponentMount.bind(fitnessPerformanceMonitor),
    recordAuthFlow: fitnessPerformanceMonitor.recordAuthFlow.bind(fitnessPerformanceMonitor),
    recordUserInteraction: fitnessPerformanceMonitor.recordUserInteraction.bind(fitnessPerformanceMonitor)
  }
}

// Performance monitoring utilities for React components
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  return function PerformanceMonitoredComponent(props: P) {
    React.useEffect(() => {
      const start = performance.now()
      
      return () => {
        const duration = performance.now() - start
        fitnessPerformanceMonitor.recordComponentMount(componentName, duration)
      }
    }, [])

    return <WrappedComponent {...props} />
  }
}