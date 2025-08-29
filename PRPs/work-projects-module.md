# Project Requirements Plan: Work Projects Module

**PRP ID**: WPM-2025-001  
**Priority**: P1 (Core Feature)  
**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Sprint**: Core Module Features  
**Confidence Score**: 9/10  

## Overview

The Work Projects Module is a comprehensive professional productivity system designed to integrate seamlessly with the Goal Assistant's modular architecture. This module provides work project management, time tracking, career development goal integration, and performance analytics while leveraging the existing goal management infrastructure and following established patterns from the Bible Study Module.

## Technical Context & Architecture

### Module System Integration

This module implements the `IModule` interface defined in `/home/tholum/projects/goalassistant/src/types/module.ts` and follows the patterns established in `/home/tholum/projects/goalassistant/src/modules/bible/BibleModule.tsx`. The module integrates with:

- **ModuleRegistry** (`/home/tholum/projects/goalassistant/src/modules/core/ModuleRegistry.ts`)
- **Existing Goal System** via `goalRepository` (`/home/tholum/projects/goalassistant/src/lib/prisma/repositories/goal-repository.ts`)
- **Gamification System** (`/home/tholum/projects/goalassistant/src/lib/gamification/XPManager.ts`)
- **Progress Tracking** via existing Progress model in Prisma schema

### Database Schema Extensions

The module extends the current SQLite schema (`/home/tholum/projects/goalassistant/prisma/schema.prisma`) with work-specific tables that follow PascalCase table naming and camelCase field conventions.

## Detailed Technical Requirements

### Database Schema Implementation

**Priority**: Critical  
**Files to Create**:
- Update `/home/tholum/projects/goalassistant/prisma/schema.prisma`

Add the following models to the existing schema:

```prisma
// Work Projects
model WorkProject {
  id              String    @id @default(cuid())
  userId          String
  goalId          String?   // Link to related goal
  name            String
  description     String?
  projectType     String    // 'client', 'internal', 'personal', 'team'
  status          String    @default("active") // 'planning', 'active', 'on-hold', 'completed', 'cancelled'
  priority        String    @default("medium") // 'low', 'medium', 'high', 'urgent'
  startDate       DateTime?
  endDate         DateTime?
  estimatedHours  Int?
  actualHours     Int       @default(0)
  budget          Float?
  clientName      String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal            Goal?     @relation(fields: [goalId], references: [id], onDelete: SetNull)
  tasks           ProjectTask[]
  timeEntries     TimeEntry[]
  milestones      ProjectMilestone[]

  @@index([userId, status])
  @@index([goalId])
  @@map("WorkProject")
}

// Project Tasks  
model ProjectTask {
  id              String     @id @default(cuid())
  projectId       String
  parentTaskId    String?    // For subtasks
  userId          String
  title           String
  description     String?
  status          String     @default("todo") // 'todo', 'in-progress', 'review', 'completed'
  priority        String     @default("medium")
  estimatedHours  Float?
  actualHours     Float      @default(0)
  assignedTo      String?    // For team projects
  dueDate         DateTime?
  completedAt     DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  // Relations
  project         WorkProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  parentTask      ProjectTask? @relation("TaskHierarchy", fields: [parentTaskId], references: [id])
  subTasks        ProjectTask[] @relation("TaskHierarchy")
  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  timeEntries     TimeEntry[]

  @@index([projectId, status])
  @@index([userId, dueDate])
  @@map("ProjectTask")
}

// Time Tracking
model TimeEntry {
  id              String     @id @default(cuid())
  userId          String
  projectId       String
  taskId          String?
  description     String?
  startTime       DateTime
  endTime         DateTime?
  durationMinutes Int?
  hourlyRate      Float?
  isBillable      Boolean    @default(false)
  entryDate       DateTime
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  // Relations
  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  project         WorkProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
  task            ProjectTask? @relation(fields: [taskId], references: [id], onDelete: SetNull)

  @@index([userId, entryDate])
  @@index([projectId])
  @@map("TimeEntry")
}

// Career Development
model CareerGoal {
  id              String     @id @default(cuid())
  userId          String
  goalId          String?    // Link to main goal
  category        String     // 'skill', 'promotion', 'certification', 'networking', 'learning'
  title           String
  description     String?
  currentLevel    String?    // 'beginner', 'intermediate', 'advanced', 'expert'
  targetLevel     String?
  targetDate      DateTime?
  isCompleted     Boolean    @default(false)
  completedAt     DateTime?
  evidence        Json?      // Achievement evidence
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  // Relations
  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal            Goal?      @relation(fields: [goalId], references: [id], onDelete: SetNull)

  @@index([userId, category])
  @@map("CareerGoal")
}

// Performance Metrics
model PerformanceMetric {
  id              String     @id @default(cuid())
  userId          String
  metricType      String     // 'productivity', 'efficiency', 'quality', 'satisfaction'
  metricName      String
  value           Float
  targetValue     Float?
  unit            String?    // 'hours', 'tasks', 'projects', 'percentage'
  period          String     // 'daily', 'weekly', 'monthly', 'quarterly'
  recordDate      DateTime
  notes           String?
  createdAt       DateTime   @default(now())

  // Relations
  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, recordDate])
  @@index([metricType, period])
  @@map("PerformanceMetric")
}

// Project Milestones
model ProjectMilestone {
  id              String     @id @default(cuid())
  projectId       String
  title           String
  description     String?
  dueDate         DateTime
  completedAt     DateTime?
  isCompleted     Boolean    @default(false)
  priority        String     @default("medium")
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  // Relations
  project         WorkProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, dueDate])
  @@map("ProjectMilestone")
}
```

**Update User model to include work-related relations**:
```prisma
model User {
  // ... existing fields ...
  
  // Add work-related relations
  workProjects      WorkProject[]
  projectTasks      ProjectTask[]  
  timeEntries       TimeEntry[]
  careerGoals       CareerGoal[]
  performanceMetrics PerformanceMetric[]
}
```

### Repository Layer Implementation

**Priority**: Critical  
**Files to Create**:
- `/home/tholum/projects/goalassistant/src/lib/prisma/repositories/work-repository.ts`

Following the pattern from `/home/tholum/projects/goalassistant/src/lib/prisma/repositories/bible-repository.ts`:

```typescript
/**
 * Work Module Repository
 * 
 * Repository for work project management operations including:
 * - Project and task CRUD operations
 * - Time tracking functionality
 * - Career goal management  
 * - Performance metrics tracking
 * - Dashboard data aggregation
 */

import { PrismaClient, WorkProject, ProjectTask, TimeEntry, CareerGoal } from '@prisma/client'
import { BaseRepository } from '../base-repository'
import { withErrorHandling } from '../error-handler'

// Repository classes for each domain
export class WorkProjectRepository extends BaseRepository<WorkProject> {
  protected model = 'workProject'
  
  async getUserProjects(userId: string, filters: {
    status?: string
    page?: number
    limit?: number
  }) {
    return withErrorHandling(async () => {
      const { status, page = 1, limit = 20 } = filters
      const skip = (page - 1) * limit
      
      const where: any = { userId }
      if (status) where.status = status
      
      return await this.prisma.workProject.findMany({
        where,
        include: {
          tasks: {
            select: { id: true, status: true }
          },
          timeEntries: {
            select: { durationMinutes: true }
          },
          milestones: {
            select: { id: true, isCompleted: true }
          },
          _count: {
            select: { tasks: true, timeEntries: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      })
    }, 'Getting user projects')
  }

  async createProject(userId: string, data: Omit<WorkProject, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    return withErrorHandling(async () => {
      return await this.prisma.workProject.create({
        data: {
          ...data,
          userId
        },
        include: {
          goal: true,
          tasks: true
        }
      })
    }, 'Creating work project')
  }

  async updateProjectHours(projectId: string) {
    return withErrorHandling(async () => {
      const totalMinutes = await this.prisma.timeEntry.aggregate({
        where: { projectId },
        _sum: { durationMinutes: true }
      })
      
      const actualHours = Math.round((totalMinutes._sum.durationMinutes || 0) / 60)
      
      return await this.prisma.workProject.update({
        where: { id: projectId },
        data: { actualHours }
      })
    }, 'Updating project hours')
  }

  async getDashboardData(userId: string) {
    return withErrorHandling(async () => {
      const [
        activeProjects,
        todayTasks, 
        weekTimeTracked,
        monthlyProgress,
        upcomingDeadlines,
        careerGoals,
        performanceMetrics
      ] = await Promise.all([
        // Active projects with progress
        this.prisma.workProject.findMany({
          where: { userId, status: 'active' },
          include: {
            tasks: { select: { status: true } },
            timeEntries: { select: { durationMinutes: true } },
            milestones: { select: { isCompleted: true, dueDate: true } }
          },
          take: 10
        }),
        
        // Today's tasks
        this.prisma.projectTask.aggregate({
          where: {
            userId,
            dueDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
          },
          _count: { id: true }
        }),
        
        // Week time tracked
        this.prisma.timeEntry.aggregate({
          where: {
            userId,
            entryDate: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          },
          _sum: { durationMinutes: true }
        }),
        
        // Monthly goal progress
        this.prisma.goal.aggregate({
          where: {
            userId,
            moduleId: 'work',
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          },
          _count: { id: true }
        }),
        
        // Upcoming deadlines
        this.prisma.projectTask.findMany({
          where: {
            userId,
            status: { not: 'completed' },
            dueDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          },
          include: { project: { select: { name: true } } },
          orderBy: { dueDate: 'asc' },
          take: 10
        }),
        
        // Career goals
        this.prisma.careerGoal.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),
        
        // Performance metrics
        this.prisma.performanceMetric.findMany({
          where: {
            userId,
            recordDate: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          },
          orderBy: { recordDate: 'desc' },
          take: 8
        })
      ])

      return {
        activeProjects: activeProjects.map(project => ({
          ...project,
          progress: this.calculateProjectProgress(project),
          completedTasks: project.tasks.filter(t => t.status === 'completed').length,
          totalTasks: project.tasks.length,
          daysRemaining: project.endDate ? 
            Math.ceil((project.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
          isOverdue: project.endDate ? project.endDate < new Date() : false
        })),
        todayTasks: {
          total: todayTasks._count.id,
          completed: 0 // Would need separate query
        },
        weekTimeTracked: weekTimeTracked._sum.durationMinutes || 0,
        monthlyProgress: {
          completed: 0, // Calculate from goals
          target: monthlyProgress._count.id,
          percentage: 0
        },
        upcomingDeadlines: upcomingDeadlines.map(task => ({
          ...task,
          projectName: task.project.name,
          daysUntilDue: Math.ceil((task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          isOverdue: task.dueDate < new Date()
        })),
        careerGoals,
        performanceMetrics
      }
    }, 'Getting work dashboard data')
  }

  private calculateProjectProgress(project: any): number {
    if (project.tasks.length === 0) return 0
    const completed = project.tasks.filter((t: any) => t.status === 'completed').length
    return Math.round((completed / project.tasks.length) * 100)
  }
}

// Export repository instances
export const workProjectRepository = new WorkProjectRepository()
export const projectTaskRepository = new ProjectTaskRepository()
export const timeEntryRepository = new TimeEntryRepository()
export const careerGoalRepository = new CareerGoalRepository()
```

### API Endpoints Implementation

**Priority**: Critical  
**Files to Create**:
- `/home/tholum/projects/goalassistant/src/app/api/v1/modules/work/route.ts`

Following the pattern from `/home/tholum/projects/goalassistant/src/app/api/v1/modules/bible/route.ts`:

```typescript
/**
 * Work Module API Routes
 * 
 * Main API endpoint for work project management including:
 * - Project and task management
 * - Time tracking operations
 * - Career goal management
 * - Performance analytics
 * - Dashboard data
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  workProjectRepository,
  projectTaskRepository,
  timeEntryRepository,
  careerGoalRepository
} from '../../../../../lib/prisma/repositories/work-repository'
import { goalRepository } from '../../../../../lib/prisma/repositories/goal-repository'
import { xpManager } from '../../../../../lib/gamification/XPManager'

// Validation schemas
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  projectType: z.enum(['client', 'internal', 'personal', 'team']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  estimatedHours: z.number().optional(),
  budget: z.number().optional(),
  clientName: z.string().optional(),
  createGoal: z.boolean().default(false)
})

const CreateTaskSchema = z.object({
  projectId: z.string(),
  parentTaskId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  estimatedHours: z.number().optional(),
  dueDate: z.string().transform((str) => new Date(str)).optional(),
  assignedTo: z.string().optional()
})

const CreateTimeEntrySchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string().transform((str) => new Date(str)),
  endTime: z.string().transform((str) => new Date(str)).optional(),
  durationMinutes: z.number().optional(),
  isBillable: z.boolean().default(false),
  hourlyRate: z.number().optional()
})

const CreateCareerGoalSchema = z.object({
  category: z.enum(['skill', 'promotion', 'certification', 'networking', 'learning']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  currentLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  targetLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  targetDate: z.string().transform((str) => new Date(str)).optional(),
  createGoal: z.boolean().default(true)
})

// Helper function to get user ID (integrate with your auth system)
async function getUserId(request: NextRequest): Promise<string> {
  // Implement based on your authentication system
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    throw new Error('Authentication required')
  }
  return 'user-placeholder-id' // Replace with actual implementation
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'dashboard'

    switch (type) {
      case 'dashboard': {
        const dashboardData = await workProjectRepository.getDashboardData(userId)
        return NextResponse.json({ success: true, data: dashboardData })
      }

      case 'projects': {
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        
        const projects = await workProjectRepository.getUserProjects(userId, {
          status,
          page,
          limit
        })
        return NextResponse.json({ success: true, data: projects })
      }

      case 'tasks': {
        const projectId = searchParams.get('projectId')
        const status = searchParams.get('status')
        
        const tasks = await projectTaskRepository.getProjectTasks(projectId, userId, { status })
        return NextResponse.json({ success: true, data: tasks })
      }

      case 'time': {
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
        const projectId = searchParams.get('projectId')
        
        const timeEntries = await timeEntryRepository.getTimeEntries(userId, date, { projectId })
        return NextResponse.json({ success: true, data: timeEntries })
      }

      case 'career': {
        const careerGoals = await careerGoalRepository.getUserCareerGoals(userId)
        return NextResponse.json({ success: true, data: careerGoals })
      }

      case 'analytics': {
        const period = searchParams.get('period') || 'week'
        const analytics = await workProjectRepository.getAnalytics(userId, period)
        return NextResponse.json({ success: true, data: analytics })
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Work module GET error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const body = await request.json()
    const { type, ...data } = body

    switch (type) {
      case 'project': {
        const validatedData = CreateProjectSchema.parse(data)
        const project = await workProjectRepository.createProject(userId, validatedData)
        
        // Create associated goal if requested
        if (validatedData.createGoal) {
          await goalRepository.create({
            userId,
            title: `Complete ${project.name}`,
            description: `Work project: ${project.description}`,
            moduleId: 'work',
            targetDate: project.endDate,
            difficulty: 'medium',
            priority: project.priority as any,
            moduleData: { projectId: project.id }
          })
        }
        
        // Award XP for project creation
        await xpManager.awardXP(userId, 'create_work_project', 'medium')
        
        return NextResponse.json(
          { success: true, data: project, message: 'Project created successfully' },
          { status: 201 }
        )
      }

      case 'task': {
        const validatedData = CreateTaskSchema.parse(data)
        const task = await projectTaskRepository.createTask(userId, validatedData)
        
        // Award XP for task creation
        await xpManager.awardXP(userId, 'create_task', 'easy')
        
        return NextResponse.json(
          { success: true, data: task, message: 'Task created successfully' },
          { status: 201 }
        )
      }

      case 'time-entry': {
        const validatedData = CreateTimeEntrySchema.parse(data)
        
        // Calculate duration if not provided
        if (!validatedData.durationMinutes && validatedData.endTime) {
          const duration = Math.round(
            (validatedData.endTime.getTime() - validatedData.startTime.getTime()) / (1000 * 60)
          )
          validatedData.durationMinutes = duration
        }
        
        const timeEntry = await timeEntryRepository.createTimeEntry(userId, {
          ...validatedData,
          entryDate: validatedData.startTime
        })
        
        // Update project actual hours
        await workProjectRepository.updateProjectHours(validatedData.projectId)
        
        // Award XP for time tracking
        await xpManager.awardXP(userId, 'track_time', 'easy')
        
        return NextResponse.json(
          { success: true, data: timeEntry, message: 'Time entry logged successfully' },
          { status: 201 }
        )
      }

      case 'career-goal': {
        const validatedData = CreateCareerGoalSchema.parse(data)
        const careerGoal = await careerGoalRepository.createCareerGoal(userId, validatedData)
        
        // Create associated main goal if requested
        if (validatedData.createGoal) {
          await goalRepository.create({
            userId,
            title: careerGoal.title,
            description: careerGoal.description,
            moduleId: 'work',
            targetDate: careerGoal.targetDate,
            difficulty: 'medium',
            priority: 'medium',
            moduleData: { careerGoalId: careerGoal.id, category: careerGoal.category }
          })
        }
        
        // Award XP for career goal creation
        await xpManager.awardXP(userId, 'create_career_goal', 'medium')
        
        return NextResponse.json(
          { success: true, data: careerGoal, message: 'Career goal created successfully' },
          { status: 201 }
        )
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Work module POST error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT and DELETE methods would follow similar patterns...
```

### Module Implementation

**Priority**: Critical  
**Files to Create**:
- `/home/tholum/projects/goalassistant/src/modules/work/WorkModule.tsx`

Following the exact pattern from `/home/tholum/projects/goalassistant/src/modules/bible/BibleModule.tsx`:

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { IModule, Achievement, PointsConfiguration, ModuleCapability } from '../../types/module';

// Import UI components (patterns from Bible module)
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

// Icons
import { 
  Briefcase, 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar,
  PlayCircle,
  PauseCircle,
  Square,
  Timer,
  CheckCircle2,
  User
} from 'lucide-react';

// Component implementations would follow the same patterns as Bible module
// with work-specific functionality...

const WorkDashboard = ({ userId }: { moduleId: string; userId: string; config: Record<string, unknown> }) => {
  // Implementation similar to BibleStudyDashboard but for work projects
  // Real-time timer, project progress, task completion, time tracking summary
  return (
    <div className="p-4 bg-blue-50 rounded-lg space-y-6">
      {/* Work-specific dashboard implementation */}
    </div>
  );
};

const WorkMobileQuickAdd = ({ onSuccess, onCancel }: { moduleId: string; userId: string; onSuccess?: () => void; onCancel?: () => void }) => {
  // Implementation for mobile quick-add: start timer, log task completion, add project update
  return (
    <div className="p-4">
      {/* Mobile quick actions for work module */}
    </div>
  );
};

const WorkDesktopDetail = ({ moduleId, userId, config }: { moduleId: string; userId: string; config: Record<string, unknown> }) => {
  // Full desktop interface with project management, time tracking, analytics
  return (
    <div className="p-6">
      {/* Desktop work management interface */}
    </div>
  );
};

const WorkSettings = ({ config, onConfigChange }: { moduleId: string; config: Record<string, unknown>; onConfigChange: (config: Record<string, unknown>) => void }) => {
  // Work module configuration settings
  return (
    <div className="p-4 space-y-6">
      {/* Work module settings */}
    </div>
  );
};

// Achievements configuration
const workAchievements: Achievement[] = [
  {
    id: 'first_project',
    name: 'Project Pioneer',
    description: 'Create your first work project',
    icon: 'briefcase',
    tier: 'bronze',
    conditions: { type: 'count', target: 1, field: 'projectsCreated' },
    xpReward: 50
  },
  {
    id: 'time_tracker',
    name: 'Time Master',
    description: 'Track 40 hours of work time',
    icon: 'clock',
    tier: 'silver',
    conditions: { type: 'count', target: 2400, field: 'minutesTracked' },
    xpReward: 150
  },
  {
    id: 'project_completer',
    name: 'Delivery Expert',
    description: 'Complete 10 work projects',
    icon: 'check-circle',
    tier: 'gold',
    conditions: { type: 'count', target: 10, field: 'projectsCompleted' },
    xpReward: 500
  },
  {
    id: 'career_focused',
    name: 'Career Strategist',
    description: 'Set and achieve 5 career development goals',
    icon: 'target',
    tier: 'gold',
    conditions: { type: 'count', target: 5, field: 'careerGoalsCompleted' },
    xpReward: 400
  },
  {
    id: 'productivity_master',
    name: 'Productivity Guru',
    description: 'Maintain a 30-day work streak',
    icon: 'trending-up',
    tier: 'platinum',
    conditions: { type: 'streak', target: 30, field: 'workStreak' },
    xpReward: 1000
  }
];

const workPointsConfig: PointsConfiguration = {
  actions: {
    create_work_project: {
      basePoints: 25,
      difficultyMultiplier: true,
      streakBonus: false,
      description: 'Create a new work project'
    },
    complete_project: {
      basePoints: 100,
      difficultyMultiplier: true,
      streakBonus: true,
      description: 'Complete a work project'
    },
    create_task: {
      basePoints: 5,
      difficultyMultiplier: true,
      streakBonus: false,
      description: 'Create a project task'
    },
    complete_task: {
      basePoints: 15,
      difficultyMultiplier: true,
      streakBonus: true,
      description: 'Complete a project task'
    },
    track_time: {
      basePoints: 2,
      difficultyMultiplier: false,
      streakBonus: true,
      description: 'Log work time'
    },
    create_career_goal: {
      basePoints: 30,
      difficultyMultiplier: true,
      streakBonus: false,
      description: 'Create a career development goal'
    },
    complete_milestone: {
      basePoints: 50,
      difficultyMultiplier: true,
      streakBonus: true,
      description: 'Complete a project milestone'
    }
  },
  difficultyMultipliers: {
    easy: 1,
    medium: 1.3,
    hard: 1.7,
    expert: 2.5
  },
  streakBonusPercentage: 15 // Encourages consistent work habits
};

// Module capabilities
const workCapabilities: ModuleCapability[] = [
  {
    id: 'project_management',
    name: 'Project Management',
    description: 'Create and manage work projects with tasks and milestones',
    required: true
  },
  {
    id: 'time_tracking',
    name: 'Time Tracking',
    description: 'Track time spent on projects and tasks',
    required: true
  },
  {
    id: 'career_development',
    name: 'Career Development',
    description: 'Set and track professional development goals',
    required: false
  },
  {
    id: 'performance_analytics',
    name: 'Performance Analytics',
    description: 'Analyze work productivity and performance metrics',
    required: false
  },
  {
    id: 'team_collaboration',
    name: 'Team Collaboration',
    description: 'Assign tasks and collaborate with team members',
    required: false
  }
];

// Main Work Module implementation
export const WorkModule: IModule = {
  id: 'work',
  name: 'Work Projects',
  version: '1.0.0',
  icon: 'briefcase',
  color: '#3B82F6',

  metadata: {
    id: 'work',
    name: 'Work Projects',
    version: '1.0.0',
    author: 'Goal Assistant Team',
    description: 'Comprehensive work project management with time tracking, career development, and performance analytics',
    keywords: ['work', 'projects', 'time-tracking', 'career', 'productivity', 'professional', 'tasks'],
    homepage: 'https://goalassistant.app/modules/work',
    repository: 'https://github.com/goalassistant/modules/work',
    license: 'MIT',
    minSystemVersion: '1.0.0',
    dependencies: {},
    peerDependencies: {}
  },

  components: {
    dashboard: WorkDashboard,
    mobileQuickAdd: WorkMobileQuickAdd,
    desktopDetail: WorkDesktopDetail,
    settings: WorkSettings
  },

  achievements: workAchievements,
  pointsConfig: workPointsConfig,
  capabilities: workCapabilities,

  permissions: [
    'read:work_data',
    'write:work_data',
    'read:time_data',
    'write:time_data',
    'read:career_data',
    'write:career_data',
    'read:performance_data',
    'write:performance_data'
  ],

  // API routes definition
  apiRoutes: {
    baseRoute: '/api/v1/modules/work',
    routes: [
      {
        path: '/',
        method: 'GET',
        handler: 'getWorkDashboard',
        permissions: ['read:work_data']
      },
      {
        path: '/',
        method: 'POST',
        handler: 'createWorkResource',
        permissions: ['write:work_data']
      }
      // Additional routes following the established pattern...
    ]
  },

  // Lifecycle methods
  async onInstall(): Promise<void> {
    console.log('Installing Work Projects module...');
  },

  async onUninstall(): Promise<void> {
    console.log('Uninstalling Work Projects module...');
  },

  async onEnable(): Promise<void> {
    console.log('Enabling Work Projects module...');
  },

  async onDisable(): Promise<void> {
    console.log('Disabling Work Projects module...');
  },

  async onUpgrade(fromVersion: string, toVersion: string): Promise<void> {
    console.log(`Upgrading Work Projects module from ${fromVersion} to ${toVersion}...`);
  },

  async onConfigChange(oldConfig: Record<string, unknown>, newConfig: Record<string, unknown>): Promise<void> {
    console.log('Work Projects module configuration changed:', { oldConfig, newConfig });
  }
};
```

## Testing Strategy

### Test Files to Create

**Priority**: High  
Following patterns from existing test structure:

1. **Unit Tests**:
   - `/home/tholum/projects/goalassistant/src/lib/prisma/repositories/work-repository.test.ts`
   - `/home/tholum/projects/goalassistant/src/modules/work/WorkModule.test.tsx`

2. **Integration Tests**:
   - `/home/tholum/projects/goalassistant/src/app/api/v1/modules/work/route.test.ts`
   - `/home/tholum/projects/goalassistant/src/modules/work/WorkModule.integration.test.tsx`

3. **Component Tests**:
   - `/home/tholum/projects/goalassistant/src/modules/work/components/WorkDashboard.test.tsx`
   - `/home/tholum/projects/goalassistant/src/modules/work/components/TimeTracker.test.tsx`

### Test Coverage Requirements
- **Repository Layer**: 100% coverage for all CRUD operations and business logic
- **API Routes**: All endpoints with success/error scenarios
- **Components**: User interactions, state changes, error handling
- **Module Integration**: Lifecycle methods, gamification integration

### Testing Commands
```bash
# Unit tests
npm run test:unit -- src/modules/work

# API tests  
npm run test:api -- src/app/api/v1/modules/work

# Database tests
npm run test:db -- work-repository

# Coverage check
npm run test:coverage -- --threshold=80
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Priority**: Critical

1. **Database Schema** - Update Prisma schema with work-specific models
2. **Repository Layer** - Implement core repository classes
3. **Basic API Endpoints** - GET/POST routes for projects and tasks
4. **Module Registration** - Basic IModule implementation

**Validation Gates**:
```bash
npm run db:generate && npm run db:migrate
npm run test:db -- work-repository
npm run lint
```

### Phase 2: Core Features (Week 2) 
**Priority**: High

1. **Time Tracking** - Complete time entry system with start/stop functionality
2. **Project Management** - Full CRUD for projects, tasks, and milestones  
3. **Dashboard Components** - Work dashboard and mobile quick-add
4. **Goal Integration** - Link work projects to goal system

**Validation Gates**:
```bash
npm run test:api -- work
npm run test:unit -- WorkModule
ruff check --fix && mypy . # If Python components exist
```

### Phase 3: Advanced Features (Week 3)
**Priority**: Medium

1. **Career Development** - Career goals and skill tracking
2. **Performance Analytics** - Metrics and reporting
3. **Desktop Interface** - Full desktop detail view
4. **Gamification Integration** - XP rewards and achievements

**Validation Gates**:
```bash
npm run test:coverage -- src/modules/work
npm run storybook # Component stories
npm run build
```

### Phase 4: Polish & Integration (Week 4)
**Priority**: Medium

1. **Mobile Optimizations** - Touch-friendly interfaces, offline support
2. **Settings & Configuration** - Module settings panel
3. **Documentation** - Storybook stories and API docs
4. **Performance Testing** - Load testing and optimization

**Validation Gates**:
```bash
npm run test:ci
npm run build-storybook
npm run lighthouse -- /work # Performance audit
```

## Integration Requirements

### Goal System Integration
- Automatic goal creation for projects and career objectives
- Progress tracking sync between work tasks and goals
- Goal completion triggers for project milestones

### Gamification Integration  
- XP rewards for work activities following `PointsConfiguration`
- Achievement unlocking based on work metrics
- Streak tracking for consistent work habits

### Existing UI Components
- Utilize components from `/home/tholum/projects/goalassistant/src/components/ui/`
- Follow design patterns from Bible Study Module
- Maintain mobile-first responsive design

## Error Handling & Validation

### API Error Patterns
Following patterns from `/home/tholum/projects/goalassistant/src/app/api/v1/modules/bible/route.ts`:
- Zod validation with detailed error messages
- Consistent error response format
- Proper HTTP status codes
- Transaction rollback on failures

### Database Constraints
- Foreign key relationships with cascading deletes
- Unique constraints where appropriate
- Index optimization for query performance
- Data validation at database level

## Performance Considerations

### Database Optimization
- Strategic indexing on frequently queried fields
- Efficient pagination for large datasets  
- Connection pooling and query optimization
- Background tasks for heavy computations

### API Performance
- Response caching for dashboard data
- Optimistic updates for time tracking
- Batch operations for bulk actions
- Rate limiting to prevent abuse

## Security Considerations

### Data Privacy
- User data isolation through userId filtering
- Permission-based access control
- Secure time tracking data handling
- GDPR-compliant data export/deletion

### API Security
- Authentication required for all endpoints
- Input validation and sanitization
- SQL injection prevention through Prisma
- Rate limiting and abuse prevention

## Deployment & Migration

### Database Migration
```bash
# Generate Prisma client with new schema
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed with sample work data
npm run db:seed -- work-module
```

### Module Registration
Following `/home/tholum/projects/goalassistant/src/modules/core/ModuleRegistry.ts` patterns:
```typescript
// In application startup
const moduleRegistry = new ModuleRegistry(storage);
await moduleRegistry.initialize();
await moduleRegistry.register(WorkModule, { autoEnable: true });
```

## Success Metrics

### Functional Requirements
- ✅ 100% API endpoint functionality with proper error handling
- ✅ Real-time time tracking with sub-minute accuracy
- ✅ Project management with task hierarchies and milestones
- ✅ Career development goal integration
- ✅ Performance analytics with historical data

### Performance Requirements  
- ✅ Dashboard loads in < 1 second
- ✅ Time tracker start/stop response < 500ms
- ✅ 80% test coverage across all components
- ✅ Mobile-responsive on all target devices

### User Experience Requirements
- ✅ Intuitive mobile-first interface
- ✅ Consistent with existing module patterns
- ✅ Accessibility compliance (WCAG 2.1)
- ✅ Offline capability for time tracking

## External Resources & Documentation

### API Design References
- [REST API Design Patterns](https://blog.stoplight.io/api-design-patterns-for-rest-web-services) - Modern REST endpoint design
- [Time Tracking API Examples](https://www.zoho.com/projects/help/rest-api/log-time.html) - Industry standard patterns
- [Project Management API Guide](https://www.merge.dev/blog/guide-to-project-management-apis) - Comprehensive API design

### React & TypeScript Patterns  
- [React Design Patterns 2025](https://refine.dev/blog/react-design-patterns/) - Modern component patterns
- [TypeScript React Best Practices](https://www.robinwieruch.de/react-folder-structure/) - Project organization
- [Modular React Applications](https://martinfowler.com/articles/modularizing-react-apps.html) - Architecture patterns

### Database & Performance
- [Prisma Schema Design](https://www.prisma.io/docs/concepts/components/prisma-schema) - Official schema guide
- [SQLite Performance](https://www.sqlite.org/optoverview.html) - Optimization techniques
- [API Performance Monitoring](https://www.apidynamics.com/blogs/the-ultimate-guide-to-api-monitoring-in-2025-metrics-tools-and-proven-practices) - 2025 monitoring practices

## Dependencies & Prerequisites

### Existing System Components
- ✅ Goal Management CRUD (P1-101) - Required for goal integration
- ✅ Database Integration (P0-002) - Prisma schema foundation
- ❌ Authentication System (P0-001) - Required for user context  
- ❌ Gamification Integration (P2-201) - Required for XP/achievements
- ❌ Calendar View (P2-203) - Optional for project scheduling

### Technical Dependencies
- Next.js 15 with App Router
- React 19 with TypeScript strict mode  
- Prisma ORM with SQLite
- Zod for validation
- Vitest for testing
- shadcn/ui components

## Risk Assessment

### High Risk Items
1. **Time Tracking Accuracy** - Critical for user trust, requires precise timestamp handling
2. **Database Performance** - Complex queries for analytics may impact performance  
3. **Mobile UX** - Time tracking must work reliably on mobile devices
4. **Data Migration** - Existing users require seamless schema updates

### Mitigation Strategies
1. **Comprehensive Testing** - Unit, integration, and performance testing
2. **Progressive Rollout** - Feature flags for gradual deployment
3. **Backup Strategy** - Database backups before schema changes
4. **Monitoring** - Real-time performance and error monitoring

---

**Confidence Score Justification (9/10)**:
This PRP achieves a high confidence score due to:
- Complete analysis of existing codebase patterns and architecture
- Detailed technical specifications following established conventions  
- Comprehensive research into modern work project management practices
- Clear implementation phases with executable validation gates
- Integration with existing Goal and Gamification systems
- Thorough testing strategy with measurable coverage requirements

The score is not 10/10 due to dependencies on authentication and gamification systems that are not yet implemented, which may require adjustments to the integration approach.