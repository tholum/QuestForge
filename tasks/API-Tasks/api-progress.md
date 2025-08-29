# API-P: Progress Tracking API Implementation

## Task Overview

**Priority**: API (Core Infrastructure)  
**Status**: Not Started  
**Effort**: 3 Story Points  
**Sprint**: API Development  

## Description

Implement comprehensive RESTful API endpoints for progress tracking functionality, including progress entry recording, progress history retrieval, milestone tracking, and progress analytics. This API provides the backend foundation for all progress-related features across the application.

## Dependencies

- ✅ API-G: Goals API Implementation (goal association)
- ✅ P0-002: Database Integration (progress data persistence)
- ✅ P1-102: Progress Tracking (business logic foundation)
- ❌ P0-001: Authentication System (secure API access)

## Definition of Done

### Core Progress API Endpoints
- [ ] POST /api/v1/progress - Record new progress entry
- [ ] GET /api/v1/progress - Retrieve progress history with filters
- [ ] GET /api/v1/progress/{id} - Get specific progress entry
- [ ] PUT /api/v1/progress/{id} - Update progress entry
- [ ] DELETE /api/v1/progress/{id} - Delete progress entry
- [ ] GET /api/v1/goals/{goalId}/progress - Get goal-specific progress

### Advanced Progress Endpoints
- [ ] GET /api/v1/progress/analytics - Progress analytics and insights
- [ ] POST /api/v1/progress/bulk - Bulk progress entry creation
- [ ] GET /api/v1/progress/streaks - Calculate progress streaks
- [ ] GET /api/v1/progress/milestones/{goalId} - Milestone tracking
- [ ] POST /api/v1/progress/milestones - Create/update milestones
- [ ] GET /api/v1/progress/trends - Progress trend analysis

### API Features
- [ ] Comprehensive input validation and sanitization
- [ ] Proper HTTP status codes and error handling
- [ ] Rate limiting and request throttling
- [ ] API documentation with OpenAPI/Swagger
- [ ] Response caching for performance
- [ ] Pagination for large datasets

## User Stories

### US-API-P.1: Progress Entry Management
```
As a client application
I want to record and manage progress entries via API
So that users can track their goal advancement programmatically
```

**Acceptance Criteria:**
- API accepts progress entries with value, notes, and timestamps
- Validates progress data against goal constraints
- Returns detailed progress entry with calculated percentages
- Handles invalid data with clear error messages
- Supports batch progress entry creation
- Updates goal completion status automatically

### US-API-P.2: Progress History Retrieval
```
As a client application
I want to retrieve progress history with flexible filtering
So that I can display progress trends and analytics to users
```

**Acceptance Criteria:**
- Supports filtering by date range, goal ID, and progress type
- Returns paginated results for performance
- Includes goal information in progress responses
- Supports sorting by various criteria
- Provides progress aggregation and statistics
- Handles large datasets efficiently

### US-API-P.3: Progress Analytics
```
As a data visualization component
I want to access progress analytics via API
So that I can display meaningful progress insights to users
```

**Acceptance Criteria:**
- Calculates progress trends over time
- Provides streak information and statistics
- Returns milestone achievement data
- Includes comparative analytics across goals
- Supports custom date ranges for analysis
- Optimizes calculations for real-time display

## Technical Implementation

### API Endpoints

#### Progress CRUD Operations
```typescript
// src/app/api/v1/progress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUserId } from '@/lib/auth';
import { progressService } from '@/lib/services/progress-service';
import { validateInput } from '@/lib/validation';

const progressCreateSchema = z.object({
  goalId: z.string().min(1, 'Goal ID is required'),
  value: z.number().min(0, 'Progress value must be non-negative'),
  maxValue: z.number().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  recordedAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

const progressQuerySchema = z.object({
  goalId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().transform(val => parseInt(val) || 50),
  offset: z.string().transform(val => parseInt(val) || 0),
  sortBy: z.enum(['recordedAt', 'value', 'goalTitle']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    // Validate input
    const validatedData = validateInput(progressCreateSchema)(body);
    
    // Verify goal ownership
    const goal = await prisma.goal.findFirst({
      where: { id: validatedData.goalId, userId },
    });
    
    if (!goal) {
      return NextResponse.json(
        { success: false, error: 'Goal not found or access denied' },
        { status: 404 }
      );
    }
    
    // Create progress entry
    const progress = await progressService.createProgress({
      ...validatedData,
      userId,
      recordedAt: validatedData.recordedAt ? new Date(validatedData.recordedAt) : new Date(),
    });
    
    // Update goal progress percentage
    await progressService.updateGoalProgress(validatedData.goalId);
    
    // Check for milestone achievements
    await progressService.checkMilestoneAchievements(validatedData.goalId);
    
    return NextResponse.json(
      { 
        success: true, 
        data: progress,
        message: 'Progress recorded successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const query = validateInput(progressQuerySchema)(
      Object.fromEntries(searchParams.entries())
    );
    
    const progressData = await progressService.getProgressHistory(userId, {
      goalId: query.goalId,
      dateRange: query.startDate && query.endDate ? {
        start: new Date(query.startDate),
        end: new Date(query.endDate),
      } : undefined,
      pagination: {
        limit: query.limit,
        offset: query.offset,
      },
      sorting: {
        sortBy: query.sortBy || 'recordedAt',
        sortOrder: query.sortOrder || 'desc',
      },
    });
    
    return NextResponse.json({
      success: true,
      data: progressData.entries,
      pagination: {
        total: progressData.total,
        limit: query.limit,
        offset: query.offset,
        hasMore: progressData.total > query.offset + query.limit,
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

#### Specific Progress Entry Operations
```typescript
// src/app/api/v1/progress/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId(request);
    const progress = await progressService.getProgressById(params.id, userId);
    
    if (!progress) {
      return NextResponse.json(
        { success: false, error: 'Progress entry not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    const updateSchema = progressCreateSchema.partial();
    const validatedData = validateInput(updateSchema)(body);
    
    const updatedProgress = await progressService.updateProgress(
      params.id,
      userId,
      validatedData
    );
    
    if (!updatedProgress) {
      return NextResponse.json(
        { success: false, error: 'Progress entry not found or access denied' },
        { status: 404 }
      );
    }
    
    // Recalculate goal progress if value changed
    if (validatedData.value !== undefined) {
      await progressService.updateGoalProgress(updatedProgress.goalId);
    }
    
    return NextResponse.json({
      success: true,
      data: updatedProgress,
      message: 'Progress updated successfully',
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId(request);
    
    const progress = await progressService.getProgressById(params.id, userId);
    if (!progress) {
      return NextResponse.json(
        { success: false, error: 'Progress entry not found' },
        { status: 404 }
      );
    }
    
    await progressService.deleteProgress(params.id, userId);
    
    // Recalculate goal progress after deletion
    await progressService.updateGoalProgress(progress.goalId);
    
    return NextResponse.json({
      success: true,
      message: 'Progress entry deleted successfully',
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

#### Progress Analytics Endpoints
```typescript
// src/app/api/v1/progress/analytics/route.ts
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const { searchParams } = new URL(request.url);
    
    const analyticsType = searchParams.get('type') || 'overview';
    const goalId = searchParams.get('goalId');
    const period = searchParams.get('period') || '30days';
    
    let analytics;
    
    switch (analyticsType) {
      case 'overview':
        analytics = await progressService.getProgressOverview(userId, { period, goalId });
        break;
      
      case 'trends':
        analytics = await progressService.getProgressTrends(userId, { period, goalId });
        break;
      
      case 'streaks':
        analytics = await progressService.getProgressStreaks(userId, { goalId });
        break;
      
      case 'milestones':
        analytics = await progressService.getMilestoneAnalytics(userId, { goalId });
        break;
      
      case 'comparison':
        analytics = await progressService.getProgressComparison(userId, { 
          period, 
          compareWith: searchParams.get('compareWith') 
        });
        break;
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid analytics type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      data: analytics,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

#### Bulk Progress Operations
```typescript
// src/app/api/v1/progress/bulk/route.ts
const bulkProgressSchema = z.object({
  entries: z.array(progressCreateSchema).min(1).max(100),
  options: z.object({
    skipValidation: z.boolean().optional(),
    updateGoalProgress: z.boolean().default(true),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    const validatedData = validateInput(bulkProgressSchema)(body);
    const options = validatedData.options || {};
    
    const results = {
      successful: [],
      failed: [],
      summary: {
        total: validatedData.entries.length,
        successful: 0,
        failed: 0,
      },
    };
    
    // Process entries in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < validatedData.entries.length; i += batchSize) {
      const batch = validatedData.entries.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (entry, index) => {
        try {
          // Verify goal ownership
          const goal = await prisma.goal.findFirst({
            where: { id: entry.goalId, userId },
          });
          
          if (!goal) {
            throw new Error('Goal not found or access denied');
          }
          
          const progress = await progressService.createProgress({
            ...entry,
            userId,
            recordedAt: entry.recordedAt ? new Date(entry.recordedAt) : new Date(),
          });
          
          results.successful.push({
            index: i + index,
            data: progress,
          });
          results.summary.successful++;
        } catch (error) {
          results.failed.push({
            index: i + index,
            entry,
            error: error.message,
          });
          results.summary.failed++;
        }
      });
      
      await Promise.all(batchPromises);
    }
    
    // Update goal progress for all affected goals if enabled
    if (options.updateGoalProgress) {
      const affectedGoalIds = [
        ...new Set([
          ...results.successful.map(r => r.data.goalId),
        ])
      ];
      
      await Promise.all(
        affectedGoalIds.map(goalId => 
          progressService.updateGoalProgress(goalId)
        )
      );
    }
    
    const statusCode = results.summary.failed > 0 ? 207 : 201; // Multi-status or Created
    
    return NextResponse.json(
      {
        success: results.summary.failed === 0,
        data: results,
        message: `Processed ${results.summary.total} entries: ${results.summary.successful} successful, ${results.summary.failed} failed`,
      },
      { status: statusCode }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Progress Service Enhancement
```typescript
// src/lib/services/progress-service.ts (Enhanced)
export class ProgressService {
  async getProgressTrends(userId: string, options: {
    period: string;
    goalId?: string;
  }) {
    const { period, goalId } = options;
    const dateRange = this.getDateRangeForPeriod(period);
    
    const progressEntries = await prisma.progress.findMany({
      where: {
        userId,
        ...(goalId && { goalId }),
        recordedAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      include: {
        goal: {
          select: { id: true, title: true, module: true },
        },
      },
      orderBy: { recordedAt: 'asc' },
    });
    
    // Group by time intervals based on period
    const intervalSize = this.getIntervalSizeForPeriod(period);
    const groupedProgress = this.groupProgressByInterval(progressEntries, intervalSize);
    
    // Calculate trends
    const trends = groupedProgress.map(group => ({
      period: group.period,
      totalProgress: group.entries.reduce((sum, entry) => sum + entry.value, 0),
      averageProgress: group.entries.length > 0 
        ? group.entries.reduce((sum, entry) => sum + entry.value, 0) / group.entries.length 
        : 0,
      entryCount: group.entries.length,
      goalCount: new Set(group.entries.map(e => e.goalId)).size,
      completionRate: this.calculateCompletionRateForGroup(group.entries),
    }));
    
    // Calculate overall trend direction
    const trendDirection = this.calculateTrendDirection(trends);
    const growthRate = this.calculateGrowthRate(trends);
    
    return {
      trends,
      summary: {
        direction: trendDirection,
        growthRate,
        totalEntries: progressEntries.length,
        dateRange,
      },
    };
  }
  
  async getProgressStreaks(userId: string, options: { goalId?: string }) {
    const { goalId } = options;
    
    const progressEntries = await prisma.progress.findMany({
      where: {
        userId,
        ...(goalId && { goalId }),
      },
      orderBy: { recordedAt: 'asc' },
      include: {
        goal: {
          select: { id: true, title: true },
        },
      },
    });
    
    if (goalId) {
      // Single goal streak analysis
      const streaks = this.calculateStreaksForGoal(progressEntries);
      return {
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        streakHistory: streaks.history,
      };
    } else {
      // Overall user streak analysis
      const dailyProgress = this.groupProgressByDay(progressEntries);
      const streaks = this.calculateDailyStreaks(dailyProgress);
      
      return {
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        averageStreak: streaks.average,
        totalStreakDays: streaks.totalDays,
        streakBreaks: streaks.breaks,
      };
    }
  }
  
  async getMilestoneAnalytics(userId: string, options: { goalId?: string }) {
    const goals = await prisma.goal.findMany({
      where: {
        userId,
        ...(options.goalId && { id: options.goalId }),
      },
      include: {
        progress: {
          orderBy: { recordedAt: 'asc' },
        },
      },
    });
    
    const milestoneAnalytics = goals.map(goal => {
      const milestones = this.calculateMilestones(goal);
      const achievedMilestones = milestones.filter(m => m.achieved);
      
      return {
        goalId: goal.id,
        goalTitle: goal.title,
        totalMilestones: milestones.length,
        achievedMilestones: achievedMilestones.length,
        completionRate: achievedMilestones.length / milestones.length,
        nextMilestone: milestones.find(m => !m.achieved),
        milestoneHistory: achievedMilestones.map(m => ({
          percentage: m.percentage,
          achievedAt: m.achievedAt,
          value: m.value,
        })),
      };
    });
    
    return {
      goals: milestoneAnalytics,
      overall: {
        totalMilestones: milestoneAnalytics.reduce((sum, g) => sum + g.totalMilestones, 0),
        achievedMilestones: milestoneAnalytics.reduce((sum, g) => sum + g.achievedMilestones, 0),
        averageCompletionRate: milestoneAnalytics.length > 0
          ? milestoneAnalytics.reduce((sum, g) => sum + g.completionRate, 0) / milestoneAnalytics.length
          : 0,
      },
    };
  }
  
  private calculateMilestones(goal: Goal & { progress: Progress[] }) {
    const milestonePercentages = [10, 25, 50, 75, 90, 100];
    const sortedProgress = goal.progress.sort((a, b) => 
      a.recordedAt.getTime() - b.recordedAt.getTime()
    );
    
    return milestonePercentages.map(percentage => {
      const targetValue = (goal.targetValue || 100) * (percentage / 100);
      const achievingProgress = sortedProgress.find(p => p.value >= targetValue);
      
      return {
        percentage,
        value: targetValue,
        achieved: !!achievingProgress,
        achievedAt: achievingProgress?.recordedAt,
        progressId: achievingProgress?.id,
      };
    });
  }
  
  async updateGoalProgress(goalId: string) {
    const latestProgress = await prisma.progress.findFirst({
      where: { goalId },
      orderBy: { recordedAt: 'desc' },
    });
    
    if (!latestProgress) return;
    
    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return;
    
    const progressPercentage = goal.targetValue 
      ? (latestProgress.value / goal.targetValue) * 100
      : 0;
    
    const isCompleted = progressPercentage >= 100;
    
    await prisma.goal.update({
      where: { id: goalId },
      data: {
        currentProgress: progressPercentage,
        isCompleted,
        completedAt: isCompleted && !goal.completedAt ? new Date() : goal.completedAt,
      },
    });
    
    // Trigger gamification updates if goal is completed
    if (isCompleted && !goal.isCompleted) {
      await gamificationService.processGoalCompletion(goal.userId, goalId);
    }
  }
}
```

## API Documentation

### OpenAPI Specification
```yaml
# progress-api.yaml
openapi: 3.0.0
info:
  title: Progress Tracking API
  version: 1.0.0
  description: API endpoints for goal progress tracking and analytics

paths:
  /api/v1/progress:
    post:
      summary: Record new progress entry
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProgressCreateRequest'
      responses:
        '201':
          description: Progress recorded successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProgressResponse'
    
    get:
      summary: Get progress history
      parameters:
        - name: goalId
          in: query
          schema:
            type: string
        - name: startDate
          in: query
          schema:
            type: string
            format: date-time
        - name: endDate
          in: query
          schema:
            type: string
            format: date-time
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
          description: Progress history retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProgressListResponse'

components:
  schemas:
    ProgressCreateRequest:
      type: object
      required:
        - goalId
        - value
      properties:
        goalId:
          type: string
        value:
          type: number
        maxValue:
          type: number
        unit:
          type: string
        notes:
          type: string
        recordedAt:
          type: string
          format: date-time
```

## Testing Strategy

### Unit Tests
- Progress CRUD operation validation
- Analytics calculation accuracy
- Bulk operation handling
- Error handling scenarios

### Integration Tests
- End-to-end progress tracking workflows
- Goal progress calculation updates
- Milestone achievement detection
- API performance under load

### API Tests
- Request/response validation
- Authentication and authorization
- Rate limiting functionality
- Error response consistency

## Success Metrics

### API Performance
- 95th percentile response time < 200ms
- 99.9% API uptime
- < 0.1% error rate
- Support for 1000+ concurrent requests

### Data Accuracy
- 100% progress calculation accuracy
- Zero data loss incidents
- Consistent data validation
- Proper error handling coverage

### Developer Experience
- Complete API documentation
- < 5 minute integration time
- Clear error messages
- Comprehensive test coverage

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Assigned**: TBD  
**Sprint**: API Development