/**
 * Gamification system types and interfaces
 */

/**
 * XP calculation configuration
 */
export interface XPConfiguration {
  baseXP: Record<string, number>; // Action -> base XP mapping
  difficultyMultipliers: {
    easy: number;
    medium: number;
    hard: number;
    expert: number;
  };
  streakBonusPercentage: number;
  levelThresholds: number[]; // XP required for each level
  maxLevel: number;
}

/**
 * User level information
 */
export interface UserLevel {
  currentLevel: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressToNextLevel: number; // 0-1
  totalXP: number;
}

/**
 * Streak tracking
 */
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  streakStartDate: Date | null;
  isActive: boolean;
}

/**
 * Achievement progress tracking
 */
export interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  targetValue: number;
  progress: number; // 0-1
  isCompleted: boolean;
  unlockedAt?: Date;
  completedAt?: Date;
}

/**
 * Achievement condition types
 */
export type AchievementConditionType = 
  | 'count' // Count of specific actions
  | 'streak' // Consecutive days/actions
  | 'completion' // Completion percentage
  | 'custom'; // Custom validation logic

/**
 * Achievement condition configuration
 */
export interface AchievementCondition {
  type: AchievementConditionType;
  target?: number;
  field?: string;
  timeframe?: 'day' | 'week' | 'month' | 'year' | 'all';
  customValidator?: (data: unknown) => boolean;
}

/**
 * Achievement tier configuration
 */
export interface AchievementTier {
  name: 'bronze' | 'silver' | 'gold' | 'platinum';
  multiplier: number; // XP multiplier for this tier
  color: string; // Hex color for UI
  icon: string; // Icon identifier
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  totalXP: number;
  currentLevel: number;
  currentStreak: number;
  rank: number;
  moduleSpecificData?: Record<string, unknown>;
}

/**
 * Activity feed entry
 */
export interface ActivityEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'goal_completed' | 'achievement_unlocked' | 'streak_milestone' | 'level_up' | 'custom';
  description: string;
  xpEarned: number;
  moduleId?: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

/**
 * Reward configuration
 */
export interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'badge' | 'avatar' | 'theme' | 'feature_unlock' | 'custom';
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirements: {
    level?: number;
    achievements?: string[];
    totalXP?: number;
    streakDays?: number;
    customCondition?: (userData: unknown) => boolean;
  };
  rewardData: Record<string, unknown>;
}

/**
 * Challenge configuration
 */
export interface Challenge {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  moduleId?: string;
  type: 'individual' | 'team' | 'global';
  conditions: AchievementCondition[];
  rewards: {
    xp: number;
    achievements?: string[];
    customRewards?: string[];
  };
  participants: string[]; // User IDs
  leaderboard?: LeaderboardEntry[];
}

/**
 * User gamification profile
 */
export interface UserGamificationProfile {
  userId: string;
  level: UserLevel;
  streak: StreakData;
  achievements: AchievementProgress[];
  unlockedRewards: string[];
  activeChallenges: string[];
  preferences: {
    showPublicProfile: boolean;
    participateInLeaderboards: boolean;
    receiveAchievementNotifications: boolean;
    showStreakReminders: boolean;
  };
  statistics: {
    totalGoalsCompleted: number;
    totalActiveDays: number;
    favoriteModules: string[];
    averageDailyXP: number;
    peakStreak: number;
  };
}

/**
 * XP transaction record
 */
export interface XPTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  moduleId?: string;
  goalId?: string;
  source: 'goal_completion' | 'achievement' | 'streak_bonus' | 'manual' | 'challenge';
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Notification for gamification events
 */
export interface GamificationNotification {
  id: string;
  userId: string;
  type: 'level_up' | 'achievement_unlocked' | 'streak_milestone' | 'challenge_completed';
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
}