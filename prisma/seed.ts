import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create sample modules based on PROJECT_OVERVIEW.md
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
        translations: ['NIV', 'ESV', 'NASB', 'KJV'],
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
      },
    },
  ]

  // Create modules
  for (const moduleData of modules) {
    await prisma.module.upsert({
      where: { id: moduleData.id },
      update: moduleData,
      create: moduleData,
    })
  }

  // Create sample achievements
  const achievements = [
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
      id: 'streak_week',
      name: 'Weekly Warrior',
      description: 'Maintain a 7-day activity streak',
      icon: 'fire',
      tier: 'silver',
      xpReward: 50,
      conditions: { type: 'streak', days: 7 },
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
      id: 'fitness_enthusiast',
      name: 'Fitness Enthusiast',
      description: 'Complete 10 fitness goals',
      icon: 'dumbbell',
      tier: 'silver',
      moduleId: 'fitness',
      xpReward: 75,
      conditions: { type: 'module_goals_completed', module: 'fitness', count: 10 },
    },
  ]

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { id: achievement.id },
      update: achievement,
      create: achievement,
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })