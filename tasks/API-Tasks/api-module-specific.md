# API-M: Module-Specific API Endpoints

## Task Overview

**Priority**: API (Core Infrastructure)  
**Status**: Partially Complete  
**Effort**: 8 Story Points  
**Sprint**: API Development  

## Description

Implement specialized API endpoints for module-specific functionality including Bible Study, Work Projects, Fitness, Learning, and Home modules. These APIs provide tailored data structures, operations, and integrations unique to each goal module while maintaining consistency with the core API architecture.

## Dependencies

- ✅ API-G: Goals API Implementation (core goal operations)
- ✅ P1-103: Bible Study Module (Bible-specific business logic)
- ✅ P1-104: Work Projects Module (work-specific business logic)
- ✅ P0-002: Database Integration (module data persistence)
- ❌ P0-001: Authentication System (secure API access)

## Definition of Done

### Bible Study Module API
- [ ] GET/POST /api/v1/modules/bible/plans - Reading plans management
- [ ] GET/POST /api/v1/modules/bible/readings - Daily readings tracking
- [ ] GET/POST /api/v1/modules/bible/studies - Study sessions management
- [ ] GET/POST /api/v1/modules/bible/prayers - Prayer requests and journal
- [ ] GET/POST /api/v1/modules/bible/bookmarks - Scripture bookmarks
- [ ] GET /api/v1/modules/bible/analytics - Bible study analytics

### Work Projects Module API
- [ ] GET/POST /api/v1/modules/work/projects - Project management
- [ ] GET/POST /api/v1/modules/work/tasks - Task management within projects
- [ ] GET/POST /api/v1/modules/work/time - Time tracking entries
- [ ] GET/POST /api/v1/modules/work/career - Career development goals
- [ ] GET /api/v1/modules/work/analytics - Productivity analytics
- [ ] GET/POST /api/v1/modules/work/metrics - Performance metrics

### Fitness Module API
- [ ] GET/POST /api/v1/modules/fitness/workouts - Workout tracking
- [ ] GET/POST /api/v1/modules/fitness/measurements - Body measurements
- [ ] GET/POST /api/v1/modules/fitness/nutrition - Nutrition logging
- [ ] GET /api/v1/modules/fitness/analytics - Fitness progress analytics
- [ ] GET/POST /api/v1/modules/fitness/routines - Exercise routines
- [ ] GET/POST /api/v1/modules/fitness/equipment - Equipment tracking

### Learning Module API
- [ ] GET/POST /api/v1/modules/learning/courses - Course enrollment and progress
- [ ] GET/POST /api/v1/modules/learning/skills - Skill development tracking
- [ ] GET/POST /api/v1/modules/learning/certifications - Certification management
- [ ] GET/POST /api/v1/modules/learning/resources - Learning resources
- [ ] GET /api/v1/modules/learning/analytics - Learning progress analytics
- [ ] GET/POST /api/v1/modules/learning/assessments - Self-assessment tools

## User Stories

### US-API-M.1: Module Data Operations
```
As a module-specific component
I want to perform CRUD operations on module-specific data
So that I can manage specialized content unique to each goal area
```

**Acceptance Criteria:**
- Each module API supports full CRUD operations
- Module-specific validation rules are enforced
- Cross-module data relationships are maintained
- API responses include module-specific metadata
- Bulk operations are available for efficiency
- Data migrations handle module schema changes

### US-API-M.2: Specialized Analytics
```
As an analytics dashboard
I want to access module-specific metrics and insights
So that I can provide tailored analytics for different goal types
```

**Acceptance Criteria:**
- Module APIs return specialized analytics data
- Calculations are optimized for each module's metrics
- Time-based trends are module-appropriate
- Comparative analysis works across modules
- Real-time analytics support for active modules
- Export functionality for module-specific reports

### US-API-M.3: Integration Capabilities
```
As a third-party integration
I want to sync data with external services through module APIs
So that users can connect their existing tools and services
```

**Acceptance Criteria:**
- Module APIs support external data import/export
- Integration webhooks are available for real-time sync
- Data mapping handles external service formats
- Conflict resolution for data synchronization
- Rate limiting protects against abuse
- Authentication for external service access

## Technical Implementation

### Bible Study Module API

#### Bible Reading Plans
```typescript
// src/app/api/v1/modules/bible/plans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { bibleService } from '@/lib/services/bible-service';

const readingPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  description: z.string().optional(),
  planType: z.enum(['preset', 'custom']),
  presetId: z.string().optional(),
  startDate: z.string().datetime(),
  customDuration: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status') || 'all';
    const includePresets = searchParams.get('presets') === 'true';
    
    const plans = await bibleService.getUserReadingPlans(userId, {
      status,
      includePresets,
    });
    
    return NextResponse.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    const validatedData = validateInput(readingPlanSchema)(body);
    
    const plan = await bibleService.createReadingPlan(userId, validatedData);
    
    // Generate daily readings for the plan
    await bibleService.generateDailyReadings(plan.id);
    
    return NextResponse.json(
      { success: true, data: plan },
      { status: 201 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
```

#### Study Sessions
```typescript
// src/app/api/v1/modules/bible/studies/route.ts
const studySessionSchema = z.object({
  goalId: z.string().optional(),
  title: z.string().min(1, 'Study title is required'),
  passages: z.array(z.string()).min(1, 'At least one passage is required'),
  durationMinutes: z.number().min(1).max(480),
  studyDate: z.string().datetime(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    const validatedData = validateInput(studySessionSchema)(body);
    
    const studySession = await bibleService.createStudySession(userId, validatedData);
    
    // Update related goal progress if specified
    if (validatedData.goalId) {
      await progressService.recordProgress(validatedData.goalId, {
        value: validatedData.durationMinutes,
        unit: 'minutes',
        notes: `Bible study: ${validatedData.title}`,
        recordedAt: new Date(validatedData.studyDate),
      });
    }
    
    // Check for Bible study achievements
    await achievementService.checkBulkAchievements(userId, [
      'bible_study_session',
      'consistent_study',
    ]);
    
    return NextResponse.json(
      { success: true, data: studySession },
      { status: 201 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Work Projects Module API

#### Project Management
```typescript
// src/app/api/v1/modules/work/projects/route.ts
const workProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  projectType: z.enum(['client', 'internal', 'personal', 'team']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  estimatedHours: z.number().optional(),
  budget: z.number().optional(),
  clientName: z.string().optional(),
  createGoal: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    const validatedData = validateInput(workProjectSchema)(body);
    
    const project = await workService.createProject(userId, validatedData);
    
    // Create associated goal if requested
    if (validatedData.createGoal) {
      const goal = await goalService.create({
        userId,
        title: `Complete ${project.name}`,
        description: `Work project: ${project.description}`,
        moduleId: 'work',
        targetDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        difficulty: 'medium',
        priority: validatedData.priority,
      });
      
      await workService.linkProjectToGoal(project.id, goal.id);
    }
    
    return NextResponse.json(
      { success: true, data: project },
      { status: 201 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
```

#### Time Tracking
```typescript
// src/app/api/v1/modules/work/time/route.ts
const timeEntrySchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  taskId: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  durationMinutes: z.number().optional(),
  hourlyRate: z.number().optional(),
  isBillable: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    const validatedData = validateInput(timeEntrySchema)(body);
    
    // Verify project ownership
    const project = await workService.getProjectById(validatedData.projectId, userId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      );
    }
    
    // Calculate duration if not provided
    if (!validatedData.durationMinutes && validatedData.endTime) {
      const start = new Date(validatedData.startTime);
      const end = new Date(validatedData.endTime);
      validatedData.durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }
    
    const timeEntry = await workService.createTimeEntry(userId, validatedData);
    
    // Update project total hours
    await workService.updateProjectHours(validatedData.projectId);
    
    // Update work-related goal progress if linked
    if (project.goalId) {
      await progressService.recordProgress(project.goalId, {
        value: validatedData.durationMinutes,
        unit: 'minutes',
        notes: `Time logged: ${validatedData.description || 'Work session'}`,
        recordedAt: new Date(validatedData.startTime),
      });
    }
    
    return NextResponse.json(
      { success: true, data: timeEntry },
      { status: 201 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Fitness Module API

#### Workout Tracking
```typescript
// src/app/api/v1/modules/fitness/workouts/route.ts
const workoutSchema = z.object({
  goalId: z.string().optional(),
  name: z.string().min(1, 'Workout name is required'),
  workoutType: z.enum(['strength', 'cardio', 'flexibility', 'sports', 'other']),
  durationMinutes: z.number().min(1).max(480),
  caloriesBurned: z.number().optional(),
  exercises: z.array(z.object({
    name: z.string(),
    sets: z.number().optional(),
    reps: z.number().optional(),
    weight: z.number().optional(),
    duration: z.number().optional(),
    distance: z.number().optional(),
  })),
  notes: z.string().optional(),
  workoutDate: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    const validatedData = validateInput(workoutSchema)(body);
    
    const workout = await fitnessService.createWorkout(userId, validatedData);
    
    // Update fitness goal progress
    if (validatedData.goalId) {
      await progressService.recordProgress(validatedData.goalId, {
        value: validatedData.durationMinutes,
        unit: 'minutes',
        notes: `Workout: ${validatedData.name}`,
        recordedAt: new Date(validatedData.workoutDate),
      });
    }
    
    // Check fitness achievements
    await achievementService.checkBulkAchievements(userId, [
      'workout_completed',
      'weekly_fitness_goal',
      'strength_milestone',
    ]);
    
    return NextResponse.json(
      { success: true, data: workout },
      { status: 201 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Learning Module API

#### Course Management
```typescript
// src/app/api/v1/modules/learning/courses/route.ts
const courseSchema = z.object({
  goalId: z.string().optional(),
  title: z.string().min(1, 'Course title is required'),
  provider: z.string().optional(),
  courseUrl: z.string().url().optional(),
  category: z.string(),
  estimatedHours: z.number().optional(),
  startDate: z.string().datetime().optional(),
  targetCompletionDate: z.string().datetime().optional(),
  cost: z.number().optional(),
  currency: z.string().default('USD'),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    const validatedData = validateInput(courseSchema)(body);
    
    const course = await learningService.enrollInCourse(userId, validatedData);
    
    // Create associated learning goal if requested
    if (validatedData.goalId || validatedData.targetCompletionDate) {
      const goal = validatedData.goalId 
        ? await goalService.getById(validatedData.goalId, userId)
        : await goalService.create({
            userId,
            title: `Complete ${course.title}`,
            description: `Learning course: ${course.provider ? course.provider + ' - ' : ''}${course.title}`,
            moduleId: 'learning',
            targetDate: validatedData.targetCompletionDate 
              ? new Date(validatedData.targetCompletionDate) 
              : null,
            difficulty: 'medium',
            priority: 'medium',
          });
      
      if (goal) {
        await learningService.linkCourseToGoal(course.id, goal.id);
      }
    }
    
    return NextResponse.json(
      { success: true, data: course },
      { status: 201 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Module Analytics Endpoints
```typescript
// src/app/api/v1/modules/[moduleId]/analytics/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  try {
    const userId = await getCurrentUserId(request);
    const { searchParams } = new URL(request.url);
    
    const period = searchParams.get('period') || '30days';
    const includeComparison = searchParams.get('comparison') === 'true';
    
    let analytics;
    
    switch (params.moduleId) {
      case 'bible':
        analytics = await bibleService.getAnalytics(userId, { period, includeComparison });
        break;
      case 'work':
        analytics = await workService.getAnalytics(userId, { period, includeComparison });
        break;
      case 'fitness':
        analytics = await fitnessService.getAnalytics(userId, { period, includeComparison });
        break;
      case 'learning':
        analytics = await learningService.getAnalytics(userId, { period, includeComparison });
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Module not found' },
          { status: 404 }
        );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        module: params.moduleId,
        period,
        analytics,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Module Service Base Class
```typescript
// src/lib/services/base-module-service.ts
export abstract class BaseModuleService {
  protected moduleName: string;
  
  constructor(moduleName: string) {
    this.moduleName = moduleName;
  }
  
  async getModuleGoals(userId: string, options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    return await prisma.goal.findMany({
      where: {
        userId,
        module: { name: this.moduleName },
        ...(options.status === 'active' && { isCompleted: false }),
        ...(options.status === 'completed' && { isCompleted: true }),
      },
      include: {
        progress: {
          take: 5,
          orderBy: { recordedAt: 'desc' },
        },
      },
      take: options.limit || 20,
      skip: options.offset || 0,
      orderBy: { createdAt: 'desc' },
    });
  }
  
  async getModuleAnalytics(userId: string, options: {
    period: string;
    includeComparison?: boolean;
  }) {
    const dateRange = this.getDateRangeForPeriod(options.period);
    
    const [goals, progress, achievements] = await Promise.all([
      this.getGoalsInPeriod(userId, dateRange),
      this.getProgressInPeriod(userId, dateRange),
      this.getAchievementsInPeriod(userId, dateRange),
    ]);
    
    const analytics = {
      overview: {
        totalGoals: goals.length,
        completedGoals: goals.filter(g => g.isCompleted).length,
        progressEntries: progress.length,
        achievementsEarned: achievements.length,
      },
      trends: this.calculateTrends(progress),
      completion: this.calculateCompletionMetrics(goals),
      specific: await this.getModuleSpecificAnalytics(userId, dateRange),
    };
    
    if (options.includeComparison) {
      analytics.comparison = await this.getComparisonAnalytics(userId, dateRange);
    }
    
    return analytics;
  }
  
  protected abstract getModuleSpecificAnalytics(
    userId: string, 
    dateRange: { start: Date; end: Date }
  ): Promise<any>;
  
  protected getDateRangeForPeriod(period: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case '7days':
        start.setDate(start.getDate() - 7);
        break;
      case '30days':
        start.setDate(start.getDate() - 30);
        break;
      case '90days':
        start.setDate(start.getDate() - 90);
        break;
      case '1year':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }
    
    return { start, end };
  }
}
```

## API Documentation

### Module-Specific OpenAPI Specs
```yaml
# modules-api.yaml
openapi: 3.0.0
info:
  title: Goal Assistant - Module-Specific APIs
  version: 1.0.0
  description: Specialized APIs for different goal modules

paths:
  /api/v1/modules/bible/plans:
    post:
      summary: Create Bible reading plan
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BibleReadingPlan'
      responses:
        '201':
          description: Reading plan created
  
  /api/v1/modules/work/projects:
    post:
      summary: Create work project
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/WorkProject'
      responses:
        '201':
          description: Project created

components:
  schemas:
    BibleReadingPlan:
      type: object
      required:
        - name
        - planType
        - startDate
      properties:
        name:
          type: string
        planType:
          type: string
          enum: [preset, custom]
        startDate:
          type: string
          format: date-time
    
    WorkProject:
      type: object
      required:
        - name
        - projectType
      properties:
        name:
          type: string
        projectType:
          type: string
          enum: [client, internal, personal, team]
        estimatedHours:
          type: number
```

## Testing Strategy

### Unit Tests
- Module-specific business logic validation
- Data transformation and formatting
- Integration with core goal system
- Analytics calculation accuracy

### Integration Tests
- Cross-module data relationships
- External service integrations
- Module-specific workflows
- Performance with large datasets

### API Tests
- Module endpoint functionality
- Data validation and sanitization
- Authentication and authorization
- Response format consistency

## Success Metrics

### API Performance
- Module-specific endpoints < 300ms response time
- 99.9% uptime for all module APIs
- < 0.1% error rate across modules
- Efficient handling of module-specific data

### Feature Adoption
- Module API usage rate > 70% for active modules
- Module-specific goal creation > 60%
- Cross-module data relationships > 30%
- Analytics feature engagement > 40%

### Data Integrity
- 100% data consistency across modules
- Zero data loss in module operations
- Proper validation of module-specific rules
- Accurate cross-module analytics

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Assigned**: TBD  
**Sprint**: API Development