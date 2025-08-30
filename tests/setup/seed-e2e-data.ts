/**
 * E2E Test Data Seeding Script
 * 
 * This script ensures that the test database has the required data
 * for E2E tests, including the demo user and basic modules.
 */
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../../src/lib/auth/password';

const prisma = new PrismaClient();

/**
 * Seed data specifically for E2E tests
 */
export async function seedE2EData() {
  console.log('🌱 Seeding E2E test data...');

  try {
    // Ensure modules exist
    await seedModulesForE2E();
    
    // Ensure demo user exists
    await seedDemoUser();
    
    // Ensure basic achievements exist
    await seedBasicAchievements();
    
    console.log('✅ E2E test data seeded successfully!');
    
  } catch (error) {
    console.error('❌ E2E seeding failed:', error);
    throw error;
  }
}

/**
 * Seed essential modules for E2E testing
 */
async function seedModulesForE2E() {
  console.log('📦 Seeding modules for E2E...');

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
      id: 'home',
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
  ];

  for (const moduleData of modules) {
    await prisma.module.upsert({
      where: { id: moduleData.id },
      update: moduleData,
      create: moduleData,
    });
  }

  console.log(`✅ Created/updated ${modules.length} modules`);
}

/**
 * Seed demo user for E2E testing
 */
async function seedDemoUser() {
  console.log('👤 Seeding demo user for E2E...');

  const hashedPassword = await hashPassword('password123');
  
  const demoUser = {
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
  };

  await prisma.user.upsert({
    where: { email: demoUser.email },
    update: {
      ...demoUser,
      // Keep existing data, just update key fields
      emailVerified: true,
      password: hashedPassword
    },
    create: demoUser,
  });

  console.log('✅ Demo user created/updated');
}

/**
 * Seed basic achievements for E2E testing
 */
async function seedBasicAchievements() {
  console.log('🏆 Seeding basic achievements for E2E...');

  const basicAchievements = [
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
    }
  ];

  for (const achievement of basicAchievements) {
    await prisma.achievement.upsert({
      where: { id: achievement.id },
      update: achievement,
      create: achievement,
    });
  }

  console.log(`✅ Created/updated ${basicAchievements.length} basic achievements`);
}

/**
 * Run seeding if called directly
 */
if (require.main === module) {
  seedE2EData()
    .then(async () => {
      await prisma.$disconnect();
      console.log('🎉 E2E seeding completed successfully!');
      process.exit(0);
    })
    .catch(async (e) => {
      console.error('💥 E2E seeding failed:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}