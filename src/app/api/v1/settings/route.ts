/**
 * Settings API Routes
 * 
 * Manages user settings and preferences with validation and error handling.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withMethodValidation, AuthenticatedRequest } from '@/lib/auth/middleware'
import { withErrorHandling } from '@/lib/prisma/error-handler'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for user settings
const SettingsSchema = z.object({
  category: z.enum(['notification', 'privacy', 'display', 'account']),
  settingKey: z.string().min(1, 'Setting key is required'),
  settingValue: z.string().min(0),
  dataType: z.enum(['string', 'boolean', 'number', 'json']).optional().default('string')
})

const SettingsQuerySchema = z.object({
  category: z.enum(['notification', 'privacy', 'display', 'account']).optional()
})

const BulkSettingsSchema = z.array(SettingsSchema)

/**
 * GET /api/v1/settings
 * Retrieve user settings by category or all settings
 */
async function handleGet(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    
    // Validate query parameters
    const query = { category: category || undefined }
    const validatedQuery = SettingsQuerySchema.parse(query)
    
    // Build where clause
    const where: any = { userId: request.user.id }
    if (validatedQuery.category) {
      where.category = validatedQuery.category
    }
    
    // Fetch settings
    const settings = await prisma.userSetting.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { settingKey: 'asc' }
      ]
    })
    
    // Group settings by category for easier consumption
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {}
      }
      
      // Parse value based on dataType
      let parsedValue: any = setting.settingValue
      try {
        switch (setting.dataType) {
          case 'boolean':
            parsedValue = setting.settingValue === 'true'
            break
          case 'number':
            parsedValue = parseFloat(setting.settingValue)
            break
          case 'json':
            parsedValue = JSON.parse(setting.settingValue)
            break
          default:
            parsedValue = setting.settingValue
        }
      } catch (error) {
        // If parsing fails, keep as string
        parsedValue = setting.settingValue
      }
      
      acc[setting.category][setting.settingKey] = {
        value: parsedValue,
        dataType: setting.dataType,
        updatedAt: setting.updatedAt
      }
      
      return acc
    }, {} as Record<string, Record<string, any>>)
    
    return NextResponse.json({
      success: true,
      data: groupedSettings,
      message: validatedQuery.category 
        ? `Settings retrieved for category: ${validatedQuery.category}`
        : 'All settings retrieved'
    })
  }, 'Fetching user settings')
}

/**
 * PUT /api/v1/settings
 * Update user settings (single setting or bulk update)
 */
async function handlePut(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const body = await request.json()
    
    // Check if this is a bulk update (array) or single setting
    const isBulkUpdate = Array.isArray(body)
    
    if (isBulkUpdate) {
      // Validate bulk settings
      const validatedSettings = BulkSettingsSchema.parse(body)
      
      // Perform bulk upsert using transaction
      const updatedSettings = await prisma.$transaction(
        validatedSettings.map(setting => {
          // Convert value to string for storage
          let stringValue = setting.settingValue
          if (setting.dataType === 'boolean') {
            stringValue = String(setting.settingValue === 'true')
          } else if (setting.dataType === 'number') {
            stringValue = String(setting.settingValue)
          } else if (setting.dataType === 'json') {
            stringValue = typeof setting.settingValue === 'string' 
              ? setting.settingValue 
              : JSON.stringify(setting.settingValue)
          }
          
          return prisma.userSetting.upsert({
            where: {
              userId_category_settingKey: {
                userId: request.user.id,
                category: setting.category,
                settingKey: setting.settingKey
              }
            },
            update: {
              settingValue: stringValue,
              dataType: setting.dataType
            },
            create: {
              userId: request.user.id,
              category: setting.category,
              settingKey: setting.settingKey,
              settingValue: stringValue,
              dataType: setting.dataType
            }
          })
        })
      )
      
      return NextResponse.json({
        success: true,
        data: updatedSettings,
        message: `${updatedSettings.length} settings updated successfully`
      })
    } else {
      // Single setting update
      const validatedSetting = SettingsSchema.parse(body)
      
      // Convert value to string for storage
      let stringValue = validatedSetting.settingValue
      if (validatedSetting.dataType === 'boolean') {
        stringValue = String(validatedSetting.settingValue === 'true')
      } else if (validatedSetting.dataType === 'number') {
        stringValue = String(validatedSetting.settingValue)
      } else if (validatedSetting.dataType === 'json') {
        stringValue = typeof validatedSetting.settingValue === 'string' 
          ? validatedSetting.settingValue 
          : JSON.stringify(validatedSetting.settingValue)
      }
      
      const updatedSetting = await prisma.userSetting.upsert({
        where: {
          userId_category_settingKey: {
            userId: request.user.id,
            category: validatedSetting.category,
            settingKey: validatedSetting.settingKey
          }
        },
        update: {
          settingValue: stringValue,
          dataType: validatedSetting.dataType
        },
        create: {
          userId: request.user.id,
          category: validatedSetting.category,
          settingKey: validatedSetting.settingKey,
          settingValue: stringValue,
          dataType: validatedSetting.dataType
        }
      })
      
      return NextResponse.json({
        success: true,
        data: updatedSetting,
        message: 'Setting updated successfully'
      })
    }
  }, 'Updating user settings')
}

/**
 * Main route handlers
 */
export async function GET(request: NextRequest) {
  const methodCheck = withMethodValidation(request, ['GET'])
  if (methodCheck) return methodCheck
  
  return withAuth(request, handleGet)
}

export async function PUT(request: NextRequest) {
  const methodCheck = withMethodValidation(request, ['PUT'])
  if (methodCheck) return methodCheck
  
  return withAuth(request, handlePut)
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}