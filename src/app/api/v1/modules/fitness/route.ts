/**
 * Fitness Module API Routes
 * 
 * Comprehensive API for fitness workout management including:
 * - Workout plans and scheduling
 * - Exercise library and templates
 * - Workout execution and tracking
 * - Progress analytics and personal records
 * - Dashboard data aggregation
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  workoutPlanRepository,
  workoutRepository,
  exerciseTemplateRepository,
  workoutExerciseRepository,
  workoutSetRepository,
  personalRecordRepository,
  fitnessDashboardRepository
} from '../../../../../lib/prisma/repositories/fitness-repository'
import { GoalRepository } from '../../../../../lib/prisma/repositories/goal-repository'
// import { xpManager } from '../../../../../lib/gamification/XPManager'

// Initialize repositories
const goalRepository = new GoalRepository()

// Validation schemas
const CreateWorkoutPlanSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  isTemplate: z.boolean().default(false),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional()
})

const CreateWorkoutSchema = z.object({
  planId: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  scheduledDate: z.string().transform((str) => new Date(str)).optional(),
  workoutType: z.enum(['cardio', 'strength', 'flexibility', 'mixed']),
  estimatedDuration: z.number().optional()
})

const CreateExerciseTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'flexibility', 'full-body']),
  muscleGroups: z.array(z.string()),
  equipmentNeeded: z.string().optional(),
  instructions: z.array(z.string()).optional(),
  videoUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional()
})

const CreateWorkoutExerciseSchema = z.object({
  workoutId: z.string(),
  exerciseId: z.string(),
  orderIndex: z.number().min(0),
  targetSets: z.number().min(1).optional(),
  targetReps: z.number().min(1).optional(),
  targetWeight: z.number().min(0).optional(),
  targetDuration: z.number().min(1).optional(),
  targetDistance: z.number().min(0).optional(),
  restBetweenSets: z.number().min(0).optional(),
  notes: z.string().optional()
})

const CreateWorkoutSetSchema = z.object({
  workoutExerciseId: z.string(),
  setNumber: z.number().min(1),
  reps: z.number().min(0).optional(),
  weight: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
  distance: z.number().min(0).optional(),
  restAfter: z.number().min(0).optional(),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().optional()
})

// Update schemas (partial versions)
const UpdateWorkoutPlanSchema = CreateWorkoutPlanSchema.partial()
const UpdateWorkoutSchema = CreateWorkoutSchema.partial()
const UpdateExerciseTemplateSchema = CreateExerciseTemplateSchema.partial()
const UpdateWorkoutExerciseSchema = CreateWorkoutExerciseSchema.partial()
const UpdateWorkoutSetSchema = CreateWorkoutSetSchema.partial()

// Helper function to get user ID (placeholder - integrate with your auth system)
async function getUserId(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization')
  // For testing purposes, allow without auth and return a test user ID
  if (!authHeader) {
    console.warn('No auth header provided, using test user ID')
    return 'test-user-id' // Test user ID for development
  }
  // TODO: Implement proper JWT token extraction
  return 'user-placeholder-id' // Replace with actual implementation
}

/**
 * GET /api/v1/modules/fitness
 * Retrieve fitness module data based on query type
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'dashboard'

    switch (type) {
      case 'dashboard': {
        const dashboardData = await fitnessDashboardRepository.getDashboardData(userId)
        return NextResponse.json({ success: true, data: dashboardData })
      }

      case 'workout-plans': {
        const status = searchParams.get('status') || undefined
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        
        const workoutPlans = await workoutPlanRepository.getUserWorkoutPlans(userId, {
          status,
          page,
          limit
        })
        return NextResponse.json({ success: true, data: workoutPlans })
      }

      case 'workout-plan': {
        const planId = searchParams.get('id')
        if (!planId) {
          return NextResponse.json(
            { success: false, error: 'Workout plan ID is required' },
            { status: 400 }
          )
        }
        
        const plan = await workoutPlanRepository.findById(planId)
        if (!plan || plan.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Workout plan not found' },
            { status: 404 }
          )
        }
        
        return NextResponse.json({ success: true, data: plan })
      }

      case 'workouts': {
        const planId = searchParams.get('planId')
        const date = searchParams.get('date')
        const status = searchParams.get('status')
        
        const workouts = await workoutRepository.findMany({
          userId,
          planId,
          date: date ? new Date(date) : undefined,
          status,
          limit: parseInt(searchParams.get('limit') || '50')
        })
        return NextResponse.json({ success: true, data: workouts })
      }

      case 'workout': {
        const workoutId = searchParams.get('id')
        if (!workoutId) {
          return NextResponse.json(
            { success: false, error: 'Workout ID is required' },
            { status: 400 }
          )
        }
        
        const workout = await workoutRepository.getWorkoutWithExercises(workoutId)
        if (!workout || workout.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Workout not found' },
            { status: 404 }
          )
        }
        
        return NextResponse.json({ success: true, data: workout })
      }

      case 'exercise-templates': {
        const category = searchParams.get('category') || undefined
        const search = searchParams.get('search') || undefined
        const includeCustom = searchParams.get('includeCustom') === 'true'
        
        const templates = await exerciseTemplateRepository.findMany({
          userId: includeCustom ? userId : undefined,
          category,
          search,
          limit: parseInt(searchParams.get('limit') || '100')
        })
        return NextResponse.json({ success: true, data: templates })
      }

      case 'personal-records': {
        const exerciseId = searchParams.get('exerciseId') || undefined
        const recordType = searchParams.get('recordType') || undefined
        
        const records = await personalRecordRepository.findMany({
          userId,
          exerciseId,
          recordType,
          limit: parseInt(searchParams.get('limit') || '50')
        })
        return NextResponse.json({ success: true, data: records })
      }

      case 'analytics': {
        const period = searchParams.get('period') || 'week'
        const analytics = await fitnessDashboardRepository.getAnalytics(userId, period)
        return NextResponse.json({ success: true, data: analytics })
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Fitness module GET error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/modules/fitness
 * Create fitness module resources
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const body = await request.json()
    const { type, ...data } = body

    switch (type) {
      case 'workout-plan': {
        const validatedData = CreateWorkoutPlanSchema.parse(data)
        
        const workoutPlan = await workoutPlanRepository.create({
          ...validatedData,
          userId
        })
        
        // Award XP for creating workout plan
        // await xpManager.awardXP(userId, 'create_workout_plan', 'medium')
        
        return NextResponse.json(
          { success: true, data: workoutPlan, message: 'Workout plan created successfully' },
          { status: 201 }
        )
      }

      case 'workout': {
        const validatedData = CreateWorkoutSchema.parse(data)
        
        // Verify workout plan belongs to user if specified
        if (validatedData.planId) {
          const plan = await workoutPlanRepository.findById(validatedData.planId)
          if (!plan || plan.userId !== userId) {
            return NextResponse.json(
              { success: false, error: 'Workout plan not found or access denied' },
              { status: 404 }
            )
          }
        }
        
        const workout = await workoutRepository.create({
          ...validatedData,
          userId
        })
        
        // Award XP for creating workout
        // await xpManager.awardXP(userId, 'create_workout', 'easy')
        
        return NextResponse.json(
          { success: true, data: workout, message: 'Workout created successfully' },
          { status: 201 }
        )
      }

      case 'exercise-template': {
        const validatedData = CreateExerciseTemplateSchema.parse(data)
        
        const template = await exerciseTemplateRepository.create({
          ...validatedData,
          userId,
          isCustom: true
        })
        
        return NextResponse.json(
          { success: true, data: template, message: 'Exercise template created successfully' },
          { status: 201 }
        )
      }

      case 'workout-exercise': {
        const validatedData = CreateWorkoutExerciseSchema.parse(data)
        
        // Verify workout belongs to user
        const workout = await workoutRepository.findById(validatedData.workoutId)
        if (!workout || workout.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Workout not found or access denied' },
            { status: 404 }
          )
        }
        
        const workoutExercise = await workoutExerciseRepository.create(validatedData)
        
        return NextResponse.json(
          { success: true, data: workoutExercise, message: 'Exercise added to workout successfully' },
          { status: 201 }
        )
      }

      case 'workout-set': {
        const validatedData = CreateWorkoutSetSchema.parse(data)
        
        // Verify workout exercise belongs to user's workout
        const workoutExercise = await workoutExerciseRepository.getWithWorkout(validatedData.workoutExerciseId)
        if (!workoutExercise || workoutExercise.workout.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Workout exercise not found or access denied' },
            { status: 404 }
          )
        }
        
        const workoutSet = await workoutSetRepository.create(validatedData)
        
        // Check for personal records
        await personalRecordRepository.checkAndUpdateRecords(userId, workoutExercise.exerciseId, validatedData)
        
        // Award XP for completing set
        // await xpManager.awardXP(userId, 'complete_set', 'easy')
        
        return NextResponse.json(
          { success: true, data: workoutSet, message: 'Set logged successfully' },
          { status: 201 }
        )
      }

      case 'copy-workout': {
        const { sourceWorkoutId, targetDate } = data
        
        if (!sourceWorkoutId || !targetDate) {
          return NextResponse.json(
            { success: false, error: 'sourceWorkoutId and targetDate are required for workout copy' },
            { status: 400 }
          )
        }

        const copiedWorkout = await workoutRepository.copyWorkout(
          sourceWorkoutId,
          new Date(targetDate),
          userId
        )

        // Award XP for copying workout
        // await xpManager.awardXP(userId, 'copy_workout', 'easy')

        return NextResponse.json(
          { success: true, data: copiedWorkout, message: 'Workout copied successfully' },
          { status: 201 }
        )
      }

      case 'copy-day': {
        const { sourceDate, targetDate } = data
        
        if (!sourceDate || !targetDate) {
          return NextResponse.json(
            { success: false, error: 'sourceDate and targetDate are required for day copy' },
            { status: 400 }
          )
        }

        const copiedWorkouts = await workoutRepository.copyDay(
          new Date(sourceDate),
          new Date(targetDate),
          userId
        )

        // Award XP for copying day
        // await xpManager.awardXP(userId, 'copy_day', 'medium')

        return NextResponse.json(
          { success: true, data: copiedWorkouts, message: `Day copied successfully (${copiedWorkouts.length} workouts)` },
          { status: 201 }
        )
      }

      case 'copy-week': {
        const { sourceWeekStart, targetWeekStart } = data
        
        if (!sourceWeekStart || !targetWeekStart) {
          return NextResponse.json(
            { success: false, error: 'sourceWeekStart and targetWeekStart are required for week copy' },
            { status: 400 }
          )
        }

        const copiedWorkouts = await workoutRepository.copyWeek(
          new Date(sourceWeekStart),
          new Date(targetWeekStart),
          userId
        )

        // Award XP for copying week
        // await xpManager.awardXP(userId, 'copy_week', 'hard')

        return NextResponse.json(
          { success: true, data: copiedWorkouts, message: `Week copied successfully (${copiedWorkouts.length} workouts)` },
          { status: 201 }
        )
      }

      case 'copy-exercise': {
        const { sourceExerciseId, targetWorkoutId, orderIndex } = data
        
        if (!sourceExerciseId || !targetWorkoutId) {
          return NextResponse.json(
            { success: false, error: 'sourceExerciseId and targetWorkoutId are required for exercise copy' },
            { status: 400 }
          )
        }

        const copiedExercise = await workoutExerciseRepository.copyExercise(
          sourceExerciseId,
          targetWorkoutId,
          userId,
          orderIndex
        )

        // Award XP for copying exercise
        // await xpManager.awardXP(userId, 'copy_exercise', 'easy')

        return NextResponse.json(
          { success: true, data: copiedExercise, message: 'Exercise copied successfully' },
          { status: 201 }
        )
      }

      case 'copy-exercises': {
        const { sourceWorkoutId, targetWorkoutId, exerciseIds } = data
        
        if (!sourceWorkoutId || !targetWorkoutId) {
          return NextResponse.json(
            { success: false, error: 'sourceWorkoutId and targetWorkoutId are required for exercises copy' },
            { status: 400 }
          )
        }

        const copiedExercises = await workoutExerciseRepository.copyExercises(
          sourceWorkoutId,
          targetWorkoutId,
          userId,
          exerciseIds
        )

        // Award XP for copying exercises
        // await xpManager.awardXP(userId, 'copy_exercises', 'medium')

        return NextResponse.json(
          { success: true, data: copiedExercises, message: `Exercises copied successfully (${copiedExercises.length} exercises)` },
          { status: 201 }
        )
      }

      case 'recurring-pattern': {
        const { name, description, workoutTemplateId, frequency, daysOfWeek, timesPerWeek, duration, startDate, endDate } = data
        
        if (!name || !workoutTemplateId || !frequency || !startDate) {
          return NextResponse.json(
            { success: false, error: 'name, workoutTemplateId, frequency, and startDate are required for recurring pattern' },
            { status: 400 }
          )
        }

        // Import the RecurringWorkoutManager
        const { recurringWorkoutManager } = await import('../../../../../lib/fitness/RecurringWorkoutManager')

        const pattern = await recurringWorkoutManager.createRecurringPattern(userId, {
          name,
          description,
          workoutTemplateId,
          frequency,
          daysOfWeek,
          timesPerWeek,
          duration,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : undefined
        })

        // Award XP for creating recurring pattern
        // await xpManager.awardXP(userId, 'create_recurring_pattern', 'medium')

        return NextResponse.json(
          { success: true, data: pattern, message: 'Recurring workout pattern created successfully' },
          { status: 201 }
        )
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Fitness module POST error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/modules/fitness
 * Update fitness module resources
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const body = await request.json()
    const { type, id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required for updates' },
        { status: 400 }
      )
    }

    switch (type) {
      case 'workout-plan': {
        const validatedData = UpdateWorkoutPlanSchema.parse(data)
        
        // Verify ownership
        const existingPlan = await workoutPlanRepository.findById(id)
        if (!existingPlan || existingPlan.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Workout plan not found or access denied' },
            { status: 404 }
          )
        }
        
        const updatedPlan = await workoutPlanRepository.update(id, validatedData)
        
        return NextResponse.json({
          success: true,
          data: updatedPlan,
          message: 'Workout plan updated successfully'
        })
      }

      case 'workout': {
        const validatedData = UpdateWorkoutSchema.parse(data)
        
        // Verify ownership
        const existingWorkout = await workoutRepository.findById(id)
        if (!existingWorkout || existingWorkout.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Workout not found or access denied' },
            { status: 404 }
          )
        }
        
        const updatedWorkout = await workoutRepository.update(id, validatedData)
        
        // Award XP for workout completion if status changed to completed
        if (validatedData.completedAt && !existingWorkout.completedAt) {
          // await xpManager.awardXP(userId, 'complete_workout', 'medium')
          
          // Update workout plan progress if applicable
          if (updatedWorkout.planId) {
            await workoutPlanRepository.updateProgress(updatedWorkout.planId)
          }
        }
        
        return NextResponse.json({
          success: true,
          data: updatedWorkout,
          message: 'Workout updated successfully'
        })
      }

      case 'workout-set': {
        const validatedData = UpdateWorkoutSetSchema.parse(data)
        
        // Verify ownership through workout exercise chain
        const existingSet = await workoutSetRepository.getWithWorkout(id)
        if (!existingSet || existingSet.workoutExercise.workout.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Workout set not found or access denied' },
            { status: 404 }
          )
        }
        
        const updatedSet = await workoutSetRepository.update(id, validatedData)
        
        // Check for new personal records if performance data changed
        if (validatedData.weight || validatedData.reps || validatedData.duration || validatedData.distance) {
          await personalRecordRepository.checkAndUpdateRecords(
            userId, 
            existingSet.workoutExercise.exerciseId, 
            validatedData
          )
        }
        
        return NextResponse.json({
          success: true,
          data: updatedSet,
          message: 'Set updated successfully'
        })
      }

      case 'workout-complete': {
        // Special operation to complete entire workout
        const workout = await workoutRepository.findById(id)
        if (!workout || workout.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Workout not found or access denied' },
            { status: 404 }
          )
        }
        
        const completedWorkout = await workoutRepository.completeWorkout(id)
        
        // Calculate and award XP based on workout difficulty and completion
        // await xpManager.awardXP(userId, 'complete_workout', 'medium')
        
        return NextResponse.json({
          success: true,
          data: completedWorkout,
          message: 'Workout completed successfully'
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Fitness module PUT error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/modules/fitness
 * Delete fitness module resources
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json(
        { success: false, error: 'Type and ID are required' },
        { status: 400 }
      )
    }

    switch (type) {
      case 'workout-plan': {
        // Verify ownership
        const plan = await workoutPlanRepository.findById(id)
        if (!plan || plan.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Workout plan not found or access denied' },
            { status: 404 }
          )
        }
        
        await workoutPlanRepository.delete(id)
        
        return NextResponse.json({
          success: true,
          message: 'Workout plan deleted successfully'
        })
      }

      case 'workout': {
        // Verify ownership
        const workout = await workoutRepository.findById(id)
        if (!workout || workout.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Workout not found or access denied' },
            { status: 404 }
          )
        }
        
        await workoutRepository.delete(id)
        
        return NextResponse.json({
          success: true,
          message: 'Workout deleted successfully'
        })
      }

      case 'exercise-template': {
        // Verify ownership (only custom exercises can be deleted)
        const template = await exerciseTemplateRepository.findById(id)
        if (!template || template.userId !== userId || !template.isCustom) {
          return NextResponse.json(
            { success: false, error: 'Exercise template not found or cannot be deleted' },
            { status: 404 }
          )
        }
        
        await exerciseTemplateRepository.delete(id)
        
        return NextResponse.json({
          success: true,
          message: 'Exercise template deleted successfully'
        })
      }

      case 'workout-exercise': {
        // Verify ownership through workout
        const workoutExercise = await workoutExerciseRepository.getWithWorkout(id)
        if (!workoutExercise || workoutExercise.workout.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Workout exercise not found or access denied' },
            { status: 404 }
          )
        }
        
        await workoutExerciseRepository.delete(id)
        
        return NextResponse.json({
          success: true,
          message: 'Exercise removed from workout successfully'
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Fitness module DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}