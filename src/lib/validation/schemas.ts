/**
 * Data Validation Schemas
 * 
 * Comprehensive Zod schemas for all database models with input validation,
 * transformation, and type safety.
 */

import { z } from 'zod'

// Common validation helpers
const cuid = z.string().cuid('Invalid CUID format')
const email = z.string().email('Invalid email format')
const positiveInt = z.number().int().positive('Must be a positive integer')
const nonNegativeInt = z.number().int().min(0, 'Cannot be negative')
const positiveFloat = z.number().positive('Must be a positive number')
const nonNegativeFloat = z.number().min(0, 'Cannot be negative')

// Date validation
const futureDate = z.date().min(new Date(), 'Date must be in the future')
const pastOrPresentDate = z.date().max(new Date(), 'Date cannot be in the future')

/**
 * User Schemas
 */
export const UserCreateSchema = z.object({
  email: email,
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  preferences: z.record(z.unknown()).optional(),
})

export const UserUpdateSchema = z.object({
  email: email.optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number')
    .optional(),
  emailVerified: z.boolean().optional(),
  lastLoginAt: z.date().optional(),
  loginAttempts: nonNegativeInt.optional(),
  lockedUntil: z.date().optional(),
  totalXp: nonNegativeInt.optional(),
  currentLevel: positiveInt.optional(),
  streakCount: nonNegativeInt.optional(),
  lastActivity: z.date().optional(),
  preferences: z.record(z.unknown()).optional(),
})

export const UserQuerySchema = z.object({
  id: cuid.optional(),
  email: email.optional(),
  emailVerified: z.boolean().optional(),
  minLevel: positiveInt.optional(),
  maxLevel: positiveInt.optional(),
  minXp: nonNegativeInt.optional(),
  hasStreak: z.boolean().optional(),
  lastActivityAfter: z.date().optional(),
  lastActivityBefore: z.date().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: nonNegativeInt.default(0),
  sortBy: z.enum(['createdAt', 'updatedAt', 'totalXp', 'currentLevel', 'streakCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * Module Schemas
 */
export const ModuleConfigSchema = z.record(z.unknown())

export const ModuleCreateSchema = z.object({
  id: z.string().min(1, 'Module ID is required').max(50, 'Module ID too long')
    .regex(/^[a-z][a-z0-9_]*$/, 'Module ID must start with letter and contain only lowercase letters, numbers, and underscores'),
  name: z.string().min(1, 'Module name is required').max(100, 'Module name too long'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semantic versioning format (x.y.z)'),
  isEnabled: z.boolean().default(true),
  isInstalled: z.boolean().default(false),
  config: ModuleConfigSchema.optional(),
})

export const ModuleUpdateSchema = z.object({
  name: z.string().min(1, 'Module name is required').max(100, 'Module name too long').optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semantic versioning format (x.y.z)').optional(),
  isEnabled: z.boolean().optional(),
  isInstalled: z.boolean().optional(),
  config: ModuleConfigSchema.optional(),
})

export const ModuleQuerySchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  isEnabled: z.boolean().optional(),
  isInstalled: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: nonNegativeInt.default(0),
  sortBy: z.enum(['id', 'name', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

/**
 * Goal Schemas
 */
export const DifficultyEnum = z.enum(['easy', 'medium', 'hard', 'expert'])
export const PriorityEnum = z.enum(['low', 'medium', 'high', 'urgent'])

export const GoalCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  targetDate: futureDate.optional(),
  difficulty: DifficultyEnum.default('medium'),
  priority: PriorityEnum.default('medium'),
  userId: cuid,
  moduleId: z.string().min(1, 'Module ID is required'),
  moduleData: z.record(z.unknown()).optional(),
  parentGoalId: cuid.optional(),
})

export const GoalUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  isCompleted: z.boolean().optional(),
  targetDate: z.date().optional(),
  difficulty: DifficultyEnum.optional(),
  priority: PriorityEnum.optional(),
  moduleData: z.record(z.unknown()).optional(),
  parentGoalId: cuid.optional(),
})

export const GoalQuerySchema = z.object({
  id: cuid.optional(),
  userId: cuid.optional(),
  moduleId: z.string().optional(),
  parentGoalId: cuid.optional(),
  isCompleted: z.boolean().optional(),
  difficulty: DifficultyEnum.optional(),
  priority: PriorityEnum.optional(),
  targetDateAfter: z.date().optional(),
  targetDateBefore: z.date().optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  search: z.string().max(100).optional(),
  includeSubGoals: z.boolean().default(false),
  limit: z.number().int().min(1).max(100).default(20),
  offset: nonNegativeInt.default(0),
  sortBy: z.enum(['createdAt', 'updatedAt', 'targetDate', 'title', 'priority', 'difficulty']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * Progress Schemas
 */
export const ProgressCreateSchema = z.object({
  value: nonNegativeFloat,
  maxValue: positiveFloat,
  xpEarned: nonNegativeInt.default(0),
  notes: z.string().max(500, 'Notes too long').optional(),
  recordedAt: z.date().default(() => new Date()),
  userId: cuid,
  goalId: cuid,
})

export const ProgressUpdateSchema = z.object({
  value: nonNegativeFloat.optional(),
  maxValue: positiveFloat.optional(),
  xpEarned: nonNegativeInt.optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
  recordedAt: z.date().optional(),
})

export const ProgressQuerySchema = z.object({
  id: cuid.optional(),
  userId: cuid.optional(),
  goalId: cuid.optional(),
  recordedAfter: z.date().optional(),
  recordedBefore: z.date().optional(),
  minValue: nonNegativeFloat.optional(),
  maxValue: positiveFloat.optional(),
  minXp: nonNegativeInt.optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: nonNegativeInt.default(0),
  sortBy: z.enum(['recordedAt', 'createdAt', 'value', 'xpEarned']).default('recordedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * Achievement Schemas
 */
export const TierEnum = z.enum(['bronze', 'silver', 'gold', 'platinum'])

export const AchievementConditionsSchema = z.object({
  type: z.enum(['goal_created', 'goals_completed', 'streak', 'module_goals_completed', 'xp_earned', 'custom']),
  count: positiveInt.optional(),
  days: positiveInt.optional(),
  module: z.string().optional(),
  xpAmount: positiveInt.optional(),
  customCondition: z.string().optional(),
}).refine(
  (data) => {
    // Validate required fields based on type
    if (data.type === 'goal_created' || data.type === 'goals_completed') {
      return data.count !== undefined
    }
    if (data.type === 'streak') {
      return data.days !== undefined
    }
    if (data.type === 'module_goals_completed') {
      return data.module !== undefined && data.count !== undefined
    }
    if (data.type === 'xp_earned') {
      return data.xpAmount !== undefined
    }
    if (data.type === 'custom') {
      return data.customCondition !== undefined
    }
    return true
  },
  {
    message: 'Missing required condition fields for achievement type'
  }
)

export const AchievementCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  icon: z.string().min(1, 'Icon is required').max(50, 'Icon name too long'),
  tier: TierEnum,
  moduleId: z.string().optional(),
  conditions: AchievementConditionsSchema,
  xpReward: nonNegativeInt.default(0),
})

export const AchievementUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long').optional(),
  icon: z.string().min(1, 'Icon is required').max(50, 'Icon name too long').optional(),
  tier: TierEnum.optional(),
  moduleId: z.string().optional(),
  conditions: AchievementConditionsSchema.optional(),
  xpReward: nonNegativeInt.optional(),
})

export const AchievementQuerySchema = z.object({
  id: cuid.optional(),
  moduleId: z.string().optional(),
  tier: TierEnum.optional(),
  minXpReward: nonNegativeInt.optional(),
  maxXpReward: nonNegativeInt.optional(),
  search: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: nonNegativeInt.default(0),
  sortBy: z.enum(['createdAt', 'name', 'tier', 'xpReward']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * UserAchievement Schemas
 */
export const UserAchievementCreateSchema = z.object({
  userId: cuid,
  achievementId: cuid,
  progress: z.number().min(0).max(1).default(0),
  isCompleted: z.boolean().default(false),
})

export const UserAchievementUpdateSchema = z.object({
  progress: z.number().min(0).max(1).optional(),
  isCompleted: z.boolean().optional(),
})

export const UserAchievementQuerySchema = z.object({
  userId: cuid.optional(),
  achievementId: cuid.optional(),
  isCompleted: z.boolean().optional(),
  minProgress: z.number().min(0).max(1).optional(),
  unlockedAfter: z.date().optional(),
  unlockedBefore: z.date().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: nonNegativeInt.default(0),
  sortBy: z.enum(['unlockedAt', 'progress']).default('unlockedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * Pagination Schema
 */
export const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: nonNegativeInt.default(0),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * Common validation utilities
 */

/**
 * Validate and transform input data
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error)
      throw new Error(`Validation failed: ${formattedError}`)
    }
    throw error
  }
}

/**
 * Safely validate input without throwing
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.safeParse(data)
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      return { success: false, error: formatZodError(result.error) }
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown validation error' }
  }
}

/**
 * Format Zod error for better readability
 */
export function formatZodError(error: z.ZodError): string {
  return error.errors
    .map(err => {
      const path = err.path.length > 0 ? `${err.path.join('.')}: ` : ''
      return `${path}${err.message}`
    })
    .join('; ')
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: unknown) {
  return validateInput(PaginationSchema, params)
}

/**
 * Create type-safe query builder
 */
export function createQueryBuilder<T extends z.ZodSchema>(schema: T) {
  return (params: unknown) => validateInput(schema, params)
}

/**
 * Middleware-compatible validation function
 */
export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => validateInput(schema, data)
}

// Export type inference helpers
export type UserCreateInput = z.infer<typeof UserCreateSchema>
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>
export type UserQuery = z.infer<typeof UserQuerySchema>

export type ModuleCreateInput = z.infer<typeof ModuleCreateSchema>
export type ModuleUpdateInput = z.infer<typeof ModuleUpdateSchema>
export type ModuleQuery = z.infer<typeof ModuleQuerySchema>

export type GoalCreateInput = z.infer<typeof GoalCreateSchema>
export type GoalUpdateInput = z.infer<typeof GoalUpdateSchema>
export type GoalQuery = z.infer<typeof GoalQuerySchema>

export type ProgressCreateInput = z.infer<typeof ProgressCreateSchema>
export type ProgressUpdateInput = z.infer<typeof ProgressUpdateSchema>
export type ProgressQuery = z.infer<typeof ProgressQuerySchema>

export type AchievementCreateInput = z.infer<typeof AchievementCreateSchema>
export type AchievementUpdateInput = z.infer<typeof AchievementUpdateSchema>
export type AchievementQuery = z.infer<typeof AchievementQuerySchema>

export type UserAchievementCreateInput = z.infer<typeof UserAchievementCreateSchema>
export type UserAchievementUpdateInput = z.infer<typeof UserAchievementUpdateSchema>
export type UserAchievementQuery = z.infer<typeof UserAchievementQuerySchema>

export type PaginationParams = z.infer<typeof PaginationSchema>