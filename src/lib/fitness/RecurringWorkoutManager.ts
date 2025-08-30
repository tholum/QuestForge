/**
 * Recurring Workout Pattern Manager
 * 
 * Provides functionality for creating and managing recurring workout patterns
 * such as "Cardio daily", "Leg Day 3x/week", etc.
 */

import { addDays, startOfWeek, endOfWeek, format } from 'date-fns'
import { workoutRepository } from '../prisma/repositories/fitness-repository'

export interface RecurringPattern {
  id: string
  name: string
  description?: string
  workoutTemplateId: string
  frequency: 'daily' | 'weekly' | 'custom'
  daysOfWeek?: number[] // 0=Sunday, 1=Monday, etc.
  timesPerWeek?: number // for custom frequency
  duration?: number // weeks to continue pattern
  startDate: Date
  endDate?: Date
  isActive: boolean
}

export interface CreateRecurringPatternInput {
  name: string
  description?: string
  workoutTemplateId: string
  frequency: 'daily' | 'weekly' | 'custom'
  daysOfWeek?: number[]
  timesPerWeek?: number
  duration?: number
  startDate: Date
  endDate?: Date
}

export class RecurringWorkoutManager {
  /**
   * Create a new recurring workout pattern
   */
  async createRecurringPattern(
    userId: string, 
    input: CreateRecurringPatternInput
  ): Promise<RecurringPattern> {
    // Validate input
    this.validateRecurringPatternInput(input)

    // Calculate end date if not provided
    const endDate = input.endDate || (
      input.duration 
        ? addDays(input.startDate, input.duration * 7)
        : addDays(input.startDate, 365) // Default to 1 year
    )

    const pattern: RecurringPattern = {
      id: `pattern_${Date.now()}`,
      name: input.name,
      description: input.description,
      workoutTemplateId: input.workoutTemplateId,
      frequency: input.frequency,
      daysOfWeek: input.daysOfWeek,
      timesPerWeek: input.timesPerWeek,
      duration: input.duration,
      startDate: input.startDate,
      endDate,
      isActive: true
    }

    // Generate initial workouts for the pattern
    await this.generateWorkoutsFromPattern(userId, pattern)

    return pattern
  }

  /**
   * Generate workouts from a recurring pattern
   */
  async generateWorkoutsFromPattern(
    userId: string,
    pattern: RecurringPattern
  ): Promise<void> {
    const workouts = this.calculateWorkoutDates(pattern)
    
    for (const workoutDate of workouts) {
      try {
        // Create workout from template for each calculated date
        await this.createWorkoutFromTemplate(
          userId,
          pattern.workoutTemplateId,
          workoutDate,
          pattern.name
        )
      } catch (error) {
        console.error(`Failed to create workout for ${format(workoutDate, 'yyyy-MM-dd')}:`, error)
        // Continue with other workouts even if one fails
      }
    }
  }

  /**
   * Calculate all workout dates for a recurring pattern
   */
  private calculateWorkoutDates(pattern: RecurringPattern): Date[] {
    const dates: Date[] = []
    const current = new Date(pattern.startDate)
    const end = pattern.endDate || addDays(pattern.startDate, 365)

    switch (pattern.frequency) {
      case 'daily':
        while (current <= end) {
          dates.push(new Date(current))
          current.setDate(current.getDate() + 1)
        }
        break

      case 'weekly':
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          // Weekly on specific days
          while (current <= end) {
            const weekStart = startOfWeek(current)
            const weekEnd = endOfWeek(current)
            
            for (const dayOfWeek of pattern.daysOfWeek) {
              const workoutDate = new Date(weekStart)
              workoutDate.setDate(weekStart.getDate() + dayOfWeek)
              
              if (workoutDate >= pattern.startDate && workoutDate <= end && workoutDate <= weekEnd) {
                dates.push(new Date(workoutDate))
              }
            }
            
            current.setDate(current.getDate() + 7) // Move to next week
          }
        }
        break

      case 'custom':
        if (pattern.timesPerWeek) {
          // Custom frequency - distribute evenly throughout the week
          const daysBetween = Math.floor(7 / pattern.timesPerWeek)
          let dayOffset = 0
          
          while (current <= end) {
            for (let i = 0; i < pattern.timesPerWeek && current <= end; i++) {
              const workoutDate = new Date(current)
              workoutDate.setDate(current.getDate() + (dayOffset * daysBetween))
              
              if (workoutDate <= end) {
                dates.push(new Date(workoutDate))
              }
              
              dayOffset++
            }
            
            current.setDate(current.getDate() + 7) // Move to next week
            dayOffset = 0
          }
        }
        break
    }

    return dates.sort((a, b) => a.getTime() - b.getTime())
  }

  /**
   * Create a workout from a template
   */
  private async createWorkoutFromTemplate(
    userId: string,
    templateId: string,
    scheduledDate: Date,
    patternName: string
  ): Promise<void> {
    // This would integrate with your workout template system
    // For now, create a basic workout structure
    const workoutData = {
      userId,
      name: `${patternName} - ${format(scheduledDate, 'MMM dd')}`,
      description: `Generated from recurring pattern: ${patternName}`,
      scheduledDate,
      workoutType: 'mixed' as const, // Would be determined by template
      estimatedDuration: 45, // Would be from template
      isTemplate: false
    }

    await workoutRepository.create(workoutData)
  }

  /**
   * Get common recurring patterns
   */
  getCommonPatterns(): Array<{
    name: string
    description: string
    frequency: 'daily' | 'weekly' | 'custom'
    daysOfWeek?: number[]
    timesPerWeek?: number
  }> {
    return [
      {
        name: 'Daily Cardio',
        description: 'Cardio workout every day',
        frequency: 'daily'
      },
      {
        name: 'MWF Strength',
        description: 'Strength training on Monday, Wednesday, Friday',
        frequency: 'weekly',
        daysOfWeek: [1, 3, 5] // Mon, Wed, Fri
      },
      {
        name: 'Weekend Warrior',
        description: 'Workouts on Saturday and Sunday',
        frequency: 'weekly',
        daysOfWeek: [0, 6] // Sun, Sat
      },
      {
        name: 'Leg Day (3x/week)',
        description: 'Leg workouts 3 times per week',
        frequency: 'custom',
        timesPerWeek: 3
      },
      {
        name: 'Upper Body (2x/week)',
        description: 'Upper body workouts 2 times per week',
        frequency: 'custom',
        timesPerWeek: 2
      },
      {
        name: 'Full Body (4x/week)',
        description: 'Full body workouts 4 times per week',
        frequency: 'custom',
        timesPerWeek: 4
      }
    ]
  }

  /**
   * Validate recurring pattern input
   */
  private validateRecurringPatternInput(input: CreateRecurringPatternInput): void {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Pattern name is required')
    }

    if (!input.workoutTemplateId) {
      throw new Error('Workout template ID is required')
    }

    if (input.frequency === 'weekly' && (!input.daysOfWeek || input.daysOfWeek.length === 0)) {
      throw new Error('Days of week must be specified for weekly frequency')
    }

    if (input.frequency === 'custom' && (!input.timesPerWeek || input.timesPerWeek < 1 || input.timesPerWeek > 7)) {
      throw new Error('Times per week must be between 1 and 7 for custom frequency')
    }

    if (input.daysOfWeek) {
      const invalidDays = input.daysOfWeek.filter(day => day < 0 || day > 6)
      if (invalidDays.length > 0) {
        throw new Error('Days of week must be between 0 (Sunday) and 6 (Saturday)')
      }
    }

    if (input.duration && input.duration < 1) {
      throw new Error('Duration must be at least 1 week')
    }
  }

  /**
   * Preview workout schedule for a pattern
   */
  previewPatternSchedule(
    pattern: Omit<RecurringPattern, 'id' | 'isActive'>,
    previewWeeks: number = 4
  ): Date[] {
    const tempPattern: RecurringPattern = {
      ...pattern,
      id: 'preview',
      isActive: true,
      endDate: pattern.endDate || addDays(pattern.startDate, previewWeeks * 7)
    }

    return this.calculateWorkoutDates(tempPattern).slice(0, previewWeeks * 7) // Limit preview
  }
}

// Export singleton instance
export const recurringWorkoutManager = new RecurringWorkoutManager()