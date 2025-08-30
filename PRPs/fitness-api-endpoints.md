# PRP 2: Fitness API Endpoints & Business Logic Implementation

## Overview
Implement comprehensive REST API endpoints for fitness workout system following existing module patterns. This includes CRUD operations for all fitness entities, proper authentication, validation, and error handling.

## Research Context

### Existing API Patterns
- **Reference Implementation**: `/home/tholum/projects/goalassistant/src/app/api/v1/modules/work/route.ts`
- **Authentication Pattern**: Uses `withAuth` middleware with proper user context
- **Validation Pattern**: Zod schemas with comprehensive error handling
- **Module Structure**: Type-based operations within single route file

### API Design Best Practices
- **RESTful Operations**: GET, POST, PUT, DELETE with proper HTTP status codes
- **Type Safety**: Full TypeScript integration with Zod validation
- **Error Handling**: Consistent error responses with detailed messages
- **Performance**: Proper pagination, filtering, and query optimization

## API Endpoint Structure

### Base Route: `/api/v1/modules/fitness`

Following the established pattern from work module, all fitness operations will be handled through type-based queries and operations:

```typescript
// GET endpoints by type
GET /api/v1/modules/fitness?type=dashboard
GET /api/v1/modules/fitness?type=workout-plans&status=active
GET /api/v1/modules/fitness?type=workouts&planId=123&date=2025-01-01
GET /api/v1/modules/fitness?type=workout&id=456
GET /api/v1/modules/fitness?type=exercise-templates&category=chest
GET /api/v1/modules/fitness?type=personal-records&exerciseId=789

// POST endpoints by type
POST /api/v1/modules/fitness (body: { type: 'workout-plan', ...data })
POST /api/v1/modules/fitness (body: { type: 'workout', ...data })
POST /api/v1/modules/fitness (body: { type: 'exercise-template', ...data })
POST /api/v1/modules/fitness (body: { type: 'workout-exercise', ...data })

// PUT endpoints by type  
PUT /api/v1/modules/fitness (body: { type: 'workout', id: '123', ...data })
PUT /api/v1/modules/fitness (body: { type: 'workout-set', id: '456', ...data })

// DELETE endpoints
DELETE /api/v1/modules/fitness?type=workout&id=123
DELETE /api/v1/modules/fitness?type=workout-plan&id=456
```

## Implementation

### Core Route Handler

```typescript
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
  category: z.enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio']),
  muscleGroups: z.array(z.string()),
  equipmentNeeded: z.string().optional(),
  instructions: z.array(z.string()).optional(),
  videoUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional()
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

// Helper function to get user ID (matches work module pattern)
async function getUserId(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    throw new Error('Authentication required')
  }
  // TODO: Implement proper JWT token extraction
  return 'user-placeholder-id' // Replace with actual implementation
}
```

### GET Handler Implementation

```typescript
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
        const category = searchParams.get('category')
        const search = searchParams.get('search')
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
        const exerciseId = searchParams.get('exerciseId')
        const recordType = searchParams.get('recordType')
        
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
```

### POST Handler Implementation

```typescript
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
```

### PUT Handler Implementation

```typescript
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
```

### DELETE Handler Implementation

```typescript
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
```

## Repository Pattern Implementation

### Fitness Repository Structure

```typescript
// src/lib/prisma/repositories/fitness-repository.ts

export class WorkoutPlanRepository {
  async create(data: CreateWorkoutPlanInput) {
    return await prisma.workoutPlan.create({ data })
  }
  
  async findById(id: string) {
    return await prisma.workoutPlan.findUnique({
      where: { id },
      include: {
        workouts: {
          include: {
            exercises: {
              include: {
                exercise: true,
                sets: true
              }
            }
          }
        }
      }
    })
  }
  
  async getUserWorkoutPlans(userId: string, options: GetWorkoutPlansOptions) {
    // Implementation with filtering, pagination
  }
  
  async update(id: string, data: UpdateWorkoutPlanInput) {
    return await prisma.workoutPlan.update({
      where: { id },
      data
    })
  }
  
  async delete(id: string) {
    return await prisma.workoutPlan.delete({ where: { id } })
  }
}

export class WorkoutRepository {
  // Similar pattern for workout operations
}

export class ExerciseTemplateRepository {
  // Exercise template operations
}

// Export repository instances
export const workoutPlanRepository = new WorkoutPlanRepository()
export const workoutRepository = new WorkoutRepository()
export const exerciseTemplateRepository = new ExerciseTemplateRepository()
// ... other repositories
```

## Implementation Tasks

### Task 1: Route Handler Setup
- [ ] Create `/src/app/api/v1/modules/fitness/route.ts`
- [ ] Implement all validation schemas with Zod
- [ ] Add proper TypeScript types for all operations
- [ ] Test basic endpoint structure

### Task 2: Repository Implementation
- [ ] Create fitness repository classes following work module pattern
- [ ] Implement all CRUD operations with proper relationships
- [ ] Add transaction support for complex operations
- [ ] Include proper error handling and logging

### Task 3: Authentication Integration  
- [ ] Implement proper JWT token extraction (replace placeholder)
- [ ] Add user context validation for all operations
- [ ] Test authentication middleware integration
- [ ] Verify user ownership checks work correctly

### Task 4: Validation & Error Handling
- [ ] Test all Zod validation schemas with edge cases
- [ ] Implement comprehensive error responses
- [ ] Add proper HTTP status codes for all scenarios
- [ ] Test error handling with malformed requests

### Task 5: Testing Suite
- [ ] Create API test suite following work module pattern
- [ ] Test all CRUD operations with database
- [ ] Test authentication and authorization
- [ ] Test validation errors and edge cases

## Validation Gates

### API Testing
```bash
# Test GET endpoints
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/v1/modules/fitness?type=dashboard"

# Test POST workout plan
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"type":"workout-plan","name":"Test Plan","description":"Test"}' \
  http://localhost:3000/api/v1/modules/fitness

# Test PUT workout completion  
curl -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"type":"workout","id":"123","completedAt":"2025-01-01T12:00:00Z"}' \
  http://localhost:3000/api/v1/modules/fitness
```

### Repository Testing
```typescript
// Test workout plan creation
const plan = await workoutPlanRepository.create({
  userId: 'test-user',
  name: 'Test Plan',
  description: 'Test Description',
  startDate: new Date(),
  isTemplate: false
})

expect(plan.id).toBeDefined()
expect(plan.name).toBe('Test Plan')
expect(plan.userId).toBe('test-user')

// Test workout with exercises
const workout = await workoutRepository.create({
  userId: 'test-user',
  planId: plan.id,
  name: 'Test Workout',
  workoutType: 'strength',
  scheduledDate: new Date()
})

const workoutExercise = await workoutExerciseRepository.create({
  workoutId: workout.id,
  exerciseId: 'exercise-template-id',
  orderIndex: 0,
  targetSets: 3,
  targetReps: 10
})

expect(workoutExercise.workoutId).toBe(workout.id)
expect(workoutExercise.targetSets).toBe(3)
```

## Performance Considerations

### Query Optimization
- Use proper joins instead of N+1 queries
- Implement pagination for large datasets
- Cache frequently accessed exercise templates
- Use database indexes for common query patterns

### Error Handling
- Provide detailed validation errors
- Log all errors for debugging
- Return consistent error response format
- Handle database connection failures gracefully

## Success Criteria

### Technical Requirements
- [ ] All CRUD operations work without errors
- [ ] Proper authentication and authorization on all endpoints
- [ ] Comprehensive validation with detailed error messages
- [ ] Response times under 500ms for single record operations
- [ ] Full TypeScript type safety

### Integration Requirements
- [ ] Follows existing work module patterns exactly
- [ ] Integrates with existing authentication system
- [ ] Works with Prisma database layer
- [ ] Maintains consistent API response format
- [ ] Supports all required fitness functionality

This PRP provides complete API functionality for the fitness module with proper validation, authentication, error handling, and performance optimization following established patterns.