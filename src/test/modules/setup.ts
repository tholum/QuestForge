/**
 * Test setup for module system tests
 */

import { vi } from 'vitest';

// Mock Prisma Client
export const mockPrismaClient = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  module: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    upsert: vi.fn(),
    deleteMany: vi.fn(),
  },
  goal: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  progress: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  achievement: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  userAchievement: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

// Mock Next.js Request/Response
export const createMockRequest = (url: string, options?: RequestInit) => {
  return new Request(url, options);
};

// Mock module factory helper
export const createTestModule = (id: string, overrides: any = {}) => {
  return {
    id,
    name: `Test Module ${id}`,
    version: '1.0.0',
    icon: 'test',
    color: '#000000',
    metadata: {
      id,
      name: `Test Module ${id}`,
      version: '1.0.0',
      author: 'Test Author',
      description: `Test module for ${id}`,
      keywords: ['test', id],
      license: 'MIT',
      minSystemVersion: '1.0.0',
      dependencies: {},
    },
    components: {
      dashboard: () => null,
      mobileQuickAdd: () => null,
      desktopDetail: () => null,
      settings: () => null,
    },
    achievements: [],
    pointsConfig: {
      actions: {
        test_action: {
          basePoints: 10,
          difficultyMultiplier: true,
          streakBonus: true,
          description: 'Test action'
        }
      },
      difficultyMultipliers: {
        easy: 1,
        medium: 1.5,
        hard: 2,
        expert: 3
      },
      streakBonusPercentage: 10
    },
    permissions: [`read:${id}_data`, `write:${id}_data`],
    capabilities: [],
    async onInstall() { console.log(`Installing ${id}`); },
    async onUninstall() { console.log(`Uninstalling ${id}`); },
    async onEnable() { console.log(`Enabling ${id}`); },
    async onDisable() { console.log(`Disabling ${id}`); },
    ...overrides
  };
};

// Mock user data for testing
export const createTestUser = (overrides: any = {}) => {
  return {
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
    totalXp: 100,
    currentLevel: 2,
    streakCount: 5,
    lastActivity: new Date(),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
    preferences: {},
    ...overrides
  };
};

// Mock achievement data for testing
export const createTestAchievement = (overrides: any = {}) => {
  return {
    id: 'test-achievement-1',
    name: 'Test Achievement',
    description: 'A test achievement',
    icon: 'trophy',
    tier: 'bronze',
    moduleId: 'test_module',
    conditions: {
      type: 'count',
      target: 10,
      field: 'testCount'
    },
    xpReward: 50,
    createdAt: new Date(),
    ...overrides
  };
};

// Test configuration constants
export const TEST_CONFIG = {
  XP_CONFIG: {
    baseXP: {
      complete_goal: 10,
      create_goal: 5,
      update_progress: 2,
    },
    difficultyMultipliers: {
      easy: 1,
      medium: 1.5,
      hard: 2,
      expert: 3,
    },
    streakBonusPercentage: 10,
    levelThresholds: [100, 250, 500, 1000, 1750],
    maxLevel: 50,
  },
  MODULE_LIFECYCLE_TIMEOUT: 5000,
  TEST_TIMEOUT: 10000,
};

// Helper function to wait for async operations
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock console methods to avoid noise in tests
export const mockConsole = () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
};

// Cleanup function for after tests
export const cleanup = () => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
};