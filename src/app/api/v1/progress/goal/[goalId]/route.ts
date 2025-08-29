/**
 * Goal Progress Analytics API Routes
 * 
 * Endpoints for retrieving progress data specific to a goal with analytics and chart data.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withMethodValidation, AuthenticatedRequest } from '@/lib/auth/middleware'
import { ProgressRepository } from '@/lib/prisma/repositories/progress-repository'
import { GoalRepository } from '@/lib/prisma/repositories/goal-repository'
import { withErrorHandling } from '@/lib/prisma/error-handler'

interface RouteContext {
  params: Promise<{
    goalId: string
  }>
}

/**
 * GET /api/v1/progress/goal/[goalId]
 * Retrieve all progress entries and analytics for a specific goal
 */
async function handleGet(
  request: AuthenticatedRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const progressRepository = new ProgressRepository()
    const goalRepository = new GoalRepository()
    const { goalId } = await params
    const url = new URL(request.url)

    // Validate goal ID format
    if (!goalId || typeof goalId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid goal ID'
      }, { status: 400 })
    }

    // Verify goal exists and user owns it
    const goal = await goalRepository.findById(goalId)
    
    if (!goal) {
      return NextResponse.json({
        success: false,
        error: 'Goal not found'
      }, { status: 404 })
    }

    if (goal.userId !== request.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized access to goal'
      }, { status: 403 })
    }

    // Parse query parameters for data filtering
    const days = parseInt(url.searchParams.get('days') || '30')
    const includeChart = url.searchParams.get('includeChart') === 'true'
    const includeSummary = url.searchParams.get('includeSummary') !== 'false'

    // Get progress entries for the goal
    const progressEntries = await progressRepository.findByGoal(goalId, 100)

    const response: any = {
      success: true,
      data: {
        goal: {
          id: goal.id,
          title: goal.title,
          difficulty: goal.difficulty,
          priority: goal.priority,
          isCompleted: goal.isCompleted,
          targetDate: goal.targetDate
        },
        progressEntries
      }
    }

    // Include summary analytics if requested
    if (includeSummary) {
      const summary = await progressRepository.getGoalProgressSummary(goalId)
      response.data.summary = summary
    }

    // Include chart data if requested
    if (includeChart) {
      const chartData = await progressRepository.getProgressChartData(goalId, days)
      response.data.chartData = chartData
    }

    return NextResponse.json(response)
  }, 'Fetching goal progress data')
}

/**
 * Main route handler
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const methodCheck = withMethodValidation(request, ['GET'])
  if (methodCheck) return methodCheck

  return withAuth(request, (req) => handleGet(req, context))
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}