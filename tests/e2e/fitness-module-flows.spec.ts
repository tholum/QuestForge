/**
 * Fitness Module E2E Tests - Complete User Flows
 * 
 * Tests the complete user journey from login to fitness module usage,
 * validating all fixes work together correctly.
 */
import { test, expect } from '@playwright/test'
import { ensureAuthenticated } from '../helpers/auth'

test.describe('Fitness Module - Complete User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure authentication before each test using cached state
    await ensureAuthenticated(page)
  })

  test('Complete fitness workflow: login → navigate → use features', async ({ page }) => {
    console.log('🧪 Testing complete fitness workflow...')
    
    // Step 1: Verify we're authenticated and on dashboard
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    
    // Step 2: Navigate to fitness module
    await page.goto('/modules/fitness')
    await expect(page).toHaveURL('/modules/fitness/dashboard')
    
    // Verify module content loads
    await expect(page.locator('[data-testid="module-content"]')).toBeVisible()
    await expect(page.locator('[data-testid="module-title"]')).toContainText('Fitness Tracker')
    
    // Step 3: Test direct routing to workouts page
    console.log('Testing direct navigation to /modules/fitness/workouts...')
    await page.goto('/modules/fitness/workouts')
    await expect(page).toHaveURL('/modules/fitness/workouts')
    
    // Verify workout planning view loads
    await expect(page.locator('h3:has-text("Workout Planning")')).toBeVisible()
    await expect(page.locator('text=Plan and track your workouts')).toBeVisible()
    
    // Step 4: Test direct routing to exercises page
    console.log('Testing direct navigation to /modules/fitness/exercises...')
    await page.goto('/modules/fitness/exercises')
    await expect(page).toHaveURL('/modules/fitness/exercises')
    
    // Verify exercise library view loads
    await expect(page.locator('h3:has-text("Exercise Library")')).toBeVisible()
    await expect(page.locator('text=Browse exercises and create custom ones')).toBeVisible()
    
    // Step 5: Test tab navigation within fitness module
    console.log('Testing tab navigation within fitness module...')
    await page.goto('/modules/fitness/dashboard')
    
    // Click on Workouts tab
    await page.click('text=Workouts')
    await expect(page).toHaveURL('/modules/fitness/workouts')
    
    // Click on Exercise Library tab
    await page.click('text=Exercise Library')  
    await expect(page).toHaveURL('/modules/fitness/exercises')
    
    // Click on Progress tab
    await page.click('text=Progress')
    await expect(page).toHaveURL('/modules/fitness/progress')
    
    // Click back to Dashboard tab
    await page.click('text=Dashboard')
    await expect(page).toHaveURL('/modules/fitness/dashboard')
    
    // Step 6: Test component functionality - workout planning
    console.log('Testing workout planning functionality...')
    await page.goto('/modules/fitness/workouts')
    
    // Verify workout cards are visible and interactive
    const workoutCards = page.locator('.p-4.border.rounded-lg')
    await expect(workoutCards.first()).toBeVisible()
    
    // Test clicking on a workout
    const firstWorkout = workoutCards.first()
    await expect(firstWorkout.locator('h5')).toContainText('Morning Cardio')
    
    const startButton = firstWorkout.locator('button:has-text("Start Workout")')
    await expect(startButton).toBeVisible()
    
    // Step 7: Test exercise library functionality
    console.log('Testing exercise library functionality...')
    await page.goto('/modules/fitness/exercises')
    
    // Verify exercise cards are present
    const exerciseCards = page.locator('.p-4.border.rounded-lg')
    await expect(exerciseCards.first()).toBeVisible()
    
    // Verify exercise details
    await expect(exerciseCards.first().locator('h4')).toContainText('Push-ups')
    await expect(exerciseCards.first().locator('p')).toContainText('Chest')
    
    console.log('✅ Complete fitness workflow test passed')
  })

  test('Authentication state persistence across fitness routes', async ({ page, context }) => {
    console.log('🧪 Testing authentication state persistence...')
    
    // Navigate to fitness and check auth state
    await page.goto('/modules/fitness/workouts')
    await expect(page.locator('[data-testid="module-content"]')).toBeVisible()
    
    // Refresh page and verify auth persists
    console.log('Testing page refresh on fitness workouts page...')
    await page.reload()
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-testid="module-content"]')).toBeVisible()
    await expect(page).toHaveURL('/modules/fitness/workouts')
    
    // Open new tab and verify auth
    console.log('Testing new tab navigation to fitness exercises...')
    const newPage = await context.newPage()
    await newPage.goto('/modules/fitness/exercises')
    await newPage.waitForLoadState('networkidle')
    await expect(newPage.locator('[data-testid="module-content"]')).toBeVisible()
    await newPage.close()
    
    console.log('✅ Authentication state persistence test passed')
  })

  test('HMR and component loading in development', async ({ page }) => {
    // Skip in production
    test.skip(process.env.NODE_ENV === 'production', 'Development only test')
    
    console.log('🧪 Testing HMR and component loading...')
    
    // Monitor console errors
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text())
        console.log(`🚨 Console error: ${msg.text()}`)
      }
    })
    
    // Navigate to component-heavy fitness pages
    await page.goto('/modules/fitness/exercises')
    
    // Wait for dynamic components to load
    await expect(page.locator('[data-testid="module-content"]')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('h3:has-text("Exercise Library")')).toBeVisible()
    
    await page.goto('/modules/fitness/workouts')
    await expect(page.locator('h3:has-text("Workout Planning")')).toBeVisible({ timeout: 15000 })
    
    // Check for HMR module factory errors
    const hmrErrors = consoleLogs.filter(log => 
      log.includes('module factory is not available') ||
      log.includes('deleted in an HMR update') ||
      log.includes('Cannot read properties of undefined')
    )
    
    if (hmrErrors.length > 0) {
      console.log('🚨 HMR errors detected:', hmrErrors)
    }
    
    expect(hmrErrors).toHaveLength(0)
    console.log('✅ HMR and component loading test passed')
  })

  test('Error boundary and recovery', async ({ page }) => {
    console.log('🧪 Testing error boundary and recovery...')
    
    // Navigate to fitness exercises
    await page.goto('/modules/fitness/exercises')
    await expect(page.locator('[data-testid="module-content"]')).toBeVisible()
    
    // Simulate navigation that might trigger errors
    await page.goto('/modules/fitness/workouts')
    await page.goto('/modules/fitness/dashboard')
    await page.goto('/modules/fitness/exercises')
    
    // Verify the page still works after multiple navigations
    await expect(page.locator('h3:has-text("Exercise Library")')).toBeVisible()
    
    console.log('✅ Error boundary and recovery test passed')
  })

  test('Mobile navigation and responsive design', async ({ page }) => {
    console.log('🧪 Testing mobile navigation and responsive design...')
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/modules/fitness')
    
    // Verify mobile layout adjusts
    await expect(page.locator('[data-testid="module-content"]')).toBeVisible()
    
    // Test tab navigation works on mobile
    await page.click('text=Workouts')
    await expect(page).toHaveURL('/modules/fitness/workouts')
    
    await page.click('text=Exercise Library')
    await expect(page).toHaveURL('/modules/fitness/exercises')
    
    // Verify content is responsive
    const exerciseCards = page.locator('.p-4.border.rounded-lg')
    await expect(exerciseCards.first()).toBeVisible()
    
    console.log('✅ Mobile navigation test passed')
  })

  test('Fitness module handles direct URL access correctly', async ({ page }) => {
    console.log('🧪 Testing direct URL access to all fitness routes...')
    
    const routes = [
      '/modules/fitness',
      '/modules/fitness/dashboard', 
      '/modules/fitness/exercises',
      '/modules/fitness/workouts',
      '/modules/fitness/progress'
    ]
    
    for (const route of routes) {
      console.log(`Testing direct access to: ${route}`)
      
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      
      // Verify we land on the correct page
      if (route === '/modules/fitness') {
        await expect(page).toHaveURL('/modules/fitness/dashboard')
      } else {
        await expect(page).toHaveURL(route)
      }
      
      // Verify module content loads
      await expect(page.locator('[data-testid="module-content"]')).toBeVisible()
      await expect(page.locator('[data-testid="module-title"]')).toContainText('Fitness Tracker')
      
      // Verify no 404 or error pages
      await expect(page.locator('text=This page could not be found')).not.toBeVisible()
      await expect(page.locator('text=500 - Server Error')).not.toBeVisible()
    }
    
    console.log('✅ Direct URL access test passed')
  })

  test('Page transitions are smooth without loading states stuck', async ({ page }) => {
    console.log('🧪 Testing smooth page transitions...')
    
    const routes = [
      '/modules/fitness/dashboard',
      '/modules/fitness/workouts', 
      '/modules/fitness/exercises',
      '/modules/fitness/progress'
    ]
    
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i]
      console.log(`Navigating to: ${route}`)
      
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      
      // Verify loading state is not stuck
      await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 3000 })
      
      // Verify content is visible
      await expect(page.locator('[data-testid="module-content"]')).toBeVisible()
      
      // Small delay for visual smoothness
      await page.waitForTimeout(500)
    }
    
    console.log('✅ Smooth page transitions test passed')
  })

  test('No authentication loops during fitness module usage', async ({ page }) => {
    console.log('🧪 Testing for authentication loops...')
    
    let authApiCalls = 0
    
    // Monitor authentication API calls
    page.route('/api/v1/auth/me', async (route) => {
      authApiCalls++
      console.log(`Auth API call #${authApiCalls}`)
      const response = await page.request.fetch(route.request())
      await route.fulfill({ response })
    })
    
    // Navigate through fitness module
    await page.goto('/modules/fitness')
    await page.waitForLoadState('networkidle')
    
    await page.goto('/modules/fitness/workouts')
    await page.waitForLoadState('networkidle')
    
    await page.goto('/modules/fitness/exercises')  
    await page.waitForLoadState('networkidle')
    
    // Wait to see if there are excessive auth calls
    await page.waitForTimeout(3000)
    
    console.log(`Total auth API calls during navigation: ${authApiCalls}`)
    
    // Should not be making excessive auth calls (reasonable threshold)
    expect(authApiCalls).toBeLessThan(10)
    
    // Verify the final page loaded properly
    await expect(page.locator('[data-testid="module-content"]')).toBeVisible()
    
    console.log('✅ No authentication loops test passed')
  })
})