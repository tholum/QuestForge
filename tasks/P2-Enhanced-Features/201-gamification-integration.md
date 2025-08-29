# P2-201: Gamification Integration

## Task Overview

**Priority**: P2 (Enhanced Feature)  
**Status**: Partially Complete  
**Effort**: 8 Story Points  
**Sprint**: Enhanced Experience  

## Description

Complete and enhance the gamification system integration to provide engaging user experiences through points, levels, achievements, and streaks. While the basic gamification infrastructure exists, it needs full integration with user actions, visual feedback, and motivation systems.

## Dependencies

- ✅ P0-002: Database Integration (Achievement models exist)
- ✅ P1-101: Goal Management CRUD (for earning XP from goals)
- ✅ P1-102: Progress Tracking (for earning XP from progress)
- ✅ Basic gamification services exist
- ❌ Visual feedback components
- ❌ Achievement notification system

## Definition of Done

### Core Gamification Features
- [ ] Complete XP earning system for all user actions
- [ ] Level progression with rewards and unlocks
- [ ] Achievement system with tiered rewards
- [ ] Streak tracking and bonuses
- [ ] Daily/weekly/monthly challenges
- [ ] Leaderboards and social comparison
- [ ] Visual feedback for XP gains and achievements

### User Experience Components
- [ ] XP and level display in header/sidebar
- [ ] Achievement notification system
- [ ] Progress celebrations and animations
- [ ] Level-up ceremonies
- [ ] Achievement gallery/collection view
- [ ] Gamification dashboard with statistics

### Achievement System
- [ ] Goal-based achievements (create, complete, streaks)
- [ ] Progress-based achievements (consistency, volume)
- [ ] Module-specific achievements
- [ ] Time-based achievements (daily, weekly, monthly)
- [ ] Special milestone achievements
- [ ] Secret/hidden achievements

### Motivation Features
- [ ] Streak visualization and protection
- [ ] Daily challenge system
- [ ] Motivational quotes and tips
- [ ] Progress celebrations
- [ ] Social sharing capabilities
- [ ] Gamification insights and analytics

## User Stories

### US-201.1: XP and Level Progression
```
As a user
I want to earn XP for completing tasks and see my level progress
So that I feel motivated to continue working toward my goals
```

**Acceptance Criteria:**
- XP is earned for goal creation, progress updates, and completions
- Level progression is clearly visible in the UI
- Level-ups trigger celebratory animations and rewards
- XP amounts are balanced and feel rewarding
- Level benefits are meaningful (unlocks, bonuses, etc.)
- Progress toward next level is always visible

### US-201.2: Achievement System
```
As a user
I want to unlock achievements for various accomplishments
So that I feel recognized for my efforts and have additional goals to work toward
```

**Acceptance Criteria:**
- Achievements are earned automatically for qualifying actions
- New achievements trigger prominent notifications
- Achievement gallery shows all earned and available achievements
- Achievement progress is visible for incomplete achievements
- Achievements have meaningful rewards (XP, titles, unlocks)
- Social sharing options for major achievements

### US-201.3: Streak Tracking
```
As a user
I want to maintain streaks for consistent behavior
So that I'm motivated to stay consistent with my habits
```

**Acceptance Criteria:**
- Streaks are tracked for daily progress entries
- Streak count is prominently displayed
- Streak bonuses increase XP earnings
- Streak protection features help maintain momentum
- Visual indicators show streak status
- Streak milestones trigger special achievements

### US-201.4: Gamification Dashboard
```
As a user
I want to see my gamification statistics and progress
So that I can understand my patterns and stay motivated
```

**Acceptance Criteria:**
- Dashboard shows total XP, current level, and progress
- Achievement collection is prominently displayed
- Streak information and calendar view
- Leaderboard showing position among friends/global
- Statistics on goals completed, XP earned, etc.
- Motivational insights and suggestions

## Technical Implementation

### Enhanced XP System

#### XP Service Implementation
```typescript
// src/lib/gamification/XPService.ts
interface XPAction {
  type: string;
  points: number;
  multipliers?: {
    difficulty?: number;
    streak?: number;
    first?: number;
  };
}

export class XPService {
  private static readonly XP_ACTIONS: Record<string, XPAction> = {
    GOAL_CREATE: { type: 'goal_create', points: 5 },
    GOAL_COMPLETE: { type: 'goal_complete', points: 50, multipliers: { difficulty: true } },
    PROGRESS_UPDATE: { type: 'progress_update', points: 10, multipliers: { streak: true } },
    DAILY_LOGIN: { type: 'daily_login', points: 5 },
    STREAK_MILESTONE: { type: 'streak_milestone', points: 25 },
    FIRST_GOAL: { type: 'first_goal', points: 20, multipliers: { first: true } },
  };

  private static readonly DIFFICULTY_MULTIPLIERS = {
    easy: 1,
    medium: 1.5,
    hard: 2,
    expert: 3,
  };

  async earnXP(
    userId: string, 
    actionType: keyof typeof XPService.XP_ACTIONS, 
    context?: {
      difficulty?: string;
      streakDay?: number;
      isFirst?: boolean;
    }
  ) {
    const action = XPService.XP_ACTIONS[actionType];
    if (!action) throw new Error(`Unknown XP action: ${actionType}`);

    let points = action.points;

    // Apply multipliers
    if (action.multipliers?.difficulty && context?.difficulty) {
      points *= XPService.DIFFICULTY_MULTIPLIERS[context.difficulty] || 1;
    }

    if (action.multipliers?.streak && context?.streakDay) {
      const streakMultiplier = Math.min(2, 1 + (context.streakDay * 0.1));
      points *= streakMultiplier;
    }

    if (action.multipliers?.first && context?.isFirst) {
      points *= 2;
    }

    points = Math.floor(points);

    // Update user XP
    const user = await this.addXPToUser(userId, points);
    
    // Check for level up
    const levelUp = await this.checkLevelUp(userId, user.totalXp);
    
    // Log XP transaction
    await this.logXPTransaction(userId, actionType, points, context);

    return {
      xpEarned: points,
      newTotalXP: user.totalXp,
      levelUp,
      achievements: await this.checkAchievements(userId, actionType, context),
    };
  }

  private async addXPToUser(userId: string, points: number) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        totalXp: { increment: points },
        lastActivity: new Date(),
      },
    });
  }

  private async checkLevelUp(userId: string, totalXP: number): Promise<LevelUp | null> {
    const currentLevel = this.calculateLevel(totalXP);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentLevel: true },
    });

    if (currentLevel > (user?.currentLevel || 1)) {
      await prisma.user.update({
        where: { id: userId },
        data: { currentLevel },
      });

      return {
        oldLevel: user?.currentLevel || 1,
        newLevel: currentLevel,
        rewards: await this.getLevelRewards(currentLevel),
      };
    }

    return null;
  }

  private calculateLevel(totalXP: number): number {
    // Progressive XP requirements: level 1=0, level 2=100, level 3=300, level 4=600, etc.
    let level = 1;
    let xpRequired = 0;
    
    while (totalXP >= xpRequired) {
      level++;
      xpRequired += level * 100; // Each level requires more XP
    }
    
    return level - 1;
  }

  private async getLevelRewards(level: number): Promise<LevelReward[]> {
    const rewards: LevelReward[] = [];

    // Add rewards based on level milestones
    if (level % 5 === 0) {
      rewards.push({
        type: 'achievement',
        title: `Level ${level} Master`,
        description: `Reached level ${level}!`,
        xpBonus: level * 50,
      });
    }

    if (level === 10) {
      rewards.push({
        type: 'unlock',
        title: 'Advanced Features',
        description: 'Unlocked advanced goal analytics',
      });
    }

    return rewards;
  }
}
```

### Achievement System Implementation

#### Achievement Manager
```typescript
// src/lib/gamification/AchievementManager.ts
export class AchievementManager {
  private static readonly ACHIEVEMENTS: Achievement[] = [
    {
      id: 'first_goal',
      name: 'First Steps',
      description: 'Create your first goal',
      icon: '🎯',
      tier: 'bronze',
      xpReward: 25,
      conditions: { goalCount: 1 },
      category: 'goals',
    },
    {
      id: 'goal_creator',
      name: 'Goal Creator',
      description: 'Create 10 goals',
      icon: '📋',
      tier: 'silver',
      xpReward: 100,
      conditions: { goalCount: 10 },
      category: 'goals',
    },
    {
      id: 'completionist',
      name: 'Completionist',
      description: 'Complete 25 goals',
      icon: '✅',
      tier: 'gold',
      xpReward: 250,
      conditions: { completedGoals: 25 },
      category: 'completion',
    },
    {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      tier: 'silver',
      xpReward: 150,
      conditions: { streak: 7 },
      category: 'consistency',
    },
    {
      id: 'progress_master',
      name: 'Progress Master',
      description: 'Make 100 progress updates',
      icon: '📈',
      tier: 'gold',
      xpReward: 200,
      conditions: { progressUpdates: 100 },
      category: 'progress',
    },
  ];

  async checkAchievements(userId: string, triggerAction?: string): Promise<NewAchievement[]> {
    const userStats = await this.getUserStats(userId);
    const unlockedAchievements = await this.getUnlockedAchievements(userId);
    const newAchievements: NewAchievement[] = [];

    for (const achievement of AchievementManager.ACHIEVEMENTS) {
      // Skip if already unlocked
      if (unlockedAchievements.includes(achievement.id)) continue;

      // Check if conditions are met
      if (this.checkConditions(achievement.conditions, userStats)) {
        await this.unlockAchievement(userId, achievement);
        newAchievements.push({
          ...achievement,
          unlockedAt: new Date(),
        });
      }
    }

    return newAchievements;
  }

  private async getUserStats(userId: string) {
    const [
      goalCount,
      completedGoals,
      progressUpdates,
      user,
      currentStreak
    ] = await Promise.all([
      prisma.goal.count({ where: { userId } }),
      prisma.goal.count({ where: { userId, isCompleted: true } }),
      prisma.progress.count({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId } }),
      this.getCurrentStreak(userId),
    ]);

    return {
      goalCount,
      completedGoals,
      progressUpdates,
      totalXp: user?.totalXp || 0,
      currentLevel: user?.currentLevel || 1,
      streak: currentStreak,
    };
  }

  private checkConditions(conditions: any, stats: any): boolean {
    return Object.entries(conditions).every(([key, value]) => {
      return stats[key] >= value;
    });
  }

  private async unlockAchievement(userId: string, achievement: Achievement) {
    // Create user achievement record
    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
        isCompleted: true,
        unlockedAt: new Date(),
      },
    });

    // Award XP
    if (achievement.xpReward > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalXp: { increment: achievement.xpReward },
        },
      });
    }
  }
}
```

### Visual Feedback Components

#### XP Notification Component
```typescript
// src/components/gamification/XPNotification.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface XPNotificationProps {
  xpEarned: number;
  show: boolean;
  onComplete: () => void;
}

export function XPNotification({ xpEarned, show, onComplete }: XPNotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-20 right-4 z-50"
        >
          <Card className="bg-primary text-primary-foreground p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl"
              >
                ⭐
              </motion.div>
              <div>
                <div className="font-bold">+{xpEarned} XP</div>
                <div className="text-sm opacity-90">Nice work!</div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

#### Level Progress Bar
```typescript
// src/components/gamification/LevelProgressBar.tsx
'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface LevelProgressBarProps {
  currentLevel: number;
  totalXp: number;
  className?: string;
}

export function LevelProgressBar({ currentLevel, totalXp, className }: LevelProgressBarProps) {
  const calculateXpForLevel = (level: number): number => {
    let total = 0;
    for (let i = 2; i <= level; i++) {
      total += i * 100;
    }
    return total;
  };

  const currentLevelXp = calculateXpForLevel(currentLevel);
  const nextLevelXp = calculateXpForLevel(currentLevel + 1);
  const progressInLevel = totalXp - currentLevelXp;
  const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
  const progressPercentage = (progressInLevel / xpNeededForNextLevel) * 100;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <Badge variant="secondary">Level {currentLevel}</Badge>
        <span className="text-sm text-muted-foreground">
          {progressInLevel}/{xpNeededForNextLevel} XP
        </span>
      </div>
      <Progress value={progressPercentage} className="h-2" />
      <div className="text-xs text-muted-foreground mt-1 text-center">
        {Math.floor(xpNeededForNextLevel - progressInLevel)} XP to next level
      </div>
    </div>
  );
}
```

### Achievement Gallery

#### Achievement Display Component
```typescript
// src/components/gamification/AchievementGallery.tsx
'use client';

import { useState, useEffect } from 'react';
import { UserAchievement, Achievement } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

interface AchievementWithProgress extends UserAchievement {
  achievement: Achievement;
}

interface AchievementGalleryProps {
  userAchievements: AchievementWithProgress[];
  availableAchievements: Achievement[];
}

export function AchievementGallery({ 
  userAchievements, 
  availableAchievements 
}: AchievementGalleryProps) {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const unlockedIds = userAchievements
    .filter(ua => ua.isCompleted)
    .map(ua => ua.achievementId);

  const filteredAchievements = availableAchievements.filter(achievement => {
    switch (filter) {
      case 'unlocked':
        return unlockedIds.includes(achievement.id);
      case 'locked':
        return !unlockedIds.includes(achievement.id);
      default:
        return true;
    }
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-amber-100 text-amber-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All ({availableAchievements.length})</TabsTrigger>
          <TabsTrigger value="unlocked">Unlocked ({unlockedIds.length})</TabsTrigger>
          <TabsTrigger value="locked">Locked ({availableAchievements.length - unlockedIds.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => {
              const userAchievement = userAchievements.find(
                ua => ua.achievementId === achievement.id
              );
              const isUnlocked = userAchievement?.isCompleted || false;

              return (
                <Card 
                  key={achievement.id}
                  className={`transition-all duration-200 ${
                    isUnlocked 
                      ? 'ring-2 ring-primary/20 shadow-lg' 
                      : 'opacity-60 grayscale'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="text-3xl mb-2">{achievement.icon}</div>
                      <Badge className={getTierColor(achievement.tier)}>
                        {achievement.tier}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{achievement.name}</CardTitle>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {achievement.description}
                    </p>
                    
                    {isUnlocked ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600 font-medium">✓ Unlocked</span>
                        <span className="text-primary font-medium">
                          +{achievement.xpReward} XP
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {userAchievement && userAchievement.progress > 0 && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{Math.floor(userAchievement.progress)}%</span>
                            </div>
                            <Progress value={userAchievement.progress} className="h-1" />
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          Reward: +{achievement.xpReward} XP
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Mobile Optimizations

### Touch-Friendly Gamification
- Large achievement cards for easy viewing
- Smooth animations that don't impact performance
- Quick access to gamification stats in mobile header
- Haptic feedback for level-ups and achievements

### Performance Considerations
- Lazy loading of achievement images/icons
- Cached XP calculations
- Efficient achievement checking (batched)
- Optimized animations for lower-end devices

## Testing Strategy

### Unit Tests
- XP calculation accuracy
- Achievement condition checking
- Level progression logic
- Streak calculation algorithms

### Integration Tests
- Complete gamification workflows
- Achievement unlocking processes
- XP earning from various actions
- Level-up reward distribution

### Performance Tests
- Achievement checking performance with large datasets
- Animation smoothness on various devices
- Memory usage with gamification components

## Success Metrics

### Engagement Metrics
- User session length increase by 30%
- Daily active users increase by 25%
- Goal completion rate increase by 40%
- User retention increase by 35%

### Gamification Metrics
- Average XP earned per user per day
- Achievement unlock rate > 80% for bronze tier
- Level distribution across user base
- Streak length averages > 7 days

### Technical Metrics
- XP calculation accuracy 100%
- Achievement unlock latency < 500ms
- UI animation smoothness 60fps
- Gamification component load time < 1s

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Assigned**: TBD  
**Sprint**: Enhanced Experience