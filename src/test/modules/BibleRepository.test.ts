/**
 * Bible Repository Comprehensive Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  BibleReadingPlanRepository,
  BibleReadingRepository,
  StudySessionRepository,
  PrayerRequestRepository,
  ScriptureBookmarkRepository,
  BibleDashboardRepository
} from '../../lib/prisma/repositories/bible-repository'
import { prisma } from '../../lib/prisma/client'

// Helper function to create a test user
async function createTestUser(email = 'test@example.com') {
  return await prisma.user.create({
    data: {
      email,
      name: 'Test User',
      password: 'hashedpassword'
    }
  })
}

// Helper function to cleanup test data
async function cleanup() {
  // Delete in order that respects foreign key constraints
  await prisma.bibleReading.deleteMany()
  await prisma.bibleReadingPlan.deleteMany()
  await prisma.studySession.deleteMany()
  await prisma.prayerRequest.deleteMany()
  await prisma.scriptureBookmark.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.user.deleteMany()
}

describe('Bible Reading Plan Repository', () => {
  let repository: BibleReadingPlanRepository
  let testUser: any

  beforeEach(async () => {
    repository = new BibleReadingPlanRepository()
    testUser = await createTestUser()
  })

  afterEach(async () => {
    await cleanup()
  })

  describe('CRUD Operations', () => {
    it('should create a reading plan', async () => {
      const planData = {
        userId: testUser.id,
        name: 'Daily Bible Reading',
        description: 'One year reading plan',
        planType: 'custom',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      }

      const plan = await repository.create(planData)
      
      expect(plan).toBeDefined()
      expect(plan.id).toBeDefined()
      expect(plan.name).toBe(planData.name)
      expect(plan.userId).toBe(testUser.id)
      expect(plan.planType).toBe('custom')
    })

    it('should find reading plans by user', async () => {
      const planData = {
        userId: testUser.id,
        name: 'Test Plan',
        planType: 'custom',
        startDate: new Date(),
        isActive: true
      }

      await repository.create(planData)
      const plans = await repository.getUserActivePlans(testUser.id)
      
      expect(plans).toHaveLength(1)
      expect(plans[0].name).toBe('Test Plan')
      expect(plans[0].isActive).toBe(true)
    })

    it('should update a reading plan', async () => {
      const plan = await repository.create({
        userId: testUser.id,
        name: 'Original Name',
        planType: 'custom',
        startDate: new Date(),
        isActive: true
      })

      const updatedPlan = await repository.update(plan.id, {
        name: 'Updated Name',
        description: 'Updated description'
      })

      expect(updatedPlan.name).toBe('Updated Name')
      expect(updatedPlan.description).toBe('Updated description')
    })

    it('should delete a reading plan', async () => {
      const plan = await repository.create({
        userId: testUser.id,
        name: 'To Delete',
        planType: 'custom',
        startDate: new Date(),
        isActive: true
      })

      await repository.delete(plan.id)
      
      const found = await repository.findById(plan.id)
      expect(found).toBeNull()
    })
  })

  describe('Business Logic', () => {
    it('should handle invalid data gracefully', async () => {
      const invalidData = {
        userId: testUser.id,
        name: '', // Empty name should fail validation
        planType: 'custom',
        startDate: new Date(),
        isActive: true
      }

      await expect(repository.create(invalidData)).rejects.toThrow()
    })

    it('should filter active plans correctly', async () => {
      // Create active plan
      await repository.create({
        userId: testUser.id,
        name: 'Active Plan',
        planType: 'custom',
        startDate: new Date(),
        isActive: true
      })

      // Create inactive plan
      await repository.create({
        userId: testUser.id,
        name: 'Inactive Plan',
        planType: 'custom',
        startDate: new Date(),
        isActive: false
      })

      const activePlans = await repository.getUserActivePlans(testUser.id)
      expect(activePlans).toHaveLength(1)
      expect(activePlans[0].name).toBe('Active Plan')
    })
  })
})

describe('Bible Reading Repository', () => {
  let repository: BibleReadingRepository
  let planRepository: BibleReadingPlanRepository
  let testUser: any
  let testPlan: any

  beforeEach(async () => {
    repository = new BibleReadingRepository()
    planRepository = new BibleReadingPlanRepository()
    testUser = await createTestUser()
    
    testPlan = await planRepository.create({
      userId: testUser.id,
      name: 'Test Plan',
      planType: 'custom',
      startDate: new Date(),
      isActive: true
    })
  })

  afterEach(async () => {
    await cleanup()
  })

  describe('CRUD Operations', () => {
    it('should create a bible reading', async () => {
      const readingData = {
        planId: testPlan.id,
        userId: testUser.id,
        assignedDate: new Date(),
        passages: ['John 3:16', 'Romans 8:28'],
        isCompleted: false
      }

      const reading = await repository.create(readingData)
      
      expect(reading).toBeDefined()
      expect(reading.planId).toBe(testPlan.id)
      expect(reading.userId).toBe(testUser.id)
      expect(reading.passages).toEqual(['John 3:16', 'Romans 8:28'])
    })

    it('should mark reading as completed', async () => {
      const reading = await repository.create({
        planId: testPlan.id,
        userId: testUser.id,
        assignedDate: new Date(),
        passages: ['John 3:16'],
        isCompleted: false
      })

      const completed = await repository.completeReading(
        reading.id,
        testUser.id,
        30,
        'Great reading today'
      )

      expect(completed.isCompleted).toBe(true)
      expect(completed.readingTimeMinutes).toBe(30)
      expect(completed.notes).toBe('Great reading today')
      expect(completed.completedAt).toBeDefined()
    })
  })

  describe('Reading Streak Calculation', () => {
    it('should calculate reading streak correctly', async () => {
      // Create readings for the last 3 days
      const today = new Date()
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
      const dayBeforeYesterday = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)

      // Create completed readings
      await repository.create({
        planId: testPlan.id,
        userId: testUser.id,
        assignedDate: today,
        passages: ['John 1:1'],
        isCompleted: true,
        completedAt: new Date()
      })

      await repository.create({
        planId: testPlan.id,
        userId: testUser.id,
        assignedDate: yesterday,
        passages: ['John 1:2'],
        isCompleted: true,
        completedAt: new Date()
      })

      await repository.create({
        planId: testPlan.id,
        userId: testUser.id,
        assignedDate: dayBeforeYesterday,
        passages: ['John 1:3'],
        isCompleted: true,
        completedAt: new Date()
      })

      const streak = await repository.getReadingStreak(testUser.id)
      expect(streak).toBe(3)
    })

    it('should return 0 for no completed readings', async () => {
      const streak = await repository.getReadingStreak(testUser.id)
      expect(streak).toBe(0)
    })
  })

  describe('Today\'s Readings', () => {
    it('should get today\'s readings', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await repository.create({
        planId: testPlan.id,
        userId: testUser.id,
        assignedDate: today,
        passages: ['Psalm 23'],
        isCompleted: false
      })

      const todaysReadings = await repository.getTodaysReadings(testUser.id)
      expect(todaysReadings).toHaveLength(1)
      expect(todaysReadings[0].assignedDate.getTime()).toBe(today.getTime())
    })
  })
})

describe('Study Session Repository', () => {
  let repository: StudySessionRepository
  let testUser: any

  beforeEach(async () => {
    repository = new StudySessionRepository()
    testUser = await createTestUser()
  })

  afterEach(async () => {
    await cleanup()
  })

  describe('CRUD Operations', () => {
    it('should create a study session', async () => {
      const sessionData = {
        userId: testUser.id,
        title: 'Romans 8 Study',
        description: 'Deep dive into Romans 8',
        passages: ['Romans 8:1-17'],
        durationMinutes: 45,
        studyDate: new Date(),
        notes: 'Great insights about freedom in Christ',
        tags: ['freedom', 'spirit']
      }

      const session = await repository.create(sessionData)
      
      expect(session).toBeDefined()
      expect(session.title).toBe(sessionData.title)
      expect(session.durationMinutes).toBe(45)
      expect(session.tags).toEqual(['freedom', 'spirit'])
    })

    it('should get recent study sessions', async () => {
      // Create multiple sessions with different dates
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      await repository.create({
        userId: testUser.id,
        title: 'Recent Study',
        studyDate: now
      })

      await repository.create({
        userId: testUser.id,
        title: 'Older Study',
        studyDate: yesterday
      })

      const recentSessions = await repository.getRecentSessions(testUser.id, 1)
      expect(recentSessions).toHaveLength(1)
      expect(recentSessions[0].title).toBe('Recent Study')
    })
  })

  describe('Tag Filtering', () => {
    it('should filter sessions by tags', async () => {
      await repository.create({
        userId: testUser.id,
        title: 'Grace Study',
        studyDate: new Date(),
        tags: ['grace', 'salvation']
      })

      await repository.create({
        userId: testUser.id,
        title: 'Love Study',
        studyDate: new Date(),
        tags: ['love', 'relationships']
      })

      const graceSessions = await repository.getByTags(testUser.id, ['grace'])
      expect(graceSessions).toHaveLength(1)
      expect(graceSessions[0].title).toBe('Grace Study')
    })
  })
})

describe('Prayer Request Repository', () => {
  let repository: PrayerRequestRepository
  let testUser: any

  beforeEach(async () => {
    repository = new PrayerRequestRepository()
    testUser = await createTestUser()
  })

  afterEach(async () => {
    await cleanup()
  })

  describe('CRUD Operations', () => {
    it('should create a prayer request', async () => {
      const prayerData = {
        userId: testUser.id,
        title: 'Wisdom for decision',
        description: 'Need guidance for career choice',
        category: 'personal',
        priority: 'high',
        isPrivate: true,
        isAnswered: false,
        requestDate: new Date()
      }

      const prayer = await repository.create(prayerData)
      
      expect(prayer).toBeDefined()
      expect(prayer.title).toBe(prayerData.title)
      expect(prayer.category).toBe('personal')
      expect(prayer.priority).toBe('high')
      expect(prayer.isAnswered).toBe(false)
    })

    it('should mark prayer as answered', async () => {
      const prayer = await repository.create({
        userId: testUser.id,
        title: 'Test Prayer',
        category: 'personal',
        priority: 'medium',
        isPrivate: true,
        isAnswered: false,
        requestDate: new Date()
      })

      const answered = await repository.markAsAnswered(
        prayer.id,
        testUser.id,
        'God provided clearly'
      )

      expect(answered.isAnswered).toBe(true)
      expect(answered.answerDescription).toBe('God provided clearly')
      expect(answered.answeredAt).toBeDefined()
    })
  })

  describe('Filtering', () => {
    it('should get active prayer requests', async () => {
      // Create active prayer
      await repository.create({
        userId: testUser.id,
        title: 'Active Prayer',
        category: 'personal',
        priority: 'medium',
        isPrivate: true,
        isAnswered: false,
        requestDate: new Date()
      })

      // Create answered prayer
      await repository.create({
        userId: testUser.id,
        title: 'Answered Prayer',
        category: 'personal',
        priority: 'medium',
        isPrivate: true,
        isAnswered: true,
        requestDate: new Date()
      })

      const activeRequests = await repository.getActiveRequests(testUser.id)
      expect(activeRequests).toHaveLength(1)
      expect(activeRequests[0].title).toBe('Active Prayer')
    })

    it('should get prayers by category', async () => {
      await repository.create({
        userId: testUser.id,
        title: 'Personal Prayer',
        category: 'personal',
        priority: 'medium',
        isPrivate: true,
        isAnswered: false,
        requestDate: new Date()
      })

      await repository.create({
        userId: testUser.id,
        title: 'Family Prayer',
        category: 'family',
        priority: 'medium',
        isPrivate: true,
        isAnswered: false,
        requestDate: new Date()
      })

      const personalPrayers = await repository.getByCategory(testUser.id, 'personal')
      expect(personalPrayers).toHaveLength(1)
      expect(personalPrayers[0].title).toBe('Personal Prayer')
    })
  })
})

describe('Scripture Bookmark Repository', () => {
  let repository: ScriptureBookmarkRepository
  let testUser: any

  beforeEach(async () => {
    repository = new ScriptureBookmarkRepository()
    testUser = await createTestUser()
  })

  afterEach(async () => {
    await cleanup()
  })

  describe('CRUD Operations', () => {
    it('should create a scripture bookmark', async () => {
      const bookmarkData = {
        userId: testUser.id,
        reference: 'John 3:16',
        version: 'ESV',
        text: 'For God so loved the world...',
        notes: 'Favorite verse about God\'s love',
        tags: ['love', 'salvation'],
        isPrivate: true
      }

      const bookmark = await repository.create(bookmarkData)
      
      expect(bookmark).toBeDefined()
      expect(bookmark.reference).toBe('John 3:16')
      expect(bookmark.version).toBe('ESV')
      expect(bookmark.tags).toEqual(['love', 'salvation'])
    })

    it('should check if bookmark exists for reference', async () => {
      await repository.create({
        userId: testUser.id,
        reference: 'Romans 8:28',
        version: 'ESV',
        isPrivate: true
      })

      const exists = await repository.existsForReference(testUser.id, 'Romans 8:28', 'ESV')
      expect(exists).toBe(true)

      const notExists = await repository.existsForReference(testUser.id, 'John 1:1', 'ESV')
      expect(notExists).toBe(false)
    })
  })

  describe('Search and Filtering', () => {
    it('should search bookmarks by reference', async () => {
      await repository.create({
        userId: testUser.id,
        reference: 'John 3:16',
        version: 'ESV',
        isPrivate: true
      })

      await repository.create({
        userId: testUser.id,
        reference: 'Romans 8:28',
        version: 'ESV',
        isPrivate: true
      })

      const searchResults = await repository.searchByReference(testUser.id, 'John')
      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].reference).toBe('John 3:16')
    })

    it('should get bookmarks by tags', async () => {
      await repository.create({
        userId: testUser.id,
        reference: 'John 3:16',
        version: 'ESV',
        tags: ['love', 'salvation'],
        isPrivate: true
      })

      await repository.create({
        userId: testUser.id,
        reference: 'Philippians 4:13',
        version: 'ESV',
        tags: ['strength', 'perseverance'],
        isPrivate: true
      })

      const loveBookmarks = await repository.getByTags(testUser.id, ['love'])
      expect(loveBookmarks).toHaveLength(1)
      expect(loveBookmarks[0].reference).toBe('John 3:16')
    })
  })
})

describe('Bible Dashboard Repository', () => {
  let dashboardRepo: BibleDashboardRepository
  let planRepo: BibleReadingPlanRepository
  let readingRepo: BibleReadingRepository
  let sessionRepo: StudySessionRepository
  let prayerRepo: PrayerRequestRepository
  let bookmarkRepo: ScriptureBookmarkRepository
  let testUser: any

  beforeEach(async () => {
    dashboardRepo = new BibleDashboardRepository()
    planRepo = new BibleReadingPlanRepository()
    readingRepo = new BibleReadingRepository()
    sessionRepo = new StudySessionRepository()
    prayerRepo = new PrayerRequestRepository()
    bookmarkRepo = new ScriptureBookmarkRepository()
    testUser = await createTestUser()
  })

  afterEach(async () => {
    await cleanup()
  })

  describe('Dashboard Data Aggregation', () => {
    it('should provide comprehensive dashboard data', async () => {
      // Create test data
      const plan = await planRepo.create({
        userId: testUser.id,
        name: 'Test Plan',
        planType: 'custom',
        startDate: new Date(),
        isActive: true
      })

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await readingRepo.create({
        planId: plan.id,
        userId: testUser.id,
        assignedDate: today,
        passages: ['John 1:1'],
        isCompleted: false
      })

      await sessionRepo.create({
        userId: testUser.id,
        title: 'Test Study',
        studyDate: new Date()
      })

      await prayerRepo.create({
        userId: testUser.id,
        title: 'Test Prayer',
        category: 'personal',
        priority: 'medium',
        isPrivate: true,
        isAnswered: false,
        requestDate: new Date()
      })

      await bookmarkRepo.create({
        userId: testUser.id,
        reference: 'John 3:16',
        version: 'ESV',
        isPrivate: true
      })

      const dashboardData = await dashboardRepo.getDashboardData(testUser.id)

      expect(dashboardData).toHaveProperty('activePlans')
      expect(dashboardData).toHaveProperty('todaysReadings')
      expect(dashboardData).toHaveProperty('recentStudySessions')
      expect(dashboardData).toHaveProperty('activePrayerRequests')
      expect(dashboardData).toHaveProperty('recentBookmarks')
      expect(dashboardData).toHaveProperty('readingStreak')
      expect(dashboardData).toHaveProperty('stats')

      expect(dashboardData.activePlans).toHaveLength(1)
      expect(dashboardData.todaysReadings).toHaveLength(1)
      expect(dashboardData.recentStudySessions).toHaveLength(1)
      expect(dashboardData.activePrayerRequests).toHaveLength(1)
      expect(dashboardData.recentBookmarks).toHaveLength(1)
      expect(dashboardData.readingStreak).toBe(0) // No completed readings yet
      expect(dashboardData.stats.totalPlans).toBe(1)
    })

    it('should handle empty dashboard data gracefully', async () => {
      const dashboardData = await dashboardRepo.getDashboardData(testUser.id)

      expect(dashboardData.activePlans).toHaveLength(0)
      expect(dashboardData.todaysReadings).toHaveLength(0)
      expect(dashboardData.recentStudySessions).toHaveLength(0)
      expect(dashboardData.activePrayerRequests).toHaveLength(0)
      expect(dashboardData.recentBookmarks).toHaveLength(0)
      expect(dashboardData.readingStreak).toBe(0)
      expect(dashboardData.stats.totalPlans).toBe(0)
    })
  })
})