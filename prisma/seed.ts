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

    // Seed nutrition food database (essential for nutrition module)
    await seedNutritionFoodDatabase()

    // Seed test data only for development and test
    if (config.createFullData) {
      const users = await seedUsers()
      await seedGoals(users)
      await seedProgress()
      await seedFitnessWorkouts(users)
      await seedNutritionData(users)
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

  // Nutrition related tables
  await prisma.mealFood.deleteMany()
  await prisma.foodLog.deleteMany()
  await prisma.meal.deleteMany()
  await prisma.waterIntake.deleteMany()
  await prisma.nutritionGoal.deleteMany()
  await prisma.food.deleteMany()
  
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

/**
 * Seed fitness workouts for testing workout execution
 */
async function seedFitnessWorkouts(users: any[]) {
  if (!users.length) return

  console.log('🏋️ Seeding fitness workouts...')

  // First, get some exercise templates to use in workouts
  const exercises = await prisma.exerciseTemplate.findMany({
    where: { isCustom: false },
    take: 20 // Get first 20 system exercises
  })

  if (exercises.length === 0) {
    console.log('No exercise templates found, skipping workout seeding')
    return
  }

  // Create workout plans for users
  const workoutPlans = []
  for (const user of users) {
    const plan = await prisma.workoutPlan.create({
      data: {
        name: 'Beginner Fitness Plan',
        description: 'A comprehensive workout plan for fitness beginners',
        userId: user.id,
        isTemplate: false,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        isActive: true
      }
    })
    workoutPlans.push(plan)
  }

  // Create sample workouts for each user
  const workoutTemplates = [
    {
      name: 'Upper Body Strength',
      description: 'Focus on chest, back, shoulders, and arms',
      workoutType: 'strength' as const,
      estimatedDuration: 45,
      exercises: [
        { templateName: 'Push-ups', targetSets: 3, targetReps: 12, restBetweenSets: 60 },
        { templateName: 'Pull-ups', targetSets: 3, targetReps: 8, restBetweenSets: 90 },
        { templateName: 'Overhead Press', targetSets: 3, targetReps: 10, targetWeight: 25, restBetweenSets: 90 },
        { templateName: 'Bent-over Rows', targetSets: 3, targetReps: 10, targetWeight: 30, restBetweenSets: 90 },
        { templateName: 'Bicep Curls', targetSets: 3, targetReps: 12, targetWeight: 15, restBetweenSets: 60 },
        { templateName: 'Tricep Dips', targetSets: 3, targetReps: 10, restBetweenSets: 60 }
      ]
    },
    {
      name: 'Lower Body Power',
      description: 'Target legs and glutes with compound movements',
      workoutType: 'strength' as const,
      estimatedDuration: 50,
      exercises: [
        { templateName: 'Squats', targetSets: 4, targetReps: 12, targetWeight: 45, restBetweenSets: 120 },
        { templateName: 'Romanian Deadlifts', targetSets: 3, targetReps: 10, targetWeight: 40, restBetweenSets: 120 },
        { templateName: 'Lunges', targetSets: 3, targetReps: 10, restBetweenSets: 90 },
        { templateName: 'Leg Press', targetSets: 3, targetReps: 15, targetWeight: 100, restBetweenSets: 90 },
        { templateName: 'Calf Raises', targetSets: 4, targetReps: 15, restBetweenSets: 60 }
      ]
    },
    {
      name: 'Cardio Blast',
      description: 'High intensity cardio workout',
      workoutType: 'cardio' as const,
      estimatedDuration: 30,
      exercises: [
        { templateName: 'Jumping Jacks', targetSets: 4, targetDuration: 60, restBetweenSets: 30 },
        { templateName: 'High Knees', targetSets: 4, targetDuration: 45, restBetweenSets: 30 },
        { templateName: 'Burpees', targetSets: 3, targetReps: 10, restBetweenSets: 60 },
        { templateName: 'Mountain Climbers', targetSets: 3, targetDuration: 45, restBetweenSets: 45 },
        { templateName: 'Running', targetSets: 1, targetDuration: 300, restBetweenSets: 0 } // 5 minutes
      ]
    },
    {
      name: 'Core & Flexibility',
      description: 'Core strengthening with flexibility work',
      workoutType: 'flexibility' as const,
      estimatedDuration: 35,
      exercises: [
        { templateName: 'Plank', targetSets: 3, targetDuration: 45, restBetweenSets: 60 },
        { templateName: 'Crunches', targetSets: 3, targetReps: 15, restBetweenSets: 45 },
        { templateName: 'Russian Twists', targetSets: 3, targetReps: 20, restBetweenSets: 45 },
        { templateName: 'Dead Bug', targetSets: 3, targetReps: 10, restBetweenSets: 45 },
        { templateName: 'Hip Flexor Stretch', targetSets: 2, targetDuration: 30, restBetweenSets: 15 },
        { templateName: 'Cat-Cow Stretch', targetSets: 2, targetReps: 10, restBetweenSets: 15 }
      ]
    },
    {
      name: 'Full Body Circuit',
      description: 'Complete body workout combining strength and cardio',
      workoutType: 'mixed' as const,
      estimatedDuration: 40,
      exercises: [
        { templateName: 'Squats', targetSets: 3, targetReps: 12, restBetweenSets: 45 },
        { templateName: 'Push-ups', targetSets: 3, targetReps: 10, restBetweenSets: 45 },
        { templateName: 'Mountain Climbers', targetSets: 3, targetDuration: 30, restBetweenSets: 45 },
        { templateName: 'Plank', targetSets: 3, targetDuration: 30, restBetweenSets: 45 },
        { templateName: 'Jumping Jacks', targetSets: 3, targetDuration: 45, restBetweenSets: 60 },
        { templateName: 'Burpees', targetSets: 2, targetReps: 8, restBetweenSets: 90 }
      ]
    }
  ]

  const createdWorkouts = []

  for (const user of users) {
    const userPlan = workoutPlans.find(p => p.userId === user.id)
    
    for (let i = 0; i < workoutTemplates.length; i++) {
      const template = workoutTemplates[i]
      
      // Create workout scheduled for different days
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + i)
      scheduledDate.setHours(9, 0, 0, 0) // 9 AM
      
      const workout = await prisma.workout.create({
        data: {
          name: template.name,
          description: template.description,
          workoutType: template.workoutType,
          estimatedDuration: template.estimatedDuration,
          scheduledDate: scheduledDate,
          userId: user.id,
          planId: userPlan?.id
        }
      })

      // Add exercises to the workout
      for (let j = 0; j < template.exercises.length; j++) {
        const exerciseTemplate = template.exercises[j]
        const exercise = exercises.find(e => e.name === exerciseTemplate.templateName)
        
        if (exercise) {
          await prisma.workoutExercise.create({
            data: {
              workoutId: workout.id,
              exerciseId: exercise.id,
              orderIndex: j,
              targetSets: exerciseTemplate.targetSets,
              targetReps: exerciseTemplate.targetReps,
              targetWeight: exerciseTemplate.targetWeight,
              targetDuration: exerciseTemplate.targetDuration,
              restBetweenSets: exerciseTemplate.restBetweenSets
            }
          })
        }
      }

      createdWorkouts.push(workout)
    }
  }

  // Create some workout templates (not scheduled, just templates)
  const templateWorkouts = []
  for (let i = 0; i < workoutTemplates.length; i++) {
    const template = workoutTemplates[i]
    
    const templateWorkout = await prisma.workout.create({
      data: {
        name: template.name,
        description: template.description,
        workoutType: template.workoutType,
        estimatedDuration: template.estimatedDuration,
        userId: users[0].id, // Associate templates with first user
        isTemplate: true // Mark as template
      }
    })

    // Add exercises to the template
    for (let j = 0; j < template.exercises.length; j++) {
      const exerciseTemplate = template.exercises[j]
      const exercise = exercises.find(e => e.name === exerciseTemplate.templateName)
      
      if (exercise) {
        await prisma.workoutExercise.create({
          data: {
            workoutId: templateWorkout.id,
            exerciseId: exercise.id,
            orderIndex: j,
            targetSets: exerciseTemplate.targetSets,
            targetReps: exerciseTemplate.targetReps,
            targetWeight: exerciseTemplate.targetWeight,
            targetDuration: exerciseTemplate.targetDuration,
            restBetweenSets: exerciseTemplate.restBetweenSets
          }
        })
      }
    }

    templateWorkouts.push(templateWorkout)
  }

  console.log(`✅ Created ${createdWorkouts.length} sample workouts across ${workoutPlans.length} workout plans`)
  console.log(`✅ Created ${templateWorkouts.length} workout templates`)
}

/**
 * Seed nutrition food database with common foods
 */
async function seedNutritionFoodDatabase() {
  console.log('🥗 Seeding nutrition food database...')

  const foods = [
    // FRUITS
    {
      name: 'Apple',
      brand: null,
      barcode: null,
      category: 'fruit',
      caloriesPer100g: 52,
      proteinPer100g: 0.3,
      carbsPer100g: 14,
      fatPer100g: 0.2,
      fiberPer100g: 2.4,
      sugarPer100g: 10.4,
      sodiumPer100g: 1,
      servingSize: 182, // medium apple
      servingUnit: 'g',
      saturatedFatPer100g: 0.1,
      vitaminCPer100g: 4.6,
      potassiumPer100g: 107,
      isVerified: true,
      source: 'USDA'
    },
    {
      name: 'Banana',
      brand: null,
      barcode: null,
      category: 'fruit',
      caloriesPer100g: 89,
      proteinPer100g: 1.1,
      carbsPer100g: 23,
      fatPer100g: 0.3,
      fiberPer100g: 2.6,
      sugarPer100g: 12.2,
      sodiumPer100g: 1,
      servingSize: 118, // medium banana
      servingUnit: 'g',
      saturatedFatPer100g: 0.1,
      vitaminCPer100g: 8.7,
      potassiumPer100g: 358,
      isVerified: true,
      source: 'USDA'
    },
    {
      name: 'Orange',
      brand: null,
      barcode: null,
      category: 'fruit',
      caloriesPer100g: 47,
      proteinPer100g: 0.9,
      carbsPer100g: 12,
      fatPer100g: 0.1,
      fiberPer100g: 2.4,
      sugarPer100g: 9.4,
      sodiumPer100g: 0,
      servingSize: 131, // medium orange
      servingUnit: 'g',
      saturatedFatPer100g: 0.02,
      vitaminCPer100g: 53.2,
      calciumPer100g: 40,
      isVerified: true,
      source: 'USDA'
    },
    {
      name: 'Blueberries',
      brand: null,
      barcode: null,
      category: 'fruit',
      caloriesPer100g: 57,
      proteinPer100g: 0.7,
      carbsPer100g: 14,
      fatPer100g: 0.3,
      fiberPer100g: 2.4,
      sugarPer100g: 10,
      sodiumPer100g: 1,
      servingSize: 148, // 1 cup
      servingUnit: 'g',
      saturatedFatPer100g: 0.1,
      vitaminCPer100g: 9.7,
      potassiumPer100g: 77,
      isVerified: true,
      source: 'USDA'
    },

    // VEGETABLES
    {
      name: 'Broccoli',
      brand: null,
      barcode: null,
      category: 'vegetable',
      caloriesPer100g: 34,
      proteinPer100g: 2.8,
      carbsPer100g: 7,
      fatPer100g: 0.4,
      fiberPer100g: 2.6,
      sugarPer100g: 1.5,
      sodiumPer100g: 33,
      servingSize: 91, // 1 cup chopped
      servingUnit: 'g',
      saturatedFatPer100g: 0.1,
      vitaminCPer100g: 89.2,
      vitaminAPer100g: 31,
      calciumPer100g: 47,
      ironPer100g: 0.7,
      isVerified: true,
      source: 'USDA'
    },
    {
      name: 'Spinach',
      brand: null,
      barcode: null,
      category: 'vegetable',
      caloriesPer100g: 23,
      proteinPer100g: 2.9,
      carbsPer100g: 3.6,
      fatPer100g: 0.4,
      fiberPer100g: 2.2,
      sugarPer100g: 0.4,
      sodiumPer100g: 79,
      servingSize: 30, // 1 cup fresh
      servingUnit: 'g',
      saturatedFatPer100g: 0.1,
      vitaminAPer100g: 469,
      vitaminCPer100g: 28.1,
      calciumPer100g: 99,
      ironPer100g: 2.7,
      isVerified: true,
      source: 'USDA'
    },
    {
      name: 'Carrot',
      brand: null,
      barcode: null,
      category: 'vegetable',
      caloriesPer100g: 41,
      proteinPer100g: 0.9,
      carbsPer100g: 10,
      fatPer100g: 0.2,
      fiberPer100g: 2.8,
      sugarPer100g: 4.7,
      sodiumPer100g: 69,
      servingSize: 61, // 1 medium carrot
      servingUnit: 'g',
      saturatedFatPer100g: 0.04,
      vitaminAPer100g: 835,
      vitaminCPer100g: 5.9,
      potassiumPer100g: 320,
      isVerified: true,
      source: 'USDA'
    },

    // GRAINS & CEREALS
    {
      name: 'Brown Rice',
      brand: null,
      barcode: null,
      category: 'grain',
      caloriesPer100g: 111,
      proteinPer100g: 2.6,
      carbsPer100g: 23,
      fatPer100g: 0.9,
      fiberPer100g: 1.8,
      sugarPer100g: 0.4,
      sodiumPer100g: 5,
      servingSize: 195, // 1 cup cooked
      servingUnit: 'g',
      saturatedFatPer100g: 0.2,
      ironPer100g: 0.4,
      potassiumPer100g: 43,
      isVerified: true,
      source: 'USDA'
    },
    {
      name: 'Quinoa',
      brand: null,
      barcode: null,
      category: 'grain',
      caloriesPer100g: 120,
      proteinPer100g: 4.4,
      carbsPer100g: 22,
      fatPer100g: 1.9,
      fiberPer100g: 2.8,
      sugarPer100g: 0.9,
      sodiumPer100g: 7,
      servingSize: 185, // 1 cup cooked
      servingUnit: 'g',
      saturatedFatPer100g: 0.2,
      ironPer100g: 1.5,
      potassiumPer100g: 172,
      isVerified: true,
      source: 'USDA'
    },
    {
      name: 'Oats',
      brand: null,
      barcode: null,
      category: 'grain',
      caloriesPer100g: 68,
      proteinPer100g: 2.4,
      carbsPer100g: 12,
      fatPer100g: 1.4,
      fiberPer100g: 1.7,
      sugarPer100g: 0.3,
      sodiumPer100g: 4,
      servingSize: 234, // 1 cup cooked
      servingUnit: 'g',
      saturatedFatPer100g: 0.2,
      ironPer100g: 1.0,
      potassiumPer100g: 70,
      isVerified: true,
      source: 'USDA'
    },

    // PROTEIN SOURCES
    {
      name: 'Chicken Breast',
      brand: null,
      barcode: null,
      category: 'meat',
      caloriesPer100g: 165,
      proteinPer100g: 31,
      carbsPer100g: 0,
      fatPer100g: 3.6,
      fiberPer100g: 0,
      sugarPer100g: 0,
      sodiumPer100g: 74,
      servingSize: 85, // 3 oz
      servingUnit: 'g',
      saturatedFatPer100g: 1.0,
      cholesterolPer100g: 85,
      ironPer100g: 0.4,
      potassiumPer100g: 256,
      isVerified: true,
      source: 'USDA'
    },
    {
      name: 'Salmon',
      brand: null,
      barcode: null,
      category: 'fish',
      caloriesPer100g: 208,
      proteinPer100g: 25,
      carbsPer100g: 0,
      fatPer100g: 12,
      fiberPer100g: 0,
      sugarPer100g: 0,
      sodiumPer100g: 59,
      servingSize: 85, // 3 oz
      servingUnit: 'g',
      saturatedFatPer100g: 3.1,
      cholesterolPer100g: 59,
      ironPer100g: 0.8,
      potassiumPer100g: 363,
      isVerified: true,
      source: 'USDA'
    },
    {
      name: 'Eggs',
      brand: null,
      barcode: null,
      category: 'protein',
      caloriesPer100g: 155,
      proteinPer100g: 13,
      carbsPer100g: 1.1,
      fatPer100g: 11,
      fiberPer100g: 0,
      sugarPer100g: 1.1,
      sodiumPer100g: 124,
      servingSize: 50, // 1 large egg
      servingUnit: 'g',
      saturatedFatPer100g: 3.3,
      cholesterolPer100g: 373,
      vitaminAPer100g: 160,
      ironPer100g: 1.8,
      isVerified: true,
      source: 'USDA'
    },
    {
      name: 'Greek Yogurt',
      brand: null,
      barcode: null,
      category: 'dairy',
      caloriesPer100g: 59,
      proteinPer100g: 10,
      carbsPer100g: 3.6,
      fatPer100g: 0.4,
      fiberPer100g: 0,
      sugarPer100g: 3.6,
      sodiumPer100g: 36,
      servingSize: 170, // 3/4 cup
      servingUnit: 'g',
      saturatedFatPer100g: 0.1,
      calciumPer100g: 110,
      potassiumPer100g: 141,
      isVerified: true,
      source: 'USDA'
    },

    // NUTS & SEEDS
    {
      name: 'Almonds',
      brand: null,
      barcode: null,
      category: 'nuts',
      caloriesPer100g: 579,
      proteinPer100g: 21,
      carbsPer100g: 22,
      fatPer100g: 50,
      fiberPer100g: 12,
      sugarPer100g: 4.4,
      sodiumPer100g: 1,
      servingSize: 28, // 1 oz (about 23 almonds)
      servingUnit: 'g',
      saturatedFatPer100g: 3.8,
      vitaminAPer100g: 0.3,
      calciumPer100g: 269,
      ironPer100g: 3.7,
      potassiumPer100g: 733,
      isVerified: true,
      source: 'USDA'
    },
    {
      name: 'Peanut Butter',
      brand: null,
      barcode: null,
      category: 'nuts',
      caloriesPer100g: 588,
      proteinPer100g: 25,
      carbsPer100g: 20,
      fatPer100g: 50,
      fiberPer100g: 6,
      sugarPer100g: 9.2,
      sodiumPer100g: 17,
      servingSize: 32, // 2 tbsp
      servingUnit: 'g',
      saturatedFatPer100g: 10,
      ironPer100g: 1.9,
      potassiumPer100g: 649,
      isVerified: true,
      source: 'USDA'
    },

    // BEVERAGES
    {
      name: 'Whole Milk',
      brand: null,
      barcode: null,
      category: 'dairy',
      caloriesPer100g: 61,
      proteinPer100g: 3.2,
      carbsPer100g: 4.8,
      fatPer100g: 3.2,
      fiberPer100g: 0,
      sugarPer100g: 5.1,
      sodiumPer100g: 40,
      servingSize: 240, // 1 cup
      servingUnit: 'ml',
      saturatedFatPer100g: 1.9,
      cholesterolPer100g: 10,
      calciumPer100g: 113,
      potassiumPer100g: 132,
      isVerified: true,
      source: 'USDA'
    },
    {
      name: 'Orange Juice',
      brand: null,
      barcode: null,
      category: 'beverage',
      caloriesPer100g: 45,
      proteinPer100g: 0.7,
      carbsPer100g: 10,
      fatPer100g: 0.2,
      fiberPer100g: 0.2,
      sugarPer100g: 8.4,
      sodiumPer100g: 1,
      servingSize: 240, // 1 cup
      servingUnit: 'ml',
      saturatedFatPer100g: 0.03,
      vitaminCPer100g: 50,
      calciumPer100g: 11,
      potassiumPer100g: 200,
      isVerified: true,
      source: 'USDA'
    },

    // PROCESSED FOODS
    {
      name: 'Pasta',
      brand: null,
      barcode: null,
      category: 'grain',
      caloriesPer100g: 131,
      proteinPer100g: 5,
      carbsPer100g: 25,
      fatPer100g: 1.1,
      fiberPer100g: 1.8,
      sugarPer100g: 0.6,
      sodiumPer100g: 1,
      servingSize: 140, // 1 cup cooked
      servingUnit: 'g',
      saturatedFatPer100g: 0.2,
      ironPer100g: 0.9,
      isVerified: true,
      source: 'USDA'
    },
    {
      name: 'White Bread',
      brand: null,
      barcode: null,
      category: 'grain',
      caloriesPer100g: 265,
      proteinPer100g: 9,
      carbsPer100g: 49,
      fatPer100g: 3.2,
      fiberPer100g: 2.7,
      sugarPer100g: 5.7,
      sodiumPer100g: 681,
      servingSize: 28, // 1 slice
      servingUnit: 'g',
      saturatedFatPer100g: 0.8,
      ironPer100g: 3.6,
      calciumPer100g: 151,
      isVerified: true,
      source: 'USDA'
    }
  ]

  for (const food of foods) {
    // Check if food already exists by name
    const existing = await prisma.food.findFirst({
      where: { 
        name: food.name, 
        isPublic: true, 
        userId: null 
      }
    })

    if (!existing) {
      await prisma.food.create({
        data: {
          ...food,
          isPublic: true,
          userId: null // System foods
        }
      })
    }
  }

  console.log(`✅ Created ${foods.length} food items in nutrition database`)
}

/**
 * Seed nutrition data for test users
 */
async function seedNutritionData(users: any[]) {
  if (!users.length) return

  console.log('📊 Seeding nutrition data for test users...')

  // Get some foods to use in logs
  const foods = await prisma.food.findMany({
    where: { isPublic: true },
    take: 20
  })

  if (foods.length === 0) {
    console.log('No foods found, skipping nutrition data seeding')
    return
  }

  let totalCreated = 0

  for (const user of users) {
    // Create nutrition goals
    const nutritionGoal = await prisma.nutritionGoal.create({
      data: {
        userId: user.id,
        dailyCalories: 2000,
        dailyProtein: 150, // 30% of calories
        dailyCarbs: 250,   // 50% of calories  
        dailyFat: 67,      // 20% of calories
        dailyFiber: 25,
        dailySugar: 50,    // limit
        dailySodium: 2300, // limit in mg
        proteinPercentage: 30,
        carbsPercentage: 50,
        fatPercentage: 20,
        goalType: 'maintenance',
        activityLevel: 'moderate',
        startDate: new Date(),
        currentWeight: 70, // kg
        targetWeight: 68,  // kg
        heightCm: 175,
        age: 30,
        gender: 'male'
      }
    })
    totalCreated++

    // Create sample meals for the last 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date()
      date.setDate(date.getDate() - dayOffset)
      date.setHours(0, 0, 0, 0)

      // Breakfast
      const breakfast = await prisma.meal.create({
        data: {
          userId: user.id,
          name: 'Breakfast',
          mealType: 'breakfast',
          date: date,
          plannedTime: new Date(date.getTime() + 8 * 60 * 60 * 1000), // 8 AM
          consumedTime: new Date(date.getTime() + 8.5 * 60 * 60 * 1000), // 8:30 AM
          totalCalories: 0, // Will be updated by food logs
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0
        }
      })

      // Add some foods to breakfast
      const breakfastFoods = [
        { food: foods.find(f => f.name === 'Oats'), quantity: 50, unit: 'g' },
        { food: foods.find(f => f.name === 'Banana'), quantity: 118, unit: 'g' },
        { food: foods.find(f => f.name === 'Whole Milk'), quantity: 240, unit: 'ml' }
      ].filter(item => item.food) // Remove any undefined foods

      for (const item of breakfastFoods) {
        if (item.food) {
          const quantity = item.quantity
          const multiplier = quantity / 100 // Convert per 100g to actual quantity
          
          await prisma.foodLog.create({
            data: {
              userId: user.id,
              foodId: item.food.id,
              mealId: breakfast.id,
              quantity: quantity,
              unit: item.unit,
              calories: item.food.caloriesPer100g * multiplier,
              protein: item.food.proteinPer100g * multiplier,
              carbs: item.food.carbsPer100g * multiplier,
              fat: item.food.fatPer100g * multiplier,
              fiber: item.food.fiberPer100g ? item.food.fiberPer100g * multiplier : null,
              sugar: item.food.sugarPer100g ? item.food.sugarPer100g * multiplier : null,
              sodium: item.food.sodiumPer100g ? item.food.sodiumPer100g * multiplier : null,
              consumedAt: breakfast.consumedTime || breakfast.plannedTime,
              mealType: 'breakfast'
            }
          })
          totalCreated++
        }
      }

      // Lunch
      const lunch = await prisma.meal.create({
        data: {
          userId: user.id,
          name: 'Lunch',
          mealType: 'lunch',
          date: date,
          plannedTime: new Date(date.getTime() + 12 * 60 * 60 * 1000), // 12 PM
          consumedTime: new Date(date.getTime() + 12.5 * 60 * 60 * 1000), // 12:30 PM
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0
        }
      })

      // Add foods to lunch
      const lunchFoods = [
        { food: foods.find(f => f.name === 'Chicken Breast'), quantity: 85, unit: 'g' },
        { food: foods.find(f => f.name === 'Brown Rice'), quantity: 195, unit: 'g' },
        { food: foods.find(f => f.name === 'Broccoli'), quantity: 91, unit: 'g' }
      ].filter(item => item.food)

      for (const item of lunchFoods) {
        if (item.food) {
          const quantity = item.quantity
          const multiplier = quantity / 100
          
          await prisma.foodLog.create({
            data: {
              userId: user.id,
              foodId: item.food.id,
              mealId: lunch.id,
              quantity: quantity,
              unit: item.unit,
              calories: item.food.caloriesPer100g * multiplier,
              protein: item.food.proteinPer100g * multiplier,
              carbs: item.food.carbsPer100g * multiplier,
              fat: item.food.fatPer100g * multiplier,
              fiber: item.food.fiberPer100g ? item.food.fiberPer100g * multiplier : null,
              sugar: item.food.sugarPer100g ? item.food.sugarPer100g * multiplier : null,
              sodium: item.food.sodiumPer100g ? item.food.sodiumPer100g * multiplier : null,
              consumedAt: lunch.consumedTime || lunch.plannedTime,
              mealType: 'lunch'
            }
          })
          totalCreated++
        }
      }

      // Add some water intake for the day
      const waterIntakes = [
        { amount: 250, time: 8 },   // 8 AM
        { amount: 300, time: 10 },  // 10 AM  
        { amount: 200, time: 12 },  // 12 PM
        { amount: 250, time: 15 },  // 3 PM
        { amount: 300, time: 18 },  // 6 PM
        { amount: 200, time: 20 }   // 8 PM
      ]

      for (const intake of waterIntakes) {
        const recordedAt = new Date(date.getTime() + intake.time * 60 * 60 * 1000)
        
        await prisma.waterIntake.create({
          data: {
            userId: user.id,
            amountMl: intake.amount,
            amountOz: intake.amount * 0.033814, // Convert ml to oz
            recordedAt: recordedAt,
            date: date,
            source: 'water'
          }
        })
        totalCreated++
      }
    }
  }

  console.log(`✅ Created ${totalCreated} nutrition data entries for ${users.length} users`)
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