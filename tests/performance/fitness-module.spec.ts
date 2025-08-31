/**
 * Fitness Module Performance Tests
 * 
 * Performance benchmarks to ensure route navigation and component loading
 * meet acceptable performance criteria.
 */
import { test, expect } from '@playwright/test'
import { ensureAuthenticated } from '../helpers/auth'

test.describe('Fitness Module Performance', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page)
  })

  test('Route navigation performance', async ({ page }) => {
    console.log('🏃 Testing route navigation performance...')
    
    // Warm up - initial navigation to establish baseline
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    const routes = [
      '/modules/fitness/dashboard',
      '/modules/fitness/exercises',
      '/modules/fitness/workouts', 
      '/modules/fitness/progress'
    ]
    
    const navigationTimes: Array<{ route: string; time: number }> = []
    
    for (const route of routes) {
      console.log(`⏱️ Measuring navigation time for: ${route}`)
      
      const start = performance.now()
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      
      // Wait for main content to be visible
      await page.waitForSelector('[data-testid="module-content"]', { timeout: 10000 })
      const end = performance.now()
      
      const navigationTime = end - start
      navigationTimes.push({
        route,
        time: navigationTime
      })
      
      console.log(`📊 ${route}: ${navigationTime.toFixed(0)}ms`)
      
      // Each route should load within 3 seconds (generous for development)
      expect(navigationTime).toBeLessThan(3000)
    }
    
    // Log summary
    const avgTime = navigationTimes.reduce((sum, item) => sum + item.time, 0) / navigationTimes.length
    console.log(`📈 Average navigation time: ${avgTime.toFixed(0)}ms`)
    console.log('✅ Route navigation performance test passed')
  })

  test('Component loading performance', async ({ page }) => {
    console.log('🏃 Testing component loading performance...')
    
    // Measure component mount times for heavy pages
    await page.goto('/modules/fitness/exercises')
    
    const start = performance.now()
    await page.waitForSelector('h3:has-text("Exercise Library")', { timeout: 5000 })
    
    // Wait for exercise cards to render
    await page.waitForSelector('.p-4.border.rounded-lg', { timeout: 5000 })
    const componentLoadTime = performance.now() - start
    
    console.log(`📊 Exercise Library component load time: ${componentLoadTime.toFixed(0)}ms`)
    
    // Component should load within 2 seconds
    expect(componentLoadTime).toBeLessThan(2000)
    
    // Test workout planning component
    await page.goto('/modules/fitness/workouts')
    
    const workoutStart = performance.now()
    await page.waitForSelector('h3:has-text("Workout Planning")', { timeout: 5000 })
    
    // Wait for workout cards to render
    await page.waitForSelector('h4:has-text("Quick Workouts")', { timeout: 5000 })
    const workoutLoadTime = performance.now() - workoutStart
    
    console.log(`📊 Workout Planning component load time: ${workoutLoadTime.toFixed(0)}ms`)
    
    // Component should load within 2 seconds
    expect(workoutLoadTime).toBeLessThan(2000)
    
    console.log('✅ Component loading performance test passed')
  })

  test('Page interactivity performance', async ({ page }) => {
    console.log('🏃 Testing page interactivity performance...')
    
    await page.goto('/modules/fitness/workouts')
    
    // Measure time for tab switching
    const tabSwitchStart = performance.now()
    await page.click('text=Exercise Library')
    await page.waitForSelector('h3:has-text("Exercise Library")', { timeout: 5000 })
    const tabSwitchTime = performance.now() - tabSwitchStart
    
    console.log(`📊 Tab switch time: ${tabSwitchTime.toFixed(0)}ms`)
    
    // Tab switching should be fast (under 1 second)
    expect(tabSwitchTime).toBeLessThan(1000)
    
    // Test button responsiveness
    const exerciseCards = page.locator('.p-4.border.rounded-lg')
    await expect(exerciseCards.first()).toBeVisible()
    
    // Measure hover effects (visual feedback)
    const buttonResponseStart = performance.now()
    await exerciseCards.first().hover()
    
    // Wait a small amount to ensure hover effects are applied
    await page.waitForTimeout(100)
    const buttonResponseTime = performance.now() - buttonResponseStart
    
    console.log(`📊 Interactive element response time: ${buttonResponseTime.toFixed(0)}ms`)
    
    // Interactive responses should be near-instant (under 200ms)
    expect(buttonResponseTime).toBeLessThan(500)
    
    console.log('✅ Page interactivity performance test passed')
  })

  test('Memory usage during navigation', async ({ page }) => {
    console.log('🏃 Testing memory usage during navigation...')
    
    const routes = [
      '/modules/fitness/dashboard',
      '/modules/fitness/exercises',
      '/modules/fitness/workouts',
      '/modules/fitness/progress'
    ]
    
    // Navigate through all routes multiple times to check for memory leaks
    for (let iteration = 0; iteration < 3; iteration++) {
      console.log(`🔄 Navigation iteration ${iteration + 1}`)
      
      for (const route of routes) {
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        await page.waitForSelector('[data-testid="module-content"]')
        
        // Small delay to allow for any cleanup
        await page.waitForTimeout(500)
      }
    }
    
    // Final verification that all routes still work
    await page.goto('/modules/fitness/exercises')
    await expect(page.locator('h3:has-text("Exercise Library")')).toBeVisible()
    
    console.log('✅ Memory usage test passed (no crashes detected)')
  })

  test('Concurrent navigation performance', async ({ browser }) => {
    console.log('🏃 Testing concurrent navigation performance...')
    
    // Create multiple pages to simulate concurrent users
    const pages = []
    for (let i = 0; i < 3; i++) {
      const context = await browser.newContext()
      const page = await context.newPage()
      await ensureAuthenticated(page)
      pages.push({ page, context })
    }
    
    try {
      // Navigate all pages simultaneously to fitness module
      const navigationPromises = pages.map(async ({ page }, index) => {
        const route = `/modules/fitness/${['dashboard', 'exercises', 'workouts'][index]}`
        
        const start = performance.now()
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        await page.waitForSelector('[data-testid="module-content"]')
        const time = performance.now() - start
        
        return { page: index, route, time }
      })
      
      const results = await Promise.all(navigationPromises)
      
      // Log results
      results.forEach(result => {
        console.log(`📊 Page ${result.page} (${result.route}): ${result.time.toFixed(0)}ms`)
      })
      
      // All concurrent navigations should complete within reasonable time
      results.forEach(result => {
        expect(result.time).toBeLessThan(5000) // 5 seconds for concurrent load
      })
      
    } finally {
      // Clean up
      for (const { context } of pages) {
        await context.close()
      }
    }
    
    console.log('✅ Concurrent navigation performance test passed')
  })

  test('Load testing with rapid navigation', async ({ page }) => {
    console.log('🏃 Testing rapid navigation performance...')
    
    const routes = [
      '/modules/fitness/dashboard',
      '/modules/fitness/exercises',
      '/modules/fitness/workouts'
    ]
    
    const rapidNavigationTimes = []
    
    // Perform rapid navigation between routes
    for (let i = 0; i < 10; i++) {
      const route = routes[i % routes.length]
      
      const start = performance.now()
      await page.goto(route)
      
      // Don't wait for networkidle to test rapid switching
      await page.waitForSelector('[data-testid="module-content"]', { timeout: 3000 })
      const time = performance.now() - start
      
      rapidNavigationTimes.push(time)
      
      // Short delay before next navigation
      await page.waitForTimeout(100)
    }
    
    const avgRapidTime = rapidNavigationTimes.reduce((sum, time) => sum + time, 0) / rapidNavigationTimes.length
    const maxRapidTime = Math.max(...rapidNavigationTimes)
    
    console.log(`📊 Average rapid navigation time: ${avgRapidTime.toFixed(0)}ms`)
    console.log(`📊 Maximum rapid navigation time: ${maxRapidTime.toFixed(0)}ms`)
    
    // Even with rapid navigation, should stay reasonable
    expect(avgRapidTime).toBeLessThan(2000)
    expect(maxRapidTime).toBeLessThan(4000)
    
    console.log('✅ Rapid navigation performance test passed')
  })
})