/**
 * useCalendar Hook
 * 
 * Custom hook for calendar events management with TanStack Query integration.
 * Provides calendar data, event CRUD operations, and scheduling functionality.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { startOfMonth, endOfMonth, format } from 'date-fns'

/**
 * Calendar data types
 */
type EventType = 'goal_deadline' | 'milestone' | 'reminder' | 'custom'

interface CalendarEvent {
  id: string
  userId: string
  goalId: string | null
  title: string
  description: string | null
  eventType: EventType
  startDate: Date
  endDate: Date | null
  isAllDay: boolean
  color: string | null
  isCompleted: boolean
  createdAt: Date
  updatedAt: Date
  goal: {
    id: string
    title: string
    isCompleted: boolean
    moduleName: string
  } | null
}

interface CalendarSummary {
  totalEvents: number
  upcomingEvents: number
  overdueEvents: number
  generatedCount: number
}

/**
 * Event input types
 */
interface EventCreateInput {
  title: string
  description?: string
  eventType: EventType
  startDate: string
  endDate?: string
  isAllDay?: boolean
  color?: string
  goalId?: string
}

interface EventUpdateInput {
  title?: string
  description?: string
  startDate?: string
  endDate?: string
  isAllDay?: boolean
  color?: string
  isCompleted?: boolean
}

/**
 * API Response interfaces
 */
interface CalendarResponse {
  success: boolean
  data: {
    events: Record<string, CalendarEvent[]>
    eventsList: CalendarEvent[]
    summary: CalendarSummary
  }
  message: string
}

interface EventResponse {
  success: boolean
  data: CalendarEvent
  message: string
}

/**
 * Hook options
 */
interface UseCalendarOptions {
  startDate?: Date
  endDate?: Date
  eventType?: EventType
  includeCompleted?: boolean
  goalId?: string
  enabled?: boolean
  refetchInterval?: number
}

/**
 * API service functions
 */
const calendarAPI = {
  /**
   * Fetch calendar events
   */
  async fetchEvents(options: UseCalendarOptions = {}): Promise<CalendarResponse> {
    const params = new URLSearchParams()
    
    if (options.startDate) params.set('startDate', options.startDate.toISOString())
    if (options.endDate) params.set('endDate', options.endDate.toISOString())
    if (options.eventType) params.set('eventType', options.eventType)
    if (options.includeCompleted !== undefined) params.set('includeCompleted', String(options.includeCompleted))
    if (options.goalId) params.set('goalId', options.goalId)

    const response = await fetch(`/api/v1/calendar?${params}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch calendar events')
    }
    
    return response.json()
  },

  /**
   * Create calendar event
   */
  async createEvent(data: EventCreateInput): Promise<EventResponse> {
    const response = await fetch('/api/v1/calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create event')
    }
    
    return response.json()
  },

  /**
   * Update calendar event
   */
  async updateEvent(eventId: string, updates: EventUpdateInput): Promise<EventResponse> {
    const response = await fetch('/api/v1/calendar', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventId, updates }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update event')
    }
    
    return response.json()
  }
}

/**
 * Generate query key for caching
 */
const generateQueryKey = (options: UseCalendarOptions) => {
  return ['calendar', options]
}

/**
 * Main useCalendar hook
 */
export function useCalendar(options: UseCalendarOptions = {}) {
  const queryClient = useQueryClient()
  
  // Default to current month if no dates provided
  const now = new Date()
  const defaultStartDate = options.startDate || startOfMonth(now)
  const defaultEndDate = options.endDate || endOfMonth(now)
  
  const queryOptions = {
    ...options,
    startDate: defaultStartDate,
    endDate: defaultEndDate
  }
  
  // Query for fetching calendar events
  const calendarQuery = useQuery({
    queryKey: generateQueryKey(queryOptions),
    queryFn: () => calendarAPI.fetchEvents(queryOptions),
    placeholderData: keepPreviousData,
    enabled: options.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchInterval: options.refetchInterval,
  })

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: calendarAPI.createEvent,
    onSuccess: (data) => {
      // Invalidate calendar queries to refetch
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      
      // Add new event to cache optimistically
      const queryKey = generateQueryKey(queryOptions)
      queryClient.setQueryData(queryKey, (old: CalendarResponse | undefined) => {
        if (!old) return old
        
        const eventDate = format(new Date(data.data.startDate), 'yyyy-MM-dd')
        
        return {
          ...old,
          data: {
            ...old.data,
            events: {
              ...old.data.events,
              [eventDate]: [...(old.data.events[eventDate] || []), data.data]
            },
            eventsList: [data.data, ...old.data.eventsList],
            summary: {
              ...old.data.summary,
              totalEvents: old.data.summary.totalEvents + 1
            }
          }
        }
      })
    },
    onError: (error) => {
      console.error('Failed to create event:', error)
    }
  })

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ eventId, updates }: { eventId: string; updates: EventUpdateInput }) => 
      calendarAPI.updateEvent(eventId, updates),
    onMutate: async ({ eventId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['calendar'] })
      
      // Snapshot previous value
      const previousCalendar = queryClient.getQueryData(generateQueryKey(queryOptions))
      
      // Optimistically update cache
      queryClient.setQueryData(generateQueryKey(queryOptions), (old: CalendarResponse | undefined) => {
        if (!old) return old
        
        const updatedEventsList = old.data.eventsList.map(event => 
          event.id === eventId 
            ? { ...event, ...updates, updatedAt: new Date() }
            : event
        )
        
        // Rebuild events by date
        const eventsByDate = updatedEventsList.reduce((acc, event) => {
          const dateKey = format(new Date(event.startDate), 'yyyy-MM-dd')
          if (!acc[dateKey]) acc[dateKey] = []
          acc[dateKey].push(event)
          return acc
        }, {} as Record<string, CalendarEvent[]>)
        
        return {
          ...old,
          data: {
            ...old.data,
            events: eventsByDate,
            eventsList: updatedEventsList
          }
        }
      })
      
      return { previousCalendar }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousCalendar) {
        queryClient.setQueryData(generateQueryKey(queryOptions), context.previousCalendar)
      }
      console.error('Failed to update event:', error)
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    }
  })

  // Helper functions
  const refetch = () => {
    return calendarQuery.refetch()
  }

  const createEvent = (data: EventCreateInput) => {
    return createEventMutation.mutateAsync(data)
  }

  const updateEvent = (eventId: string, updates: EventUpdateInput) => {
    return updateEventMutation.mutateAsync({ eventId, updates })
  }

  const completeEvent = (eventId: string) => {
    return updateEvent(eventId, { isCompleted: true })
  }

  const uncompleteEvent = (eventId: string) => {
    return updateEvent(eventId, { isCompleted: false })
  }

  // Data access helpers
  const getEvents = () => {
    return calendarQuery.data?.data?.eventsList || []
  }

  const getEventsByDate = () => {
    return calendarQuery.data?.data?.events || {}
  }

  const getSummary = () => {
    return calendarQuery.data?.data?.summary || {
      totalEvents: 0,
      upcomingEvents: 0,
      overdueEvents: 0,
      generatedCount: 0
    }
  }

  const getEventsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return getEventsByDate()[dateKey] || []
  }

  const getUpcomingEvents = (limit = 5) => {
    const now = new Date()
    return getEvents()
      .filter(event => new Date(event.startDate) >= now && !event.isCompleted)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, limit)
  }

  const getOverdueEvents = () => {
    const now = new Date()
    return getEvents()
      .filter(event => new Date(event.startDate) < now && !event.isCompleted)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  }

  const getEventsForGoal = (goalId: string) => {
    return getEvents().filter(event => event.goalId === goalId)
  }

  const getEventsByType = (eventType: EventType) => {
    return getEvents().filter(event => event.eventType === eventType)
  }

  const getTodaysEvents = () => {
    return getEventsForDate(new Date())
  }

  const getCompletedEvents = () => {
    return getEvents().filter(event => event.isCompleted)
  }

  const getPendingEvents = () => {
    return getEvents().filter(event => !event.isCompleted)
  }

  // Calendar view helpers
  const hasEventsOnDate = (date: Date) => {
    return getEventsForDate(date).length > 0
  }

  const getEventCountForDate = (date: Date) => {
    return getEventsForDate(date).length
  }

  const getMonthEventCounts = () => {
    const eventsByDate = getEventsByDate()
    const counts: Record<string, number> = {}
    
    Object.keys(eventsByDate).forEach(dateKey => {
      counts[dateKey] = eventsByDate[dateKey].length
    })
    
    return counts
  }

  // Quick create helpers
  const createDeadlineEvent = (goalId: string, title: string, dueDate: Date) => {
    return createEvent({
      title: `Deadline: ${title}`,
      eventType: 'goal_deadline',
      startDate: dueDate.toISOString(),
      endDate: dueDate.toISOString(),
      isAllDay: true,
      goalId,
      color: '#EF4444' // Red for deadlines
    })
  }

  const createReminderEvent = (title: string, reminderDate: Date, description?: string) => {
    return createEvent({
      title: `Reminder: ${title}`,
      description,
      eventType: 'reminder',
      startDate: reminderDate.toISOString(),
      isAllDay: false,
      color: '#F59E0B' // Yellow for reminders
    })
  }

  const createMilestoneEvent = (goalId: string, title: string, milestoneDate: Date) => {
    return createEvent({
      title: `Milestone: ${title}`,
      eventType: 'milestone',
      startDate: milestoneDate.toISOString(),
      isAllDay: true,
      goalId,
      color: '#10B981' // Green for milestones
    })
  }

  return {
    // Data
    events: getEvents(),
    eventsByDate: getEventsByDate(),
    summary: getSummary(),
    loading: calendarQuery.isLoading,
    error: calendarQuery.error,
    
    // Mutation states
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    
    // Methods
    refetch,
    createEvent,
    updateEvent,
    completeEvent,
    uncompleteEvent,
    
    // Data helpers
    getEventsForDate,
    getUpcomingEvents,
    getOverdueEvents,
    getEventsForGoal,
    getEventsByType,
    getTodaysEvents,
    getCompletedEvents,
    getPendingEvents,
    
    // Calendar view helpers
    hasEventsOnDate,
    getEventCountForDate,
    getMonthEventCounts,
    
    // Quick create helpers
    createDeadlineEvent,
    createReminderEvent,
    createMilestoneEvent,
    
    // Raw queries for advanced usage
    calendarQuery,
    createEventMutation,
    updateEventMutation
  }
}

/**
 * Hook for current month calendar
 */
export function useMonthCalendar(date = new Date(), enabled = true) {
  const startDate = startOfMonth(date)
  const endDate = endOfMonth(date)
  
  return useCalendar({ startDate, endDate, enabled })
}

/**
 * Hook for goal-specific events
 */
export function useGoalCalendar(goalId: string, enabled = true) {
  return useCalendar({ goalId, enabled })
}

/**
 * Hook for upcoming events only
 */
export function useUpcomingEvents(enabled = true) {
  const startDate = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 3) // Next 3 months
  
  return useCalendar({ 
    startDate, 
    endDate, 
    includeCompleted: false, 
    enabled 
  })
}

/**
 * Export types for use in components
 */
export type { 
  CalendarEvent,
  EventType,
  EventCreateInput,
  EventUpdateInput,
  CalendarSummary,
  UseCalendarOptions 
}