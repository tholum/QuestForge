/**
 * Achievements API Routes
 * 
 * Manages user achievements and progress tracking.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withMethodValidation, AuthenticatedRequest } from '@/lib/auth/middleware'
import { withErrorHandling } from '@/lib/prisma/error-handler'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for achievement queries
const AchievementQuerySchema = z.object({
  moduleId: z.string().optional(),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']).optional(),
  completed: z.boolean().optional(),
  page: z.number().min(1).optional().default(1),
  limit: z.number().min(1).max(100).optional().default(20)
})

const AchievementCheckSchema = z.object({
  achievementId: z.string().min(1, 'Achievement ID is required')
})

/**
 * Check if user meets achievement conditions
 */
async function checkAchievementConditions(userId: string, achievement: any): Promise<{ progress: number; isCompleted: boolean }> {
  const conditions = achievement.conditions
  
  // This is a simplified implementation - in a real app, you'd have more complex condition checking
  // based on the achievement type and conditions stored in the JSON
  
  try {
    let progress = 0
    let isCompleted = false
    
    switch (conditions.type) {
      case 'goals_completed': {
        const completedCount = await prisma.goal.count({
          where: {
            userId,
            isCompleted: true,
            ...(achievement.moduleId && { moduleId: achievement.moduleId })
          }
        })
        progress = Math.min(completedCount / conditions.target, 1) * 100
        isCompleted = completedCount >= conditions.target
        break
      }
      
      case 'streak_days': {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { streakCount: true }
        })
        const currentStreak = user?.streakCount || 0
        progress = Math.min(currentStreak / conditions.target, 1) * 100
        isCompleted = currentStreak >= conditions.target
        break
      }
      
      case 'xp_earned': {
        const xpData = await prisma.progress.aggregate({
          where: {
            userId,
            ...(achievement.moduleId && {
              goal: { moduleId: achievement.moduleId }
            })
          },
          _sum: { xpEarned: true }
        })
        const totalXp = xpData._sum.xpEarned || 0
        progress = Math.min(totalXp / conditions.target, 1) * 100
        isCompleted = totalXp >= conditions.target
        break
      }
      
      case 'level_reached': {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { currentLevel: true }
        })
        const currentLevel = user?.currentLevel || 1
        progress = Math.min(currentLevel / conditions.target, 1) * 100
        isCompleted = currentLevel >= conditions.target
        break
      }
      
      case 'progress_entries': {
        const entriesCount = await prisma.progress.count({
          where: {
            userId,
            ...(achievement.moduleId && {
              goal: { moduleId: achievement.moduleId }
            })
          }
        })
        progress = Math.min(entriesCount / conditions.target, 1) * 100
        isCompleted = entriesCount >= conditions.target
        break
      }
      
      default:
        // Default to not completed for unknown achievement types
        progress = 0
        isCompleted = false
    }
    
    return {
      progress: Math.round(progress * 100) / 100,
      isCompleted
    }
  } catch (error) {
    console.error('Error checking achievement conditions:', error)
    return { progress: 0, isCompleted: false }
  }
}

/**
 * Get user's achievement progress
 */
async function getUserAchievementProgress(userId: string, achievementId: string) {
  const userAchievement = await prisma.userAchievement.findUnique({
    where: {
      userId_achievementId: {
        userId,
        achievementId
      }
    }
  })
  
  const achievement = await prisma.achievement.findUnique({
    where: { id: achievementId }
  })
  
  if (!achievement) {
    return null
  }
  
  // Check current progress
  const { progress, isCompleted } = await checkAchievementConditions(userId, achievement)
  
  if (!userAchievement) {
    // Create user achievement record if it doesn't exist and there's progress
    if (progress > 0) {
      return await prisma.userAchievement.create({
        data: {
          userId,
          achievementId,
          progress,
          isCompleted,
          unlockedAt: isCompleted ? new Date() : new Date()
        },
        include: {
          achievement: true
        }
      })
    }
    
    return {
      userId,
      achievementId,
      progress: 0,
      isCompleted: false,
      unlockedAt: null,
      achievement
    }
  }
  
  // Update existing record if progress has changed
  if (userAchievement.progress !== progress || userAchievement.isCompleted !== isCompleted) {
    const updatedAchievement = await prisma.userAchievement.update({
      where: { id: userAchievement.id },
      data: {
        progress,
        isCompleted,
        ...(isCompleted && !userAchievement.isCompleted && { unlockedAt: new Date() })
      },
      include: {
        achievement: true
      }
    })
    
    // Award XP if achievement was just completed
    if (isCompleted && !userAchievement.isCompleted) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalXp: {
            increment: achievement.xpReward
          }
        }
      })
    }
    
    return updatedAchievement
  }
  
  return {
    ...userAchievement,
    achievement
  }
}

/**
 * GET /api/v1/achievements
 * Get user achievements with progress
 */
async function handleGet(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const url = new URL(request.url)
    
    const queryParams = {
      moduleId: url.searchParams.get('moduleId') || undefined,
      tier: url.searchParams.get('tier') as 'bronze' | 'silver' | 'gold' | 'platinum' || undefined,
      completed: url.searchParams.get('completed') === 'true' ? true : 
                url.searchParams.get('completed') === 'false' ? false : undefined,
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
    }
    
    const validatedQuery = AchievementQuerySchema.parse(queryParams)
    const offset = (validatedQuery.page - 1) * validatedQuery.limit
    
    // Build where clause for achievements
    const achievementWhere: any = {}
    if (validatedQuery.moduleId) {
      achievementWhere.moduleId = validatedQuery.moduleId
    }
    if (validatedQuery.tier) {
      achievementWhere.tier = validatedQuery.tier
    }
    
    // Get all achievements with pagination
    const [achievements, totalCount] = await Promise.all([
      prisma.achievement.findMany({
        where: achievementWhere,
        skip: offset,
        take: validatedQuery.limit,
        orderBy: [
          { tier: 'asc' },
          { createdAt: 'asc' }
        ]
      }),
      prisma.achievement.count({
        where: achievementWhere
      })
    ])
    
    // Get user progress for each achievement
    const achievementsWithProgress = await Promise.all(
      achievements.map(async (achievement) => {
        const userProgress = await getUserAchievementProgress(request.user.id, achievement.id)
        
        return {
          ...achievement,
          userProgress: userProgress ? {
            progress: userProgress.progress,
            isCompleted: userProgress.isCompleted,
            unlockedAt: userProgress.unlockedAt
          } : {
            progress: 0,
            isCompleted: false,
            unlockedAt: null
          }
        }
      })
    )
    
    // Filter by completion status if specified
    const filteredAchievements = validatedQuery.completed !== undefined
      ? achievementsWithProgress.filter(a => a.userProgress.isCompleted === validatedQuery.completed)
      : achievementsWithProgress
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / validatedQuery.limit)
    
    // Get achievement summary stats
    const [completedCount, totalXpFromAchievements] = await Promise.all([
      prisma.userAchievement.count({
        where: {
          userId: request.user.id,
          isCompleted: true
        }
      }),
      prisma.userAchievement.aggregate({
        where: {
          userId: request.user.id,
          isCompleted: true
        },
        _sum: {
          achievement: {
            xpReward: true
          }
        }
      }).then(result => 
        prisma.achievement.aggregate({
          where: {
            id: {
              in: await prisma.userAchievement.findMany({
                where: { userId: request.user.id, isCompleted: true },
                select: { achievementId: true }
              }).then(records => records.map(r => r.achievementId))
            }
          },
          _sum: { xpReward: true }
        })
      )
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        achievements: filteredAchievements,
        summary: {
          total: totalCount,
          completed: completedCount,
          completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
          totalXpFromAchievements: totalXpFromAchievements._sum.xpReward || 0
        }
      },
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: filteredAchievements.length,
        totalPages,
        hasNextPage: validatedQuery.page < totalPages,
        hasPreviousPage: validatedQuery.page > 1
      },
      message: 'Achievements retrieved successfully'
    })
  }, 'Fetching user achievements')
}

/**
 * POST /api/v1/achievements
 * Check and unlock achievements manually
 */
async function handlePost(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const body = await request.json()
    const { action, achievementId } = body
    
    if (action === 'check') {
      // Validate achievement ID
      const validatedData = AchievementCheckSchema.parse({ achievementId })
      
      // Check and update achievement progress
      const updatedProgress = await getUserAchievementProgress(request.user.id, validatedData.achievementId)
      
      if (!updatedProgress) {
        return NextResponse.json({
          success: false,
          error: 'Achievement not found'
        }, { status: 404 })
      }
      
      return NextResponse.json({
        success: true,
        data: updatedProgress,
        message: updatedProgress.isCompleted 
          ? 'Achievement unlocked!' 
          : 'Achievement progress updated'
      })
    }
    
    if (action === 'check_all') {
      // Check progress for all achievements
      const allAchievements = await prisma.achievement.findMany()
      
      const updatedAchievements = await Promise.all(
        allAchievements.map(achievement => 
          getUserAchievementProgress(request.user.id, achievement.id)
        )
      )
      
      const newlyCompleted = updatedAchievements.filter(ua => ua?.isCompleted).length
      
      return NextResponse.json({
        success: true,
        data: {
          checkedCount: allAchievements.length,
          newlyCompleted,
          achievements: updatedAchievements
        },
        message: `Checked ${allAchievements.length} achievements, ${newlyCompleted} newly completed`
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action specified'
    }, { status: 400 })
  }, 'Processing achievement action')
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