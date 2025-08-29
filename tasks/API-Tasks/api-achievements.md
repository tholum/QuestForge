# API-A: Achievements API Implementation

## Task Overview

**Priority**: API (Core Infrastructure)  
**Status**: Partially Complete  
**Effort**: 3 Story Points  
**Sprint**: API Development  

## Description

Implement comprehensive RESTful API endpoints for the achievements and gamification system, including achievement management, XP tracking, level progression, leaderboards, and badge systems. This API provides the backend foundation for all gamification features across the application.

## Dependencies

- ✅ P0-002: Database Integration (achievements data persistence)
- ✅ P2-201: Gamification Integration (business logic foundation)
- ✅ API-G: Goals API Implementation (goal-related achievements)
- ❌ P0-001: Authentication System (secure API access)

## Definition of Done

### Core Achievement API Endpoints
- [ ] GET /api/v1/achievements - List user achievements
- [ ] GET /api/v1/achievements/{id} - Get specific achievement
- [ ] POST /api/v1/achievements/unlock - Manually unlock achievement
- [ ] GET /api/v1/achievements/available - Get available achievements
- [ ] GET /api/v1/achievements/progress - Get achievement progress
- [ ] PUT /api/v1/achievements/{id}/progress - Update achievement progress

### Gamification System Endpoints
- [ ] GET /api/v1/gamification/profile - Get user gamification profile
- [ ] GET /api/v1/gamification/xp - Get XP history and analytics
- [ ] POST /api/v1/gamification/xp - Award XP manually
- [ ] GET /api/v1/gamification/levels - Get level information and requirements
- [ ] GET /api/v1/gamification/leaderboards - Get leaderboard data
- [ ] GET /api/v1/gamification/badges - Get user badges and collections

### Achievement Management Endpoints
- [ ] POST /api/v1/admin/achievements - Create new achievement (admin)
- [ ] PUT /api/v1/admin/achievements/{id} - Update achievement (admin)
- [ ] DELETE /api/v1/admin/achievements/{id} - Delete achievement (admin)
- [ ] GET /api/v1/admin/achievements/analytics - Achievement analytics (admin)
- [ ] POST /api/v1/achievements/verify - Verify achievement conditions
- [ ] GET /api/v1/achievements/categories - Get achievement categories

## User Stories

### US-API-A.1: Achievement Discovery
```
As a client application
I want to retrieve available achievements and user progress
So that I can display achievement galleries and progress to users
```

**Acceptance Criteria:**
- API returns all available achievements with metadata
- User progress is included for each achievement
- Achievements are categorized and filterable
- Locked achievements show requirements without spoilers
- API supports pagination for large achievement sets
- Response includes achievement artwork and descriptions

### US-API-A.2: Achievement Unlocking
```
As a gamification system
I want to unlock achievements when conditions are met
So that users receive recognition for their accomplishments
```

**Acceptance Criteria:**
- API validates achievement unlock conditions
- Awards appropriate XP and badges upon unlock
- Prevents duplicate achievement unlocks
- Updates user level and statistics automatically
- Triggers appropriate notifications
- Logs achievement unlock for audit trail

### US-API-A.3: Gamification Analytics
```
As an analytics dashboard
I want to access gamification metrics and statistics
So that I can display meaningful progress data to users
```

**Acceptance Criteria:**
- Returns comprehensive XP history and trends
- Provides level progression information and forecasts
- Calculates achievement completion rates
- Includes leaderboard rankings and comparisons
- Supports custom time range analytics
- Optimizes calculations for real-time display

## Technical Implementation

### API Endpoints

#### Achievement Endpoints
```typescript
// src/app/api/v1/achievements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/auth';
import { achievementService } from '@/lib/services/achievement-service';
import { validateInput } from '@/lib/validation';

const achievementQuerySchema = z.object({
  category: z.string().optional(),
  status: z.enum(['all', 'unlocked', 'locked', 'in_progress']).default('all'),
  limit: z.string().transform(val => parseInt(val) || 50),
  offset: z.string().transform(val => parseInt(val) || 0),
  sortBy: z.enum(['name', 'unlockedAt', 'difficulty', 'xpReward']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const { searchParams } = new URL(request.url);
    
    const query = validateInput(achievementQuerySchema)(
      Object.fromEntries(searchParams.entries())
    );
    
    const achievements = await achievementService.getUserAchievements(userId, {
      category: query.category,
      status: query.status,
      pagination: {
        limit: query.limit,
        offset: query.offset,
      },
      sorting: {
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        achievements: achievements.items,
        categories: achievements.categories,
        summary: {
          total: achievements.total,
          unlocked: achievements.summary.unlocked,
          inProgress: achievements.summary.inProgress,
          locked: achievements.summary.locked,
        },
      },
      pagination: {
        total: achievements.total,
        limit: query.limit,
        offset: query.offset,
        hasMore: achievements.total > query.offset + query.limit,
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

#### Achievement Progress and Unlocking
```typescript
// src/app/api/v1/achievements/unlock/route.ts
const achievementUnlockSchema = z.object({
  achievementId: z.string().min(1, 'Achievement ID is required'),
  context: z.record(z.any()).optional(), // Additional context for verification
  force: z.boolean().default(false), // For admin/testing purposes
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    const { achievementId, context, force } = validateInput(achievementUnlockSchema)(body);
    
    // Check if achievement exists and is not already unlocked
    const existingUnlock = await prisma.userAchievement.findFirst({
      where: { userId, achievementId },
    });
    
    if (existingUnlock) {
      return NextResponse.json(
        { success: false, error: 'Achievement already unlocked' },
        { status: 409 }
      );
    }
    
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
    });
    
    if (!achievement) {
      return NextResponse.json(
        { success: false, error: 'Achievement not found' },
        { status: 404 }
      );
    }
    
    // Verify achievement conditions unless forced
    if (!force) {
      const conditionsMet = await achievementService.verifyAchievementConditions(
        userId,
        achievementId,
        context
      );
      
      if (!conditionsMet.eligible) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Achievement conditions not met',
            details: conditionsMet.missingRequirements,
          },
          { status: 400 }
        );
      }
    }
    
    // Unlock achievement
    const result = await achievementService.unlockAchievement(userId, achievementId, {
      context,
      source: 'api_request',
    });
    
    // Award XP and update user level
    if (result.xpAwarded > 0) {
      await gamificationService.awardXP(userId, result.xpAwarded, {
        source: 'achievement_unlock',
        achievementId,
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        achievement: result.achievement,
        xpAwarded: result.xpAwarded,
        newLevel: result.newLevel,
        badges: result.badgesAwarded,
      },
      message: `Achievement "${achievement.name}" unlocked!`,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

#### Gamification Profile
```typescript
// src/app/api/v1/gamification/profile/route.ts
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    
    const [
      userProfile,
      recentAchievements,
      xpHistory,
      levelInfo,
      leaderboardRank,
    ] = await Promise.all([
      gamificationService.getUserProfile(userId),
      achievementService.getRecentAchievements(userId, 5),
      gamificationService.getXPHistory(userId, '30days'),
      gamificationService.getCurrentLevelInfo(userId),
      gamificationService.getUserLeaderboardRank(userId),
    ]);
    
    return NextResponse.json({
      success: true,
      data: {
        profile: userProfile,
        level: levelInfo,
        xp: {
          current: userProfile.totalXP,
          toNextLevel: levelInfo.xpToNextLevel,
          recentHistory: xpHistory.slice(-7), // Last 7 days
        },
        achievements: {
          recent: recentAchievements,
          total: userProfile.achievementCount,
          completionRate: userProfile.achievementCompletionRate,
        },
        leaderboard: {
          rank: leaderboardRank.rank,
          totalUsers: leaderboardRank.totalUsers,
          percentile: leaderboardRank.percentile,
        },
        badges: userProfile.badges,
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

#### XP Management
```typescript
// src/app/api/v1/gamification/xp/route.ts
const xpAwardSchema = z.object({
  amount: z.number().min(1).max(10000),
  source: z.string().min(1),
  description: z.string().optional(),
  goalId: z.string().optional(),
  achievementId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    const { amount, source, description, goalId, achievementId, metadata } = 
      validateInput(xpAwardSchema)(body);
    
    const result = await gamificationService.awardXP(userId, amount, {
      source,
      description,
      goalId,
      achievementId,
      metadata,
    });
    
    // Check for level up and new achievements
    const levelUpResult = await gamificationService.checkLevelUp(userId);
    const newAchievements = await achievementService.checkXPAchievements(userId);
    
    return NextResponse.json({
      success: true,
      data: {
        xpAwarded: amount,
        totalXP: result.totalXP,
        levelUp: levelUpResult.leveledUp ? {
          oldLevel: levelUpResult.oldLevel,
          newLevel: levelUpResult.newLevel,
          rewards: levelUpResult.rewards,
        } : null,
        newAchievements,
      },
      message: `${amount} XP awarded!`,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const { searchParams } = new URL(request.url);
    
    const period = searchParams.get('period') || '30days';
    const groupBy = searchParams.get('groupBy') || 'day';
    
    const xpHistory = await gamificationService.getXPHistory(userId, period, {
      groupBy,
      includeBreakdown: searchParams.get('breakdown') === 'true',
    });
    
    const analytics = await gamificationService.getXPAnalytics(userId, period);
    
    return NextResponse.json({
      success: true,
      data: {
        history: xpHistory,
        analytics: {
          totalXP: analytics.totalXP,
          averageDaily: analytics.averageDaily,
          trend: analytics.trend,
          topSources: analytics.topSources,
          streaks: analytics.streaks,
        },
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

#### Leaderboards
```typescript
// src/app/api/v1/gamification/leaderboards/route.ts
const leaderboardQuerySchema = z.object({
  type: z.enum(['xp', 'level', 'achievements', 'goals_completed']).default('xp'),
  period: z.enum(['all_time', 'monthly', 'weekly', 'daily']).default('all_time'),
  category: z.string().optional(), // For achievement-specific leaderboards
  limit: z.string().transform(val => parseInt(val) || 50),
  offset: z.string().transform(val => parseInt(val) || 0),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const { searchParams } = new URL(request.url);
    
    const query = validateInput(leaderboardQuerySchema)(
      Object.fromEntries(searchParams.entries())
    );
    
    const leaderboard = await gamificationService.getLeaderboard({
      type: query.type,
      period: query.period,
      category: query.category,
      pagination: {
        limit: query.limit,
        offset: query.offset,
      },
      includeUserRank: true,
      userId,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        rankings: leaderboard.rankings,
        userRank: leaderboard.userRank,
        metadata: {
          type: query.type,
          period: query.period,
          totalParticipants: leaderboard.totalParticipants,
          lastUpdated: leaderboard.lastUpdated,
        },
      },
      pagination: {
        total: leaderboard.totalParticipants,
        limit: query.limit,
        offset: query.offset,
        hasMore: leaderboard.totalParticipants > query.offset + query.limit,
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Achievement Service Enhancement
```typescript
// src/lib/services/achievement-service.ts (Enhanced)
export class AchievementService {
  async verifyAchievementConditions(
    userId: string, 
    achievementId: string, 
    context?: Record<string, any>
  ) {
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
    });
    
    if (!achievement) {
      throw new Error('Achievement not found');
    }
    
    const conditions = JSON.parse(achievement.criteria);
    const missingRequirements = [];
    
    for (const condition of conditions) {
      const result = await this.checkCondition(userId, condition, context);
      if (!result.met) {
        missingRequirements.push({
          type: condition.type,
          required: condition.value,
          current: result.currentValue,
          description: result.description,
        });
      }
    }
    
    return {
      eligible: missingRequirements.length === 0,
      missingRequirements,
      progress: this.calculateAchievementProgress(conditions, missingRequirements),
    };
  }
  
  private async checkCondition(
    userId: string, 
    condition: any, 
    context?: Record<string, any>
  ) {
    switch (condition.type) {
      case 'goals_completed':
        const completedGoals = await prisma.goal.count({
          where: { userId, isCompleted: true },
        });
        return {
          met: completedGoals >= condition.value,
          currentValue: completedGoals,
          description: `Complete ${condition.value} goals (${completedGoals}/${condition.value})`,
        };
      
      case 'consecutive_days':
        const streak = await this.getCurrentStreakDays(userId);
        return {
          met: streak >= condition.value,
          currentValue: streak,
          description: `Maintain ${condition.value} day streak (${streak}/${condition.value})`,
        };
      
      case 'module_goals':
        const moduleGoals = await prisma.goal.count({
          where: { 
            userId, 
            isCompleted: true,
            moduleId: condition.moduleId,
          },
        });
        return {
          met: moduleGoals >= condition.value,
          currentValue: moduleGoals,
          description: `Complete ${condition.value} ${condition.moduleName} goals (${moduleGoals}/${condition.value})`,
        };
      
      case 'total_xp':
        const totalXP = await prisma.xPTransaction.aggregate({
          where: { userId },
          _sum: { amount: true },
        });
        const currentXP = totalXP._sum.amount || 0;
        return {
          met: currentXP >= condition.value,
          currentValue: currentXP,
          description: `Earn ${condition.value} total XP (${currentXP}/${condition.value})`,
        };
      
      case 'progress_entries':
        const progressCount = await prisma.progress.count({
          where: { userId },
        });
        return {
          met: progressCount >= condition.value,
          currentValue: progressCount,
          description: `Record ${condition.value} progress entries (${progressCount}/${condition.value})`,
        };
      
      default:
        return {
          met: false,
          currentValue: 0,
          description: `Unknown condition type: ${condition.type}`,
        };
    }
  }
  
  async getAchievementProgress(userId: string, achievementId: string) {
    const verification = await this.verifyAchievementConditions(userId, achievementId);
    
    if (verification.eligible) {
      return { progress: 100, completed: true };
    }
    
    return {
      progress: verification.progress,
      completed: false,
      requirements: verification.missingRequirements,
    };
  }
  
  async checkBulkAchievements(userId: string, triggers: string[]) {
    const unlockedAchievements = [];
    
    // Get achievements that could be triggered by these events
    const candidateAchievements = await prisma.achievement.findMany({
      where: {
        isActive: true,
        triggerEvents: {
          hasSome: triggers,
        },
      },
    });
    
    // Check if user already has these achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: {
        userId,
        achievementId: { in: candidateAchievements.map(a => a.id) },
      },
    });
    
    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));
    const eligibleAchievements = candidateAchievements.filter(a => !unlockedIds.has(a.id));
    
    // Check conditions for each eligible achievement
    for (const achievement of eligibleAchievements) {
      const verification = await this.verifyAchievementConditions(userId, achievement.id);
      
      if (verification.eligible) {
        const result = await this.unlockAchievement(userId, achievement.id, {
          source: 'automatic_check',
          triggers,
        });
        unlockedAchievements.push(result);
      }
    }
    
    return unlockedAchievements;
  }
}
```

## API Documentation

### OpenAPI Specification
```yaml
# achievements-api.yaml
openapi: 3.0.0
info:
  title: Achievements & Gamification API
  version: 1.0.0
  description: API endpoints for achievements, XP, levels, and gamification

paths:
  /api/v1/achievements:
    get:
      summary: Get user achievements
      parameters:
        - name: category
          in: query
          schema:
            type: string
        - name: status
          in: query
          schema:
            type: string
            enum: [all, unlocked, locked, in_progress]
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Achievements retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AchievementsResponse'
  
  /api/v1/gamification/profile:
    get:
      summary: Get user gamification profile
      responses:
        '200':
          description: Profile retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GamificationProfile'

components:
  schemas:
    Achievement:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string
        category:
          type: string
        difficulty:
          type: string
        xpReward:
          type: integer
        iconUrl:
          type: string
        unlockedAt:
          type: string
          format: date-time
        progress:
          type: number
          minimum: 0
          maximum: 100
```

## Testing Strategy

### Unit Tests
- Achievement condition verification
- XP calculation and awarding
- Level progression logic
- Leaderboard ranking accuracy

### Integration Tests
- End-to-end achievement unlock flows
- Gamification system integration
- Bulk achievement checking
- API performance testing

### API Tests
- Authentication and authorization
- Request validation and sanitization
- Response format consistency
- Error handling scenarios

## Success Metrics

### API Performance
- 95th percentile response time < 150ms
- 99.9% API uptime
- < 0.1% error rate
- Support for 500+ concurrent requests

### Gamification Effectiveness
- Achievement unlock rate > 80%
- User engagement increase > 25%
- XP earning consistency
- Leaderboard participation > 40%

### System Reliability
- Zero achievement duplication
- 100% XP calculation accuracy
- Consistent level progression
- Real-time leaderboard updates

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Assigned**: TBD  
**Sprint**: API Development