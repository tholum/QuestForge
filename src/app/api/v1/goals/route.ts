/**
 * Goals API Routes
 * 
 * Main CRUD endpoints for goal management with authentication, validation,
 * and comprehensive error handling.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withMethodValidation, AuthenticatedRequest } from '@/lib/auth/middleware'
import { GoalRepository } from '@/lib/prisma/repositories/goal-repository'
import { validateInput, GoalCreateSchema, GoalQuerySchema } from '@/lib/validation/schemas'
import { withErrorHandling } from '@/lib/prisma/error-handler'

/**
 * GET /api/v1/goals
 * Retrieve goals for the authenticated user with filtering, pagination, and search
 */
async function handleGet(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const goalRepository = new GoalRepository()
    const url = new URL(request.url)
    
    // Extract query parameters
    const queryParams = {
      userId: request.user.id, // Always filter by authenticated user
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: Math.min(parseInt(url.searchParams.get('limit') || '20'), 100), // Max 100 items per page
      moduleId: url.searchParams.get('moduleId') || undefined,
      search: url.searchParams.get('search') || undefined,
      filter: url.searchParams.get('filter') as 'all' | 'active' | 'completed' | undefined,
      priority: url.searchParams.get('priority') || undefined,
      difficulty: url.searchParams.get('difficulty') || undefined,
      sortBy: url.searchParams.get('sort') || 'createdAt',
      sortOrder: (url.searchParams.get('order') as 'asc' | 'desc') || 'desc',
      targetDateAfter: url.searchParams.get('targetDateAfter') 
        ? new Date(url.searchParams.get('targetDateAfter')!) 
        : undefined,
      targetDateBefore: url.searchParams.get('targetDateBefore') 
        ? new Date(url.searchParams.get('targetDateBefore')!) 
        : undefined,
    }

    // Convert page to offset
    const offset = (queryParams.page - 1) * queryParams.limit

    // Build query object for validation
    const query = {
      userId: queryParams.userId,
      moduleId: queryParams.moduleId,
      search: queryParams.search,
      isCompleted: queryParams.filter === 'completed' 
        ? true 
        : queryParams.filter === 'active' 
        ? false 
        : undefined,
      priority: queryParams.priority,
      difficulty: queryParams.difficulty,
      targetDateAfter: queryParams.targetDateAfter,
      targetDateBefore: queryParams.targetDateBefore,
      limit: queryParams.limit,
      offset: offset,
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder,
    }

    // Validate query parameters
    const validatedQuery = validateInput(GoalQuerySchema, query)

    // Execute query
    const [goals, totalCount] = await Promise.all([
      goalRepository.findMany(validatedQuery),
      goalRepository.count(validatedQuery)
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / queryParams.limit)
    const hasNextPage = queryParams.page < totalPages
    const hasPreviousPage = queryParams.page > 1

    return NextResponse.json({
      success: true,
      data: goals,
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total: totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage
      },
      filters: {
        moduleId: queryParams.moduleId,
        search: queryParams.search,
        filter: queryParams.filter,
        priority: queryParams.priority,
        difficulty: queryParams.difficulty,
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder
      }
    })
  }, 'Fetching goals')
}

/**
 * POST /api/v1/goals
 * Create a new goal for the authenticated user
 */
async function handlePost(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const goalRepository = new GoalRepository()
    
    // Parse request body
    const body = await request.json()
    
    // Add user ID from authenticated context
    const goalData = {
      ...body,
      userId: request.user.id
    }

    // Validate input data
    const validatedData = validateInput(GoalCreateSchema, goalData)

    // Create the goal
    const createdGoal = await goalRepository.create(validatedData)

    // TODO: Trigger gamification events (XP rewards, achievement checks)
    // This will be implemented in Phase 3

    return NextResponse.json({
      success: true,
      data: createdGoal,
      message: 'Goal created successfully'
    }, { status: 201 })
  }, 'Creating goal')
}

/**
 * Main route handler
 */
export async function GET(request: NextRequest) {
  // Validate HTTP method
  const methodCheck = withMethodValidation(request, ['GET'])
  if (methodCheck) return methodCheck

  // Apply authentication and handle request
  return withAuth(request, handleGet)
}

export async function POST(request: NextRequest) {
  // Validate HTTP method
  const methodCheck = withMethodValidation(request, ['POST'])
  if (methodCheck) return methodCheck

  // Apply authentication and handle request
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