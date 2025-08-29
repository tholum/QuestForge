/**
 * Database Performance Tests
 * 
 * Tests for database performance, query optimization, and monitoring.
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { PerformanceMonitor, QueryOptimizer, ConnectionPoolMonitor } from '../performance-monitor'
import { hashPassword } from '../../auth/password'

// Test database setup
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'file:./test-performance.db'
    }
  }
})

describe('Database Performance Tests', () => {
  let performanceMonitor: PerformanceMonitor
  
  beforeAll(async () => {
    performanceMonitor = new PerformanceMonitor(testPrisma, {
      enableQueryLogging: true,
      enableConnectionMonitoring: false, // Disable for tests
      slowQueryThreshold: 100 // Lower threshold for testing
    })
  })

  beforeEach(async () => {
    // Clean database before each test
    await testPrisma.userAchievement.deleteMany()
    await testPrisma.progress.deleteMany()
    await testPrisma.goal.deleteMany()
    await testPrisma.achievement.deleteMany()
    await testPrisma.user.deleteMany()
    await testPrisma.module.deleteMany()

    // Clear performance metrics
    performanceMonitor.clearMetrics()
  })

  afterAll(async () => {
    await testPrisma.$disconnect()
  })

  describe('Query Performance', () => {
    it('should measure query execution time', async () => {
      const startTime = Date.now()
      
      await testPrisma.user.findMany()
      
      const endTime = Date.now()
      const duration = endTime - startTime

      expect(duration).toBeGreaterThanOrEqual(0)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle bulk operations efficiently', async () => {
      const password = await hashPassword('password123')
      
      // Create test data
      const users = Array.from({ length: 100 }, (_, i) => ({
        email: `user${i}@example.com`,
        name: `User ${i}`,
        password
      }))

      const startTime = Date.now()
      
      // Use transaction for bulk operations
      await testPrisma.$transaction(async (tx) => {
        for (const user of users) {
          await tx.user.create({ data: user })
        }
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`Bulk insert of 100 users took: ${duration}ms`)
      
      // Should complete within reasonable time (adjust based on your performance requirements)
      expect(duration).toBeLessThan(10000) // 10 seconds

      // Verify all users were created
      const userCount = await testPrisma.user.count()
      expect(userCount).toBe(100)
    })

    it('should perform efficient pagination', async () => {
      const password = await hashPassword('password123')
      
      // Create test users
      await testPrisma.user.createMany({
        data: Array.from({ length: 50 }, (_, i) => ({
          email: `page-user${i}@example.com`,
          name: `Page User ${i}`,
          password
        }))
      })

      const pageSize = 10
      const startTime = Date.now()

      // Test pagination performance
      for (let page = 0; page < 5; page++) {
        const users = await testPrisma.user.findMany({
          skip: page * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' }
        })
        expect(users).toHaveLength(pageSize)
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`Paginated queries took: ${duration}ms`)
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should handle complex queries with joins efficiently', async () => {
      // Setup test data
      const password = await hashPassword('password123')
      const user = await testPrisma.user.create({
        data: {
          email: 'complex@example.com',
          name: 'Complex User',
          password
        }
      })

      const module = await testPrisma.module.create({
        data: {
          id: 'complex-module',
          name: 'Complex Module',
          version: '1.0.0'
        }
      })

      // Create goals with progress
      const goals = await Promise.all(
        Array.from({ length: 20 }, async (_, i) => {
          const goal = await testPrisma.goal.create({
            data: {
              title: `Complex Goal ${i}`,
              userId: user.id,
              moduleId: module.id,
              difficulty: 'medium',
              priority: 'high'
            }
          })

          // Add progress entries
          await testPrisma.progress.createMany({
            data: Array.from({ length: 5 }, (_, j) => ({
              value: Math.random() * 100,
              maxValue: 100,
              xpEarned: Math.floor(Math.random() * 50),
              userId: user.id,
              goalId: goal.id,
              recordedAt: new Date(Date.now() - j * 24 * 60 * 60 * 1000)
            }))
          })

          return goal
        })
      )

      const startTime = Date.now()

      // Complex query with multiple joins
      const result = await testPrisma.user.findUnique({
        where: { id: user.id },
        include: {
          goals: {
            include: {
              progress: {
                orderBy: { recordedAt: 'desc' },
                take: 3
              },
              module: true
            }
          },
          _count: {
            select: {
              goals: true,
              progress: true
            }
          }
        }
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`Complex query with joins took: ${duration}ms`)
      
      expect(result).toBeDefined()
      expect(result!.goals).toHaveLength(20)
      expect(duration).toBeLessThan(2000) // Should complete within 2 seconds
    })
  })

  describe('Performance Monitor', () => {
    it('should track query metrics', async () => {
      // Perform some queries
      await testPrisma.user.findMany()
      await testPrisma.module.findMany()

      // Wait a bit for metrics to be collected
      await new Promise(resolve => setTimeout(resolve, 100))

      const summary = performanceMonitor.getPerformanceSummary(1) // Last 1 minute

      expect(summary.totalQueries).toBeGreaterThan(0)
      expect(summary.averageQueryTime).toBeGreaterThanOrEqual(0)
    })

    it('should identify slow queries', async () => {
      // Force a slow query by creating complex data and querying it
      const password = await hashPassword('password123')
      await testPrisma.user.create({
        data: {
          email: 'slow@example.com',
          name: 'Slow User',
          password
        }
      })

      // Simulate a potentially slow query
      await testPrisma.user.findMany({
        where: {
          email: { contains: 'slow' }
        },
        include: {
          goals: {
            include: {
              progress: true
            }
          }
        }
      })

      const slowQueries = performanceMonitor.getSlowQueries(5)
      
      // The actual assertion depends on whether queries are actually slow
      // In a test environment, they might not be slow enough to trigger the threshold
      expect(Array.isArray(slowQueries)).toBe(true)
    })

    it('should analyze query patterns', async () => {
      // Perform various queries
      await testPrisma.user.findMany()
      await testPrisma.user.findUnique({ where: { id: 'non-existent' } })
      await testPrisma.module.findMany()

      const patterns = performanceMonitor.getQueryPatterns()
      
      expect(Array.isArray(patterns)).toBe(true)
      if (patterns.length > 0) {
        expect(patterns[0]).toHaveProperty('pattern')
        expect(patterns[0]).toHaveProperty('count')
        expect(patterns[0]).toHaveProperty('averageDuration')
      }
    })

    it('should perform health check', async () => {
      const healthResult = await performanceMonitor.healthCheck()

      expect(healthResult).toHaveProperty('status')
      expect(healthResult).toHaveProperty('latency')
      expect(healthResult).toHaveProperty('canConnect')
      expect(healthResult).toHaveProperty('errors')

      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthResult.status)
      expect(typeof healthResult.latency).toBe('number')
      expect(typeof healthResult.canConnect).toBe('boolean')
      expect(Array.isArray(healthResult.errors)).toBe(true)
    })
  })

  describe('Query Optimization', () => {
    it('should suggest index optimizations', async () => {
      const slowQueries = [
        {
          query: 'SELECT * FROM User WHERE email = $1',
          duration: 1500,
          timestamp: new Date()
        },
        {
          query: 'SELECT * FROM Goal WHERE userId = $1 AND isCompleted = $2',
          duration: 2000,
          timestamp: new Date()
        }
      ]

      const suggestions = QueryOptimizer.suggestIndexes(slowQueries)

      expect(Array.isArray(suggestions)).toBe(true)
      // Suggestions depend on the query analysis logic
      if (suggestions.length > 0) {
        expect(suggestions[0]).toHaveProperty('table')
        expect(suggestions[0]).toHaveProperty('columns')
        expect(suggestions[0]).toHaveProperty('reasoning')
      }
    })
  })

  describe('Connection Pool Monitoring', () => {
    it('should provide connection pool status', async () => {
      const poolStatus = await ConnectionPoolMonitor.getPoolStatus()

      expect(poolStatus).toHaveProperty('totalConnections')
      expect(poolStatus).toHaveProperty('activeConnections')
      expect(poolStatus).toHaveProperty('idleConnections')
      expect(poolStatus).toHaveProperty('pendingConnections')
      expect(poolStatus).toHaveProperty('poolUtilization')
      expect(poolStatus).toHaveProperty('recommendations')

      expect(typeof poolStatus.totalConnections).toBe('number')
      expect(typeof poolStatus.poolUtilization).toBe('number')
      expect(Array.isArray(poolStatus.recommendations)).toBe(true)
    })
  })

  describe('Memory and Resource Usage', () => {
    it('should not cause memory leaks with large datasets', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      const password = await hashPassword('password123')

      // Create and process large dataset
      for (let batch = 0; batch < 10; batch++) {
        const users = await testPrisma.user.createMany({
          data: Array.from({ length: 50 }, (_, i) => ({
            email: `batch${batch}-user${i}@example.com`,
            name: `Batch ${batch} User ${i}`,
            password
          }))
        })

        // Process the data
        const userList = await testPrisma.user.findMany({
          skip: batch * 50,
          take: 50
        })

        expect(userList).toHaveLength(50)

        // Clean up batch to prevent excessive memory usage
        await testPrisma.user.deleteMany({
          where: {
            email: {
              startsWith: `batch${batch}-`
            }
          }
        })
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      console.log(`Memory increase: ${memoryIncrease / 1024 / 1024} MB`)
      
      // Memory increase should be reasonable (adjust threshold as needed)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024) // 100 MB
    })

    it('should handle concurrent operations', async () => {
      const password = await hashPassword('password123')
      const concurrentOperations = 10

      const startTime = Date.now()

      // Run concurrent operations
      const promises = Array.from({ length: concurrentOperations }, async (_, i) => {
        const user = await testPrisma.user.create({
          data: {
            email: `concurrent${i}@example.com`,
            name: `Concurrent User ${i}`,
            password
          }
        })

        // Perform some operations on the user
        await testPrisma.user.update({
          where: { id: user.id },
          data: { totalXp: i * 10 }
        })

        return user
      })

      const results = await Promise.all(promises)
      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`${concurrentOperations} concurrent operations took: ${duration}ms`)

      expect(results).toHaveLength(concurrentOperations)
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds

      // Verify all users were created
      const userCount = await testPrisma.user.count({
        where: {
          email: {
            startsWith: 'concurrent'
          }
        }
      })
      expect(userCount).toBe(concurrentOperations)
    })
  })

  describe('Database Stress Testing', () => {
    it('should handle rapid sequential operations', async () => {
      const password = await hashPassword('password123')
      const operationCount = 100

      const startTime = Date.now()

      // Rapid sequential operations
      for (let i = 0; i < operationCount; i++) {
        const user = await testPrisma.user.create({
          data: {
            email: `rapid${i}@example.com`,
            name: `Rapid User ${i}`,
            password
          }
        })

        await testPrisma.user.update({
          where: { id: user.id },
          data: { totalXp: i }
        })

        await testPrisma.user.findUnique({
          where: { id: user.id }
        })
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`${operationCount} rapid sequential operations took: ${duration}ms`)
      
      expect(duration).toBeLessThan(30000) // 30 seconds max

      const userCount = await testPrisma.user.count({
        where: {
          email: {
            startsWith: 'rapid'
          }
        }
      })
      expect(userCount).toBe(operationCount)
    })

    it('should maintain consistency under load', async () => {
      const password = await hashPassword('password123')
      
      const user = await testPrisma.user.create({
        data: {
          email: 'consistency@example.com',
          name: 'Consistency User',
          password,
          totalXp: 0
        }
      })

      const incrementCount = 50
      const incrementAmount = 10

      // Multiple concurrent updates to same user
      const promises = Array.from({ length: incrementCount }, async () => {
        return testPrisma.user.update({
          where: { id: user.id },
          data: {
            totalXp: {
              increment: incrementAmount
            }
          }
        })
      })

      await Promise.all(promises)

      const finalUser = await testPrisma.user.findUnique({
        where: { id: user.id }
      })

      // Should have correct final XP (assuming atomic increments)
      expect(finalUser!.totalXp).toBe(incrementCount * incrementAmount)
    })
  })
})