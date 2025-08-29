/**
 * Enhanced Database Seeding Script
 * 
 * Environment-specific seeding with realistic test data and proper error handling.
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth/password'

const prisma = new PrismaClient()

// Environment configuration
const environment = process.env.NODE_ENV || 'development'
const isDevelopment = environment === 'development'
const isTest = environment === 'test'
const isProduction = environment === 'production'

// Seeding configuration
const seedConfig = {
  development: {
    createUsers: 3,
    createGoals: 20,
    createProgress: 50,
    createFullData: true
  },
  test: {
    createUsers: 2,
    createGoals: 5,
    createProgress: 10,
    createFullData: false
  },
  production: {
    createUsers: 0,
    createGoals: 0,
    createProgress: 0,
    createFullData: false // Only create essential data in production
  }
}

const config = seedConfig[environment as keyof typeof seedConfig] || seedConfig.development

async function main() {
  console.log(`🌱 Seeding database for ${environment} environment...`)

  try {
    // Clean existing data in test/development
    if (!isProduction) {
      await cleanDatabase()
    }

    // Seed modules (essential for all environments)
    await seedModules()

    // Seed achievements (essential for all environments)
    await seedAchievements()

    // Seed test data only for development and test
    if (config.createFullData) {
      const users = await seedUsers()
      await seedGoals(users)
      await seedProgress()
    }

    console.log('✅ Database seeded successfully!')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

/**
 * Clean database for development/test environments
 */
async function cleanDatabase() {
  if (isProduction) return

  console.log('🧹 Cleaning existing data...')

  // Delete in order to respect foreign key constraints
  await prisma.userAchievement.deleteMany()
  await prisma.progress.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.achievement.deleteMany()
  await prisma.user.deleteMany()
  await prisma.module.deleteMany()

  console.log('✅ Database cleaned')
}

/**
 * Seed modules
 */
async function seedModules() {
  console.log('📦 Seeding modules...')

  const modules = [
    {
      id: 'fitness',
      name: 'Fitness Tracker',
      version: '1.0.0',
      isInstalled: true,
      isEnabled: true,
      config: {
        categories: ['cardio', 'strength', 'flexibility', 'sports'],
        units: ['minutes', 'reps', 'sets', 'distance'],
        trackingMethods: ['time', 'count', 'weight', 'distance']
      },
    },
    {
      id: 'home_projects',
      name: 'Home Projects',
      version: '1.0.0',
      isInstalled: true,
      isEnabled: true,
      config: {
        categories: ['maintenance', 'improvement', 'organization', 'repair'],
        priorities: ['low', 'medium', 'high', 'urgent'],
        rooms: ['kitchen', 'bedroom', 'bathroom', 'living_room', 'garage', 'basement']
      },
    },
    {
      id: 'learning',
      name: 'Learning Goals',
      version: '1.0.0',
      isInstalled: true,
      isEnabled: true,
      config: {
        categories: ['skill', 'course', 'certification', 'hobby'],
        subjects: ['technology', 'language', 'creative', 'business'],
        sources: ['online', 'book', 'classroom', 'workshop', 'mentorship']
      },
    },
    {
      id: 'bible',
      name: 'Bible Study',
      version: '1.0.0',
      isInstalled: true,
      isEnabled: true,
      config: {
        plans: ['chronological', 'topical', 'book_study', 'devotional'],
        translations: ['NIV', 'ESV', 'NASB', 'KJV', 'NLT', 'MSG'],
        studyTypes: ['personal', 'group', 'family', 'church']
      },
    },
    {
      id: 'work',
      name: 'Work Projects',
      version: '1.0.0',
      isInstalled: true,
      isEnabled: true,
      config: {
        categories: ['development', 'meeting', 'research', 'documentation'],
        statuses: ['planning', 'in_progress', 'review', 'completed'],
        priorities: ['low', 'medium', 'high', 'urgent', 'critical']
      },
    },
  ]

  for (const moduleData of modules) {
    await prisma.module.upsert({
      where: { id: moduleData.id },
      update: moduleData,
      create: moduleData,
    })
  }

  console.log(`✅ Created ${modules.length} modules`)
}

/**
 * Seed achievements
 */
async function seedAchievements() {
  console.log('🏆 Seeding achievements...')

  const achievements = [
    // Global achievements
    {
      id: 'first_goal',
      name: 'Getting Started',
      description: 'Create your first goal',
      icon: 'target',
      tier: 'bronze',
      xpReward: 10,
      conditions: { type: 'goal_created', count: 1 },
    },
    {
      id: 'goal_creator',
      name: 'Goal Creator',
      description: 'Create 5 goals',
      icon: 'plus-circle',
      tier: 'bronze',
      xpReward: 25,
      conditions: { type: 'goal_created', count: 5 },
    },
    {
      id: 'streak_week',
      name: 'Weekly Warrior',
      description: 'Maintain a 7-day activity streak',
      icon: 'fire',
      tier: 'silver',
      xpReward: 50,
      conditions: { type: 'streak', days: 7 },
    },
    {
      id: 'streak_month',
      name: 'Monthly Master',
      description: 'Maintain a 30-day activity streak',
      icon: 'flame',
      tier: 'gold',
      xpReward: 200,
      conditions: { type: 'streak', days: 30 },
    },
    {
      id: 'goal_finisher',
      name: 'Goal Finisher',
      description: 'Complete 5 goals',
      icon: 'check-circle',
      tier: 'silver',
      xpReward: 75,
      conditions: { type: 'goals_completed', count: 5 },
    },
    {
      id: 'goal_master',
      name: 'Goal Master',
      description: 'Complete 25 goals',
      icon: 'crown',
      tier: 'gold',
      xpReward: 200,
      conditions: { type: 'goals_completed', count: 25 },
    },
    {
      id: 'goal_legend',
      name: 'Goal Legend',
      description: 'Complete 100 goals',
      icon: 'trophy',
      tier: 'platinum',
      xpReward: 500,
      conditions: { type: 'goals_completed', count: 100 },
    },
    {
      id: 'xp_collector',
      name: 'XP Collector',
      description: 'Earn 1,000 XP',
      icon: 'star',
      tier: 'silver',
      xpReward: 100,
      conditions: { type: 'xp_earned', xpAmount: 1000 },
    },

    // Fitness achievements
    {
      id: 'fitness_beginner',
      name: 'Fitness Beginner',
      description: 'Complete your first fitness goal',
      icon: 'activity',
      tier: 'bronze',
      moduleId: 'fitness',
      xpReward: 25,
      conditions: { type: 'module_goals_completed', module: 'fitness', count: 1 },
    },
    {
      id: 'fitness_enthusiast',
      name: 'Fitness Enthusiast',
      description: 'Complete 10 fitness goals',
      icon: 'dumbbell',
      tier: 'silver',
      moduleId: 'fitness',
      xpReward: 75,
      conditions: { type: 'module_goals_completed', module: 'fitness', count: 10 },
    },
    {
      id: 'fitness_champion',
      name: 'Fitness Champion',
      description: 'Complete 50 fitness goals',
      icon: 'award',
      tier: 'gold',
      moduleId: 'fitness',
      xpReward: 200,
      conditions: { type: 'module_goals_completed', module: 'fitness', count: 50 },
    },

    // Learning achievements
    {
      id: 'knowledge_seeker',
      name: 'Knowledge Seeker',
      description: 'Complete your first learning goal',
      icon: 'book-open',
      tier: 'bronze',
      moduleId: 'learning',
      xpReward: 25,
      conditions: { type: 'module_goals_completed', module: 'learning', count: 1 },
    },
    {
      id: 'lifelong_learner',
      name: 'Lifelong Learner',
      description: 'Complete 20 learning goals',
      icon: 'graduation-cap',
      tier: 'gold',
      moduleId: 'learning',
      xpReward: 150,
      conditions: { type: 'module_goals_completed', module: 'learning', count: 20 },
    },

    // Home Project achievements
    {
      id: 'home_improver',
      name: 'Home Improver',
      description: 'Complete your first home project',
      icon: 'home',
      tier: 'bronze',
      moduleId: 'home_projects',
      xpReward: 25,
      conditions: { type: 'module_goals_completed', module: 'home_projects', count: 1 },
    },

    // Bible Study achievements
    {
      id: 'faithful_student',
      name: 'Faithful Student',
      description: 'Complete your first Bible study goal',
      icon: 'book',
      tier: 'bronze',
      moduleId: 'bible',
      xpReward: 25,
      conditions: { type: 'module_goals_completed', module: 'bible', count: 1 },
    },

    // Work achievements
    {
      id: 'productive_worker',
      name: 'Productive Worker',
      description: 'Complete your first work project',
      icon: 'briefcase',
      tier: 'bronze',
      moduleId: 'work',
      xpReward: 25,
      conditions: { type: 'module_goals_completed', module: 'work', count: 1 },
    },
  ]

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { id: achievement.id },
      update: achievement,
      create: achievement,
    })
  }

  console.log(`✅ Created ${achievements.length} achievements`)
}

/**
 * Seed test users
 */
async function seedUsers() {
  if (config.createUsers === 0) return []

  console.log('👥 Seeding users...')

  const hashedPassword = await hashPassword('password123')
  
  const users = [
    {
      email: 'demo@example.com',
      name: 'Demo User',
      password: hashedPassword,
      emailVerified: true,
      totalXp: 150,
      currentLevel: 2,
      streakCount: 5,
      lastActivity: new Date(),
      preferences: {
        theme: 'light',
        notifications: true,
        weeklyGoal: 7
      }
    },
    {
      email: 'test@example.com',
      name: 'Test User',
      password: hashedPassword,
      emailVerified: true,
      totalXp: 75,
      currentLevel: 1,
      streakCount: 2,
      lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      preferences: {
        theme: 'dark',
        notifications: false,
        weeklyGoal: 5
      }
    },
    {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      emailVerified: true,
      totalXp: 500,
      currentLevel: 3,
      streakCount: 15,
      lastActivity: new Date(),
      preferences: {
        theme: 'auto',
        notifications: true,
        weeklyGoal: 10,
        isAdmin: true
      }
    }
  ]

  const createdUsers = []
  for (let i = 0; i < Math.min(config.createUsers, users.length); i++) {
    const user = await prisma.user.create({ data: users[i] })
    createdUsers.push(user)
  }

  console.log(`✅ Created ${createdUsers.length} users`)
  return createdUsers
}

/**
 * Seed test goals
 */
async function seedGoals(users: any[]) {
  if (!users.length || config.createGoals === 0) return

  console.log('🎯 Seeding goals...')

  const goalTemplates = [
    // Fitness goals
    { title: 'Morning Jog', description: 'Go for a 30-minute jog every morning', module: 'fitness', difficulty: 'medium', priority: 'high' },
    { title: 'Gym Workout', description: 'Complete strength training workout 3x per week', module: 'fitness', difficulty: 'hard', priority: 'medium' },
    { title: '10K Steps Daily', description: 'Walk 10,000 steps every day', module: 'fitness', difficulty: 'easy', priority: 'medium' },
    
    // Learning goals
    { title: 'Learn TypeScript', description: 'Complete TypeScript course and build a project', module: 'learning', difficulty: 'hard', priority: 'high' },
    { title: 'Read 12 Books', description: 'Read one book per month this year', module: 'learning', difficulty: 'medium', priority: 'medium' },
    { title: 'Spanish Lessons', description: 'Take Spanish lessons twice a week', module: 'learning', difficulty: 'medium', priority: 'low' },
    
    // Home project goals
    { title: 'Kitchen Renovation', description: 'Renovate the kitchen cabinet doors', module: 'home_projects', difficulty: 'expert', priority: 'high' },
    { title: 'Garden Maintenance', description: 'Maintain the garden and plant new flowers', module: 'home_projects', difficulty: 'easy', priority: 'low' },
    { title: 'Organize Garage', description: 'Clean and organize the entire garage', module: 'home_projects', difficulty: 'medium', priority: 'medium' },
    
    // Bible study goals
    { title: 'Daily Devotion', description: 'Read Bible and pray for 15 minutes daily', module: 'bible', difficulty: 'easy', priority: 'high' },
    { title: 'Bible Study Group', description: 'Join and actively participate in weekly Bible study', module: 'bible', difficulty: 'medium', priority: 'medium' },
    
    // Work goals
    { title: 'Complete Project Alpha', description: 'Finish the Alpha project by deadline', module: 'work', difficulty: 'hard', priority: 'urgent' },
    { title: 'Team Meeting Prep', description: 'Prepare weekly team meeting agendas', module: 'work', difficulty: 'easy', priority: 'medium' },
  ]

  const createdGoals = []
  let goalCount = 0

  for (const user of users) {
    const userGoalCount = Math.ceil(config.createGoals / users.length)
    
    for (let i = 0; i < userGoalCount && goalCount < config.createGoals; i++) {
      const template = goalTemplates[Math.floor(Math.random() * goalTemplates.length)]
      const isCompleted = Math.random() < 0.3 // 30% chance of being completed
      
      const goal = await prisma.goal.create({
        data: {
          title: template.title,
          description: template.description,
          difficulty: template.difficulty as any,
          priority: template.priority as any,
          isCompleted,
          targetDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date within 90 days
          userId: user.id,
          moduleId: template.module,
          moduleData: {
            category: template.module === 'fitness' ? 'cardio' : 'general',
            estimatedHours: Math.ceil(Math.random() * 20),
            tags: ['sample', 'seeded']
          }
        }
      })

      createdGoals.push(goal)
      goalCount++
    }
  }

  console.log(`✅ Created ${createdGoals.length} goals`)
  return createdGoals
}

/**
 * Seed progress data
 */
async function seedProgress() {
  if (config.createProgress === 0) return

  console.log('📈 Seeding progress data...')

  const goals = await prisma.goal.findMany({
    include: { user: true }
  })

  if (!goals.length) return

  const progressEntries = []
  let progressCount = 0

  for (const goal of goals) {
    const entriesForGoal = Math.ceil(Math.random() * 5) // 1-5 progress entries per goal
    
    for (let i = 0; i < entriesForGoal && progressCount < config.createProgress; i++) {
      const daysAgo = Math.floor(Math.random() * 30) // Within last 30 days
      const recordedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      
      const maxValue = 100
      const value = Math.random() * maxValue
      const xpEarned = Math.ceil(value / 10) // 1 XP per 10% progress
      
      const progress = await prisma.progress.create({
        data: {
          value: Math.round(value * 100) / 100,
          maxValue,
          xpEarned,
          notes: Math.random() < 0.5 ? 'Good progress today!' : undefined,
          recordedAt,
          userId: goal.userId,
          goalId: goal.id
        }
      })

      progressEntries.push(progress)
      progressCount++
    }
  }

  console.log(`✅ Created ${progressEntries.length} progress entries`)
  return progressEntries
}

// Run the seeding
main()
  .then(async () => {
    await prisma.$disconnect()
    console.log('🎉 Seeding completed successfully!')
    process.exit(0)
  })
  .catch(async (e) => {
    console.error('💥 Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })