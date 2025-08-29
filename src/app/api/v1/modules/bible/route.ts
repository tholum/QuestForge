/**
 * Bible Module API Routes
 * 
 * Main API endpoint for Bible study module operations including:
 * - Dashboard data retrieval
 * - Reading plan management
 * - Study session tracking
 * - Prayer request management
 * - Scripture bookmark management
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  bibleDashboardRepository,
  bibleReadingPlanRepository,
  bibleReadingRepository,
  studySessionRepository,
  prayerRequestRepository,
  scriptureBookmarkRepository
} from '../../../../../lib/prisma/repositories/bible-repository'
import { bibleAPIService } from '../../../../../modules/bible/services/BibleAPIService'

// Request validation schemas
const CreateReadingPlanSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  planType: z.enum(['preset', 'custom']),
  presetId: z.string().optional(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)).optional(),
  customReadings: z.array(z.object({
    date: z.string().transform((str) => new Date(str)),
    passages: z.array(z.string())
  })).optional()
})

const CompleteReadingSchema = z.object({
  readingId: z.string(),
  readingTimeMinutes: z.number().optional(),
  notes: z.string().optional()
})

const CreateStudySessionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  passages: z.array(z.string()).optional(),
  durationMinutes: z.number().optional(),
  studyDate: z.string().transform((str) => new Date(str)),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  goalId: z.string().optional()
})

const CreatePrayerRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum(['personal', 'family', 'ministry', 'world']).default('personal'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  isPrivate: z.boolean().default(true),
  requestDate: z.string().transform((str) => new Date(str))
})

const CreateBookmarkSchema = z.object({
  reference: z.string().min(1),
  version: z.string().default('ESV'),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPrivate: z.boolean().default(true)
})

// Helper function to get user ID from request (placeholder - implement based on your auth system)
async function getUserId(request: NextRequest): Promise<string> {
  // This would typically extract user ID from JWT token or session
  // For now, return a placeholder - implement based on your auth system
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    throw new Error('Authentication required')
  }
  // Extract user ID from token - implement based on your auth system
  return 'user-placeholder-id' // Replace with actual user ID extraction
}

/**
 * GET /api/v1/modules/bible
 * Retrieve Bible module data based on query type
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'dashboard'

    switch (type) {
      case 'dashboard': {
        const dashboardData = await bibleDashboardRepository.getDashboardData(userId)
        return NextResponse.json({
          success: true,
          data: dashboardData
        })
      }

      case 'reading-plans': {
        const plans = await bibleReadingPlanRepository.getUserActivePlans(userId)
        return NextResponse.json({
          success: true,
          data: plans
        })
      }

      case 'readings': {
        const date = searchParams.get('date')
        if (date) {
          const readings = await bibleReadingRepository.findMany({
            userId,
            assignedDate: new Date(date)
          })
          return NextResponse.json({
            success: true,
            data: readings
          })
        } else {
          const readings = await bibleReadingRepository.getTodaysReadings(userId)
          return NextResponse.json({
            success: true,
            data: readings
          })
        }
      }

      case 'study-sessions': {
        const limit = parseInt(searchParams.get('limit') || '10', 10)
        const sessions = await studySessionRepository.getRecentSessions(userId, limit)
        return NextResponse.json({
          success: true,
          data: sessions
        })
      }

      case 'prayer-requests': {
        const isAnswered = searchParams.get('answered')
        if (isAnswered === 'false') {
          const requests = await prayerRequestRepository.getActiveRequests(userId)
          return NextResponse.json({
            success: true,
            data: requests
          })
        } else {
          const requests = await prayerRequestRepository.findMany({ userId })
          return NextResponse.json({
            success: true,
            data: requests
          })
        }
      }

      case 'bookmarks': {
        const tags = searchParams.get('tags')?.split(',')
        if (tags?.length) {
          const bookmarks = await scriptureBookmarkRepository.getByTags(userId, tags)
          return NextResponse.json({
            success: true,
            data: bookmarks
          })
        } else {
          const bookmarks = await scriptureBookmarkRepository.findMany({ userId })
          return NextResponse.json({
            success: true,
            data: bookmarks
          })
        }
      }

      case 'verse': {
        const reference = searchParams.get('reference')
        const version = searchParams.get('version') || 'ESV'
        if (!reference) {
          return NextResponse.json({
            success: false,
            error: 'Reference parameter required'
          }, { status: 400 })
        }

        const verse = await bibleAPIService.getVerse(reference, version)
        return NextResponse.json({
          success: true,
          data: verse
        })
      }

      case 'search': {
        const query = searchParams.get('q')
        const version = searchParams.get('version') || 'ESV'
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'Query parameter required'
          }, { status: 400 })
        }

        const results = await bibleAPIService.searchVerses(query, version)
        return NextResponse.json({
          success: true,
          data: results
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown type parameter: ${type}`
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Bible module GET error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * POST /api/v1/modules/bible
 * Create Bible module resources based on request type
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const body = await request.json()
    const { type, ...data } = body

    switch (type) {
      case 'reading-plan': {
        const validatedData = CreateReadingPlanSchema.parse(data)
        
        let plan
        if (validatedData.planType === 'preset' && validatedData.presetId) {
          plan = await bibleReadingPlanRepository.createFromPreset(
            userId,
            validatedData.presetId,
            validatedData.startDate
          )
        } else {
          plan = await bibleReadingPlanRepository.create({
            userId,
            name: validatedData.name,
            description: validatedData.description,
            planType: validatedData.planType,
            presetId: validatedData.presetId,
            startDate: validatedData.startDate,
            endDate: validatedData.endDate,
            isActive: true
          })

          // If custom plan with readings, create the readings
          if (validatedData.customReadings) {
            const readings = validatedData.customReadings.map(reading => ({
              planId: plan.id,
              userId,
              assignedDate: reading.date,
              passages: reading.passages,
              isCompleted: false
            }))
            
            await bibleReadingRepository.createMany(readings)
          }
        }

        return NextResponse.json({
          success: true,
          data: plan,
          message: 'Reading plan created successfully'
        }, { status: 201 })
      }

      case 'complete-reading': {
        const validatedData = CompleteReadingSchema.parse(data)
        const reading = await bibleReadingRepository.completeReading(
          validatedData.readingId,
          userId,
          validatedData.readingTimeMinutes,
          validatedData.notes
        )

        // Award XP for completing reading
        // This would integrate with your gamification system

        return NextResponse.json({
          success: true,
          data: reading,
          message: 'Reading marked as complete'
        })
      }

      case 'study-session': {
        const validatedData = CreateStudySessionSchema.parse(data)
        const session = await studySessionRepository.create({
          userId,
          title: validatedData.title,
          description: validatedData.description,
          passages: validatedData.passages,
          durationMinutes: validatedData.durationMinutes,
          studyDate: validatedData.studyDate,
          notes: validatedData.notes,
          tags: validatedData.tags,
          goalId: validatedData.goalId
        })

        // Award XP for study session
        // This would integrate with your gamification system

        return NextResponse.json({
          success: true,
          data: session,
          message: 'Study session logged successfully'
        }, { status: 201 })
      }

      case 'prayer-request': {
        const validatedData = CreatePrayerRequestSchema.parse(data)
        const request = await prayerRequestRepository.create({
          userId,
          title: validatedData.title,
          description: validatedData.description,
          category: validatedData.category,
          priority: validatedData.priority,
          isPrivate: validatedData.isPrivate,
          isAnswered: false,
          requestDate: validatedData.requestDate
        })

        // Award XP for prayer request
        // This would integrate with your gamification system

        return NextResponse.json({
          success: true,
          data: request,
          message: 'Prayer request added successfully'
        }, { status: 201 })
      }

      case 'bookmark': {
        const validatedData = CreateBookmarkSchema.parse(data)
        
        // Check if bookmark already exists
        const exists = await scriptureBookmarkRepository.existsForReference(
          userId,
          validatedData.reference,
          validatedData.version
        )

        if (exists) {
          return NextResponse.json({
            success: false,
            error: 'Bookmark for this verse already exists'
          }, { status: 409 })
        }

        // Fetch verse text if not provided
        let verseText = ''
        try {
          const verse = await bibleAPIService.getVerse(validatedData.reference, validatedData.version)
          verseText = verse.text
        } catch (error) {
          console.warn('Failed to fetch verse text:', error)
        }

        const bookmark = await scriptureBookmarkRepository.create({
          userId,
          reference: validatedData.reference,
          version: validatedData.version,
          text: verseText,
          notes: validatedData.notes,
          tags: validatedData.tags,
          isPrivate: validatedData.isPrivate
        })

        // Award XP for bookmark
        // This would integrate with your gamification system

        return NextResponse.json({
          success: true,
          data: bookmark,
          message: 'Scripture bookmark saved successfully'
        }, { status: 201 })
      }

      case 'answer-prayer': {
        const { prayerId, answerDescription } = data
        if (!prayerId) {
          return NextResponse.json({
            success: false,
            error: 'Prayer ID required'
          }, { status: 400 })
        }

        const answeredPrayer = await prayerRequestRepository.markAsAnswered(
          prayerId,
          userId,
          answerDescription
        )

        // Award XP for answered prayer
        // This would integrate with your gamification system

        return NextResponse.json({
          success: true,
          data: answeredPrayer,
          message: 'Prayer marked as answered'
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown type parameter: ${type}`
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Bible module POST error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * PUT /api/v1/modules/bible
 * Update Bible module resources
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const body = await request.json()
    const { type, id, ...data } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Resource ID required for updates'
      }, { status: 400 })
    }

    switch (type) {
      case 'reading-plan': {
        const plan = await bibleReadingPlanRepository.update(id, data)
        return NextResponse.json({
          success: true,
          data: plan,
          message: 'Reading plan updated successfully'
        })
      }

      case 'study-session': {
        const session = await studySessionRepository.update(id, data)
        return NextResponse.json({
          success: true,
          data: session,
          message: 'Study session updated successfully'
        })
      }

      case 'prayer-request': {
        const request = await prayerRequestRepository.update(id, data)
        return NextResponse.json({
          success: true,
          data: request,
          message: 'Prayer request updated successfully'
        })
      }

      case 'bookmark': {
        const bookmark = await scriptureBookmarkRepository.update(id, data)
        return NextResponse.json({
          success: true,
          data: bookmark,
          message: 'Bookmark updated successfully'
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown type parameter: ${type}`
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Bible module PUT error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/modules/bible
 * Delete Bible module resources
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json({
        success: false,
        error: 'Type and ID parameters required'
      }, { status: 400 })
    }

    switch (type) {
      case 'reading-plan': {
        await bibleReadingPlanRepository.delete(id)
        return NextResponse.json({
          success: true,
          message: 'Reading plan deleted successfully'
        })
      }

      case 'study-session': {
        await studySessionRepository.delete(id)
        return NextResponse.json({
          success: true,
          message: 'Study session deleted successfully'
        })
      }

      case 'prayer-request': {
        await prayerRequestRepository.delete(id)
        return NextResponse.json({
          success: true,
          message: 'Prayer request deleted successfully'
        })
      }

      case 'bookmark': {
        await scriptureBookmarkRepository.delete(id)
        return NextResponse.json({
          success: true,
          message: 'Bookmark deleted successfully'
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown type parameter: ${type}`
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Bible module DELETE error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}