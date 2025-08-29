/**
 * Progress API Routes
 * 
 * Main CRUD endpoints for progress tracking with authentication, validation,
 * XP calculation, and comprehensive error handling.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withMethodValidation, AuthenticatedRequest } from '@/lib/auth/middleware'
import { ProgressRepository } from '@/lib/prisma/repositories/progress-repository'
import { GoalRepository } from '@/lib/prisma/repositories/goal-repository'
import { XPManager } from '@/lib/gamification/XPManager'
import { validateInput, ProgressCreateSchema, ProgressQuerySchema } from '@/lib/validation/schemas'
import { withErrorHandling } from '@/lib/prisma/error-handler'
import { prisma } from '@/lib/prisma/client'

/**
 * Calculate XP for progress entry based on goal difficulty and progress value
 */
function calculateProgressXP(
  progressValue: number,
  goalDifficulty: string,
  streakMultiplier: number = 1,
  completionBonus: boolean = false
): number {
  const baseXP = Math.floor(progressValue / 10) // 1 XP per 10% progress
  
  const difficultyMultipliers = {
    easy: 1,
    medium: 1.5,
    hard: 2,
    expert: 3
  }
  
  const difficultyMultiplier = difficultyMultipliers[goalDifficulty as keyof typeof difficultyMultipliers] || 1.5
  const bonusXP = completionBonus ? 50 : 0
  
  return Math.max(1, Math.floor(
    (baseXP * difficultyMultiplier * streakMultiplier) + bonusXP
  ))
}

/**
 * GET /api/v1/progress
 * Retrieve progress entries for the authenticated user with filtering and pagination
 */
async function handleGet(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const progressRepository = new ProgressRepository()
    const url = new URL(request.url)
    
    // Extract query parameters
    const queryParams = {
      userId: request.user.id, // Always filter by authenticated user
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: Math.min(parseInt(url.searchParams.get('limit') || '20'), 100),
      goalId: url.searchParams.get('goalId') || undefined,
      recordedAfter: url.searchParams.get('recordedAfter') 
        ? new Date(url.searchParams.get('recordedAfter')!) 
        : undefined,
      recordedBefore: url.searchParams.get('recordedBefore') 
        ? new Date(url.searchParams.get('recordedBefore')!) 
        : undefined,
      minValue: url.searchParams.get('minValue') 
        ? parseFloat(url.searchParams.get('minValue')!) 
        : undefined,
      maxValue: url.searchParams.get('maxValue') 
        ? parseFloat(url.searchParams.get('maxValue')!) 
        : undefined,
      minXp: url.searchParams.get('minXp') 
        ? parseInt(url.searchParams.get('minXp')!) 
        : undefined,
      sortBy: url.searchParams.get('sort') || 'recordedAt',
      sortOrder: (url.searchParams.get('order') as 'asc' | 'desc') || 'desc',
    }

    // Convert page to offset
    const offset = (queryParams.page - 1) * queryParams.limit

    // Build query object for validation
    const query = {
      userId: queryParams.userId,
      goalId: queryParams.goalId,
      recordedAfter: queryParams.recordedAfter,
      recordedBefore: queryParams.recordedBefore,
      minValue: queryParams.minValue,
      maxValue: queryParams.maxValue,
      minXp: queryParams.minXp,
      limit: queryParams.limit,
      offset: offset,
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder,
    }

    // Validate query parameters
    const validatedQuery = validateInput(ProgressQuerySchema, query)

    // Execute query
    const [progressEntries, totalCount] = await Promise.all([
      progressRepository.findMany(validatedQuery),
      progressRepository.count(validatedQuery)
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / queryParams.limit)
    const hasNextPage = queryParams.page < totalPages
    const hasPreviousPage = queryParams.page > 1

    return NextResponse.json({
      success: true,
      data: progressEntries,
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage
      },
      filters: {
        goalId: queryParams.goalId,
        recordedAfter: queryParams.recordedAfter,
        recordedBefore: queryParams.recordedBefore,
        minValue: queryParams.minValue,
        maxValue: queryParams.maxValue,
        minXp: queryParams.minXp,
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder
      }
    })
  }, 'Fetching progress entries')
}

/**
 * POST /api/v1/progress
 * Create a new progress entry with XP calculation and achievement checking
 */
async function handlePost(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const progressRepository = new ProgressRepository()
    const goalRepository = new GoalRepository()
    const xpManager = new XPManager(prisma.$client)
    
    // Parse request body
    const body = await request.json()
    
    // Add user ID from authenticated context
    const progressData = {
      ...body,
      userId: request.user.id
    }

    // Validate input data
    const validatedData = validateInput(ProgressCreateSchema, progressData)

    // Get the goal to check difficulty and completion status
    const goal = await goalRepository.findById(validatedData.goalId)
    if (!goal) {
      return NextResponse.json({
        success: false,
        error: 'Goal not found'
      }, { status: 404 })
    }

    // Verify user owns the goal
    if (goal.userId !== request.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized access to goal'
      }, { status: 403 })
    }

    // Get user's current streak for XP calculation
    const streakData = await xpManager.getUserStreak(request.user.id)
    const streakMultiplier = 1 + (streakData.currentStreak * 0.1) // 10% bonus per streak day

    // Calculate XP based on progress value and goal difficulty
    const completionBonus = (validatedData.value / validatedData.maxValue) >= 1.0
    const calculatedXP = calculateProgressXP(
      (validatedData.value / validatedData.maxValue) * 100, // Convert to percentage
      goal.difficulty,
      streakMultiplier,
      completionBonus
    )

    // Update the validated data with calculated XP
    const progressWithXP = {
      ...validatedData,
      xpEarned: calculatedXP
    }

    // Create the progress entry
    const createdProgress = await progressRepository.create(progressWithXP)

    // Award XP to user and update streak
    const xpResult = await xpManager.awardXP(
      request.user.id,
      'update_progress',
      goal.difficulty as any,
      streakData.currentStreak
    )

    // Update user's streak
    const updatedStreak = await xpManager.updateStreak(request.user.id)

    // If goal is completed, mark it as completed and award completion XP
    if (completionBonus && !goal.isCompleted) {
      await goalRepository.update(goal.id, { isCompleted: true })
      
      // Award completion XP
      await xpManager.awardXP(
        request.user.id,
        'complete_goal',
        goal.difficulty as any,
        updatedStreak.currentStreak
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...createdProgress,
        xpAwarded: xpResult.xpAwarded,
        leveledUp: xpResult.leveledUp,
        newLevel: xpResult.newLevel,
        streak: updatedStreak.currentStreak,
        goalCompleted: completionBonus && !goal.isCompleted
      },
      message: 'Progress recorded successfully'
    }, { status: 201 })
  }, 'Creating progress entry')
}

/**
 * Main route handlers
 */
export async function GET(request: NextRequest) {
  const methodCheck = withMethodValidation(request, ['GET'])
  if (methodCheck) return methodCheck

  return withAuth(request, handleGet)
}

export async function POST(request: NextRequest) {
  const methodCheck = withMethodValidation(request, ['POST'])
  if (methodCheck) return methodCheck

  return withAuth(request, handlePost)
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}