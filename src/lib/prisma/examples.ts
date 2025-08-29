import { prisma } from './client'

/**
 * Example functions demonstrating Prisma usage
 * These serve as reference implementations following the project's patterns
 */

// User operations
export async function createUser(email: string, name?: string) {
  return prisma.user.create({
    data: {
      email,
      name,
    },
  })
}

export async function getUserWithGoals(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      goals: {
        include: {
          module: true,
          progress: {
            orderBy: { recordedAt: 'desc' },
            take: 5, // Get latest 5 progress entries
          },
        },
      },
      userAchievements: {
        where: { isCompleted: true },
        include: {
          achievement: true,
        },
      },
    },
  })
}

// Goal operations
export async function createGoal({
  userId,
  moduleId,
  title,
  description,
  difficulty = 'medium',
  priority = 'medium',
  targetDate,
  moduleData,
}: {
  userId: string
  moduleId: string
  title: string
  description?: string
  difficulty?: string
  priority?: string
  targetDate?: Date
  moduleData?: object
}) {
  return prisma.goal.create({
    data: {
      userId,
      moduleId,
      title,
      description,
      difficulty,
      priority,
      targetDate,
      moduleData,
    },
    include: {
      module: true,
    },
  })
}

export async function updateGoalProgress({
  goalId,
  userId,
  value,
  maxValue = 100,
  xpEarned = 0,
  notes,
}: {
  goalId: string
  userId: string
  value: number
  maxValue?: number
  xpEarned?: number
  notes?: string
}) {
  // Create progress entry
  const progress = await prisma.progress.create({
    data: {
      goalId,
      userId,
      value,
      maxValue,
      xpEarned,
      notes,
    },
  })

  // Update user's total XP
  await prisma.user.update({
    where: { id: userId },
    data: {
      totalXp: {
        increment: xpEarned,
      },
    },
  })

  // Mark goal as completed if progress reaches 100%
  if (value >= maxValue) {
    await prisma.goal.update({
      where: { id: goalId },
      data: { isCompleted: true },
    })
  }

  return progress
}

// Module operations
export async function getEnabledModules() {
  return prisma.module.findMany({
    where: {
      isEnabled: true,
      isInstalled: true,
    },
  })
}

export async function getModuleGoals(moduleId: string, userId: string) {
  return prisma.goal.findMany({
    where: {
      moduleId,
      userId,
    },
    include: {
      progress: {
        orderBy: { recordedAt: 'desc' },
        take: 1, // Get latest progress
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

// Achievement operations
export async function checkAndUnlockAchievements(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      goals: true,
      progress: true,
      userAchievements: true,
    },
  })

  if (!user) return []

  const achievements = await prisma.achievement.findMany()
  const unlockedAchievements = []

  for (const achievement of achievements) {
    // Skip if user already has this achievement
    if (user.userAchievements.some(ua => ua.achievementId === achievement.id)) {
      continue
    }

    const conditions = achievement.conditions as {
      type: string
      count?: number
      days?: number
      module?: string
    }
    let shouldUnlock = false

    // Simple achievement condition checking
    switch (conditions.type) {
      case 'goal_created':
        shouldUnlock = conditions.count ? user.goals.length >= conditions.count : false
        break
      case 'goals_completed':
        shouldUnlock = conditions.count 
          ? user.goals.filter(g => g.isCompleted).length >= conditions.count 
          : false
        break
      case 'streak':
        // Simplified streak checking - would need more complex logic in real implementation
        shouldUnlock = conditions.days ? user.streakCount >= conditions.days : false
        break
      case 'module_goals_completed':
        if (conditions.module && conditions.count) {
          const moduleGoalsCompleted = user.goals.filter(
            g => g.moduleId === conditions.module && g.isCompleted
          ).length
          shouldUnlock = moduleGoalsCompleted >= conditions.count
        }
        break
    }

    if (shouldUnlock) {
      const userAchievement = await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          isCompleted: true,
          progress: 100,
        },
        include: {
          achievement: true,
        },
      })

      // Award XP for achievement
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalXp: {
            increment: achievement.xpReward,
          },
        },
      })

      unlockedAchievements.push(userAchievement)
    }
  }

  return unlockedAchievements
}

// Analytics functions
export async function getUserStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          goals: true,
          progress: true,
          userAchievements: {
            where: { isCompleted: true },
          },
        },
      },
    },
  })

  if (!user) return null

  const completedGoals = await prisma.goal.count({
    where: {
      userId,
      isCompleted: true,
    },
  })

  const activeGoals = await prisma.goal.count({
    where: {
      userId,
      isCompleted: false,
    },
  })

  return {
    user,
    stats: {
      totalGoals: user._count.goals,
      completedGoals,
      activeGoals,
      totalProgress: user._count.progress,
      totalAchievements: user._count.userAchievements,
      totalXp: user.totalXp,
      currentLevel: user.currentLevel,
      streakCount: user.streakCount,
    },
  }
}