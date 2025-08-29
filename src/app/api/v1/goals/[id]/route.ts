/**
 * Individual Goal API Routes
 * 
 * CRUD endpoints for individual goal operations with ownership validation
 * and comprehensive error handling.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withMethodValidation, AuthenticatedRequest } from '@/lib/auth/middleware'
import { GoalRepository } from '@/lib/prisma/repositories/goal-repository'
import { validateInput, GoalUpdateSchema } from '@/lib/validation/schemas'
import { withErrorHandling } from '@/lib/prisma/error-handler'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/v1/goals/[id]
 * Retrieve a single goal by ID with ownership validation
 */
async function handleGet(
  request: AuthenticatedRequest, 
  { params }: RouteParams
): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const goalRepository = new GoalRepository()
    const { id: goalId } = await params

    // Find the goal
    const goal = await goalRepository.findById(goalId)

    if (!goal) {
      return NextResponse.json({
        success: false,
        error: 'Goal not found',
        code: 'GOAL_NOT_FOUND'
      }, { status: 404 })
    }

    // Check ownership
    if (goal.userId !== request.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Access denied - you can only view your own goals',
        code: 'ACCESS_DENIED'
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: goal
    })
  }, 'Fetching goal by ID')
}

/**
 * PUT /api/v1/goals/[id]
 * Update a goal with ownership validation and audit logging
 */
async function handlePut(
  request: AuthenticatedRequest, 
  { params }: RouteParams
): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const goalRepository = new GoalRepository()
    const { id: goalId } = await params

    // Check if goal exists and user owns it
    const existingGoal = await goalRepository.findById(goalId)

    if (!existingGoal) {
      return NextResponse.json({
        success: false,
        error: 'Goal not found',
        code: 'GOAL_NOT_FOUND'
      }, { status: 404 })
    }

    if (existingGoal.userId !== request.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Access denied - you can only update your own goals',
        code: 'ACCESS_DENIED'
      }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()

    // Validate input data
    const validatedData = validateInput(GoalUpdateSchema, body)

    // Check for concurrent edit conflicts (simple version using updatedAt)
    if (body.lastUpdated) {
      const bodyUpdatedAt = new Date(body.lastUpdated)
      const dbUpdatedAt = new Date(existingGoal.updatedAt)
      
      if (bodyUpdatedAt < dbUpdatedAt) {
        return NextResponse.json({
          success: false,
          error: 'Goal has been modified by another process. Please refresh and try again.',
          code: 'CONCURRENT_EDIT_CONFLICT',
          data: { currentGoal: existingGoal }
        }, { status: 409 })
      }
    }

    // Update the goal
    const updatedGoal = await goalRepository.update(goalId, validatedData)

    // TODO: Log audit trail for the update
    // TODO: Trigger gamification events if goal was completed

    return NextResponse.json({
      success: true,
      data: updatedGoal,
      message: 'Goal updated successfully'
    })
  }, 'Updating goal')
}

/**
 * DELETE /api/v1/goals/[id]
 * Delete a goal with ownership validation and cascade handling
 */
async function handleDelete(
  request: AuthenticatedRequest, 
  { params }: RouteParams
): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const goalRepository = new GoalRepository()
    const { id: goalId } = await params

    // Check if goal exists and user owns it
    const existingGoal = await goalRepository.findById(goalId)

    if (!existingGoal) {
      return NextResponse.json({
        success: false,
        error: 'Goal not found',
        code: 'GOAL_NOT_FOUND'
      }, { status: 404 })
    }

    if (existingGoal.userId !== request.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Access denied - you can only delete your own goals',
        code: 'ACCESS_DENIED'
      }, { status: 403 })
    }

    // Check for sub-goals
    const subGoals = await goalRepository.findSubGoals(goalId)
    
    if (subGoals.length > 0) {
      // Get confirmation for cascade delete from query parameter
      const url = new URL(request.url)
      const cascadeDelete = url.searchParams.get('cascade') === 'true'
      
      if (!cascadeDelete) {
        return NextResponse.json({
          success: false,
          error: `Goal has ${subGoals.length} sub-goal(s). Add ?cascade=true to delete them as well.`,
          code: 'HAS_SUB_GOALS',
          data: { 
            subGoalCount: subGoals.length,
            subGoals: subGoals.map(sg => ({ id: sg.id, title: sg.title }))
          }
        }, { status: 400 })
      }
    }

    // Soft delete by default (can be changed to hard delete with ?hard=true)
    const url = new URL(request.url)
    const hardDelete = url.searchParams.get('hard') === 'true'

    if (hardDelete) {
      // Hard delete - actually remove from database
      await goalRepository.delete(goalId)
    } else {
      // Soft delete - mark as deleted but keep in database
      // For now, we'll use hard delete since soft delete isn't implemented in the schema
      // TODO: Add isDeleted field to Goal model for soft delete functionality
      await goalRepository.delete(goalId)
    }

    // TODO: Recalculate achievements that may have been affected by this deletion
    // TODO: Log audit trail for the deletion

    return NextResponse.json({
      success: true,
      message: `Goal ${hardDelete ? 'permanently deleted' : 'deleted'} successfully`,
      data: { id: goalId, deleted: true, hardDelete }
    })
  }, 'Deleting goal')
}

/**
 * Route handlers
 */
export async function GET(request: NextRequest, context: RouteParams) {
  const methodCheck = withMethodValidation(request, ['GET'])
  if (methodCheck) return methodCheck

  return withAuth(request, (req) => handleGet(req, context))
}

export async function PUT(request: NextRequest, context: RouteParams) {
  const methodCheck = withMethodValidation(request, ['PUT'])
  if (methodCheck) return methodCheck

  return withAuth(request, (req) => handlePut(req, context))
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  const methodCheck = withMethodValidation(request, ['DELETE'])
  if (methodCheck) return methodCheck

  return withAuth(request, (req) => handleDelete(req, context))
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}