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

import { z } from 'zod'
import { BaseRepository, TransactionContext } from '../base-repository'
import { prisma } from '../client'
import type {
  WorkProject,
  ProjectTask,
  TimeEntry,
  CareerGoal,
  PerformanceMetric,
  ProjectMilestone
} from '@prisma/client'

// Validation schemas
const WorkProjectCreateSchema = z.object({
  userId: z.string(),
  goalId: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  projectType: z.enum(['client', 'internal', 'personal', 'team']),
  status: z.enum(['planning', 'active', 'on-hold', 'completed', 'cancelled']).default('active'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  estimatedHours: z.number().optional(),
  actualHours: z.number().default(0),
  budget: z.number().optional(),
  clientName: z.string().optional()
})

const WorkProjectUpdateSchema = WorkProjectCreateSchema.partial()

const WorkProjectQuerySchema = z.object({
  userId: z.string().optional(),
  status: z.string().optional(),
  projectType: z.string().optional(),
  priority: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const ProjectTaskCreateSchema = z.object({
  projectId: z.string(),
  parentTaskId: z.string().optional(),
  userId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'review', 'completed']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  estimatedHours: z.number().optional(),
  actualHours: z.number().default(0),
  assignedTo: z.string().optional(),
  dueDate: z.date().optional()
})

const ProjectTaskUpdateSchema = ProjectTaskCreateSchema.partial()

const ProjectTaskQuerySchema = z.object({
  userId: z.string().optional(),
  projectId: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.date().optional(),
  assignedTo: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const TimeEntryCreateSchema = z.object({
  userId: z.string(),
  projectId: z.string(),
  taskId: z.string().optional(),
  description: z.string().optional(),
  startTime: z.date(),
  endTime: z.date().optional(),
  durationMinutes: z.number().optional(),
  hourlyRate: z.number().optional(),
  isBillable: z.boolean().default(false),
  entryDate: z.date()
})

const TimeEntryUpdateSchema = TimeEntryCreateSchema.partial()

const TimeEntryQuerySchema = z.object({
  userId: z.string().optional(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  entryDate: z.date().optional(),
  isBillable: z.boolean().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const CareerGoalCreateSchema = z.object({
  userId: z.string(),
  goalId: z.string().optional(),
  category: z.enum(['skill', 'promotion', 'certification', 'networking', 'learning']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  currentLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  targetLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  targetDate: z.date().optional(),
  isCompleted: z.boolean().default(false),
  evidence: z.any().optional()
})

const CareerGoalUpdateSchema = CareerGoalCreateSchema.partial()

const CareerGoalQuerySchema = z.object({
  userId: z.string().optional(),
  category: z.string().optional(),
  isCompleted: z.boolean().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const PerformanceMetricCreateSchema = z.object({
  userId: z.string(),
  metricType: z.enum(['productivity', 'efficiency', 'quality', 'satisfaction']),
  metricName: z.string().min(1).max(100),
  value: z.number(),
  targetValue: z.number().optional(),
  unit: z.string().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  recordDate: z.date(),
  notes: z.string().optional()
})

const PerformanceMetricUpdateSchema = PerformanceMetricCreateSchema.partial()

const PerformanceMetricQuerySchema = z.object({
  userId: z.string().optional(),
  metricType: z.string().optional(),
  period: z.string().optional(),
  recordDate: z.date().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

const ProjectMilestoneCreateSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  dueDate: z.date(),
  isCompleted: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
})

const ProjectMilestoneUpdateSchema = ProjectMilestoneCreateSchema.partial()

const ProjectMilestoneQuerySchema = z.object({
  projectId: z.string().optional(),
  isCompleted: z.boolean().optional(),
  priority: z.string().optional(),
  dueDate: z.date().optional(),
  limit: z.number().optional(),
  offset: z.number().optional()
})

// Type definitions
type WorkProjectCreate = z.infer<typeof WorkProjectCreateSchema>
type WorkProjectUpdate = z.infer<typeof WorkProjectUpdateSchema>
type WorkProjectQuery = z.infer<typeof WorkProjectQuerySchema>

type ProjectTaskCreate = z.infer<typeof ProjectTaskCreateSchema>
type ProjectTaskUpdate = z.infer<typeof ProjectTaskUpdateSchema>
type ProjectTaskQuery = z.infer<typeof ProjectTaskQuerySchema>

type TimeEntryCreate = z.infer<typeof TimeEntryCreateSchema>
type TimeEntryUpdate = z.infer<typeof TimeEntryUpdateSchema>
type TimeEntryQuery = z.infer<typeof TimeEntryQuerySchema>

type CareerGoalCreate = z.infer<typeof CareerGoalCreateSchema>
type CareerGoalUpdate = z.infer<typeof CareerGoalUpdateSchema>
type CareerGoalQuery = z.infer<typeof CareerGoalQuerySchema>

type PerformanceMetricCreate = z.infer<typeof PerformanceMetricCreateSchema>
type PerformanceMetricUpdate = z.infer<typeof PerformanceMetricUpdateSchema>
type PerformanceMetricQuery = z.infer<typeof PerformanceMetricQuerySchema>

type ProjectMilestoneCreate = z.infer<typeof ProjectMilestoneCreateSchema>
type ProjectMilestoneUpdate = z.infer<typeof ProjectMilestoneUpdateSchema>
type ProjectMilestoneQuery = z.infer<typeof ProjectMilestoneQuerySchema>

/**
 * Work Project Repository
 */
export class WorkProjectRepository extends BaseRepository<
  WorkProject,
  WorkProjectCreate,
  WorkProjectUpdate,
  WorkProjectQuery
> {
  protected model = 'workProject'
  protected createSchema = WorkProjectCreateSchema
  protected updateSchema = WorkProjectUpdateSchema
  protected querySchema = WorkProjectQuerySchema

  protected buildWhereClause(query: WorkProjectQuery): any {
    const where: any = {}
    
    if (query.userId) where.userId = query.userId
    if (query.status) where.status = query.status
    if (query.projectType) where.projectType = query.projectType
    if (query.priority) where.priority = query.priority

    return where
  }

  protected buildOrderByClause(query: WorkProjectQuery): any {
    return { updatedAt: 'desc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        goal: {
          select: { id: true, title: true }
        },
        tasks: {
          select: { id: true, status: true, title: true }
        },
        timeEntries: {
          select: { durationMinutes: true }
        },
        milestones: {
          select: { id: true, isCompleted: true, dueDate: true }
        },
        _count: {
          select: { tasks: true, timeEntries: true, milestones: true }
        }
      }
    }
  }

  /**
   * Get user's projects with filters
   */
  async getUserProjects(userId: string, filters: {
    status?: string
    page?: number
    limit?: number
  } = {}): Promise<WorkProject[]> {
    const { status, page = 1, limit = 20 } = filters
    const skip = (page - 1) * limit
    
    return this.findMany({
      userId,
      status,
      limit,
      offset: skip
    })
  }

  /**
   * Update project actual hours based on time entries
   */
  async updateProjectHours(projectId: string): Promise<WorkProject> {
    const totalMinutes = await prisma.timeEntry.aggregate({
      where: { projectId },
      _sum: { durationMinutes: true }
    })
    
    const actualHours = Math.round((totalMinutes._sum.durationMinutes || 0) / 60)
    
    return this.update(projectId, { actualHours })
  }

  /**
   * Get project analytics
   */
  async getAnalytics(userId: string, period: string = 'week'): Promise<any> {
    const periodStart = this.getPeriodStart(period)
    
    const [
      totalProjects,
      completedProjects,
      activeProjects,
      totalTime,
      averageCompletion
    ] = await Promise.all([
      this.count({ userId }),
      this.count({ userId, status: 'completed' }),
      this.count({ userId, status: 'active' }),
      prisma.timeEntry.aggregate({
        where: {
          userId,
          entryDate: { gte: periodStart }
        },
        _sum: { durationMinutes: true }
      }),
      prisma.$queryRaw`
        SELECT AVG(julianday(updatedAt) - julianday(createdAt)) as avg_days
        FROM WorkProject 
        WHERE userId = ${userId} AND status = 'completed'
      `
    ])

    return {
      totalProjects,
      completedProjects,
      activeProjects,
      completionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
      totalTimeMinutes: totalTime._sum.durationMinutes || 0,
      totalTimeHours: Math.round((totalTime._sum.durationMinutes || 0) / 60),
      averageCompletionDays: averageCompletion[0]?.avg_days || 0
    }
  }

  private getPeriodStart(period: string): Date {
    const now = new Date()
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1)
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        return new Date(now.getFullYear(), quarter * 3, 1)
      case 'year':
        return new Date(now.getFullYear(), 0, 1)
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  }

  /**
   * Calculate project progress
   */
  calculateProjectProgress(project: any): number {
    if (!project.tasks || project.tasks.length === 0) return 0
    const completed = project.tasks.filter((t: any) => t.status === 'completed').length
    return Math.round((completed / project.tasks.length) * 100)
  }
}

/**
 * Project Task Repository
 */
export class ProjectTaskRepository extends BaseRepository<
  ProjectTask,
  ProjectTaskCreate,
  ProjectTaskUpdate,
  ProjectTaskQuery
> {
  protected model = 'projectTask'
  protected createSchema = ProjectTaskCreateSchema
  protected updateSchema = ProjectTaskUpdateSchema
  protected querySchema = ProjectTaskQuerySchema

  protected buildWhereClause(query: ProjectTaskQuery): any {
    const where: any = {}
    
    if (query.userId) where.userId = query.userId
    if (query.projectId) where.projectId = query.projectId
    if (query.status) where.status = query.status
    if (query.priority) where.priority = query.priority
    if (query.assignedTo) where.assignedTo = query.assignedTo
    if (query.dueDate) where.dueDate = { gte: query.dueDate }

    return where
  }

  protected buildOrderByClause(query: ProjectTaskQuery): any {
    return { dueDate: 'asc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        project: {
          select: { id: true, name: true }
        },
        parentTask: {
          select: { id: true, title: true }
        },
        subTasks: {
          select: { id: true, title: true, status: true }
        },
        timeEntries: {
          select: { durationMinutes: true }
        }
      }
    }
  }

  /**
   * Get project tasks
   */
  async getProjectTasks(projectId: string, userId: string, filters: { status?: string } = {}): Promise<ProjectTask[]> {
    return this.findMany({
      userId,
      projectId,
      status: filters.status
    })
  }

  /**
   * Complete task
   */
  async completeTask(id: string, userId: string): Promise<ProjectTask> {
    return this.update(id, {
      status: 'completed',
      completedAt: new Date(),
      actualHours: await this.calculateTaskHours(id)
    })
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(userId: string): Promise<ProjectTask[]> {
    const now = new Date()
    return prisma.projectTask.findMany({
      where: {
        userId,
        dueDate: { lt: now },
        status: { not: 'completed' }
      },
      include: this.getIncludeOptions().include
    })
  }

  private async calculateTaskHours(taskId: string): Promise<number> {
    const totalMinutes = await prisma.timeEntry.aggregate({
      where: { taskId },
      _sum: { durationMinutes: true }
    })
    
    return (totalMinutes._sum.durationMinutes || 0) / 60
  }
}

/**
 * Time Entry Repository
 */
export class TimeEntryRepository extends BaseRepository<
  TimeEntry,
  TimeEntryCreate,
  TimeEntryUpdate,
  TimeEntryQuery
> {
  protected model = 'timeEntry'
  protected createSchema = TimeEntryCreateSchema
  protected updateSchema = TimeEntryUpdateSchema
  protected querySchema = TimeEntryQuerySchema

  protected buildWhereClause(query: TimeEntryQuery): any {
    const where: any = {}
    
    if (query.userId) where.userId = query.userId
    if (query.projectId) where.projectId = query.projectId
    if (query.taskId) where.taskId = query.taskId
    if (query.entryDate) where.entryDate = query.entryDate
    if (query.isBillable !== undefined) where.isBillable = query.isBillable

    return where
  }

  protected buildOrderByClause(query: TimeEntryQuery): any {
    return { startTime: 'desc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        project: {
          select: { id: true, name: true }
        },
        task: {
          select: { id: true, title: true }
        }
      }
    }
  }

  /**
   * Get time entries for date range
   */
  async getTimeEntries(userId: string, date: string, filters: { projectId?: string } = {}): Promise<TimeEntry[]> {
    const entryDate = new Date(date)
    return this.findMany({
      userId,
      projectId: filters.projectId,
      entryDate
    })
  }

  /**
   * Start timer
   */
  async startTimer(userId: string, projectId: string, taskId?: string, description?: string): Promise<TimeEntry> {
    const startTime = new Date()
    return this.create({
      userId,
      projectId,
      taskId,
      description,
      startTime,
      entryDate: startTime,
      isBillable: false
    })
  }

  /**
   * Stop timer
   */
  async stopTimer(id: string, endTime?: Date): Promise<TimeEntry> {
    const stopTime = endTime || new Date()
    const entry = await this.findById(id)
    
    if (!entry) {
      throw new Error('Time entry not found')
    }

    const durationMinutes = Math.round(
      (stopTime.getTime() - entry.startTime.getTime()) / (1000 * 60)
    )

    return this.update(id, {
      endTime: stopTime,
      durationMinutes
    })
  }

  /**
   * Get weekly time summary
   */
  async getWeeklyTimeSummary(userId: string, weekStart: Date): Promise<any> {
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return prisma.timeEntry.groupBy({
      by: ['projectId'],
      where: {
        userId,
        entryDate: {
          gte: weekStart,
          lt: weekEnd
        }
      },
      _sum: {
        durationMinutes: true
      },
      _count: {
        id: true
      }
    })
  }
}

/**
 * Career Goal Repository
 */
export class CareerGoalRepository extends BaseRepository<
  CareerGoal,
  CareerGoalCreate,
  CareerGoalUpdate,
  CareerGoalQuery
> {
  protected model = 'careerGoal'
  protected createSchema = CareerGoalCreateSchema
  protected updateSchema = CareerGoalUpdateSchema
  protected querySchema = CareerGoalQuerySchema

  protected buildWhereClause(query: CareerGoalQuery): any {
    const where: any = {}
    
    if (query.userId) where.userId = query.userId
    if (query.category) where.category = query.category
    if (query.isCompleted !== undefined) where.isCompleted = query.isCompleted

    return where
  }

  protected buildOrderByClause(query: CareerGoalQuery): any {
    return { createdAt: 'desc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        goal: {
          select: { id: true, title: true }
        }
      }
    }
  }

  /**
   * Get user's career goals
   */
  async getUserCareerGoals(userId: string): Promise<CareerGoal[]> {
    return this.findMany({ userId })
  }

  /**
   * Complete career goal
   */
  async completeCareerGoal(id: string, userId: string, evidence?: any): Promise<CareerGoal> {
    return this.update(id, {
      isCompleted: true,
      completedAt: new Date(),
      evidence
    })
  }

  /**
   * Get goals by category
   */
  async getByCategory(userId: string, category: string): Promise<CareerGoal[]> {
    return this.findMany({ userId, category })
  }
}

/**
 * Performance Metric Repository
 */
export class PerformanceMetricRepository extends BaseRepository<
  PerformanceMetric,
  PerformanceMetricCreate,
  PerformanceMetricUpdate,
  PerformanceMetricQuery
> {
  protected model = 'performanceMetric'
  protected createSchema = PerformanceMetricCreateSchema
  protected updateSchema = PerformanceMetricUpdateSchema
  protected querySchema = PerformanceMetricQuerySchema

  protected buildWhereClause(query: PerformanceMetricQuery): any {
    const where: any = {}
    
    if (query.userId) where.userId = query.userId
    if (query.metricType) where.metricType = query.metricType
    if (query.period) where.period = query.period
    if (query.recordDate) where.recordDate = { gte: query.recordDate }

    return where
  }

  protected buildOrderByClause(query: PerformanceMetricQuery): any {
    return { recordDate: 'desc' }
  }

  /**
   * Get metrics for period
   */
  async getMetricsForPeriod(userId: string, metricType: string, period: string): Promise<PerformanceMetric[]> {
    return this.findMany({ userId, metricType, period })
  }
}

/**
 * Project Milestone Repository
 */
export class ProjectMilestoneRepository extends BaseRepository<
  ProjectMilestone,
  ProjectMilestoneCreate,
  ProjectMilestoneUpdate,
  ProjectMilestoneQuery
> {
  protected model = 'projectMilestone'
  protected createSchema = ProjectMilestoneCreateSchema
  protected updateSchema = ProjectMilestoneUpdateSchema
  protected querySchema = ProjectMilestoneQuerySchema

  protected buildWhereClause(query: ProjectMilestoneQuery): any {
    const where: any = {}
    
    if (query.projectId) where.projectId = query.projectId
    if (query.isCompleted !== undefined) where.isCompleted = query.isCompleted
    if (query.priority) where.priority = query.priority
    if (query.dueDate) where.dueDate = { gte: query.dueDate }

    return where
  }

  protected buildOrderByClause(query: ProjectMilestoneQuery): any {
    return { dueDate: 'asc' }
  }

  protected getIncludeOptions(): any {
    return {
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    }
  }

  /**
   * Complete milestone
   */
  async completeMilestone(id: string): Promise<ProjectMilestone> {
    return this.update(id, {
      isCompleted: true,
      completedAt: new Date()
    })
  }

  /**
   * Get upcoming milestones
   */
  async getUpcomingMilestones(projectId: string, days: number = 30): Promise<ProjectMilestone[]> {
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    
    return prisma.projectMilestone.findMany({
      where: {
        projectId,
        dueDate: {
          gte: new Date(),
          lte: futureDate
        },
        isCompleted: false
      },
      include: this.getIncludeOptions().include,
      orderBy: { dueDate: 'asc' }
    })
  }
}

/**
 * Work Dashboard Repository
 * Aggregates data for the work module dashboard
 */
export class WorkDashboardRepository {
  private workProjectRepo = new WorkProjectRepository()
  private projectTaskRepo = new ProjectTaskRepository()
  private timeEntryRepo = new TimeEntryRepository()
  private careerGoalRepo = new CareerGoalRepository()
  private performanceMetricRepo = new PerformanceMetricRepository()

  /**
   * Get comprehensive dashboard data for user
   */
  async getDashboardData(userId: string) {
    const [
      activeProjects,
      todayTasks,
      weekTimeTracked,
      upcomingDeadlines,
      careerGoals,
      recentMetrics,
      overdueTasks
    ] = await Promise.all([
      // Active projects with progress
      this.getActiveProjectsWithProgress(userId),
      
      // Today's tasks
      this.getTodayTaskCount(userId),
      
      // Week time tracked
      this.getWeekTimeTracked(userId),
      
      // Upcoming deadlines
      this.getUpcomingDeadlines(userId),
      
      // Career goals
      this.careerGoalRepo.findMany({ userId, limit: 5 }),
      
      // Recent performance metrics
      this.getRecentMetrics(userId),
      
      // Overdue tasks
      this.projectTaskRepo.getOverdueTasks(userId)
    ])

    return {
      activeProjects,
      todayTasks,
      weekTimeTracked: weekTimeTracked._sum.durationMinutes || 0,
      upcomingDeadlines,
      careerGoals,
      recentMetrics,
      overdueTasks: overdueTasks.slice(0, 5), // Limit to 5 most urgent
      stats: {
        totalActiveProjects: activeProjects.length,
        weekHours: Math.round((weekTimeTracked._sum.durationMinutes || 0) / 60),
        overdueTaskCount: overdueTasks.length,
        completedCareerGoals: careerGoals.filter(g => g.isCompleted).length
      }
    }
  }

  private async getActiveProjectsWithProgress(userId: string): Promise<any[]> {
    const projects = await prisma.workProject.findMany({
      where: { userId, status: 'active' },
      include: {
        tasks: { select: { status: true } },
        timeEntries: { select: { durationMinutes: true } },
        milestones: { select: { isCompleted: true, dueDate: true } }
      },
      take: 10,
      orderBy: { updatedAt: 'desc' }
    })

    return projects.map(project => ({
      ...project,
      progress: this.workProjectRepo.calculateProjectProgress(project),
      completedTasks: project.tasks.filter(t => t.status === 'completed').length,
      totalTasks: project.tasks.length,
      totalTimeMinutes: project.timeEntries.reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0),
      completedMilestones: project.milestones.filter(m => m.isCompleted).length,
      totalMilestones: project.milestones.length,
      daysRemaining: project.endDate ? 
        Math.ceil((project.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
      isOverdue: project.endDate ? project.endDate < new Date() : false
    }))
  }

  private async getTodayTaskCount(userId: string): Promise<any> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

    const [total, completed] = await Promise.all([
      prisma.projectTask.count({
        where: {
          userId,
          dueDate: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      prisma.projectTask.count({
        where: {
          userId,
          dueDate: {
            gte: today,
            lt: tomorrow
          },
          status: 'completed'
        }
      })
    ])

    return { total, completed, remaining: total - completed }
  }

  private async getWeekTimeTracked(userId: string): Promise<any> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    return prisma.timeEntry.aggregate({
      where: {
        userId,
        entryDate: { gte: weekAgo }
      },
      _sum: { durationMinutes: true }
    })
  }

  private async getUpcomingDeadlines(userId: string): Promise<any[]> {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    
    const tasks = await prisma.projectTask.findMany({
      where: {
        userId,
        status: { not: 'completed' },
        dueDate: {
          gte: new Date(),
          lte: thirtyDaysFromNow
        }
      },
      include: { project: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
      take: 10
    })

    return tasks.map(task => ({
      ...task,
      projectName: task.project.name,
      daysUntilDue: Math.ceil((task.dueDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      isOverdue: task.dueDate! < new Date()
    }))
  }

  private async getRecentMetrics(userId: string): Promise<PerformanceMetric[]> {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    
    return this.performanceMetricRepo.findMany({
      userId,
      recordDate: monthAgo,
      limit: 8
    })
  }
}

// Export repository instances
export const workProjectRepository = new WorkProjectRepository()
export const projectTaskRepository = new ProjectTaskRepository()
export const timeEntryRepository = new TimeEntryRepository()
export const careerGoalRepository = new CareerGoalRepository()
export const performanceMetricRepository = new PerformanceMetricRepository()
export const projectMilestoneRepository = new ProjectMilestoneRepository()
export const workDashboardRepository = new WorkDashboardRepository()