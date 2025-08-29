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
  workDashboardRepository,
  workProjectRepository,
  projectTaskRepository,
  timeEntryRepository,
  careerGoalRepository,
  performanceMetricRepository,
  projectMilestoneRepository
} from '../../../../../lib/prisma/repositories/work-repository'
import { GoalRepository } from '../../../../../lib/prisma/repositories/goal-repository'
// import { xpManager } from '../../../../../lib/gamification/XPManager'

// Initialize repositories
const goalRepository = new GoalRepository()

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

const UpdateProjectSchema = CreateProjectSchema.partial()

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

const UpdateTaskSchema = CreateTaskSchema.partial()

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

const UpdateTimeEntrySchema = CreateTimeEntrySchema.partial()

const CreateCareerGoalSchema = z.object({
  category: z.enum(['skill', 'promotion', 'certification', 'networking', 'learning']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  currentLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  targetLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  targetDate: z.string().transform((str) => new Date(str)).optional(),
  createGoal: z.boolean().default(true)
})

const UpdateCareerGoalSchema = CreateCareerGoalSchema.partial()

const CreatePerformanceMetricSchema = z.object({
  metricType: z.enum(['productivity', 'efficiency', 'quality', 'satisfaction']),
  metricName: z.string().min(1).max(100),
  value: z.number(),
  targetValue: z.number().optional(),
  unit: z.string().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  recordDate: z.string().transform((str) => new Date(str)),
  notes: z.string().optional()
})

const CreateMilestoneSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  dueDate: z.string().transform((str) => new Date(str)),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
})

// Helper function to get user ID (placeholder - integrate with your auth system)
async function getUserId(request: NextRequest): Promise<string> {
  // This would typically extract user ID from JWT token or session
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    throw new Error('Authentication required')
  }
  // For now, return a placeholder - implement based on your auth system
  return 'user-placeholder-id' // Replace with actual implementation
}

/**
 * GET /api/v1/modules/work
 * Retrieve work module data based on query type
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'dashboard'

    switch (type) {
      case 'dashboard': {
        const dashboardData = await workDashboardRepository.getDashboardData(userId)
        return NextResponse.json({ success: true, data: dashboardData })
      }

      case 'projects': {
        const status = searchParams.get('status') || undefined
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        
        const projects = await workProjectRepository.getUserProjects(userId, {
          status,
          page,
          limit
        })
        return NextResponse.json({ success: true, data: projects })
      }

      case 'project': {
        const projectId = searchParams.get('id')
        if (!projectId) {
          return NextResponse.json(
            { success: false, error: 'Project ID is required' },
            { status: 400 }
          )
        }
        
        const project = await workProjectRepository.findById(projectId)
        if (!project || project.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Project not found' },
            { status: 404 }
          )
        }
        
        return NextResponse.json({ success: true, data: project })
      }

      case 'tasks': {
        const projectId = searchParams.get('projectId')
        const status = searchParams.get('status') || undefined
        
        if (projectId) {
          const tasks = await projectTaskRepository.getProjectTasks(projectId, userId, { status })
          return NextResponse.json({ success: true, data: tasks })
        } else {
          const tasks = await projectTaskRepository.findMany({
            userId,
            status,
            limit: parseInt(searchParams.get('limit') || '50')
          })
          return NextResponse.json({ success: true, data: tasks })
        }
      }

      case 'time-entries': {
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
        const projectId = searchParams.get('projectId') || undefined
        
        const timeEntries = await timeEntryRepository.getTimeEntries(userId, date, { projectId })
        return NextResponse.json({ success: true, data: timeEntries })
      }

      case 'time-summary': {
        const weekStart = searchParams.get('weekStart') 
          ? new Date(searchParams.get('weekStart')!)
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        
        const summary = await timeEntryRepository.getWeeklyTimeSummary(userId, weekStart)
        return NextResponse.json({ success: true, data: summary })
      }

      case 'career-goals': {
        const category = searchParams.get('category') || undefined
        const careerGoals = await careerGoalRepository.findMany({ 
          userId, 
          category,
          limit: parseInt(searchParams.get('limit') || '20')
        })
        return NextResponse.json({ success: true, data: careerGoals })
      }

      case 'performance-metrics': {
        const metricType = searchParams.get('metricType') || undefined
        const period = searchParams.get('period') || undefined
        const metrics = await performanceMetricRepository.findMany({
          userId,
          metricType,
          period,
          limit: parseInt(searchParams.get('limit') || '50')
        })
        return NextResponse.json({ success: true, data: metrics })
      }

      case 'analytics': {
        const period = searchParams.get('period') || 'week'
        const analytics = await workProjectRepository.getAnalytics(userId, period)
        return NextResponse.json({ success: true, data: analytics })
      }

      case 'upcoming-deadlines': {
        const days = parseInt(searchParams.get('days') || '30')
        const projectId = searchParams.get('projectId')
        
        if (projectId) {
          const milestones = await projectMilestoneRepository.getUpcomingMilestones(projectId, days)
          return NextResponse.json({ success: true, data: milestones })
        } else {
          const overdueTasks = await projectTaskRepository.getOverdueTasks(userId)
          return NextResponse.json({ success: true, data: overdueTasks })
        }
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

/**
 * POST /api/v1/modules/work
 * Create work module resources
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const body = await request.json()
    const { type, ...data } = body

    switch (type) {
      case 'project': {
        const validatedData = CreateProjectSchema.parse(data)
        
        // Create the project
        const project = await workProjectRepository.create({
          ...validatedData,
          userId
        })
        
        // Create associated goal if requested
        if (validatedData.createGoal) {
          await goalRepository.create({
            userId,
            title: `Complete ${project.name}`,
            description: `Work project: ${project.description || ''}`,
            moduleId: 'work',
            targetDate: project.endDate,
            difficulty: 'medium',
            priority: project.priority as any,
            moduleData: { projectId: project.id, type: 'work_project' }
          })
        }
        
        // Award XP for project creation (commented until gamification is implemented)
        // await xpManager.awardXP(userId, 'create_work_project', 'medium')
        
        return NextResponse.json(
          { success: true, data: project, message: 'Project created successfully' },
          { status: 201 }
        )
      }

      case 'task': {
        const validatedData = CreateTaskSchema.parse(data)
        
        // Verify project belongs to user
        const project = await workProjectRepository.findById(validatedData.projectId)
        if (!project || project.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Project not found or access denied' },
            { status: 404 }
          )
        }
        
        const task = await projectTaskRepository.create({
          ...validatedData,
          userId
        })
        
        // Award XP for task creation
        // await xpManager.awardXP(userId, 'create_task', 'easy')
        
        return NextResponse.json(
          { success: true, data: task, message: 'Task created successfully' },
          { status: 201 }
        )
      }

      case 'time-entry': {
        const validatedData = CreateTimeEntrySchema.parse(data)
        
        // Verify project belongs to user
        const project = await workProjectRepository.findById(validatedData.projectId)
        if (!project || project.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Project not found or access denied' },
            { status: 404 }
          )
        }
        
        // Calculate duration if not provided
        if (!validatedData.durationMinutes && validatedData.endTime) {
          const duration = Math.round(
            (validatedData.endTime.getTime() - validatedData.startTime.getTime()) / (1000 * 60)
          )
          validatedData.durationMinutes = duration
        }
        
        const timeEntry = await timeEntryRepository.create({
          ...validatedData,
          userId,
          entryDate: validatedData.startTime
        })
        
        // Update project actual hours
        await workProjectRepository.updateProjectHours(validatedData.projectId)
        
        // Award XP for time tracking
        // await xpManager.awardXP(userId, 'track_time', 'easy')
        
        return NextResponse.json(
          { success: true, data: timeEntry, message: 'Time entry logged successfully' },
          { status: 201 }
        )
      }

      case 'time-start': {
        const { projectId, taskId, description } = data
        
        // Verify project belongs to user
        const project = await workProjectRepository.findById(projectId)
        if (!project || project.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Project not found or access denied' },
            { status: 404 }
          )
        }
        
        const timeEntry = await timeEntryRepository.startTimer(userId, projectId, taskId, description)
        
        return NextResponse.json(
          { success: true, data: timeEntry, message: 'Timer started' },
          { status: 201 }
        )
      }

      case 'career-goal': {
        const validatedData = CreateCareerGoalSchema.parse(data)
        
        const careerGoal = await careerGoalRepository.create({
          ...validatedData,
          userId
        })
        
        // Create associated main goal if requested
        if (validatedData.createGoal) {
          await goalRepository.create({
            userId,
            title: careerGoal.title,
            description: careerGoal.description || '',
            moduleId: 'work',
            targetDate: careerGoal.targetDate,
            difficulty: 'medium',
            priority: 'medium',
            moduleData: { 
              careerGoalId: careerGoal.id, 
              category: careerGoal.category,
              type: 'career_goal'
            }
          })
        }
        
        // Award XP for career goal creation
        // await xpManager.awardXP(userId, 'create_career_goal', 'medium')
        
        return NextResponse.json(
          { success: true, data: careerGoal, message: 'Career goal created successfully' },
          { status: 201 }
        )
      }

      case 'performance-metric': {
        const validatedData = CreatePerformanceMetricSchema.parse(data)
        
        const metric = await performanceMetricRepository.create({
          ...validatedData,
          userId
        })
        
        return NextResponse.json(
          { success: true, data: metric, message: 'Performance metric recorded successfully' },
          { status: 201 }
        )
      }

      case 'milestone': {
        const validatedData = CreateMilestoneSchema.parse(data)
        
        // Verify project belongs to user
        const project = await workProjectRepository.findById(validatedData.projectId)
        if (!project || project.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Project not found or access denied' },
            { status: 404 }
          )
        }
        
        const milestone = await projectMilestoneRepository.create(validatedData)
        
        return NextResponse.json(
          { success: true, data: milestone, message: 'Milestone created successfully' },
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

/**
 * PUT /api/v1/modules/work
 * Update work module resources
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const body = await request.json()
    const { type, id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required for updates' },
        { status: 400 }
      )
    }

    switch (type) {
      case 'project': {
        const validatedData = UpdateProjectSchema.parse(data)
        
        // Verify ownership
        const existingProject = await workProjectRepository.findById(id)
        if (!existingProject || existingProject.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Project not found or access denied' },
            { status: 404 }
          )
        }
        
        const updatedProject = await workProjectRepository.update(id, validatedData)
        
        return NextResponse.json({
          success: true,
          data: updatedProject,
          message: 'Project updated successfully'
        })
      }

      case 'task': {
        const validatedData = UpdateTaskSchema.parse(data)
        
        // Verify ownership
        const existingTask = await projectTaskRepository.findById(id)
        if (!existingTask || existingTask.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Task not found or access denied' },
            { status: 404 }
          )
        }
        
        const updatedTask = await projectTaskRepository.update(id, validatedData)
        
        // Award XP for task completion if status changed to completed
        if (validatedData.status === 'completed' && existingTask.status !== 'completed') {
          // await xpManager.awardXP(userId, 'complete_task', 'medium')
        }
        
        return NextResponse.json({
          success: true,
          data: updatedTask,
          message: 'Task updated successfully'
        })
      }

      case 'time-entry': {
        const validatedData = UpdateTimeEntrySchema.parse(data)
        
        // Verify ownership
        const existingEntry = await timeEntryRepository.findById(id)
        if (!existingEntry || existingEntry.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Time entry not found or access denied' },
            { status: 404 }
          )
        }
        
        const updatedEntry = await timeEntryRepository.update(id, validatedData)
        
        // Update project hours if this was a duration change
        if (validatedData.durationMinutes !== undefined) {
          await workProjectRepository.updateProjectHours(existingEntry.projectId)
        }
        
        return NextResponse.json({
          success: true,
          data: updatedEntry,
          message: 'Time entry updated successfully'
        })
      }

      case 'time-stop': {
        const { endTime } = data
        
        // Verify ownership
        const existingEntry = await timeEntryRepository.findById(id)
        if (!existingEntry || existingEntry.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Time entry not found or access denied' },
            { status: 404 }
          )
        }
        
        const stoppedEntry = await timeEntryRepository.stopTimer(id, endTime ? new Date(endTime) : undefined)
        
        // Update project hours
        await workProjectRepository.updateProjectHours(existingEntry.projectId)
        
        return NextResponse.json({
          success: true,
          data: stoppedEntry,
          message: 'Timer stopped successfully'
        })
      }

      case 'career-goal': {
        const validatedData = UpdateCareerGoalSchema.parse(data)
        
        // Verify ownership
        const existingGoal = await careerGoalRepository.findById(id)
        if (!existingGoal || existingGoal.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Career goal not found or access denied' },
            { status: 404 }
          )
        }
        
        const updatedGoal = await careerGoalRepository.update(id, validatedData)
        
        return NextResponse.json({
          success: true,
          data: updatedGoal,
          message: 'Career goal updated successfully'
        })
      }

      case 'milestone-complete': {
        const milestone = await projectMilestoneRepository.findById(id)
        if (!milestone) {
          return NextResponse.json(
            { success: false, error: 'Milestone not found' },
            { status: 404 }
          )
        }
        
        // Verify project ownership
        const project = await workProjectRepository.findById(milestone.projectId)
        if (!project || project.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Access denied' },
            { status: 403 }
          )
        }
        
        const completedMilestone = await projectMilestoneRepository.completeMilestone(id)
        
        // Award XP for milestone completion
        // await xpManager.awardXP(userId, 'complete_milestone', 'medium')
        
        return NextResponse.json({
          success: true,
          data: completedMilestone,
          message: 'Milestone completed successfully'
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Work module PUT error:', error)
    
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

/**
 * DELETE /api/v1/modules/work
 * Delete work module resources
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json(
        { success: false, error: 'Type and ID are required' },
        { status: 400 }
      )
    }

    switch (type) {
      case 'project': {
        // Verify ownership
        const project = await workProjectRepository.findById(id)
        if (!project || project.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Project not found or access denied' },
            { status: 404 }
          )
        }
        
        await workProjectRepository.delete(id)
        
        return NextResponse.json({
          success: true,
          message: 'Project deleted successfully'
        })
      }

      case 'task': {
        // Verify ownership
        const task = await projectTaskRepository.findById(id)
        if (!task || task.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Task not found or access denied' },
            { status: 404 }
          )
        }
        
        await projectTaskRepository.delete(id)
        
        return NextResponse.json({
          success: true,
          message: 'Task deleted successfully'
        })
      }

      case 'time-entry': {
        // Verify ownership
        const entry = await timeEntryRepository.findById(id)
        if (!entry || entry.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Time entry not found or access denied' },
            { status: 404 }
          )
        }
        
        await timeEntryRepository.delete(id)
        
        // Update project hours
        await workProjectRepository.updateProjectHours(entry.projectId)
        
        return NextResponse.json({
          success: true,
          message: 'Time entry deleted successfully'
        })
      }

      case 'career-goal': {
        // Verify ownership
        const goal = await careerGoalRepository.findById(id)
        if (!goal || goal.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Career goal not found or access denied' },
            { status: 404 }
          )
        }
        
        await careerGoalRepository.delete(id)
        
        return NextResponse.json({
          success: true,
          message: 'Career goal deleted successfully'
        })
      }

      case 'milestone': {
        const milestone = await projectMilestoneRepository.findById(id)
        if (!milestone) {
          return NextResponse.json(
            { success: false, error: 'Milestone not found' },
            { status: 404 }
          )
        }
        
        // Verify project ownership
        const project = await workProjectRepository.findById(milestone.projectId)
        if (!project || project.userId !== userId) {
          return NextResponse.json(
            { success: false, error: 'Access denied' },
            { status: 403 }
          )
        }
        
        await projectMilestoneRepository.delete(id)
        
        return NextResponse.json({
          success: true,
          message: 'Milestone deleted successfully'
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown type: ${type}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Work module DELETE error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}