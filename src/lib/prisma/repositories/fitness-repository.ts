/**
 * Fitness Module Repository
 * 
 * Repository for fitness workout management operations including:
 * - Workout plan CRUD operations
 * - Workout and exercise tracking
 * - Personal records management
 * - Exercise template management
 * - Dashboard data aggregation
 */

import { z } from 'zod'
import { BaseRepository, TransactionContext } from '../base-repository'
import { prisma } from '../client'
import type {
  WorkoutPlan,
  Workout,
  ExerciseTemplate,
  WorkoutExercise,
  WorkoutSet,
  PersonalRecord,
  Food,
  FoodLog,
  NutritionGoal,
  WaterIntake,
  Meal,
  MealFood
} from '@prisma/client'

// Validation schemas
const WorkoutPlanCreateSchema = z.object({
  userId: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  isTemplate: z.boolean().default(false),
  isActive: z.boolean().default(true),
  startDate: z.date().optional(),
  endDate: z.date().optional()
})

const WorkoutPlanUpdateSchema = WorkoutPlanCreateSchema.partial()

const WorkoutPlanQuerySchema = z.object({
  userId: z.string().optional(),
  isTemplate: z.boolean().optional(),
  isActive: z.boolean().optional(),
  status: z.string().nullish().transform(val => val === null ? undefined : val),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const WorkoutCreateSchema = z.object({
  planId: z.string().optional(),
  userId: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  scheduledDate: z.date().optional(),
  completedAt: z.date().optional(),
  isTemplate: z.boolean().default(false),
  workoutType: z.enum(['cardio', 'strength', 'flexibility', 'mixed']),
  estimatedDuration: z.number().optional(),
  actualDuration: z.number().optional(),
  notes: z.string().optional(),
  xpAwarded: z.number().default(0)
})

const WorkoutUpdateSchema = WorkoutCreateSchema.partial()

const WorkoutQuerySchema = z.object({
  userId: z.string().optional(),
  planId: z.string().nullish().transform(val => val === null ? undefined : val),
  workoutType: z.string().nullish().transform(val => val === null ? undefined : val),
  date: z.date().optional(),
  status: z.string().nullish().transform(val => val === null ? undefined : val),
  isTemplate: z.boolean().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const ExerciseTemplateCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'flexibility', 'full-body']),
  muscleGroups: z.array(z.string()),
  equipmentNeeded: z.string().optional(),
  instructions: z.array(z.string()).optional(),
  videoUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  isCustom: z.boolean().default(false),
  userId: z.string().optional(),
  isActive: z.boolean().default(true),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional()
})

const ExerciseTemplateUpdateSchema = ExerciseTemplateCreateSchema.partial()

const ExerciseTemplateQuerySchema = z.object({
  userId: z.string().optional(),
  category: z.string().nullish().transform(val => val === null ? undefined : val),
  isCustom: z.boolean().optional(),
  isActive: z.boolean().optional(),
  search: z.string().nullish().transform(val => val === null ? undefined : val),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const WorkoutExerciseCreateSchema = z.object({
  workoutId: z.string(),
  exerciseId: z.string(),
  orderIndex: z.number().min(0),
  targetSets: z.number().min(1).optional(),
  targetReps: z.number().min(1).optional(),
  targetWeight: z.number().min(0).optional(),
  targetDuration: z.number().min(1).optional(),
  targetDistance: z.number().min(0).optional(),
  restBetweenSets: z.number().min(0).optional(),
  notes: z.string().optional(),
  completedAt: z.date().optional()
})

const WorkoutExerciseUpdateSchema = WorkoutExerciseCreateSchema.partial()

const WorkoutExerciseQuerySchema = z.object({
  workoutId: z.string().optional(),
  exerciseId: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const WorkoutSetCreateSchema = z.object({
  workoutExerciseId: z.string(),
  setNumber: z.number().min(1),
  reps: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
  distance: z.number().min(0).optional(),
  restAfter: z.number().min(0).optional(),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  completedAt: z.date().optional()
})

const WorkoutSetUpdateSchema = WorkoutSetCreateSchema.partial()

const WorkoutSetQuerySchema = z.object({
  workoutExerciseId: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const PersonalRecordCreateSchema = z.object({
  userId: z.string(),
  exerciseId: z.string(),
  recordType: z.enum(['1rm', '5rm', 'volume', 'duration', 'distance']),
  value: z.number(),
  unit: z.enum(['lbs', 'kg', 'seconds', 'miles', 'km']),
  previousValue: z.number().optional(),
  achievedAt: z.date(),
  workoutId: z.string().optional(),
  notes: z.string().optional()
})

const PersonalRecordUpdateSchema = PersonalRecordCreateSchema.partial()

const PersonalRecordQuerySchema = z.object({
  userId: z.string().optional(),
  exerciseId: z.string().nullish().transform(val => val === null ? undefined : val),
  recordType: z.string().nullish().transform(val => val === null ? undefined : val),
  limit: z.number().optional(),
  offset: z.number().optional()
})

// Type definitions
type WorkoutPlanCreate = z.infer<typeof WorkoutPlanCreateSchema>
type WorkoutPlanUpdate = z.infer<typeof WorkoutPlanUpdateSchema>
type WorkoutPlanQuery = z.infer<typeof WorkoutPlanQuerySchema>

type WorkoutCreate = z.infer<typeof WorkoutCreateSchema>
type WorkoutUpdate = z.infer<typeof WorkoutUpdateSchema>
type WorkoutQuery = z.infer<typeof WorkoutQuerySchema>

type ExerciseTemplateCreate = z.infer<typeof ExerciseTemplateCreateSchema>
type ExerciseTemplateUpdate = z.infer<typeof ExerciseTemplateUpdateSchema>
type ExerciseTemplateQuery = z.infer<typeof ExerciseTemplateQuerySchema>

type WorkoutExerciseCreate = z.infer<typeof WorkoutExerciseCreateSchema>
type WorkoutExerciseUpdate = z.infer<typeof WorkoutExerciseUpdateSchema>
type WorkoutExerciseQuery = z.infer<typeof WorkoutExerciseQuerySchema>

type WorkoutSetCreate = z.infer<typeof WorkoutSetCreateSchema>
type WorkoutSetUpdate = z.infer<typeof WorkoutSetUpdateSchema>
type WorkoutSetQuery = z.infer<typeof WorkoutSetQuerySchema>

type PersonalRecordCreate = z.infer<typeof PersonalRecordCreateSchema>
type PersonalRecordUpdate = z.infer<typeof PersonalRecordUpdateSchema>
type PersonalRecordQuery = z.infer<typeof PersonalRecordQuerySchema>

/**
 * Workout Plan Repository
 */
export class WorkoutPlanRepository extends BaseRepository<
  WorkoutPlan,
  WorkoutPlanCreate,
  WorkoutPlanUpdate,
  WorkoutPlanQuery
> {
  protected model = 'workoutPlan'
  protected createSchema = WorkoutPlanCreateSchema
  protected updateSchema = WorkoutPlanUpdateSchema
  protected querySchema = WorkoutPlanQuerySchema

  protected buildWhereClause(query: WorkoutPlanQuery): any {
    const where: any = {}
    
    if (query.userId) where.userId = query.userId
    if (query.isTemplate !== undefined) where.isTemplate = query.isTemplate
    if (query.isActive !== undefined) where.isActive = query.isActive

    return where
  }

  protected buildOrderByClause(query: WorkoutPlanQuery): any {
    return { updatedAt: 'desc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        workouts: {
          select: { 
            id: true, 
            name: true, 
            scheduledDate: true, 
            completedAt: true, 
            workoutType: true 
          }
        },
        _count: {
          select: { workouts: true }
        }
      }
    }
  }

  /**
   * Get user's workout plans with filters
   */
  async getUserWorkoutPlans(userId: string, filters: {
    status?: string
    page?: number
    limit?: number
  } = {}): Promise<WorkoutPlan[]> {
    const { status, page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit
    
    return this.findMany({
      userId,
      limit,
      offset: skip
    })
  }

  /**
   * Update workout plan progress based on completed workouts
   */
  async updateProgress(planId: string): Promise<void> {
    const plan = await prisma.workoutPlan.findUnique({
      where: { id: planId },
      include: { workouts: true }
    })

    if (!plan) return

    const completedWorkouts = plan.workouts.filter(w => w.completedAt).length
    const totalWorkouts = plan.workouts.length

    // Update progress could be stored in a separate field if needed
    // For now, this is just placeholder logic
  }
}

/**
 * Workout Repository
 */
export class WorkoutRepository extends BaseRepository<
  Workout,
  WorkoutCreate,
  WorkoutUpdate,
  WorkoutQuery
> {
  protected model = 'workout'
  protected createSchema = WorkoutCreateSchema
  protected updateSchema = WorkoutUpdateSchema
  protected querySchema = WorkoutQuerySchema

  protected buildWhereClause(query: WorkoutQuery): any {
    const where: any = {}
    
    if (query.userId) where.userId = query.userId
    if (query.planId) where.planId = query.planId
    if (query.workoutType) where.workoutType = query.workoutType
    if (query.isTemplate !== undefined) where.isTemplate = query.isTemplate
    
    if (query.date) {
      const startOfDay = new Date(query.date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(query.date)
      endOfDay.setHours(23, 59, 59, 999)
      
      where.scheduledDate = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    if (query.status) {
      if (query.status === 'completed') {
        where.completedAt = { not: null }
      } else if (query.status === 'pending') {
        where.completedAt = null
      }
    }

    return where
  }

  protected buildOrderByClause(query: WorkoutQuery): any {
    return { scheduledDate: 'desc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        plan: {
          select: { id: true, name: true }
        },
        exercises: {
          include: {
            exercise: {
              select: { id: true, name: true, category: true }
            },
            sets: true
          }
        },
        _count: {
          select: { exercises: true }
        }
      }
    }
  }

  /**
   * Get workout with all exercises and sets
   */
  async getWorkoutWithExercises(workoutId: string): Promise<any> {
    return prisma.workout.findUnique({
      where: { id: workoutId },
      include: this.getIncludeOptions().include
    })
  }

  /**
   * Complete a workout
   */
  async completeWorkout(workoutId: string): Promise<Workout> {
    const now = new Date()
    return this.update(workoutId, {
      completedAt: now,
      actualDuration: await this.calculateActualDuration(workoutId)
    })
  }

  private async calculateActualDuration(workoutId: string): Promise<number | undefined> {
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: {
        exercises: {
          include: { sets: true }
        }
      }
    })

    if (!workout || !workout.exercises.length) return undefined

    // Simple calculation: sum of all set durations plus rest periods
    let totalDuration = 0
    
    for (const exercise of workout.exercises) {
      for (const set of exercise.sets) {
        if (set.duration) totalDuration += set.duration
        if (set.restAfter) totalDuration += set.restAfter
      }
    }

    return Math.round(totalDuration / 60) // Convert to minutes
  }

  /**
   * Copy a single workout to a new date
   */
  async copyWorkout(sourceWorkoutId: string, targetDate: Date, userId: string): Promise<Workout> {
    return this.transaction(async ({ tx }) => {
      // Get the source workout with all exercises and sets
      const sourceWorkout = await tx.workout.findFirst({
        where: { 
          id: sourceWorkoutId,
          userId 
        },
        include: {
          exercises: {
            include: {
              sets: true,
              exercise: true
            },
            orderBy: { orderIndex: 'asc' }
          }
        }
      })

      if (!sourceWorkout) {
        throw new Error('Source workout not found or access denied')
      }

      // Create the new workout
      const newWorkout = await tx.workout.create({
        data: {
          userId,
          planId: sourceWorkout.planId,
          name: `${sourceWorkout.name} (Copy)`,
          description: sourceWorkout.description,
          scheduledDate: targetDate,
          workoutType: sourceWorkout.workoutType,
          estimatedDuration: sourceWorkout.estimatedDuration,
          notes: sourceWorkout.notes
        }
      })

      // Copy all exercises
      for (const sourceExercise of sourceWorkout.exercises) {
        const newWorkoutExercise = await tx.workoutExercise.create({
          data: {
            workoutId: newWorkout.id,
            exerciseId: sourceExercise.exerciseId,
            orderIndex: sourceExercise.orderIndex,
            targetSets: sourceExercise.targetSets,
            targetReps: sourceExercise.targetReps,
            targetWeight: sourceExercise.targetWeight,
            targetDuration: sourceExercise.targetDuration,
            targetDistance: sourceExercise.targetDistance,
            restBetweenSets: sourceExercise.restBetweenSets,
            notes: sourceExercise.notes
          }
        })

        // Copy template sets (target sets only, not actual performance)
        for (const sourceSet of sourceExercise.sets) {
          await tx.workoutSet.create({
            data: {
              workoutExerciseId: newWorkoutExercise.id,
              setNumber: sourceSet.setNumber,
              // Only copy target values, not actual performance
              reps: sourceExercise.targetReps,
              weight: sourceExercise.targetWeight,
              duration: sourceExercise.targetDuration,
              distance: sourceExercise.targetDistance,
              restAfter: sourceExercise.restBetweenSets
            }
          })
        }
      }

      return newWorkout
    })
  }

  /**
   * Copy all workouts from one day to another
   */
  async copyDay(sourceDate: Date, targetDate: Date, userId: string): Promise<Workout[]> {
    return this.transaction(async ({ tx }) => {
      // Get all workouts from the source date
      const sourceWorkouts = await tx.workout.findMany({
        where: {
          userId,
          scheduledDate: {
            gte: new Date(sourceDate.getFullYear(), sourceDate.getMonth(), sourceDate.getDate()),
            lt: new Date(sourceDate.getFullYear(), sourceDate.getMonth(), sourceDate.getDate() + 1)
          }
        },
        include: {
          exercises: {
            include: {
              sets: true,
              exercise: true
            },
            orderBy: { orderIndex: 'asc' }
          }
        }
      })

      if (sourceWorkouts.length === 0) {
        throw new Error('No workouts found for the source date')
      }

      const copiedWorkouts: Workout[] = []

      // Copy each workout to the target date
      for (const sourceWorkout of sourceWorkouts) {
        const newWorkout = await tx.workout.create({
          data: {
            userId,
            planId: sourceWorkout.planId,
            name: sourceWorkout.name,
            description: sourceWorkout.description,
            scheduledDate: new Date(
              targetDate.getFullYear(),
              targetDate.getMonth(),
              targetDate.getDate(),
              sourceWorkout.scheduledDate?.getHours() || 9,
              sourceWorkout.scheduledDate?.getMinutes() || 0
            ),
            workoutType: sourceWorkout.workoutType,
            estimatedDuration: sourceWorkout.estimatedDuration,
            notes: sourceWorkout.notes
          }
        })

        // Copy all exercises for this workout
        for (const sourceExercise of sourceWorkout.exercises) {
          const newWorkoutExercise = await tx.workoutExercise.create({
            data: {
              workoutId: newWorkout.id,
              exerciseId: sourceExercise.exerciseId,
              orderIndex: sourceExercise.orderIndex,
              targetSets: sourceExercise.targetSets,
              targetReps: sourceExercise.targetReps,
              targetWeight: sourceExercise.targetWeight,
              targetDuration: sourceExercise.targetDuration,
              targetDistance: sourceExercise.targetDistance,
              restBetweenSets: sourceExercise.restBetweenSets,
              notes: sourceExercise.notes
            }
          })

          // Copy template sets
          for (const sourceSet of sourceExercise.sets) {
            await tx.workoutSet.create({
              data: {
                workoutExerciseId: newWorkoutExercise.id,
                setNumber: sourceSet.setNumber,
                reps: sourceExercise.targetReps,
                weight: sourceExercise.targetWeight,
                duration: sourceExercise.targetDuration,
                distance: sourceExercise.targetDistance,
                restAfter: sourceExercise.restBetweenSets
              }
            })
          }
        }

        copiedWorkouts.push(newWorkout)
      }

      return copiedWorkouts
    })
  }

  /**
   * Copy all workouts from one week to another
   */
  async copyWeek(sourceWeekStart: Date, targetWeekStart: Date, userId: string): Promise<Workout[]> {
    return this.transaction(async ({ tx }) => {
      const sourceWeekEnd = new Date(sourceWeekStart)
      sourceWeekEnd.setDate(sourceWeekStart.getDate() + 7)

      // Get all workouts from the source week
      const sourceWorkouts = await tx.workout.findMany({
        where: {
          userId,
          scheduledDate: {
            gte: sourceWeekStart,
            lt: sourceWeekEnd
          }
        },
        include: {
          exercises: {
            include: {
              sets: true,
              exercise: true
            },
            orderBy: { orderIndex: 'asc' }
          }
        },
        orderBy: { scheduledDate: 'asc' }
      })

      if (sourceWorkouts.length === 0) {
        throw new Error('No workouts found for the source week')
      }

      const copiedWorkouts: Workout[] = []

      // Copy each workout to the corresponding day in the target week
      for (const sourceWorkout of sourceWorkouts) {
        if (!sourceWorkout.scheduledDate) continue

        // Calculate the day offset from the week start
        const dayOffset = Math.floor(
          (sourceWorkout.scheduledDate.getTime() - sourceWeekStart.getTime()) / (1000 * 60 * 60 * 24)
        )

        const targetDate = new Date(targetWeekStart)
        targetDate.setDate(targetWeekStart.getDate() + dayOffset)
        
        // Preserve the time of day
        targetDate.setHours(
          sourceWorkout.scheduledDate.getHours(),
          sourceWorkout.scheduledDate.getMinutes(),
          sourceWorkout.scheduledDate.getSeconds(),
          sourceWorkout.scheduledDate.getMilliseconds()
        )

        const newWorkout = await tx.workout.create({
          data: {
            userId,
            planId: sourceWorkout.planId,
            name: sourceWorkout.name,
            description: sourceWorkout.description,
            scheduledDate: targetDate,
            workoutType: sourceWorkout.workoutType,
            estimatedDuration: sourceWorkout.estimatedDuration,
            notes: sourceWorkout.notes
          }
        })

        // Copy all exercises for this workout
        for (const sourceExercise of sourceWorkout.exercises) {
          const newWorkoutExercise = await tx.workoutExercise.create({
            data: {
              workoutId: newWorkout.id,
              exerciseId: sourceExercise.exerciseId,
              orderIndex: sourceExercise.orderIndex,
              targetSets: sourceExercise.targetSets,
              targetReps: sourceExercise.targetReps,
              targetWeight: sourceExercise.targetWeight,
              targetDuration: sourceExercise.targetDuration,
              targetDistance: sourceExercise.targetDistance,
              restBetweenSets: sourceExercise.restBetweenSets,
              notes: sourceExercise.notes
            }
          })

          // Copy template sets
          for (const sourceSet of sourceExercise.sets) {
            await tx.workoutSet.create({
              data: {
                workoutExerciseId: newWorkoutExercise.id,
                setNumber: sourceSet.setNumber,
                reps: sourceExercise.targetReps,
                weight: sourceExercise.targetWeight,
                duration: sourceExercise.targetDuration,
                distance: sourceExercise.targetDistance,
                restAfter: sourceExercise.restBetweenSets
              }
            })
          }
        }

        copiedWorkouts.push(newWorkout)
      }

      return copiedWorkouts
    })
  }
}

/**
 * Exercise Template Repository
 */
export class ExerciseTemplateRepository extends BaseRepository<
  ExerciseTemplate,
  ExerciseTemplateCreate,
  ExerciseTemplateUpdate,
  ExerciseTemplateQuery
> {
  protected model = 'exerciseTemplate'
  protected createSchema = ExerciseTemplateCreateSchema
  protected updateSchema = ExerciseTemplateUpdateSchema
  protected querySchema = ExerciseTemplateQuerySchema

  protected buildWhereClause(query: ExerciseTemplateQuery): any {
    const where: any = {}
    
    if (query.userId !== undefined) {
      where.OR = [
        { userId: query.userId }, // User's custom exercises
        { userId: null }          // System exercises
      ]
    }
    if (query.category) where.category = query.category
    if (query.isCustom !== undefined) where.isCustom = query.isCustom
    if (query.isActive !== undefined) where.isActive = query.isActive
    
    if (query.search) {
      where.OR = where.OR || []
      where.OR.push(
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      )
    }

    return where
  }

  protected buildOrderByClause(query: ExerciseTemplateQuery): any {
    return { name: 'asc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        user: {
          select: { id: true, email: true }
        },
        _count: {
          select: { 
            workoutExercises: true,
            personalRecords: true 
          }
        }
      }
    }
  }
}

/**
 * Workout Exercise Repository
 */
export class WorkoutExerciseRepository extends BaseRepository<
  WorkoutExercise,
  WorkoutExerciseCreate,
  WorkoutExerciseUpdate,
  WorkoutExerciseQuery
> {
  protected model = 'workoutExercise'
  protected createSchema = WorkoutExerciseCreateSchema
  protected updateSchema = WorkoutExerciseUpdateSchema
  protected querySchema = WorkoutExerciseQuerySchema

  protected buildWhereClause(query: WorkoutExerciseQuery): any {
    const where: any = {}
    
    if (query.workoutId) where.workoutId = query.workoutId
    if (query.exerciseId) where.exerciseId = query.exerciseId

    return where
  }

  protected buildOrderByClause(query: WorkoutExerciseQuery): any {
    return { orderIndex: 'asc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        workout: {
          select: { id: true, name: true, userId: true }
        },
        exercise: {
          select: { id: true, name: true, category: true, muscleGroups: true }
        },
        sets: {
          orderBy: { setNumber: 'asc' }
        }
      }
    }
  }

  /**
   * Get workout exercise with workout info for permission checking
   */
  async getWithWorkout(workoutExerciseId: string): Promise<any> {
    return prisma.workoutExercise.findUnique({
      where: { id: workoutExerciseId },
      include: this.getIncludeOptions().include
    })
  }

  /**
   * Copy an exercise from one workout to another
   */
  async copyExercise(sourceExerciseId: string, targetWorkoutId: string, userId: string, orderIndex?: number): Promise<WorkoutExercise> {
    return this.transaction(async ({ tx }) => {
      // Get the source exercise with all sets
      const sourceExercise = await tx.workoutExercise.findFirst({
        where: { id: sourceExerciseId },
        include: {
          sets: true,
          exercise: true,
          workout: {
            select: { id: true, userId: true }
          }
        }
      })

      if (!sourceExercise) {
        throw new Error('Source exercise not found')
      }

      // Verify source workout belongs to user
      if (sourceExercise.workout.userId !== userId) {
        throw new Error('Access denied to source exercise')
      }

      // Verify target workout belongs to user
      const targetWorkout = await tx.workout.findFirst({
        where: { id: targetWorkoutId, userId }
      })

      if (!targetWorkout) {
        throw new Error('Target workout not found or access denied')
      }

      // Get the next order index if not provided
      let newOrderIndex = orderIndex
      if (newOrderIndex === undefined) {
        const maxOrder = await tx.workoutExercise.aggregate({
          where: { workoutId: targetWorkoutId },
          _max: { orderIndex: true }
        })
        newOrderIndex = (maxOrder._max.orderIndex || -1) + 1
      }

      // Create the new exercise in the target workout
      const newWorkoutExercise = await tx.workoutExercise.create({
        data: {
          workoutId: targetWorkoutId,
          exerciseId: sourceExercise.exerciseId,
          orderIndex: newOrderIndex,
          targetSets: sourceExercise.targetSets,
          targetReps: sourceExercise.targetReps,
          targetWeight: sourceExercise.targetWeight,
          targetDuration: sourceExercise.targetDuration,
          targetDistance: sourceExercise.targetDistance,
          restBetweenSets: sourceExercise.restBetweenSets,
          notes: sourceExercise.notes
        }
      })

      // Copy all sets (as template sets, not actual performance)
      for (const sourceSet of sourceExercise.sets) {
        await tx.workoutSet.create({
          data: {
            workoutExerciseId: newWorkoutExercise.id,
            setNumber: sourceSet.setNumber,
            reps: sourceExercise.targetReps,
            weight: sourceExercise.targetWeight,
            duration: sourceExercise.targetDuration,
            distance: sourceExercise.targetDistance,
            restAfter: sourceExercise.restBetweenSets
          }
        })
      }

      return newWorkoutExercise
    })
  }

  /**
   * Copy multiple exercises from one workout to another
   */
  async copyExercises(sourceWorkoutId: string, targetWorkoutId: string, userId: string, exerciseIds?: string[]): Promise<WorkoutExercise[]> {
    return this.transaction(async ({ tx }) => {
      // Verify both workouts belong to user
      const [sourceWorkout, targetWorkout] = await Promise.all([
        tx.workout.findFirst({ where: { id: sourceWorkoutId, userId } }),
        tx.workout.findFirst({ where: { id: targetWorkoutId, userId } })
      ])

      if (!sourceWorkout || !targetWorkout) {
        throw new Error('One or both workouts not found or access denied')
      }

      // Get exercises to copy
      const whereClause: any = { workoutId: sourceWorkoutId }
      if (exerciseIds && exerciseIds.length > 0) {
        whereClause.id = { in: exerciseIds }
      }

      const sourceExercises = await tx.workoutExercise.findMany({
        where: whereClause,
        include: {
          sets: true,
          exercise: true
        },
        orderBy: { orderIndex: 'asc' }
      })

      if (sourceExercises.length === 0) {
        throw new Error('No exercises found to copy')
      }

      // Get the next order index for the target workout
      const maxOrder = await tx.workoutExercise.aggregate({
        where: { workoutId: targetWorkoutId },
        _max: { orderIndex: true }
      })
      let currentOrderIndex = (maxOrder._max.orderIndex || -1) + 1

      const copiedExercises: WorkoutExercise[] = []

      // Copy each exercise
      for (const sourceExercise of sourceExercises) {
        const newWorkoutExercise = await tx.workoutExercise.create({
          data: {
            workoutId: targetWorkoutId,
            exerciseId: sourceExercise.exerciseId,
            orderIndex: currentOrderIndex++,
            targetSets: sourceExercise.targetSets,
            targetReps: sourceExercise.targetReps,
            targetWeight: sourceExercise.targetWeight,
            targetDuration: sourceExercise.targetDuration,
            targetDistance: sourceExercise.targetDistance,
            restBetweenSets: sourceExercise.restBetweenSets,
            notes: sourceExercise.notes
          }
        })

        // Copy all sets for this exercise
        for (const sourceSet of sourceExercise.sets) {
          await tx.workoutSet.create({
            data: {
              workoutExerciseId: newWorkoutExercise.id,
              setNumber: sourceSet.setNumber,
              reps: sourceExercise.targetReps,
              weight: sourceExercise.targetWeight,
              duration: sourceExercise.targetDuration,
              distance: sourceExercise.targetDistance,
              restAfter: sourceExercise.restBetweenSets
            }
          })
        }

        copiedExercises.push(newWorkoutExercise)
      }

      return copiedExercises
    })
  }
}

/**
 * Workout Set Repository
 */
export class WorkoutSetRepository extends BaseRepository<
  WorkoutSet,
  WorkoutSetCreate,
  WorkoutSetUpdate,
  WorkoutSetQuery
> {
  protected model = 'workoutSet'
  protected createSchema = WorkoutSetCreateSchema
  protected updateSchema = WorkoutSetUpdateSchema
  protected querySchema = WorkoutSetQuerySchema

  protected buildWhereClause(query: WorkoutSetQuery): any {
    const where: any = {}
    
    if (query.workoutExerciseId) where.workoutExerciseId = query.workoutExerciseId

    return where
  }

  protected buildOrderByClause(query: WorkoutSetQuery): any {
    return { setNumber: 'asc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        workoutExercise: {
          include: {
            workout: {
              select: { id: true, userId: true }
            },
            exercise: {
              select: { id: true, name: true }
            }
          }
        }
      }
    }
  }

  /**
   * Get workout set with full workout chain for permission checking
   */
  async getWithWorkout(setId: string): Promise<any> {
    return prisma.workoutSet.findUnique({
      where: { id: setId },
      include: this.getIncludeOptions().include
    })
  }
}

/**
 * Personal Record Repository
 */
export class PersonalRecordRepository extends BaseRepository<
  PersonalRecord,
  PersonalRecordCreate,
  PersonalRecordUpdate,
  PersonalRecordQuery
> {
  protected model = 'personalRecord'
  protected createSchema = PersonalRecordCreateSchema
  protected updateSchema = PersonalRecordUpdateSchema
  protected querySchema = PersonalRecordQuerySchema

  protected buildWhereClause(query: PersonalRecordQuery): any {
    const where: any = {}
    
    if (query.userId) where.userId = query.userId
    if (query.exerciseId) where.exerciseId = query.exerciseId
    if (query.recordType) where.recordType = query.recordType

    return where
  }

  protected buildOrderByClause(query: PersonalRecordQuery): any {
    return { achievedAt: 'desc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        exercise: {
          select: { id: true, name: true, category: true }
        },
        workout: {
          select: { id: true, name: true, scheduledDate: true }
        }
      }
    }
  }

  /**
   * Check and update personal records based on workout set performance
   */
  async checkAndUpdateRecords(
    userId: string, 
    exerciseId: string, 
    setData: { weight?: number; reps?: number; duration?: number; distance?: number }
  ): Promise<PersonalRecord[]> {
    const records: PersonalRecord[] = []

    // Check 1RM record (if weight and reps provided)
    if (setData.weight && setData.reps) {
      const estimated1rm = this.calculate1RM(setData.weight, setData.reps)
      const existing1rm = await this.findFirst({
        userId,
        exerciseId,
        recordType: '1rm'
      })

      if (!existing1rm || estimated1rm > existing1rm.value) {
        const record = await this.create({
          userId,
          exerciseId,
          recordType: '1rm',
          value: estimated1rm,
          unit: 'lbs', // TODO: Make this configurable
          previousValue: existing1rm?.value,
          achievedAt: new Date(),
          notes: `Estimated from ${setData.reps} reps at ${setData.weight} lbs`
        })
        records.push(record)
      }
    }

    // Check volume record
    if (setData.weight && setData.reps) {
      const volume = setData.weight * setData.reps
      const existingVolume = await this.findFirst({
        userId,
        exerciseId,
        recordType: 'volume'
      })

      if (!existingVolume || volume > existingVolume.value) {
        const record = await this.create({
          userId,
          exerciseId,
          recordType: 'volume',
          value: volume,
          unit: 'lbs',
          previousValue: existingVolume?.value,
          achievedAt: new Date()
        })
        records.push(record)
      }
    }

    // Check duration record
    if (setData.duration) {
      const existingDuration = await this.findFirst({
        userId,
        exerciseId,
        recordType: 'duration'
      })

      if (!existingDuration || setData.duration > existingDuration.value) {
        const record = await this.create({
          userId,
          exerciseId,
          recordType: 'duration',
          value: setData.duration,
          unit: 'seconds',
          previousValue: existingDuration?.value,
          achievedAt: new Date()
        })
        records.push(record)
      }
    }

    // Check distance record
    if (setData.distance) {
      const existingDistance = await this.findFirst({
        userId,
        exerciseId,
        recordType: 'distance'
      })

      if (!existingDistance || setData.distance > existingDistance.value) {
        const record = await this.create({
          userId,
          exerciseId,
          recordType: 'distance',
          value: setData.distance,
          unit: 'miles', // TODO: Make this configurable
          previousValue: existingDistance?.value,
          achievedAt: new Date()
        })
        records.push(record)
      }
    }

    return records
  }

  /**
   * Calculate estimated 1RM using Epley formula
   */
  private calculate1RM(weight: number, reps: number): number {
    if (reps === 1) return weight
    return Math.round(weight * (1 + reps / 30))
  }
}

/**
 * Fitness Dashboard Repository
 * Aggregates data for the fitness module dashboard
 */
export class FitnessDashboardRepository {
  private workoutPlanRepo = new WorkoutPlanRepository()
  private workoutRepo = new WorkoutRepository()
  private exerciseTemplateRepo = new ExerciseTemplateRepository()
  private personalRecordRepo = new PersonalRecordRepository()

  /**
   * Get comprehensive dashboard data for user
   */
  async getDashboardData(userId: string) {
    const [
      activeWorkoutPlans,
      recentWorkouts,
      weeklyStats,
      personalRecords,
      exerciseCategories,
      upcomingWorkouts
    ] = await Promise.all([
      this.getActiveWorkoutPlans(userId),
      this.getRecentWorkouts(userId),
      this.getWeeklyStats(userId),
      this.getRecentPersonalRecords(userId),
      this.getExerciseCategoryStats(userId),
      this.getUpcomingWorkouts(userId)
    ])

    return {
      activeWorkoutPlans,
      recentWorkouts,
      weeklyStats,
      personalRecords,
      exerciseCategories,
      upcomingWorkouts,
      stats: {
        totalActivePlans: activeWorkoutPlans.length,
        weeklyWorkouts: weeklyStats.totalWorkouts,
        weeklyDuration: weeklyStats.totalDuration,
        recentPRCount: personalRecords.length
      }
    }
  }

  /**
   * Get analytics data for various time periods
   */
  async getAnalytics(userId: string, period: string = 'week'): Promise<any> {
    const periodStart = this.getPeriodStart(period)

    const [
      workoutCount,
      totalDuration,
      exerciseVolume,
      personalRecordCount
    ] = await Promise.all([
      this.getWorkoutCount(userId, periodStart),
      this.getTotalDuration(userId, periodStart),
      this.getExerciseVolume(userId, periodStart),
      this.getPersonalRecordCount(userId, periodStart)
    ])

    return {
      period,
      workoutCount,
      totalDuration,
      averageDuration: workoutCount > 0 ? Math.round(totalDuration / workoutCount) : 0,
      exerciseVolume,
      personalRecordCount
    }
  }

  private async getActiveWorkoutPlans(userId: string): Promise<any[]> {
    return prisma.workoutPlan.findMany({
      where: { 
        userId, 
        isActive: true,
        isTemplate: false
      },
      include: {
        workouts: {
          select: { 
            id: true, 
            completedAt: true, 
            scheduledDate: true 
          }
        },
        _count: { select: { workouts: true } }
      },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    })
  }

  private async getRecentWorkouts(userId: string): Promise<any[]> {
    return prisma.workout.findMany({
      where: { userId },
      include: {
        plan: { select: { name: true } },
        exercises: {
          include: {
            exercise: { select: { name: true, category: true } }
          }
        }
      },
      take: 10,
      orderBy: { scheduledDate: 'desc' }
    })
  }

  private async getWeeklyStats(userId: string): Promise<any> {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)

    const [totalWorkouts, totalDuration] = await Promise.all([
      prisma.workout.count({
        where: {
          userId,
          completedAt: { not: null },
          scheduledDate: { gte: weekStart }
        }
      }),
      prisma.workout.aggregate({
        where: {
          userId,
          completedAt: { not: null },
          scheduledDate: { gte: weekStart }
        },
        _sum: { actualDuration: true }
      })
    ])

    return {
      totalWorkouts,
      totalDuration: totalDuration._sum.actualDuration || 0
    }
  }

  private async getRecentPersonalRecords(userId: string): Promise<PersonalRecord[]> {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    return prisma.personalRecord.findMany({
      where: { userId },
      take: 5,
      orderBy: { achievedAt: 'desc' },
      include: {
        exercise: {
          select: { id: true, name: true, category: true }
        },
        workout: {
          select: { id: true, name: true, scheduledDate: true }
        }
      }
    })
  }

  private async getExerciseCategoryStats(userId: string): Promise<any> {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    return prisma.workoutExercise.groupBy({
      by: ['exerciseId'],
      where: {
        workout: {
          userId,
          completedAt: { not: null },
          scheduledDate: { gte: monthAgo }
        }
      },
      _count: { id: true }
    })
  }

  private async getUpcomingWorkouts(userId: string): Promise<any[]> {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    return prisma.workout.findMany({
      where: {
        userId,
        scheduledDate: {
          gte: new Date(),
          lte: nextWeek
        },
        completedAt: null
      },
      include: {
        plan: { select: { name: true } }
      },
      orderBy: { scheduledDate: 'asc' },
      take: 10
    })
  }

  private async getWorkoutCount(userId: string, since: Date): Promise<number> {
    return prisma.workout.count({
      where: {
        userId,
        completedAt: { not: null },
        scheduledDate: { gte: since }
      }
    })
  }

  private async getTotalDuration(userId: string, since: Date): Promise<number> {
    const result = await prisma.workout.aggregate({
      where: {
        userId,
        completedAt: { not: null },
        scheduledDate: { gte: since }
      },
      _sum: { actualDuration: true }
    })

    return result._sum.actualDuration || 0
  }

  private async getExerciseVolume(userId: string, since: Date): Promise<number> {
    const result = await prisma.workoutSet.aggregate({
      where: {
        workoutExercise: {
          workout: {
            userId,
            scheduledDate: { gte: since }
          }
        },
        weight: { not: null },
        reps: { not: null }
      },
      _sum: {
        weight: true,
        reps: true
      }
    })

    // Calculate total volume (weight * reps summed)
    return (result._sum.weight || 0) * (result._sum.reps || 0)
  }

  private async getPersonalRecordCount(userId: string, since: Date): Promise<number> {
    return prisma.personalRecord.count({
      where: {
        userId,
        achievedAt: { gte: since }
      }
    })
  }

  private getPeriodStart(period: string): Date {
    const now = new Date()
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1)
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        return new Date(now.getFullYear(), quarter * 3, 1)
      case 'year':
        return new Date(now.getFullYear(), 0, 1)
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  }
}

// Nutrition-specific validation schemas
const FoodCreateSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().optional(),
  barcode: z.string().optional(),
  category: z.string(),
  caloriesPer100g: z.number().min(0),
  proteinPer100g: z.number().min(0),
  carbsPer100g: z.number().min(0),
  fatPer100g: z.number().min(0),
  fiberPer100g: z.number().min(0).optional(),
  sugarPer100g: z.number().min(0).optional(),
  sodiumPer100g: z.number().min(0).optional(),
  servingSize: z.number().min(0).optional(),
  servingUnit: z.string().default('g'),
  isCustom: z.boolean().default(false),
  userId: z.string().optional()
})

const FoodUpdateSchema = FoodCreateSchema.partial()

const FoodQuerySchema = z.object({
  userId: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  isCustom: z.boolean().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const FoodLogCreateSchema = z.object({
  userId: z.string(),
  foodId: z.string(),
  mealId: z.string().optional(),
  quantity: z.number().min(0),
  unit: z.string(),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0).optional(),
  sugar: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  consumedAt: z.date().optional()
})

const FoodLogUpdateSchema = FoodLogCreateSchema.partial()

const FoodLogQuerySchema = z.object({
  userId: z.string().optional(),
  foodId: z.string().optional(),
  mealId: z.string().optional(),
  date: z.date().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const NutritionGoalCreateSchema = z.object({
  userId: z.string(),
  dailyCalories: z.number().min(0),
  dailyProtein: z.number().min(0),
  dailyCarbs: z.number().min(0),
  dailyFat: z.number().min(0),
  dailyFiber: z.number().min(0).optional(),
  dailySugar: z.number().min(0).optional(),
  dailySodium: z.number().min(0).optional(),
  proteinPercentage: z.number().min(0).max(100).optional(),
  carbsPercentage: z.number().min(0).max(100).optional(),
  fatPercentage: z.number().min(0).max(100).optional(),
  goalType: z.enum(['weight_loss', 'weight_gain', 'maintenance', 'muscle_gain', 'general']).default('general'),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).default('moderate'),
  startDate: z.date().optional(),
  endDate: z.date().optional()
})

const NutritionGoalUpdateSchema = NutritionGoalCreateSchema.partial()

const WaterIntakeCreateSchema = z.object({
  userId: z.string(),
  amountMl: z.number().min(0),
  amountOz: z.number().min(0).optional(),
  recordedAt: z.date().optional(),
  date: z.date(),
  source: z.string().optional(),
  notes: z.string().optional(),
  temperature: z.enum(['cold', 'room', 'warm', 'hot']).optional()
})

const WaterIntakeUpdateSchema = WaterIntakeCreateSchema.partial()

const WaterIntakeQuerySchema = z.object({
  userId: z.string().optional(),
  date: z.date().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  source: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const MealCreateSchema = z.object({
  userId: z.string(),
  name: z.string().min(1).max(200),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  date: z.date(),
  plannedTime: z.date().optional(),
  consumedTime: z.date().optional(),
  totalCalories: z.number().min(0).default(0),
  totalProtein: z.number().min(0).default(0),
  totalCarbs: z.number().min(0).default(0),
  totalFat: z.number().min(0).default(0),
  totalFiber: z.number().min(0).default(0).optional(),
  totalSugar: z.number().min(0).default(0).optional(),
  totalSodium: z.number().min(0).default(0).optional(),
  notes: z.string().optional(),
  isTemplate: z.boolean().default(false)
})

const MealUpdateSchema = MealCreateSchema.partial()

const MealQuerySchema = z.object({
  userId: z.string().optional(),
  mealType: z.string().optional(),
  date: z.date().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  isTemplate: z.boolean().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

// Type definitions for nutrition
type FoodCreate = z.infer<typeof FoodCreateSchema>
type FoodUpdate = z.infer<typeof FoodUpdateSchema>
type FoodQuery = z.infer<typeof FoodQuerySchema>

type FoodLogCreate = z.infer<typeof FoodLogCreateSchema>
type FoodLogUpdate = z.infer<typeof FoodLogUpdateSchema>
type FoodLogQuery = z.infer<typeof FoodLogQuerySchema>

type NutritionGoalCreate = z.infer<typeof NutritionGoalCreateSchema>
type NutritionGoalUpdate = z.infer<typeof NutritionGoalUpdateSchema>

type WaterIntakeCreate = z.infer<typeof WaterIntakeCreateSchema>
type WaterIntakeUpdate = z.infer<typeof WaterIntakeUpdateSchema>
type WaterIntakeQuery = z.infer<typeof WaterIntakeQuerySchema>

type MealCreate = z.infer<typeof MealCreateSchema>
type MealUpdate = z.infer<typeof MealUpdateSchema>
type MealQuery = z.infer<typeof MealQuerySchema>

/**
 * Food Repository
 */
export class FoodRepository extends BaseRepository<
  Food,
  FoodCreate,
  FoodUpdate,
  FoodQuery
> {
  protected model = 'food'
  protected createSchema = FoodCreateSchema
  protected updateSchema = FoodUpdateSchema
  protected querySchema = FoodQuerySchema

  protected buildWhereClause(query: FoodQuery): any {
    const where: any = {}
    
    if (query.userId !== undefined) {
      where.OR = [
        { userId: query.userId }, // User's custom foods
        { userId: null }          // System foods
      ]
    }
    if (query.category) where.category = query.category
    if (query.isCustom !== undefined) where.isCustom = query.isCustom
    
    if (query.search) {
      where.OR = where.OR || []
      where.OR.push(
        { name: { contains: query.search } },
        { brand: { contains: query.search } }
      )
    }

    return where
  }

  protected buildOrderByClause(query: FoodQuery): any {
    return { name: 'asc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        user: {
          select: { id: true, email: true }
        },
        _count: {
          select: { 
            foodLogs: true,
            mealFoods: true
          }
        }
      }
    }
  }

  /**
   * Search foods by name or brand with fuzzy matching
   */
  async searchFoods(query: string, userId?: string, limit: number = 20): Promise<Food[]> {
    return this.findMany({
      search: query,
      userId,
      limit
    })
  }
}

/**
 * Food Log Repository
 */
export class FoodLogRepository extends BaseRepository<
  FoodLog,
  FoodLogCreate,
  FoodLogUpdate,
  FoodLogQuery
> {
  protected model = 'foodLog'
  protected createSchema = FoodLogCreateSchema
  protected updateSchema = FoodLogUpdateSchema
  protected querySchema = FoodLogQuerySchema

  protected buildWhereClause(query: FoodLogQuery): any {
    const where: any = {}
    
    if (query.userId) where.userId = query.userId
    if (query.foodId) where.foodId = query.foodId
    if (query.mealId) where.mealId = query.mealId
    
    if (query.date) {
      const startOfDay = new Date(query.date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(query.date)
      endOfDay.setHours(23, 59, 59, 999)
      
      where.consumedAt = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    if (query.dateFrom && query.dateTo) {
      where.consumedAt = {
        gte: query.dateFrom,
        lte: query.dateTo
      }
    } else if (query.dateFrom) {
      where.consumedAt = { gte: query.dateFrom }
    } else if (query.dateTo) {
      where.consumedAt = { lte: query.dateTo }
    }

    return where
  }

  protected buildOrderByClause(query: FoodLogQuery): any {
    return { consumedAt: 'desc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        food: {
          select: { 
            id: true, 
            name: true, 
            brand: true, 
            category: true,
            servingSize: true,
            servingUnit: true
          }
        },
        meal: {
          select: { 
            id: true, 
            name: true, 
            mealType: true 
          }
        },
        user: {
          select: { id: true, email: true }
        }
      }
    }
  }

  /**
   * Get food logs for a specific date
   */
  async getFoodLogsByDate(userId: string, date: Date): Promise<FoodLog[]> {
    return this.findMany({
      userId,
      date,
      limit: 1000 // Get all logs for the day
    })
  }

  /**
   * Calculate nutritional totals for a date range
   */
  async getNutritionTotals(userId: string, dateFrom: Date, dateTo: Date): Promise<any> {
    const result = await prisma.foodLog.aggregate({
      where: {
        userId,
        consumedAt: {
          gte: dateFrom,
          lte: dateTo
        }
      },
      _sum: {
        calories: true,
        protein: true,
        carbs: true,
        fat: true,
        fiber: true,
        sugar: true,
        sodium: true
      }
    })

    return {
      calories: result._sum.calories || 0,
      protein: result._sum.protein || 0,
      carbs: result._sum.carbs || 0,
      fat: result._sum.fat || 0,
      fiber: result._sum.fiber || 0,
      sugar: result._sum.sugar || 0,
      sodium: result._sum.sodium || 0
    }
  }

  /**
   * Log food consumption with automatic nutritional calculation
   */
  async logFood(userId: string, foodId: string, quantity: number, unit: string, mealId?: string): Promise<FoodLog> {
    return this.transaction(async ({ tx }) => {
      // Get the food details
      const food = await tx.food.findUnique({
        where: { id: foodId }
      })

      if (!food) {
        throw new Error('Food not found')
      }

      // Convert quantity to grams/ml for calculation
      let quantityInGrams = quantity
      if (unit !== 'g' && unit !== 'ml') {
        // Handle other units - for now assume serving size conversion
        if (food.servingSize) {
          quantityInGrams = (quantity * food.servingSize) / 100
        }
      } else {
        quantityInGrams = quantity / 100 // Convert to per-100g basis
      }

      // Calculate nutritional values
      const calories = food.caloriesPer100g * quantityInGrams
      const protein = food.proteinPer100g * quantityInGrams
      const carbs = food.carbsPer100g * quantityInGrams
      const fat = food.fatPer100g * quantityInGrams
      const fiber = food.fiberPer100g ? food.fiberPer100g * quantityInGrams : undefined
      const sugar = food.sugarPer100g ? food.sugarPer100g * quantityInGrams : undefined
      const sodium = food.sodiumPer100g ? food.sodiumPer100g * quantityInGrams : undefined

      // Create the food log entry
      return await tx.foodLog.create({
        data: {
          userId,
          foodId,
          mealId,
          quantity,
          unit,
          calories,
          protein,
          carbs,
          fat,
          fiber,
          sugar,
          sodium,
          consumedAt: new Date()
        }
      })
    })
  }
}

/**
 * Nutrition Goal Repository
 */
export class NutritionGoalRepository extends BaseRepository<
  NutritionGoal,
  NutritionGoalCreate,
  NutritionGoalUpdate,
  never
> {
  protected model = 'nutritionGoal'
  protected createSchema = NutritionGoalCreateSchema
  protected updateSchema = NutritionGoalUpdateSchema
  protected querySchema = z.object({})

  protected buildWhereClause(): any {
    return {}
  }

  protected buildOrderByClause(): any {
    return { updatedAt: 'desc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        user: {
          select: { id: true, email: true }
        }
      }
    }
  }

  /**
   * Get user's current nutrition goals (only one active goal per user)
   */
  async getUserGoals(userId: string): Promise<NutritionGoal | null> {
    return prisma.nutritionGoal.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    })
  }

  /**
   * Set or update user's nutrition goals
   */
  async setUserGoals(userId: string, goals: Omit<NutritionGoalCreate, 'userId'>): Promise<NutritionGoal> {
    // Delete existing goals and create new ones
    return this.transaction(async ({ tx }) => {
      await tx.nutritionGoal.deleteMany({
        where: { userId }
      })

      const goalData = {
        userId,
        startDate: goals.startDate || new Date(), // Default to current date if not provided
        ...goals
      }

      return await tx.nutritionGoal.create({
        data: goalData
      })
    })
  }
}

/**
 * Water Intake Repository
 */
export class WaterIntakeRepository extends BaseRepository<
  WaterIntake,
  WaterIntakeCreate,
  WaterIntakeUpdate,
  WaterIntakeQuery
> {
  protected model = 'waterIntake'
  protected createSchema = WaterIntakeCreateSchema
  protected updateSchema = WaterIntakeUpdateSchema
  protected querySchema = WaterIntakeQuerySchema

  protected buildWhereClause(query: WaterIntakeQuery): any {
    const where: any = {}
    
    if (query.userId) where.userId = query.userId
    if (query.source) where.source = query.source
    
    if (query.date) {
      const startOfDay = new Date(query.date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(query.date)
      endOfDay.setHours(23, 59, 59, 999)
      
      where.date = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    if (query.dateFrom && query.dateTo) {
      where.date = {
        gte: query.dateFrom,
        lte: query.dateTo
      }
    } else if (query.dateFrom) {
      where.date = { gte: query.dateFrom }
    } else if (query.dateTo) {
      where.date = { lte: query.dateTo }
    }

    return where
  }

  protected buildOrderByClause(query: WaterIntakeQuery): any {
    return { recordedAt: 'desc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        user: {
          select: { id: true, email: true }
        }
      }
    }
  }

  /**
   * Get water intake for a specific date
   */
  async getWaterIntakeByDate(userId: string, date: Date): Promise<WaterIntake[]> {
    return this.findMany({
      userId,
      date,
      limit: 100
    })
  }

  /**
   * Get total water intake for a date
   */
  async getTotalWaterIntake(userId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const result = await prisma.waterIntake.aggregate({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _sum: {
        amountMl: true
      }
    })

    return result._sum.amountMl || 0
  }

  /**
   * Log water intake
   */
  async logWaterIntake(userId: string, amountMl: number, source?: string, temperature?: string): Promise<WaterIntake> {
    const now = new Date()
    const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const amountOz = amountMl * 0.033814 // Convert ml to fl oz

    return this.create({
      userId,
      amountMl,
      amountOz,
      recordedAt: now,
      date: dateOnly,
      source,
      temperature
    })
  }
}

/**
 * Meal Repository
 */
export class MealRepository extends BaseRepository<
  Meal,
  MealCreate,
  MealUpdate,
  MealQuery
> {
  protected model = 'meal'
  protected createSchema = MealCreateSchema
  protected updateSchema = MealUpdateSchema
  protected querySchema = MealQuerySchema

  protected buildWhereClause(query: MealQuery): any {
    const where: any = {}
    
    if (query.userId) where.userId = query.userId
    if (query.mealType) where.mealType = query.mealType
    if (query.isTemplate !== undefined) where.isTemplate = query.isTemplate
    
    if (query.date) {
      const startOfDay = new Date(query.date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(query.date)
      endOfDay.setHours(23, 59, 59, 999)
      
      where.date = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    if (query.dateFrom && query.dateTo) {
      where.date = {
        gte: query.dateFrom,
        lte: query.dateTo
      }
    } else if (query.dateFrom) {
      where.date = { gte: query.dateFrom }
    } else if (query.dateTo) {
      where.date = { lte: query.dateTo }
    }

    return where
  }

  protected buildOrderByClause(query: MealQuery): any {
    return { plannedTime: 'asc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        user: {
          select: { id: true, email: true }
        },
        mealFoods: {
          include: {
            food: {
              select: { 
                id: true, 
                name: true, 
                brand: true, 
                category: true 
              }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        foodLogs: {
          include: {
            food: {
              select: { 
                id: true, 
                name: true, 
                brand: true, 
                category: true 
              }
            }
          }
        }
      }
    }
  }

  /**
   * Get meals for a specific date
   */
  async getMealsByDate(userId: string, date: Date): Promise<Meal[]> {
    return this.findMany({
      userId,
      date,
      isTemplate: false,
      limit: 10
    })
  }

  /**
   * Create a meal with foods
   */
  async createMealWithFoods(
    userId: string, 
    mealData: Omit<MealCreate, 'userId'>, 
    foods: Array<{ foodId: string; quantity: number; unit: string; notes?: string }>
  ): Promise<Meal> {
    return this.transaction(async ({ tx }) => {
      // Create the meal
      const meal = await tx.meal.create({
        data: {
          userId,
          ...mealData
        }
      })

      // Add foods to the meal and calculate totals
      let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0
      let totalFiber = 0, totalSugar = 0, totalSodium = 0

      for (let i = 0; i < foods.length; i++) {
        const { foodId, quantity, unit, notes } = foods[i]

        // Get food nutritional data
        const food = await tx.food.findUnique({
          where: { id: foodId }
        })

        if (!food) continue

        // Add to meal foods
        await tx.mealFood.create({
          data: {
            mealId: meal.id,
            foodId,
            quantity,
            unit,
            orderIndex: i,
            notes
          }
        })

        // Calculate nutritional contribution (simplified - assumes grams)
        const factor = quantity / 100 // Convert to per-100g basis
        totalCalories += food.caloriesPer100g * factor
        totalProtein += food.proteinPer100g * factor
        totalCarbs += food.carbsPer100g * factor
        totalFat += food.fatPer100g * factor
        totalFiber += (food.fiberPer100g || 0) * factor
        totalSugar += (food.sugarPer100g || 0) * factor
        totalSodium += (food.sodiumPer100g || 0) * factor
      }

      // Update meal totals
      return await tx.meal.update({
        where: { id: meal.id },
        data: {
          totalCalories,
          totalProtein,
          totalCarbs,
          totalFat,
          totalFiber,
          totalSugar,
          totalSodium
        },
        include: {
          mealFoods: {
            include: {
              food: true
            }
          }
        }
      })
    })
  }
}

/**
 * Nutrition Dashboard Repository
 * Aggregates nutrition data for dashboard display
 */
export class NutritionDashboardRepository {
  private foodLogRepo = new FoodLogRepository()
  private nutritionGoalRepo = new NutritionGoalRepository()
  private waterIntakeRepo = new WaterIntakeRepository()
  private mealRepo = new MealRepository()

  /**
   * Get comprehensive nutrition dashboard data for today
   */
  async getDashboardData(userId: string, date: Date = new Date()) {
    const [
      todayFoodLogs,
      nutritionGoals,
      todayWaterIntake,
      todayMeals,
      weeklyStats,
      nutritionTrends
    ] = await Promise.all([
      this.foodLogRepo.getFoodLogsByDate(userId, date),
      this.nutritionGoalRepo.getUserGoals(userId),
      this.waterIntakeRepo.getWaterIntakeByDate(userId, date),
      this.mealRepo.getMealsByDate(userId, date),
      this.getWeeklyNutritionStats(userId),
      this.getNutritionTrends(userId, 7) // Last 7 days
    ])

    // Calculate today's totals
    const todayTotals = this.calculateTotals(todayFoodLogs)
    const totalWaterMl = todayWaterIntake.reduce((sum, intake) => sum + intake.amountMl, 0)

    // Calculate goal progress if goals exist
    let goalProgress = null
    if (nutritionGoals) {
      goalProgress = {
        calories: {
          current: todayTotals.calories,
          target: nutritionGoals.dailyCalories,
          percentage: Math.round((todayTotals.calories / nutritionGoals.dailyCalories) * 100)
        },
        protein: {
          current: todayTotals.protein,
          target: nutritionGoals.dailyProtein,
          percentage: Math.round((todayTotals.protein / nutritionGoals.dailyProtein) * 100)
        },
        carbs: {
          current: todayTotals.carbs,
          target: nutritionGoals.dailyCarbs,
          percentage: Math.round((todayTotals.carbs / nutritionGoals.dailyCarbs) * 100)
        },
        fat: {
          current: todayTotals.fat,
          target: nutritionGoals.dailyFat,
          percentage: Math.round((todayTotals.fat / nutritionGoals.dailyFat) * 100)
        }
      }
    }

    return {
      date,
      todayTotals,
      nutritionGoals,
      goalProgress,
      totalWaterMl,
      waterGoalMl: 2000, // Default goal, should be configurable
      waterProgress: Math.round((totalWaterMl / 2000) * 100),
      todayFoodLogs,
      todayMeals,
      weeklyStats,
      nutritionTrends,
      stats: {
        foodsLogged: todayFoodLogs.length,
        mealsPlanned: todayMeals.length,
        waterGlassesCount: Math.round(totalWaterMl / 250), // Assuming 250ml per glass
        caloriesRemaining: nutritionGoals ? Math.max(0, nutritionGoals.dailyCalories - todayTotals.calories) : null
      }
    }
  }

  private calculateTotals(foodLogs: FoodLog[]) {
    return foodLogs.reduce((totals, log) => ({
      calories: totals.calories + log.calories,
      protein: totals.protein + log.protein,
      carbs: totals.carbs + log.carbs,
      fat: totals.fat + log.fat,
      fiber: totals.fiber + (log.fiber || 0),
      sugar: totals.sugar + (log.sugar || 0),
      sodium: totals.sodium + (log.sodium || 0)
    }), {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    })
  }

  private async getWeeklyNutritionStats(userId: string) {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    return await this.foodLogRepo.getNutritionTotals(userId, weekAgo, new Date())
  }

  private async getNutritionTrends(userId: string, days: number) {
    const trends = []
    
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const dayTotals = await this.foodLogRepo.getNutritionTotals(userId, dayStart, dayEnd)
      const waterTotal = await this.waterIntakeRepo.getTotalWaterIntake(userId, date)

      trends.unshift({
        date: dayStart,
        ...dayTotals,
        water: waterTotal
      })
    }

    return trends
  }
}

// Export repository instances
export const workoutPlanRepository = new WorkoutPlanRepository()
export const workoutRepository = new WorkoutRepository()
export const exerciseTemplateRepository = new ExerciseTemplateRepository()
export const workoutExerciseRepository = new WorkoutExerciseRepository()
export const workoutSetRepository = new WorkoutSetRepository()
export const personalRecordRepository = new PersonalRecordRepository()
export const fitnessDashboardRepository = new FitnessDashboardRepository()

// Export nutrition repository instances
export const foodRepository = new FoodRepository()
export const foodLogRepository = new FoodLogRepository()
export const nutritionGoalRepository = new NutritionGoalRepository()
export const waterIntakeRepository = new WaterIntakeRepository()
export const mealRepository = new MealRepository()
export const nutritionDashboardRepository = new NutritionDashboardRepository()