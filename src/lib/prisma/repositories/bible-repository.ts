/**
 * Bible Repository
 * 
 * Repository for Bible study related operations including reading plans,
 * daily readings, study sessions, prayer requests, and scripture bookmarks.
 */

import { z } from 'zod'
import { BaseRepository, TransactionContext } from '../base-repository'
import { prisma } from '../client'
import type {
  BibleReadingPlan,
  BibleReading,
  StudySession,
  PrayerRequest,
  ScriptureBookmark,
  BibleReadingPlanPreset
} from '@prisma/client'

// Validation schemas
const BibleReadingPlanCreateSchema = z.object({
  userId: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  planType: z.enum(['preset', 'custom']),
  presetId: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  isActive: z.boolean().default(true)
})

const BibleReadingPlanUpdateSchema = BibleReadingPlanCreateSchema.partial()

const BibleReadingPlanQuerySchema = z.object({
  userId: z.string().optional(),
  isActive: z.boolean().optional(),
  planType: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const BibleReadingCreateSchema = z.object({
  planId: z.string(),
  userId: z.string(),
  assignedDate: z.date(),
  passages: z.array(z.string()),
  isCompleted: z.boolean().default(false),
  completedAt: z.date().optional(),
  readingTimeMinutes: z.number().optional(),
  notes: z.string().optional()
})

const BibleReadingUpdateSchema = BibleReadingCreateSchema.partial()

const BibleReadingQuerySchema = z.object({
  userId: z.string().optional(),
  planId: z.string().optional(),
  assignedDate: z.date().optional(),
  isCompleted: z.boolean().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const StudySessionCreateSchema = z.object({
  userId: z.string(),
  goalId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  passages: z.array(z.string()).optional(),
  durationMinutes: z.number().optional(),
  studyDate: z.date(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
})

const StudySessionUpdateSchema = StudySessionCreateSchema.partial()

const StudySessionQuerySchema = z.object({
  userId: z.string().optional(),
  goalId: z.string().optional(),
  studyDate: z.date().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const PrayerRequestCreateSchema = z.object({
  userId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum(['personal', 'family', 'ministry', 'world']).default('personal'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  isPrivate: z.boolean().default(true),
  isAnswered: z.boolean().default(false),
  answeredAt: z.date().optional(),
  answerDescription: z.string().optional(),
  requestDate: z.date()
})

const PrayerRequestUpdateSchema = PrayerRequestCreateSchema.partial()

const PrayerRequestQuerySchema = z.object({
  userId: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  isAnswered: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const ScriptureBookmarkCreateSchema = z.object({
  userId: z.string(),
  reference: z.string().min(1),
  version: z.string().default('ESV'),
  text: z.string().optional(),
  notes: z.string().optional(),
  highlights: z.array(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().default(true)
})

const ScriptureBookmarkUpdateSchema = ScriptureBookmarkCreateSchema.partial()

const ScriptureBookmarkQuerySchema = z.object({
  userId: z.string().optional(),
  reference: z.string().optional(),
  version: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

// Type definitions
type BibleReadingPlanCreate = z.infer<typeof BibleReadingPlanCreateSchema>
type BibleReadingPlanUpdate = z.infer<typeof BibleReadingPlanUpdateSchema>
type BibleReadingPlanQuery = z.infer<typeof BibleReadingPlanQuerySchema>

type BibleReadingCreate = z.infer<typeof BibleReadingCreateSchema>
type BibleReadingUpdate = z.infer<typeof BibleReadingUpdateSchema>
type BibleReadingQuery = z.infer<typeof BibleReadingQuerySchema>

type StudySessionCreate = z.infer<typeof StudySessionCreateSchema>
type StudySessionUpdate = z.infer<typeof StudySessionUpdateSchema>
type StudySessionQuery = z.infer<typeof StudySessionQuerySchema>

type PrayerRequestCreate = z.infer<typeof PrayerRequestCreateSchema>
type PrayerRequestUpdate = z.infer<typeof PrayerRequestUpdateSchema>
type PrayerRequestQuery = z.infer<typeof PrayerRequestQuerySchema>

type ScriptureBookmarkCreate = z.infer<typeof ScriptureBookmarkCreateSchema>
type ScriptureBookmarkUpdate = z.infer<typeof ScriptureBookmarkUpdateSchema>
type ScriptureBookmarkQuery = z.infer<typeof ScriptureBookmarkQuerySchema>

/**
 * Bible Reading Plan Repository
 */
export class BibleReadingPlanRepository extends BaseRepository<
  BibleReadingPlan,
  BibleReadingPlanCreate,
  BibleReadingPlanUpdate,
  BibleReadingPlanQuery
> {
  protected model = 'bibleReadingPlan'
  protected createSchema = BibleReadingPlanCreateSchema
  protected updateSchema = BibleReadingPlanUpdateSchema
  protected querySchema = BibleReadingPlanQuerySchema

  protected buildWhereClause(query: BibleReadingPlanQuery): any {
    const where: any = {}
    
    if (query.userId) where.userId = query.userId
    if (query.isActive !== undefined) where.isActive = query.isActive
    if (query.planType) where.planType = query.planType

    return where
  }

  protected buildOrderByClause(query: BibleReadingPlanQuery): any {
    return { createdAt: 'desc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        readings: {
          take: 5,
          orderBy: { assignedDate: 'asc' }
        },
        user: {
          select: { id: true, name: true }
        }
      }
    }
  }

  /**
   * Get user's active reading plans
   */
  async getUserActivePlans(userId: string): Promise<BibleReadingPlan[]> {
    return this.findMany({ userId, isActive: true })
  }

  /**
   * Get reading plan with full readings
   */
  async getWithReadings(id: string, userId: string): Promise<BibleReadingPlan | null> {
    const plan = await prisma.bibleReadingPlan.findFirst({
      where: { id, userId },
      include: {
        readings: {
          orderBy: { assignedDate: 'asc' }
        }
      }
    })

    return plan
  }

  /**
   * Create reading plan from preset
   */
  async createFromPreset(userId: string, presetId: string, startDate: Date): Promise<BibleReadingPlan> {
    return this.transaction(async (context) => {
      // Get the preset
      const preset = await prisma.bibleReadingPlanPreset.findUnique({
        where: { id: presetId }
      })

      if (!preset) {
        throw new Error(`Preset reading plan ${presetId} not found`)
      }

      // Create the plan
      const plan = await this.create({
        userId,
        name: preset.name,
        description: preset.description,
        planType: 'preset',
        presetId,
        startDate,
        endDate: new Date(startDate.getTime() + (preset.durationDays * 24 * 60 * 60 * 1000)),
        isActive: true
      }, context)

      // Create daily readings based on preset data
      const planData = preset.planData as any
      const readings: BibleReadingCreate[] = planData.readings.map((reading: any, index: number) => ({
        planId: plan.id,
        userId,
        assignedDate: new Date(startDate.getTime() + (index * 24 * 60 * 60 * 1000)),
        passages: reading.passages,
        isCompleted: false
      }))

      // Bulk create readings
      await this.bibleReadingRepository.createMany(readings, context)

      return plan
    })
  }

  private bibleReadingRepository = new BibleReadingRepository()
}

/**
 * Bible Reading Repository
 */
export class BibleReadingRepository extends BaseRepository<
  BibleReading,
  BibleReadingCreate,
  BibleReadingUpdate,
  BibleReadingQuery
> {
  protected model = 'bibleReading'
  protected createSchema = BibleReadingCreateSchema
  protected updateSchema = BibleReadingUpdateSchema
  protected querySchema = BibleReadingQuerySchema

  protected buildWhereClause(query: BibleReadingQuery): any {
    const where: any = {}
    
    if (query.userId) where.userId = query.userId
    if (query.planId) where.planId = query.planId
    if (query.assignedDate) where.assignedDate = query.assignedDate
    if (query.isCompleted !== undefined) where.isCompleted = query.isCompleted

    return where
  }

  protected buildOrderByClause(query: BibleReadingQuery): any {
    return { assignedDate: 'desc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        plan: {
          select: { id: true, name: true }
        }
      }
    }
  }

  /**
   * Get today's readings for user
   */
  async getTodaysReadings(userId: string): Promise<BibleReading[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return this.findMany({ userId, assignedDate: today })
  }

  /**
   * Mark reading as completed
   */
  async completeReading(id: string, userId: string, readingTimeMinutes?: number, notes?: string): Promise<BibleReading> {
    return this.update(id, {
      isCompleted: true,
      completedAt: new Date(),
      readingTimeMinutes,
      notes
    })
  }

  /**
   * Get reading streak for user
   */
  async getReadingStreak(userId: string): Promise<number> {
    const readings = await prisma.bibleReading.findMany({
      where: {
        userId,
        isCompleted: true
      },
      orderBy: { assignedDate: 'desc' },
      take: 365 // Check up to a year
    })

    if (readings.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (const reading of readings) {
      const readingDate = new Date(reading.assignedDate)
      readingDate.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((today.getTime() - readingDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === streak) {
        streak++
      } else {
        break
      }
    }

    return streak
  }
}

/**
 * Study Session Repository
 */
export class StudySessionRepository extends BaseRepository<
  StudySession,
  StudySessionCreate,
  StudySessionUpdate,
  StudySessionQuery
> {
  protected model = 'studySession'
  protected createSchema = StudySessionCreateSchema
  protected updateSchema = StudySessionUpdateSchema
  protected querySchema = StudySessionQuerySchema

  protected buildWhereClause(query: StudySessionQuery): any {
    const where: any = {}
    
    if (query.userId) where.userId = query.userId
    if (query.goalId) where.goalId = query.goalId
    if (query.studyDate) where.studyDate = query.studyDate
    if (query.tags?.length) {
      where.tags = {
        hasEvery: query.tags
      }
    }

    return where
  }

  protected buildOrderByClause(query: StudySessionQuery): any {
    return { studyDate: 'desc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        goal: {
          select: { id: true, title: true }
        }
      }
    }
  }

  /**
   * Get recent study sessions
   */
  async getRecentSessions(userId: string, limit: number = 10): Promise<StudySession[]> {
    return this.findMany({ userId, limit })
  }

  /**
   * Get study sessions by tag
   */
  async getByTags(userId: string, tags: string[]): Promise<StudySession[]> {
    return this.findMany({ userId, tags })
  }
}

/**
 * Prayer Request Repository
 */
export class PrayerRequestRepository extends BaseRepository<
  PrayerRequest,
  PrayerRequestCreate,
  PrayerRequestUpdate,
  PrayerRequestQuery
> {
  protected model = 'prayerRequest'
  protected createSchema = PrayerRequestCreateSchema
  protected updateSchema = PrayerRequestUpdateSchema
  protected querySchema = PrayerRequestQuerySchema

  protected buildWhereClause(query: PrayerRequestQuery): any {
    const where: any = {}
    
    if (query.userId) where.userId = query.userId
    if (query.category) where.category = query.category
    if (query.priority) where.priority = query.priority
    if (query.isAnswered !== undefined) where.isAnswered = query.isAnswered
    if (query.isPrivate !== undefined) where.isPrivate = query.isPrivate

    return where
  }

  protected buildOrderByClause(query: PrayerRequestQuery): any {
    return { requestDate: 'desc' }
  }

  /**
   * Mark prayer as answered
   */
  async markAsAnswered(id: string, userId: string, answerDescription?: string): Promise<PrayerRequest> {
    return this.update(id, {
      isAnswered: true,
      answeredAt: new Date(),
      answerDescription
    })
  }

  /**
   * Get active prayer requests
   */
  async getActiveRequests(userId: string): Promise<PrayerRequest[]> {
    return this.findMany({ userId, isAnswered: false })
  }

  /**
   * Get prayer requests by category
   */
  async getByCategory(userId: string, category: string): Promise<PrayerRequest[]> {
    return this.findMany({ userId, category })
  }
}

/**
 * Scripture Bookmark Repository
 */
export class ScriptureBookmarkRepository extends BaseRepository<
  ScriptureBookmark,
  ScriptureBookmarkCreate,
  ScriptureBookmarkUpdate,
  ScriptureBookmarkQuery
> {
  protected model = 'scriptureBookmark'
  protected createSchema = ScriptureBookmarkCreateSchema
  protected updateSchema = ScriptureBookmarkUpdateSchema
  protected querySchema = ScriptureBookmarkQuerySchema

  protected buildWhereClause(query: ScriptureBookmarkQuery): any {
    const where: any = {}
    
    if (query.userId) where.userId = query.userId
    if (query.reference) where.reference = { contains: query.reference }
    if (query.version) where.version = query.version
    if (query.isPrivate !== undefined) where.isPrivate = query.isPrivate
    if (query.tags?.length) {
      where.tags = {
        hasEvery: query.tags
      }
    }

    return where
  }

  protected buildOrderByClause(query: ScriptureBookmarkQuery): any {
    return { createdAt: 'desc' }
  }

  /**
   * Search bookmarks by reference
   */
  async searchByReference(userId: string, searchTerm: string): Promise<ScriptureBookmark[]> {
    return this.findMany({ userId, reference: searchTerm })
  }

  /**
   * Get bookmarks by tags
   */
  async getByTags(userId: string, tags: string[]): Promise<ScriptureBookmark[]> {
    return this.findMany({ userId, tags })
  }

  /**
   * Check if bookmark exists for reference
   */
  async existsForReference(userId: string, reference: string, version: string = 'ESV'): Promise<boolean> {
    const bookmark = await this.findFirst({ userId, reference, version })
    return bookmark !== null
  }
}

/**
 * Bible Dashboard Repository
 * Aggregates data for the Bible study dashboard
 */
export class BibleDashboardRepository {
  private readingPlanRepo = new BibleReadingPlanRepository()
  private readingRepo = new BibleReadingRepository()
  private studySessionRepo = new StudySessionRepository()
  private prayerRequestRepo = new PrayerRequestRepository()
  private bookmarkRepo = new ScriptureBookmarkRepository()

  /**
   * Get comprehensive dashboard data for user
   */
  async getDashboardData(userId: string) {
    const [
      activePlans,
      todaysReadings,
      recentStudySessions,
      activePrayerRequests,
      recentBookmarks,
      readingStreak
    ] = await Promise.all([
      this.readingPlanRepo.getUserActivePlans(userId),
      this.readingRepo.getTodaysReadings(userId),
      this.studySessionRepo.getRecentSessions(userId, 5),
      this.prayerRequestRepo.getActiveRequests(userId),
      this.bookmarkRepo.findMany({ userId, limit: 5 }),
      this.readingRepo.getReadingStreak(userId)
    ])

    return {
      activePlans,
      todaysReadings,
      recentStudySessions,
      activePrayerRequests,
      recentBookmarks,
      readingStreak,
      stats: {
        totalPlans: activePlans.length,
        completedReadingsThisWeek: await this.getWeeklyReadingCount(userId),
        studySessionsThisMonth: await this.getMonthlyStudyCount(userId),
        answeredPrayers: await this.getAnsweredPrayerCount(userId)
      }
    }
  }

  private async getWeeklyReadingCount(userId: string): Promise<number> {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    return this.readingRepo.count({
      userId,
      isCompleted: true
    })
  }

  private async getMonthlyStudyCount(userId: string): Promise<number> {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    
    return this.studySessionRepo.count({ userId })
  }

  private async getAnsweredPrayerCount(userId: string): Promise<number> {
    return this.prayerRequestRepo.count({
      userId,
      isAnswered: true
    })
  }
}

// Export repository instances
export const bibleReadingPlanRepository = new BibleReadingPlanRepository()
export const bibleReadingRepository = new BibleReadingRepository()
export const studySessionRepository = new StudySessionRepository()
export const prayerRequestRepository = new PrayerRequestRepository()
export const scriptureBookmarkRepository = new ScriptureBookmarkRepository()
export const bibleDashboardRepository = new BibleDashboardRepository()