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

    // Seed Bible reading plan presets (essential for Bible module)
    await seedBibleReadingPlanPresets()

    // Seed fitness exercise templates (essential for fitness module)
    await seedFitnessExerciseTemplates()

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
  
  // Bible Study related tables
  await prisma.bibleReading.deleteMany()
  await prisma.bibleReadingPlan.deleteMany()
  await prisma.studySession.deleteMany()
  await prisma.prayerRequest.deleteMany()
  await prisma.scriptureBookmark.deleteMany()
  await prisma.bibleReadingPlanPreset.deleteMany()

  // Fitness related tables
  await prisma.workoutSet.deleteMany()
  await prisma.workoutExercise.deleteMany()
  await prisma.personalRecord.deleteMany()
  await prisma.workout.deleteMany()
  await prisma.exerciseTemplate.deleteMany()
  await prisma.workoutPlan.deleteMany()
  
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

/**
 * Seed Bible reading plan presets
 */
async function seedBibleReadingPlanPresets() {
  console.log('📖 Seeding Bible reading plan presets...')

  const presets = [
    {
      id: 'one-year-chronological',
      name: 'One Year Chronological',
      description: 'Read the Bible in historical order over one year',
      durationDays: 365,
      category: 'chronological',
      difficulty: 'medium',
      isPopular: true,
      planData: {
        readings: generateChronologicalReadings(365)
      }
    },
    {
      id: 'one-year-canonical',
      name: 'One Year Canonical',
      description: 'Read the Bible in traditional book order over one year',
      durationDays: 365,
      category: 'canonical',
      difficulty: 'medium',
      isPopular: true,
      planData: {
        readings: generateCanonicalReadings(365)
      }
    },
    {
      id: 'new-testament-30-days',
      name: 'New Testament in 30 Days',
      description: 'Read through the entire New Testament in one month',
      durationDays: 30,
      category: 'canonical',
      difficulty: 'hard',
      isPopular: true,
      planData: {
        readings: generateNewTestamentReadings(30)
      }
    },
    {
      id: 'psalms-proverbs-150',
      name: 'Psalms and Proverbs',
      description: 'Read through Psalms and Proverbs for wisdom and worship',
      durationDays: 150,
      category: 'devotional',
      difficulty: 'easy',
      isPopular: true,
      planData: {
        readings: generatePsalmsProverbsReadings(150)
      }
    },
    {
      id: 'gospels-90-days',
      name: 'Four Gospels in 90 Days',
      description: 'Study the life and teachings of Jesus through all four Gospels',
      durationDays: 90,
      category: 'topical',
      difficulty: 'medium',
      isPopular: true,
      planData: {
        readings: generateGospelsReadings(90)
      }
    },
    {
      id: 'pauls-letters',
      name: 'Paul\'s Letters',
      description: 'Deep dive into the Apostle Paul\'s epistles',
      durationDays: 60,
      category: 'topical',
      difficulty: 'medium',
      isPopular: false,
      planData: {
        readings: generatePaulsLettersReadings(60)
      }
    }
  ]

  for (const preset of presets) {
    await prisma.bibleReadingPlanPreset.upsert({
      where: { id: preset.id },
      update: preset,
      create: preset
    })
  }

  console.log(`✅ Created ${presets.length} Bible reading plan presets`)
}

// Helper functions to generate reading schedules
function generateChronologicalReadings(days: number) {
  // Simplified chronological order - in a real implementation, 
  // this would follow historical chronology
  const readings = []
  const booksInOrder = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
    'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms',
    'Proverbs', 'Ecclesiastes', 'Song of Solomon',
    'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel',
    'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah',
    'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah',
    'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
    'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
    '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus',
    'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
    '1 John', '2 John', '3 John', 'Jude', 'Revelation'
  ]

  for (let i = 0; i < days; i++) {
    const bookIndex = Math.floor(i / (days / booksInOrder.length))
    const book = booksInOrder[Math.min(bookIndex, booksInOrder.length - 1)]
    const chapter = (i % 5) + 1 // Simplified chapter assignment
    
    readings.push({
      day: i + 1,
      passages: [`${book} ${chapter}`]
    })
  }

  return readings
}

function generateCanonicalReadings(days: number) {
  // Simplified canonical order
  return generateChronologicalReadings(days) // For simplicity, reuse chronological
}

function generateNewTestamentReadings(days: number) {
  const readings = []
  const ntBooks = [
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
    'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
    '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus',
    'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
    '1 John', '2 John', '3 John', 'Jude', 'Revelation'
  ]

  for (let i = 0; i < days; i++) {
    const bookIndex = Math.floor(i / (days / ntBooks.length))
    const book = ntBooks[Math.min(bookIndex, ntBooks.length - 1)]
    const chapter = (i % 3) + 1
    
    readings.push({
      day: i + 1,
      passages: [`${book} ${chapter}`]
    })
  }

  return readings
}

function generatePsalmsProverbsReadings(days: number) {
  const readings = []
  
  for (let i = 0; i < days; i++) {
    const psalmsChapter = (i % 150) + 1
    const proverbsChapter = (i % 31) + 1
    
    readings.push({
      day: i + 1,
      passages: [`Psalm ${psalmsChapter}`, `Proverbs ${proverbsChapter}`]
    })
  }

  return readings
}

function generateGospelsReadings(days: number) {
  const readings = []
  const gospels = ['Matthew', 'Mark', 'Luke', 'John']
  
  for (let i = 0; i < days; i++) {
    const gospel = gospels[Math.floor(i / (days / 4))]
    const chapter = (i % 10) + 1
    
    readings.push({
      day: i + 1,
      passages: [`${gospel} ${chapter}`]
    })
  }

  return readings
}

function generatePaulsLettersReadings(days: number) {
  const readings = []
  const paulsLetters = [
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians',
    'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians',
    '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon'
  ]
  
  for (let i = 0; i < days; i++) {
    const letterIndex = Math.floor(i / (days / paulsLetters.length))
    const letter = paulsLetters[Math.min(letterIndex, paulsLetters.length - 1)]
    const chapter = (i % 5) + 1
    
    readings.push({
      day: i + 1,
      passages: [`${letter} ${chapter}`]
    })
  }

  return readings
}

/**
 * Seed fitness exercise templates
 */
async function seedFitnessExerciseTemplates() {
  console.log('💪 Seeding fitness exercise templates...')

  const exerciseTemplates = [
    // CHEST EXERCISES
    {
      name: 'Bench Press',
      description: 'Barbell bench press for chest development',
      category: 'chest',
      muscleGroups: ['pectorals', 'triceps', 'anterior deltoids'],
      equipmentNeeded: 'Barbell, bench',
      instructions: [
        'Lie on bench with feet flat on floor',
        'Grip barbell with hands wider than shoulders',
        'Lower bar to chest with control',
        'Press bar up to full arm extension'
      ]
    },
    {
      name: 'Push-ups',
      description: 'Bodyweight chest exercise',
      category: 'chest',
      muscleGroups: ['pectorals', 'triceps', 'core'],
      equipmentNeeded: 'None',
      instructions: [
        'Start in plank position',
        'Lower body until chest nearly touches floor',
        'Push up to starting position'
      ]
    },
    {
      name: 'Dumbbell Flyes',
      description: 'Isolation exercise for chest muscles',
      category: 'chest',
      muscleGroups: ['pectorals'],
      equipmentNeeded: 'Dumbbells, bench',
      instructions: [
        'Lie on bench holding dumbbells above chest',
        'Lower weights in wide arc until chest stretch is felt',
        'Bring dumbbells back together above chest'
      ]
    },
    {
      name: 'Incline Bench Press',
      description: 'Upper chest focused bench press',
      category: 'chest',
      muscleGroups: ['upper pectorals', 'triceps', 'anterior deltoids'],
      equipmentNeeded: 'Barbell, incline bench',
      instructions: [
        'Set bench to 30-45 degree incline',
        'Grip barbell slightly wider than shoulders',
        'Lower bar to upper chest',
        'Press up to full extension'
      ]
    },
    {
      name: 'Decline Push-ups',
      description: 'Bodyweight exercise targeting upper chest',
      category: 'chest',
      muscleGroups: ['upper pectorals', 'triceps', 'core'],
      equipmentNeeded: 'Elevated surface',
      instructions: [
        'Place feet on elevated surface',
        'Assume push-up position',
        'Lower chest toward floor',
        'Push back up to starting position'
      ]
    },

    // BACK EXERCISES
    {
      name: 'Pull-ups',
      description: 'Bodyweight back exercise',
      category: 'back',
      muscleGroups: ['latissimus dorsi', 'rhomboids', 'biceps'],
      equipmentNeeded: 'Pull-up bar',
      instructions: [
        'Hang from bar with overhand grip',
        'Pull body up until chin clears bar',
        'Lower with control to full extension'
      ]
    },
    {
      name: 'Deadlift',
      description: 'Compound posterior chain exercise',
      category: 'back',
      muscleGroups: ['erector spinae', 'glutes', 'hamstrings', 'traps'],
      equipmentNeeded: 'Barbell, plates',
      instructions: [
        'Stand with feet hip-width apart',
        'Hinge at hips and knees to grip bar',
        'Lift bar by extending hips and knees',
        'Stand tall then lower with control'
      ]
    },
    {
      name: 'Bent-over Rows',
      description: 'Barbell rowing exercise for back thickness',
      category: 'back',
      muscleGroups: ['latissimus dorsi', 'rhomboids', 'middle traps'],
      equipmentNeeded: 'Barbell, plates',
      instructions: [
        'Hinge at hips holding barbell',
        'Keep back straight and core tight',
        'Pull bar to lower chest/upper abdomen',
        'Lower with control'
      ]
    },
    {
      name: 'Lat Pulldowns',
      description: 'Machine exercise for lat development',
      category: 'back',
      muscleGroups: ['latissimus dorsi', 'rhomboids', 'biceps'],
      equipmentNeeded: 'Lat pulldown machine',
      instructions: [
        'Sit at machine with thighs under pads',
        'Grip bar wider than shoulders',
        'Pull bar down to chest',
        'Slowly return to starting position'
      ]
    },
    {
      name: 'T-Bar Rows',
      description: 'Thick grip rowing for back development',
      category: 'back',
      muscleGroups: ['middle traps', 'rhomboids', 'latissimus dorsi'],
      equipmentNeeded: 'T-bar row apparatus',
      instructions: [
        'Straddle T-bar with chest on pad',
        'Grip handles with neutral grip',
        'Pull handles toward chest',
        'Lower with control'
      ]
    },

    // LEG EXERCISES
    {
      name: 'Squats',
      description: 'Compound leg exercise',
      category: 'legs',
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
      equipmentNeeded: 'Barbell (optional)',
      instructions: [
        'Stand with feet shoulder-width apart',
        'Lower by bending knees and hips',
        'Go down until thighs parallel to floor',
        'Drive through heels to return to start'
      ]
    },
    {
      name: 'Romanian Deadlifts',
      description: 'Hip hinge movement for posterior chain',
      category: 'legs',
      muscleGroups: ['hamstrings', 'glutes', 'erector spinae'],
      equipmentNeeded: 'Barbell or dumbbells',
      instructions: [
        'Hold weight with arms straight',
        'Hinge at hips keeping knees slightly bent',
        'Lower weight until hamstring stretch is felt',
        'Drive hips forward to return to standing'
      ]
    },
    {
      name: 'Lunges',
      description: 'Single leg functional movement',
      category: 'legs',
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
      equipmentNeeded: 'None (dumbbells optional)',
      instructions: [
        'Step forward into lunge position',
        'Lower back knee toward ground',
        'Push through front heel to return',
        'Alternate legs or complete all reps on one side'
      ]
    },
    {
      name: 'Leg Press',
      description: 'Machine exercise for quad and glute development',
      category: 'legs',
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
      equipmentNeeded: 'Leg press machine',
      instructions: [
        'Sit in machine with feet on platform',
        'Lower weight by bending knees',
        'Stop when knees reach 90 degrees',
        'Press weight back to starting position'
      ]
    },
    {
      name: 'Calf Raises',
      description: 'Isolation exercise for calf muscles',
      category: 'legs',
      muscleGroups: ['gastrocnemius', 'soleus'],
      equipmentNeeded: 'None (weights optional)',
      instructions: [
        'Stand with balls of feet on elevated surface',
        'Rise up onto toes as high as possible',
        'Hold briefly at top',
        'Lower slowly to starting position'
      ]
    },

    // SHOULDER EXERCISES
    {
      name: 'Overhead Press',
      description: 'Compound shoulder exercise',
      category: 'shoulders',
      muscleGroups: ['anterior deltoids', 'medial deltoids', 'triceps'],
      equipmentNeeded: 'Barbell or dumbbells',
      instructions: [
        'Stand with weight at shoulder level',
        'Press weight overhead to full extension',
        'Lower with control to starting position',
        'Keep core tight throughout'
      ]
    },
    {
      name: 'Lateral Raises',
      description: 'Isolation exercise for medial deltoids',
      category: 'shoulders',
      muscleGroups: ['medial deltoids'],
      equipmentNeeded: 'Dumbbells',
      instructions: [
        'Hold dumbbells at sides',
        'Raise arms out to sides until parallel to floor',
        'Hold briefly at top',
        'Lower with control'
      ]
    },
    {
      name: 'Rear Delt Flyes',
      description: 'Isolation exercise for posterior deltoids',
      category: 'shoulders',
      muscleGroups: ['posterior deltoids', 'rhomboids'],
      equipmentNeeded: 'Dumbbells',
      instructions: [
        'Bend forward at hips holding dumbbells',
        'Raise arms out to sides in reverse fly motion',
        'Squeeze shoulder blades together',
        'Lower with control'
      ]
    },
    {
      name: 'Arnold Press',
      description: 'Rotational shoulder press variation',
      category: 'shoulders',
      muscleGroups: ['all deltoid heads', 'triceps'],
      equipmentNeeded: 'Dumbbells',
      instructions: [
        'Start with dumbbells at shoulder level, palms facing body',
        'Rotate palms outward while pressing up',
        'Fully extend arms overhead',
        'Reverse motion to return to start'
      ]
    },
    {
      name: 'Pike Push-ups',
      description: 'Bodyweight shoulder exercise',
      category: 'shoulders',
      muscleGroups: ['anterior deltoids', 'triceps'],
      equipmentNeeded: 'None',
      instructions: [
        'Start in downward dog position',
        'Lower head toward ground',
        'Push back up to starting position',
        'Keep legs straight throughout'
      ]
    },

    // ARM EXERCISES
    {
      name: 'Bicep Curls',
      description: 'Classic bicep isolation exercise',
      category: 'arms',
      muscleGroups: ['biceps'],
      equipmentNeeded: 'Dumbbells or barbell',
      instructions: [
        'Hold weight with arms at sides',
        'Curl weight up toward shoulders',
        'Squeeze biceps at top',
        'Lower with control'
      ]
    },
    {
      name: 'Tricep Dips',
      description: 'Bodyweight tricep exercise',
      category: 'arms',
      muscleGroups: ['triceps', 'anterior deltoids'],
      equipmentNeeded: 'Chair or dip station',
      instructions: [
        'Support body weight on hands',
        'Lower body by bending elbows',
        'Push back up to starting position',
        'Keep body close to support'
      ]
    },
    {
      name: 'Hammer Curls',
      description: 'Neutral grip bicep exercise',
      category: 'arms',
      muscleGroups: ['biceps', 'brachialis'],
      equipmentNeeded: 'Dumbbells',
      instructions: [
        'Hold dumbbells with neutral grip',
        'Curl weights up keeping palms facing each other',
        'Squeeze at top',
        'Lower with control'
      ]
    },
    {
      name: 'Tricep Extensions',
      description: 'Overhead tricep isolation',
      category: 'arms',
      muscleGroups: ['triceps'],
      equipmentNeeded: 'Dumbbell',
      instructions: [
        'Hold dumbbell overhead with both hands',
        'Lower weight behind head by bending elbows',
        'Extend arms back to starting position',
        'Keep elbows pointing forward'
      ]
    },
    {
      name: 'Close-grip Push-ups',
      description: 'Bodyweight tricep-focused exercise',
      category: 'arms',
      muscleGroups: ['triceps', 'pectorals'],
      equipmentNeeded: 'None',
      instructions: [
        'Assume push-up position with hands close together',
        'Lower chest toward hands',
        'Push back up to starting position',
        'Keep elbows close to body'
      ]
    },

    // CORE EXERCISES
    {
      name: 'Plank',
      description: 'Isometric core strengthening exercise',
      category: 'core',
      muscleGroups: ['rectus abdominis', 'transverse abdominis', 'obliques'],
      equipmentNeeded: 'None',
      instructions: [
        'Start in push-up position on forearms',
        'Keep body in straight line from head to heels',
        'Hold position while breathing normally',
        'Engage core throughout'
      ]
    },
    {
      name: 'Crunches',
      description: 'Classic abdominal exercise',
      category: 'core',
      muscleGroups: ['rectus abdominis'],
      equipmentNeeded: 'None',
      instructions: [
        'Lie on back with knees bent',
        'Place hands behind head',
        'Lift shoulders off ground',
        'Lower back down with control'
      ]
    },
    {
      name: 'Russian Twists',
      description: 'Rotational core exercise',
      category: 'core',
      muscleGroups: ['obliques', 'rectus abdominis'],
      equipmentNeeded: 'None (weight optional)',
      instructions: [
        'Sit with knees bent and feet lifted',
        'Lean back slightly',
        'Rotate torso side to side',
        'Keep chest up throughout'
      ]
    },
    {
      name: 'Mountain Climbers',
      description: 'Dynamic core and cardio exercise',
      category: 'core',
      muscleGroups: ['core', 'hip flexors', 'shoulders'],
      equipmentNeeded: 'None',
      instructions: [
        'Start in plank position',
        'Alternate bringing knees toward chest',
        'Maintain plank position throughout',
        'Move at a controlled pace'
      ]
    },
    {
      name: 'Dead Bug',
      description: 'Core stability exercise',
      category: 'core',
      muscleGroups: ['deep core muscles', 'hip flexors'],
      equipmentNeeded: 'None',
      instructions: [
        'Lie on back with arms up and knees bent at 90 degrees',
        'Slowly extend opposite arm and leg',
        'Return to starting position',
        'Keep lower back pressed to floor'
      ]
    },

    // CARDIO EXERCISES
    {
      name: 'Running',
      description: 'Cardiovascular endurance exercise',
      category: 'cardio',
      muscleGroups: ['legs', 'cardiovascular system'],
      equipmentNeeded: 'Running shoes',
      instructions: [
        'Start with 5-minute warm-up walk',
        'Maintain steady pace',
        'Focus on breathing rhythm',
        'Cool down with walking'
      ]
    },
    {
      name: 'Jumping Jacks',
      description: 'Full body cardio exercise',
      category: 'cardio',
      muscleGroups: ['full body', 'cardiovascular system'],
      equipmentNeeded: 'None',
      instructions: [
        'Stand with feet together, arms at sides',
        'Jump feet apart while raising arms overhead',
        'Jump back to starting position',
        'Maintain steady rhythm'
      ]
    },
    {
      name: 'High Knees',
      description: 'In-place cardio exercise',
      category: 'cardio',
      muscleGroups: ['hip flexors', 'legs', 'core'],
      equipmentNeeded: 'None',
      instructions: [
        'Stand in place',
        'Run in place bringing knees up high',
        'Pump arms while running',
        'Maintain quick cadence'
      ]
    },
    {
      name: 'Burpees',
      description: 'Full body explosive exercise',
      category: 'cardio',
      muscleGroups: ['full body', 'cardiovascular system'],
      equipmentNeeded: 'None',
      instructions: [
        'Start standing',
        'Drop into squat and place hands on floor',
        'Jump feet back into plank',
        'Jump feet forward and explode up'
      ]
    },
    {
      name: 'Cycling',
      description: 'Low impact cardiovascular exercise',
      category: 'cardio',
      muscleGroups: ['legs', 'cardiovascular system'],
      equipmentNeeded: 'Bicycle or stationary bike',
      instructions: [
        'Maintain steady pedaling cadence',
        'Adjust resistance as needed',
        'Keep good posture throughout',
        'Start with moderate intensity'
      ]
    },

    // FUNCTIONAL/MIXED EXERCISES
    {
      name: 'Turkish Get-up',
      description: 'Complex full-body movement',
      category: 'functional',
      muscleGroups: ['full body', 'core', 'shoulders'],
      equipmentNeeded: 'Kettlebell or dumbbell',
      instructions: [
        'Start lying down with weight in one hand',
        'Follow specific sequence to standing position',
        'Reverse the movement to return to lying',
        'Focus on control and stability'
      ]
    },
    {
      name: 'Kettlebell Swings',
      description: 'Explosive hip hinge movement',
      category: 'functional',
      muscleGroups: ['glutes', 'hamstrings', 'core', 'shoulders'],
      equipmentNeeded: 'Kettlebell',
      instructions: [
        'Stand with feet hip-width apart',
        'Hinge at hips and swing kettlebell between legs',
        'Drive hips forward to swing weight to chest level',
        'Let weight swing back down between legs'
      ]
    },
    {
      name: 'Farmer\'s Walk',
      description: 'Loaded carry exercise',
      category: 'functional',
      muscleGroups: ['grip', 'core', 'traps', 'legs'],
      equipmentNeeded: 'Heavy weights (dumbbells, kettlebells)',
      instructions: [
        'Pick up heavy weights in each hand',
        'Walk forward with good posture',
        'Keep core tight and shoulders back',
        'Walk for time or distance'
      ]
    },
    {
      name: 'Box Step-ups',
      description: 'Unilateral leg exercise',
      category: 'functional',
      muscleGroups: ['quadriceps', 'glutes', 'calves'],
      equipmentNeeded: 'Sturdy box or platform',
      instructions: [
        'Step up onto box with one foot',
        'Drive through heel to stand on box',
        'Step back down with control',
        'Complete all reps on one side before switching'
      ]
    },
    {
      name: 'Bear Crawl',
      description: 'Quadrupedal movement pattern',
      category: 'functional',
      muscleGroups: ['core', 'shoulders', 'legs'],
      equipmentNeeded: 'None',
      instructions: [
        'Start on hands and knees',
        'Lift knees slightly off ground',
        'Crawl forward maintaining position',
        'Keep hips low and core engaged'
      ]
    },

    // FLEXIBILITY/MOBILITY
    {
      name: 'Hip Flexor Stretch',
      description: 'Static stretch for hip flexors',
      category: 'flexibility',
      muscleGroups: ['hip flexors'],
      equipmentNeeded: 'None',
      instructions: [
        'Step into lunge position',
        'Lower back knee toward ground',
        'Push hips forward to feel stretch',
        'Hold for 30-60 seconds per side'
      ]
    },
    {
      name: 'Pigeon Pose',
      description: 'Deep hip and glute stretch',
      category: 'flexibility',
      muscleGroups: ['glutes', 'hip flexors'],
      equipmentNeeded: 'None',
      instructions: [
        'Start in plank position',
        'Bring one knee forward toward same-side hand',
        'Extend back leg straight behind',
        'Hold stretch and breathe deeply'
      ]
    },
    {
      name: 'Cat-Cow Stretch',
      description: 'Spinal mobility exercise',
      category: 'flexibility',
      muscleGroups: ['spine', 'core'],
      equipmentNeeded: 'None',
      instructions: [
        'Start on hands and knees',
        'Arch back and look up (cow)',
        'Round back and tuck chin (cat)',
        'Move slowly between positions'
      ]
    },
    {
      name: 'Shoulder Rolls',
      description: 'Shoulder mobility exercise',
      category: 'flexibility',
      muscleGroups: ['shoulders', 'upper traps'],
      equipmentNeeded: 'None',
      instructions: [
        'Stand with arms at sides',
        'Roll shoulders backward in large circles',
        'Complete 10-15 rolls backward',
        'Repeat rolling forward'
      ]
    }
  ]

  for (const exercise of exerciseTemplates) {
    // Check if exercise already exists by name
    const existing = await prisma.exerciseTemplate.findFirst({
      where: { name: exercise.name, isCustom: false, userId: null }
    })

    if (!existing) {
      await prisma.exerciseTemplate.create({
        data: {
          ...exercise,
          isCustom: false,
          userId: null // System exercises
        }
      })
    }
  }

  console.log(`✅ Created ${exerciseTemplates.length} exercise templates`)
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