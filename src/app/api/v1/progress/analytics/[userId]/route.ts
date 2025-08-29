/**
 * User Progress Analytics API Routes
 * 
 * Endpoints for retrieving comprehensive progress analytics for a specific user.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withMethodValidation, AuthenticatedRequest } from '@/lib/auth/middleware'
import { ProgressRepository } from '@/lib/prisma/repositories/progress-repository'
import { XPManager } from '@/lib/gamification/XPManager'
import { withErrorHandling } from '@/lib/prisma/error-handler'
import { prisma } from '@/lib/prisma/client'

interface RouteContext {
  params: Promise<{
    userId: string
  }>
}

/**
 * GET /api/v1/progress/analytics/[userId]
 * Retrieve comprehensive progress analytics for a user
 */
async function handleGet(
  request: AuthenticatedRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const progressRepository = new ProgressRepository()
    const xpManager = new XPManager(prisma.$client)
    const { userId } = await params
    const url = new URL(request.url)

    // Validate user ID format
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID'
      }, { status: 400 })
    }

    // Verify user can only access their own analytics
    if (userId !== request.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized access to user analytics'
      }, { status: 403 })
    }

    // Parse query parameters
    const days = Math.min(parseInt(url.searchParams.get('days') || '30'), 365)
    const includeTopPerformers = url.searchParams.get('includeLeaderboard') === 'true'

    // Get user progress analytics
    const [
      progressAnalytics,
      userLevel,
      streakData,
      recentProgress
    ] = await Promise.all([
      progressRepository.getUserProgressAnalytics(userId, days),
      xpManager.getUserLevel(userId),
      xpManager.getUserStreak(userId),
      progressRepository.findByUser(userId, 10)
    ])

    const response: any = {
      success: true,
      data: {
        userId,
        timeframe: {
          days,
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          endDate: new Date()
        },
        analytics: progressAnalytics,
        gamification: {
          level: userLevel,
          streak: streakData
        },
        recentProgress
      }
    }

    // Include leaderboard data if requested
    if (includeTopPerformers) {
      const [xpLeaderboard, levelLeaderboard] = await Promise.all([
        xpManager.getXPLeaderboard(10),
        xpManager.getLevelLeaderboard(10)
      ])
      
      response.data.leaderboards = {
        xp: xpLeaderboard,
        level: levelLeaderboard
      }
    }

    // Calculate insights and trends
    const insights = {
      dailyAverage: progressAnalytics.totalEntries / days,
      xpPerEntry: progressAnalytics.totalEntries > 0 
        ? Math.round(progressAnalytics.totalXpEarned / progressAnalytics.totalEntries)
        : 0,
      streakHealth: streakData.currentStreak >= 7 ? 'excellent' 
        : streakData.currentStreak >= 3 ? 'good' 
        : streakData.currentStreak >= 1 ? 'fair' 
        : 'needs_attention',
      consistencyGrade: progressAnalytics.consistencyScore >= 80 ? 'A'
        : progressAnalytics.consistencyScore >= 60 ? 'B'
        : progressAnalytics.consistencyScore >= 40 ? 'C'
        : progressAnalytics.consistencyScore >= 20 ? 'D'
        : 'F'
    }

    response.data.insights = insights

    return NextResponse.json(response)
  }, 'Fetching user progress analytics')
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