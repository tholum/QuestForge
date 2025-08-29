/**
 * User Profile API Routes
 * 
 * Manages user profile information with statistics and preferences.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withMethodValidation, AuthenticatedRequest } from '@/lib/auth/middleware'
import { withErrorHandling } from '@/lib/prisma/error-handler'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for profile updates
const ProfileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  bio: z.string().max(500, 'Bio too long').optional(),
  profilePicture: z.string().url('Invalid profile picture URL').optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  preferences: z.record(z.any()).optional()
})

/**
 * Calculate user statistics
 */
async function calculateUserStats(userId: string) {
  const [
    totalGoals,
    completedGoals,
    activeGoals,
    totalProgress,
    totalXp,
    achievementCount,
    streakInfo,
    moduleUsage,
    recentActivity
  ] = await Promise.all([
    // Total goals
    prisma.goal.count({
      where: { userId }
    }),
    
    // Completed goals
    prisma.goal.count({
      where: { userId, isCompleted: true }
    }),
    
    // Active goals
    prisma.goal.count({
      where: { userId, isCompleted: false }
    }),
    
    // Total progress entries
    prisma.progress.count({
      where: { userId }
    }),
    
    // Total XP earned
    prisma.progress.aggregate({
      where: { userId },
      _sum: { xpEarned: true }
    }),
    
    // Total achievements
    prisma.userAchievement.count({
      where: { userId, isCompleted: true }
    }),
    
    // User streak and level info
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        streakCount: true,
        currentLevel: true,
        totalXp: true,
        lastActivity: true,
        createdAt: true
      }
    }),
    
    // Module usage stats
    prisma.goal.groupBy({
      by: ['moduleId'],
      where: { userId },
      _count: {
        id: true
      }
    }),
    
    // Recent activity (last 10 progress entries)
    prisma.progress.findMany({
      where: { userId },
      take: 10,
      orderBy: { recordedAt: 'desc' },
      include: {
        goal: {
          select: {
            title: true,
            module: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })
  ])
  
  // Calculate completion rate
  const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0
  
  // Calculate days since joining
  const daysSinceJoined = streakInfo?.createdAt 
    ? Math.floor((new Date().getTime() - streakInfo.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  
  // Get module names for usage stats
  const moduleIds = moduleUsage.map(m => m.moduleId)
  const modules = await prisma.module.findMany({
    where: { id: { in: moduleIds } },
    select: { id: true, name: true }
  })
  
  const moduleMap = modules.reduce((acc, module) => {
    acc[module.id] = module.name
    return acc
  }, {} as Record<string, string>)
  
  const moduleUsageWithNames = moduleUsage.map(usage => ({
    moduleId: usage.moduleId,
    moduleName: moduleMap[usage.moduleId] || 'Unknown Module',
    goalCount: usage._count.id
  }))
  
  return {
    goals: {
      total: totalGoals,
      completed: completedGoals,
      active: activeGoals,
      completionRate: Math.round(completionRate * 100) / 100
    },
    activity: {
      totalProgressEntries: totalProgress,
      totalXpEarned: totalXp._sum.xpEarned || 0,
      currentStreak: streakInfo?.streakCount || 0,
      lastActive: streakInfo?.lastActivity,
      daysSinceJoined
    },
    gamification: {
      currentLevel: streakInfo?.currentLevel || 1,
      totalXp: streakInfo?.totalXp || 0,
      achievementCount,
      streakCount: streakInfo?.streakCount || 0
    },
    moduleUsage: moduleUsageWithNames,
    recentActivity: recentActivity.map(entry => ({
      id: entry.id,
      value: entry.value,
      maxValue: entry.maxValue,
      xpEarned: entry.xpEarned,
      recordedAt: entry.recordedAt,
      goal: {
        title: entry.goal.title,
        module: entry.goal.module.name
      }
    }))
  }
}

/**
 * GET /api/v1/users/profile
 * Get user profile with statistics
 */
async function handleGet(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    // Get user profile data
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        profilePicture: true,
        timezone: true,
        locale: true,
        onboardingCompleted: true,
        emailVerified: true,
        lastLoginAt: true,
        lastActiveAt: true,
        createdAt: true,
        updatedAt: true,
        preferences: true,
        // Exclude sensitive fields
        password: false,
        passwordResetToken: false,
        passwordResetExpires: false
      }
    })
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }
    
    // Calculate user statistics
    const stats = await calculateUserStats(request.user.id)
    
    return NextResponse.json({
      success: true,
      data: {
        profile: user,
        stats
      },
      message: 'Profile retrieved successfully'
    })
  }, 'Fetching user profile')
}

/**
 * PATCH /api/v1/users/profile
 * Update user profile information
 */
async function handlePatch(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const body = await request.json()
    
    // Validate input
    const validatedData = ProfileUpdateSchema.parse(body)
    
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: request.user.id },
      data: {
        ...validatedData,
        // Update lastActiveAt when profile is updated
        lastActiveAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        profilePicture: true,
        timezone: true,
        locale: true,
        onboardingCompleted: true,
        lastActiveAt: true,
        updatedAt: true,
        preferences: true
      }
    })
    
    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully'
    })
  }, 'Updating user profile')
}

/**
 * POST /api/v1/users/profile
 * Complete onboarding or reset profile
 */
async function handlePost(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const body = await request.json()
    const { action } = body
    
    if (action === 'complete_onboarding') {
      // Mark onboarding as completed
      const updatedUser = await prisma.user.update({
        where: { id: request.user.id },
        data: {
          onboardingCompleted: true,
          lastActiveAt: new Date()
        },
        select: {
          id: true,
          onboardingCompleted: true,
          updatedAt: true
        }
      })
      
      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: 'Onboarding completed successfully'
      })
    }
    
    if (action === 'update_last_active') {
      // Update last active timestamp
      const updatedUser = await prisma.user.update({
        where: { id: request.user.id },
        data: {
          lastActiveAt: new Date()
        },
        select: {
          id: true,
          lastActiveAt: true
        }
      })
      
      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: 'Last active updated'
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action specified'
    }, { status: 400 })
  }, 'Processing profile action')
}

/**
 * Main route handlers
 */
export async function GET(request: NextRequest) {
  const methodCheck = withMethodValidation(request, ['GET'])
  if (methodCheck) return methodCheck
  
  return withAuth(request, handleGet)
}

export async function PATCH(request: NextRequest) {
  const methodCheck = withMethodValidation(request, ['PATCH'])
  if (methodCheck) return methodCheck
  
  return withAuth(request, handlePatch)
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
      'Access-Control-Allow-Methods': 'GET, PATCH, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}