/**
 * Calendar API Routes
 * 
 * Manages calendar events, goal deadlines, and scheduling.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withMethodValidation, AuthenticatedRequest } from '@/lib/auth/middleware'
import { withErrorHandling } from '@/lib/prisma/error-handler'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { startOfDay, endOfDay, parseISO } from 'date-fns'

const prisma = new PrismaClient()

// Validation schemas
const CalendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  eventType: z.enum(['goal_deadline', 'milestone', 'reminder', 'custom']),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date').optional(),
  isAllDay: z.boolean().optional().default(false),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  goalId: z.string().optional()
})

const CalendarQuerySchema = z.object({
  startDate: z.string().datetime('Invalid start date').optional(),
  endDate: z.string().datetime('Invalid end date').optional(),
  eventType: z.enum(['goal_deadline', 'milestone', 'reminder', 'custom']).optional(),
  includeCompleted: z.boolean().optional().default(true),
  goalId: z.string().optional()
})

const EventUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isAllDay: z.boolean().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  isCompleted: z.boolean().optional()
})

/**
 * Generate automatic calendar events from goals
 */
async function generateGoalEvents(userId: string, startDate: Date, endDate: Date) {
  // Get goals with target dates within the range
  const goals = await prisma.goal.findMany({
    where: {
      userId,
      targetDate: {
        gte: startDate,
        lte: endDate
      },
      isCompleted: false
    },
    include: {
      module: {
        select: {
          name: true
        }
      }
    }
  })
  
  // Check if calendar events already exist for these goals
  const existingEvents = await prisma.calendarEvent.findMany({
    where: {
      userId,
      goalId: {
        in: goals.map(g => g.id)
      },
      eventType: 'goal_deadline'
    }
  })
  
  const existingGoalIds = new Set(existingEvents.map(e => e.goalId))
  
  // Create events for goals that don't have them yet
  const newEvents = goals
    .filter(goal => !existingGoalIds.has(goal.id))
    .map(goal => ({
      userId,
      goalId: goal.id,
      title: `Goal Deadline: ${goal.title}`,
      description: goal.description || undefined,
      eventType: 'goal_deadline' as const,
      startDate: goal.targetDate!,
      endDate: goal.targetDate!,
      isAllDay: true,
      color: getModuleColor(goal.module.name)
    }))
  
  if (newEvents.length > 0) {
    await prisma.calendarEvent.createMany({
      data: newEvents,
      skipDuplicates: true
    })
  }
  
  return newEvents.length
}

/**
 * Get default color for module
 */
function getModuleColor(moduleName: string): string {
  const colorMap: Record<string, string> = {
    'Bible Study': '#8B5CF6',
    'Work Projects': '#3B82F6',
    'Fitness': '#10B981',
    'Learning': '#F59E0B',
    'Home': '#EF4444',
    'Creative': '#EC4899'
  }
  
  return colorMap[moduleName] || '#6B7280'
}

/**
 * GET /api/v1/calendar
 * Get calendar events for date range
 */
async function handleGet(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const url = new URL(request.url)
    
    const queryParams = {
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      eventType: url.searchParams.get('eventType') as 'goal_deadline' | 'milestone' | 'reminder' | 'custom' || undefined,
      includeCompleted: url.searchParams.get('includeCompleted') !== 'false',
      goalId: url.searchParams.get('goalId') || undefined
    }
    
    const validatedQuery = CalendarQuerySchema.parse(queryParams)
    
    // Default to current month if no dates provided
    const now = new Date()
    const defaultStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1))
    const defaultEnd = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    
    const startDate = validatedQuery.startDate ? parseISO(validatedQuery.startDate) : defaultStart
    const endDate = validatedQuery.endDate ? parseISO(validatedQuery.endDate) : defaultEnd
    
    // Generate automatic events for goals if needed
    const generatedCount = await generateGoalEvents(request.user.id, startDate, endDate)
    
    // Build where clause
    const where: any = {
      userId: request.user.id,
      startDate: {
        gte: startDate,
        lte: endDate
      }
    }
    
    if (validatedQuery.eventType) {
      where.eventType = validatedQuery.eventType
    }
    
    if (!validatedQuery.includeCompleted) {
      where.isCompleted = false
    }
    
    if (validatedQuery.goalId) {
      where.goalId = validatedQuery.goalId
    }
    
    // Fetch events
    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            isCompleted: true,
            module: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    })
    
    // Group events by date for easier consumption
    const eventsByDate = events.reduce((acc, event) => {
      const dateKey = event.startDate.toISOString().split('T')[0]
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push({
        ...event,
        goal: event.goal ? {
          id: event.goal.id,
          title: event.goal.title,
          isCompleted: event.goal.isCompleted,
          moduleName: event.goal.module.name
        } : null
      })
      return acc
    }, {} as Record<string, any[]>)
    
    // Get summary stats
    const [totalEvents, upcomingEvents, overdueEvents] = await Promise.all([
      prisma.calendarEvent.count({
        where: { userId: request.user.id }
      }),
      prisma.calendarEvent.count({
        where: {
          userId: request.user.id,
          startDate: { gte: now },
          isCompleted: false
        }
      }),
      prisma.calendarEvent.count({
        where: {
          userId: request.user.id,
          startDate: { lt: now },
          isCompleted: false
        }
      })
    ])
    
    return NextResponse.json({
      success: true,
      data: {
        events: eventsByDate,
        eventsList: events,
        summary: {
          totalEvents,
          upcomingEvents,
          overdueEvents,
          generatedCount
        }
      },
      message: `Retrieved ${events.length} events${generatedCount > 0 ? ` (${generatedCount} auto-generated)` : ''}`
    })
  }, 'Fetching calendar events')
}

/**
 * POST /api/v1/calendar
 * Create new calendar event
 */
async function handlePost(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const body = await request.json()
    
    const validatedData = CalendarEventSchema.parse(body)
    
    // Parse dates
    const startDate = parseISO(validatedData.startDate)
    const endDate = validatedData.endDate ? parseISO(validatedData.endDate) : startDate
    
    // Validate that end date is after start date
    if (endDate < startDate) {
      return NextResponse.json({
        success: false,
        error: 'End date must be after start date'
      }, { status: 400 })
    }
    
    // If goalId is provided, verify it belongs to the user
    if (validatedData.goalId) {
      const goal = await prisma.goal.findUnique({
        where: { id: validatedData.goalId },
        select: { userId: true }
      })
      
      if (!goal || goal.userId !== request.user.id) {
        return NextResponse.json({
          success: false,
          error: 'Goal not found or access denied'
        }, { status: 404 })
      }
    }
    
    // Create calendar event
    const newEvent = await prisma.calendarEvent.create({
      data: {
        userId: request.user.id,
        title: validatedData.title,
        description: validatedData.description,
        eventType: validatedData.eventType,
        startDate,
        endDate,
        isAllDay: validatedData.isAllDay,
        color: validatedData.color || '#6B7280',
        goalId: validatedData.goalId
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: newEvent,
      message: 'Calendar event created successfully'
    }, { status: 201 })
  }, 'Creating calendar event')
}

/**
 * PATCH /api/v1/calendar
 * Update existing calendar events (bulk update support)
 */
async function handlePatch(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const body = await request.json()
    const { eventId, updates } = body
    
    if (!eventId) {
      return NextResponse.json({
        success: false,
        error: 'Event ID is required'
      }, { status: 400 })
    }
    
    const validatedUpdates = EventUpdateSchema.parse(updates)
    
    // Verify event belongs to user
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id: eventId },
      select: { userId: true }
    })
    
    if (!existingEvent || existingEvent.userId !== request.user.id) {
      return NextResponse.json({
        success: false,
        error: 'Event not found or access denied'
      }, { status: 404 })
    }
    
    // Prepare update data
    const updateData: any = {}
    
    if (validatedUpdates.title !== undefined) updateData.title = validatedUpdates.title
    if (validatedUpdates.description !== undefined) updateData.description = validatedUpdates.description
    if (validatedUpdates.isAllDay !== undefined) updateData.isAllDay = validatedUpdates.isAllDay
    if (validatedUpdates.color !== undefined) updateData.color = validatedUpdates.color
    if (validatedUpdates.isCompleted !== undefined) updateData.isCompleted = validatedUpdates.isCompleted
    
    if (validatedUpdates.startDate) {
      updateData.startDate = parseISO(validatedUpdates.startDate)
    }
    
    if (validatedUpdates.endDate) {
      updateData.endDate = parseISO(validatedUpdates.endDate)
    }
    
    // Validate date logic if both dates are being updated
    if (updateData.startDate && updateData.endDate && updateData.endDate < updateData.startDate) {
      return NextResponse.json({
        success: false,
        error: 'End date must be after start date'
      }, { status: 400 })
    }
    
    // Update the event
    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: updateData,
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: 'Calendar event updated successfully'
    })
  }, 'Updating calendar event')
}

/**
 * Main route handlers
 */
export async function GET(request: NextRequest) {
  const methodCheck = withMethodValidation(request, ['GET'])
  if (methodCheck) return methodCheck
  
  return withAuth(request, handleGet)
}

export async function POST(request: NextRequest) {
  const methodCheck = withMethodValidation(request, ['POST'])
  if (methodCheck) return methodCheck
  
  return withAuth(request, handlePost)
}

export async function PATCH(request: NextRequest) {
  const methodCheck = withMethodValidation(request, ['PATCH'])
  if (methodCheck) return methodCheck
  
  return withAuth(request, handlePatch)
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}