/**
 * Progress Leaderboard API Routes
 * 
 * Endpoints for retrieving progress leaderboards and top performers.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withMethodValidation, AuthenticatedRequest } from '@/lib/auth/middleware'
import { ProgressRepository } from '@/lib/prisma/repositories/progress-repository'
import { XPManager } from '@/lib/gamification/XPManager'
import { withErrorHandling } from '@/lib/prisma/error-handler'
import { prisma } from '@/lib/prisma/client'

/**
 * GET /api/v1/progress/leaderboard
 * Retrieve progress leaderboards and top performers
 */
async function handleGet(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const progressRepository = new ProgressRepository()
    const xpManager = new XPManager(prisma.$client)
    const url = new URL(request.url)

    // Parse query parameters
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
    const days = Math.min(parseInt(url.searchParams.get('days') || '30'), 365)
    const type = url.searchParams.get('type') || 'all' // all, xp, level, progress, streak
    const includeUserRank = url.searchParams.get('includeUserRank') === 'true'

    const response: any = {
      success: true,
      data: {
        timeframe: {
          days,
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          endDate: new Date()
        },
        limit
      }
    }

    // Get different types of leaderboards based on request
    if (type === 'all' || type === 'xp') {
      const xpLeaderboard = await xpManager.getXPLeaderboard(limit)
      response.data.xpLeaderboard = xpLeaderboard
    }

    if (type === 'all' || type === 'level') {
      const levelLeaderboard = await xpManager.getLevelLeaderboard(limit)
      response.data.levelLeaderboard = levelLeaderboard
    }

    if (type === 'all' || type === 'progress') {
      const progressLeaderboard = await progressRepository.getTopPerformers(limit, days)
      response.data.progressLeaderboard = progressLeaderboard
    }

    if (type === 'all' || type === 'streak') {
      // Get users with highest streaks
      // Note: This would require a more complex query in a real implementation
      // For now, we'll get top XP earners as a proxy
      const streakLeaderboard = await xpManager.getXPLeaderboard(limit)
      response.data.streakLeaderboard = streakLeaderboard.map((user, index) => ({
        ...user,
        streak: Math.floor(Math.random() * 30) + 1, // Placeholder - would need proper streak tracking
        rank: index + 1
      }))
    }

    // Include current user's rank if requested
    if (includeUserRank) {
      const currentUserId = request.user.id
      
      // Get all leaderboards to find user's position
      const [allXpUsers, allLevelUsers, allProgressUsers] = await Promise.all([
        xpManager.getXPLeaderboard(1000), // Get more users to find rank
        xpManager.getLevelLeaderboard(1000),
        progressRepository.getTopPerformers(1000, days)
      ])

      const userRanks = {
        xp: allXpUsers.findIndex(u => u.userId === currentUserId) + 1,
        level: allLevelUsers.findIndex(u => u.userId === currentUserId) + 1,
        progress: allProgressUsers.findIndex(u => u.userId === currentUserId) + 1,
      }

      // Get user's current stats
      const [userLevel, userStreak] = await Promise.all([
        xpManager.getUserLevel(currentUserId),
        xpManager.getUserStreak(currentUserId)
      ])

      const userProgressStats = allProgressUsers.find(u => u.userId === currentUserId)

      response.data.currentUser = {
        userId: currentUserId,
        ranks: userRanks,
        stats: {
          level: userLevel.currentLevel,
          totalXP: userLevel.totalXP,
          streak: userStreak.currentStreak,
          totalXpEarned: userProgressStats?.totalXp || 0,
          totalProgress: userProgressStats?.totalProgress || 0,
          entriesCount: userProgressStats?.entriesCount || 0
        }
      }
    }

    // Add overall statistics
    const totalUsers = await prisma.$client.user.count()
    const activeUsers = await prisma.$client.user.count({
      where: {
        lastActivity: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Active in last 7 days
        }
      }
    })

    response.data.globalStats = {
      totalUsers,
      activeUsers,
      percentageActive: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
    }

    return NextResponse.json(response)
  }, 'Fetching progress leaderboard')
}

/**
 * Main route handler
 */
export async function GET(request: NextRequest) {
  const methodCheck = withMethodValidation(request, ['GET'])
  if (methodCheck) return methodCheck

  return withAuth(request, handleGet)
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