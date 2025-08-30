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
  PersonalRecord
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
    return this.transaction(async (tx) => {
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
    return this.transaction(async (tx) => {
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
    return this.transaction(async (tx) => {
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
    return this.transaction(async (tx) => {
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
    return this.transaction(async (tx) => {
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

// Export repository instances
export const workoutPlanRepository = new WorkoutPlanRepository()
export const workoutRepository = new WorkoutRepository()
export const exerciseTemplateRepository = new ExerciseTemplateRepository()
export const workoutExerciseRepository = new WorkoutExerciseRepository()
export const workoutSetRepository = new WorkoutSetRepository()
export const personalRecordRepository = new PersonalRecordRepository()
export const fitnessDashboardRepository = new FitnessDashboardRepository()