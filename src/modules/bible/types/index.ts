/**
 * Bible Module Type Definitions
 */

import type {
  BibleReadingPlan,
  BibleReading,
  StudySession,
  PrayerRequest,
  ScriptureBookmark,
  BibleReadingPlanPreset
} from '@prisma/client'

// Extended types with relations
export interface BibleReadingPlanWithReadings extends BibleReadingPlan {
  readings: BibleReading[]
  user: {
    id: string
    name: string | null
  }
}

export interface BibleReadingWithPlan extends BibleReading {
  plan: {
    id: string
    name: string
  }
}

export interface StudySessionWithGoal extends StudySession {
  goal?: {
    id: string
    title: string
  }
}

// Dashboard data types
export interface BibleDashboardData {
  activePlans: BibleReadingPlanWithReadings[]
  todaysReadings: BibleReadingWithPlan[]
  recentStudySessions: StudySessionWithGoal[]
  activePrayerRequests: PrayerRequest[]
  recentBookmarks: ScriptureBookmark[]
  readingStreak: number
  stats: {
    totalPlans: number
    completedReadingsThisWeek: number
    studySessionsThisMonth: number
    answeredPrayers: number
  }
}

// Reading plan creation types
export interface CreateReadingPlanInput {
  name: string
  description?: string
  planType: 'preset' | 'custom'
  presetId?: string
  startDate: Date
  endDate?: Date
  customReadings?: {
    date: Date
    passages: string[]
  }[]
}

export interface ReadingPlanPreset {
  id: string
  name: string
  description: string
  durationDays: number
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  isPopular: boolean
}

// Study session types
export interface CreateStudySessionInput {
  title: string
  description?: string
  passages?: string[]
  durationMinutes?: number
  studyDate: Date
  notes?: string
  tags?: string[]
  goalId?: string
}

export interface StudySessionStats {
  totalSessions: number
  totalMinutes: number
  averageSessionLength: number
  mostStudiedBooks: { book: string; count: number }[]
  monthlyProgress: { month: string; sessions: number }[]
}

// Prayer request types
export interface CreatePrayerRequestInput {
  title: string
  description?: string
  category: 'personal' | 'family' | 'ministry' | 'world'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isPrivate: boolean
  requestDate: Date
}

export interface PrayerRequestStats {
  totalRequests: number
  answeredRequests: number
  answerRate: number
  categoryBreakdown: { category: string; count: number }[]
  averageAnswerTime: number // in days
}

// Scripture bookmark types
export interface CreateScriptureBookmarkInput {
  reference: string
  version?: string
  text?: string
  notes?: string
  highlights?: HighlightObject[]
  tags?: string[]
  isPrivate: boolean
}

export interface HighlightObject {
  startOffset: number
  endOffset: number
  color: string
  note?: string
}

export interface BookmarkStats {
  totalBookmarks: number
  favoriteBooks: { book: string; count: number }[]
  tagCloud: { tag: string; count: number }[]
  recentActivity: { date: string; count: number }[]
}

// Reading progress types
export interface ReadingProgress {
  planId: string
  planName: string
  startDate: Date
  endDate?: Date
  totalReadings: number
  completedReadings: number
  progressPercentage: number
  currentStreak: number
  longestStreak: number
  averageReadingTime: number
  estimatedCompletionDate?: Date
}

export interface ReadingStreakData {
  currentStreak: number
  longestStreak: number
  streakHistory: { date: string; completed: boolean }[]
  streakMilestones: { days: number; achieved: boolean; date?: Date }[]
}

// Bible study statistics
export interface BibleStudyStats {
  readingStats: {
    totalReadings: number
    completedReadings: number
    readingStreak: number
    favoriteBooks: { book: string; count: number }[]
    readingTimeByMonth: { month: string; minutes: number }[]
  }
  studyStats: StudySessionStats
  prayerStats: PrayerRequestStats
  bookmarkStats: BookmarkStats
  overallStats: {
    totalDaysActive: number
    averageDailyTime: number
    xpEarned: number
    achievementsUnlocked: number
  }
}

// Component prop types
export interface BibleModuleConfig {
  preferredVersion: string
  enableReadingReminders: boolean
  reminderTime: string
  autoCreateGoals: boolean
  defaultStudyDuration: number
  enablePrayerJournal: boolean
  enableBookmarks: boolean
  shareBookmarks: boolean
}

// API response types
export interface BibleAPIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedBibleResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Form types
export interface ReadingPlanFormData {
  name: string
  description?: string
  planType: 'preset' | 'custom'
  presetId?: string
  startDate: Date
  customSchedule?: {
    frequency: 'daily' | 'weekly' | 'custom'
    daysOfWeek?: string[]
    passages?: string[]
  }
}

export interface StudySessionFormData {
  title: string
  description?: string
  passages: string[]
  studyDate: Date
  durationMinutes?: number
  notes?: string
  tags: string[]
  goalId?: string
}

export interface PrayerRequestFormData {
  title: string
  description?: string
  category: 'personal' | 'family' | 'ministry' | 'world'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  isPrivate: boolean
  requestDate: Date
}

export interface BookmarkFormData {
  reference: string
  version: string
  notes?: string
  tags: string[]
  isPrivate: boolean
}

// Validation types
export interface ValidationError {
  field: string
  message: string
}

export interface FormValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Bible reading plan templates
export interface ReadingPlanTemplate {
  id: string
  name: string
  description: string
  category: 'chronological' | 'canonical' | 'topical' | 'devotional'
  difficulty: 'easy' | 'medium' | 'hard'
  durationDays: number
  readingsPerDay: number
  estimatedTimePerDay: number // in minutes
  tags: string[]
  isPopular: boolean
  schedule: {
    day: number
    passages: string[]
    theme?: string
  }[]
}

// Common reading plan templates
export const READING_PLAN_TEMPLATES: ReadingPlanTemplate[] = [
  {
    id: 'one-year-chronological',
    name: 'One Year Chronological',
    description: 'Read the Bible in historical order over one year',
    category: 'chronological',
    difficulty: 'medium',
    durationDays: 365,
    readingsPerDay: 3,
    estimatedTimePerDay: 20,
    tags: ['chronological', 'annual', 'comprehensive'],
    isPopular: true,
    schedule: [] // Would be populated with actual schedule
  },
  {
    id: 'new-testament-30-days',
    name: 'New Testament in 30 Days',
    description: 'Read through the entire New Testament in one month',
    category: 'canonical',
    difficulty: 'hard',
    durationDays: 30,
    readingsPerDay: 8,
    estimatedTimePerDay: 45,
    tags: ['new-testament', 'intensive', 'monthly'],
    isPopular: true,
    schedule: []
  },
  {
    id: 'psalms-and-proverbs',
    name: 'Psalms and Proverbs',
    description: 'Wisdom literature for daily encouragement',
    category: 'devotional',
    difficulty: 'easy',
    durationDays: 150,
    readingsPerDay: 2,
    estimatedTimePerDay: 10,
    tags: ['wisdom', 'devotional', 'daily'],
    isPopular: true,
    schedule: []
  }
]

// Export all types
export type {
  BibleReadingPlan,
  BibleReading,
  StudySession,
  PrayerRequest,
  ScriptureBookmark,
  BibleReadingPlanPreset
}